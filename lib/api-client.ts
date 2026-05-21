// lib/api-client.ts
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { tokenStorage, userStorage } from "./secure-store";

const BASE_URL = process.env.EXPO_PUBLIC_AUTH_URL || "http://10.152.118.138:3000/api/v1";

/**
 * Session expiry callback - set by AuthContext
 * Called when refresh token fails and user needs to re-authenticate
 */
let onSessionExpired: (() => void) | null = null;

export const setSessionExpiredCallback = (callback: () => void) => {
  onSessionExpired = callback;
};

export const clearSessionExpiredCallback = () => {
  onSessionExpired = null;
};

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

const getErrorMessage = (error: unknown): string => {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : "";
  }

  const data = error.response?.data as any;
  const message = data?.message || data?.error || error.message || "";

  if (Array.isArray(message)) {
    return message.join(" ");
  }

  return String(message);
};

const isNetworkOrTemporaryError = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  if (!error.response) {
    return true;
  }

  const status = error.response.status;
  return status === 408 || status === 429 || status >= 500;
};

const looksLikeAuthSessionFailure = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;
  const message = getErrorMessage(error).toLowerCase();

  if (status === 401) {
    return (
      message.includes("token") ||
      message.includes("session") ||
      message.includes("jwt") ||
      message.includes("unauthorized") ||
      message.includes("unauthenticated") ||
      message.includes("expired") ||
      message.includes("invalid")
    );
  }

  if (status === 404) {
    return message.includes("user not found") || message.includes("account not found") || message.includes("user deleted");
  }

  return false;
};

const expireSession = async (reason: string) => {
  await tokenStorage.clearTokens();
  console.log(`[api-client] Session expired (${reason}), notifying callback`);
  onSessionExpired?.();
};

// Request: Add Authorization header
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response: Handle 401, refresh token
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: unknown | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 403) {
      console.warn("[api-client] 403 response received; preserving session:", error.response?.data || error.message);
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => apiClient(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        
        if (!refreshToken) {
          console.warn("[api-client] No refresh token available, cannot refresh");
          throw new Error("No refresh token available");
        }

        console.log("[api-client] Attempting token refresh with endpoint:", `${BASE_URL}/mobile/auth/refresh`);

        const response = await axios.post(`${BASE_URL}/mobile/auth/refresh`, {
          refreshToken,
        });
        
        console.log("[api-client] Token refresh successful, response:", response.data);
        
        // Handle nested data structure (response.data.data) or flat structure
        const authData = response.data.data || response.data;

        // Save new access token
        if (authData.accessToken && typeof authData.accessToken === 'string') {
          console.log("[api-client] Saving new access token");
          await tokenStorage.setAccessToken(authData.accessToken);
          // Update the header on the original request
          originalRequest.headers.Authorization = `Bearer ${authData.accessToken}`;
        } else {
          console.warn("[api-client] No accessToken in refresh response:", authData);
        }
        
        // Save new refresh token (if backend rotated it)
        if (authData.refreshToken && typeof authData.refreshToken === 'string') {
          console.log("[api-client] Saving new refresh token");
          await tokenStorage.setRefreshToken(authData.refreshToken);
        }

        // Save updated user data (id, email, role) to SecureStore
        if (authData.id || authData.email || authData.role) {
          console.log("[api-client] Updating user cache with refreshed data");
          const userData = {
            id: authData.id,
            email: authData.email,
            role: authData.role,
          };
          await userStorage.setUser(userData);
          if (authData.role) {
            await userStorage.setUserRole(authData.role);
          }
        }

        processQueue(null);
        isRefreshing = false;

        console.log("[api-client] Retrying original request after token refresh");
        return apiClient(originalRequest);
      } catch (refreshError: AxiosError | Error | unknown) {
        console.error(
          "[api-client] Token refresh failed:",
          axios.isAxiosError(refreshError) ? refreshError.response?.data || refreshError.message : getErrorMessage(refreshError)
        );
        processQueue(refreshError);
        isRefreshing = false;

        if (looksLikeAuthSessionFailure(refreshError)) {
          await expireSession("refresh-token-invalid");
        } else if (isNetworkOrTemporaryError(refreshError)) {
          console.warn("[api-client] Refresh failed due to temporary/network issue; preserving session");
        } else {
          console.warn("[api-client] Refresh failed without clear session-invalid signal; preserving session");
        }

        throw refreshError;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
