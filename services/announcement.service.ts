import apiClient from "@/lib/api-client";
import { ApiResponse } from "@/types/api.types";
import { DashboardAnnouncement } from "@/types/announcement.types";

export const announcementService = {
  getDashboardAnnouncement: async (): Promise<
    ApiResponse<DashboardAnnouncement | null>
  > => {
    const response = await apiClient.get<
      ApiResponse<DashboardAnnouncement | null>
    >("/dashboard-announcement");
    return response.data;
  },

  markViewed: async (announcementId: string): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(
      `/announcements/${announcementId}/view`
    );
    return response.data;
  },
};
