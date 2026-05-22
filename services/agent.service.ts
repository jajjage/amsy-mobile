import apiClient from "@/lib/api-client";
import {
    AgentAccount,
    AgentCommission,
    AgentCustomer,
    AgentCustomersParams,
    AgentStats,
    AvailableBalance,
    BankWithdrawalHistoryItem,
    BankWithdrawalHistoryParams,
    BankWithdrawalRequest,
    PaginatedResponse,
    RegenerateAgentCodeResponse,
    RegisterWithAgentCodePayload,
    ValidateAgentCodeResponse,
    WalletWithdrawalRequest,
    WithdrawalRequest,
    WithdrawalResponse,
} from "@/types/agent.types";
import { ApiResponse } from "@/types/api.types";

export function normalizeAgentCodeValidation(
  response: ApiResponse<ValidateAgentCodeResponse>
): ValidateAgentCodeResponse {
  const payload: any = response?.data ?? response ?? {};
  const topLevelMessage = response?.message;

  const valid =
    typeof payload?.valid === "boolean"
      ? payload.valid
      : typeof payload?.isValid === "boolean"
        ? payload.isValid
        : typeof response?.data?.valid === "boolean"
          ? response.data.valid
        : response?.success === true;

  return {
    valid,
    referrerName:
      payload?.referrerName ??
      payload?.agentName ??
      payload?.name,
    message: payload?.message ?? topLevelMessage,
  };
}

export function normalizeAgentStats(
  response: ApiResponse<AgentStats>
): AgentStats {
  const payload: any = response?.data ?? response ?? {};
  const totalCustomers = Number(payload?.totalCustomers ?? 0);
  const lifetimeEarnings = Number(
    payload?.lifetimeEarnings ??
      payload?.totalCommissionsEarned ??
      payload?.totalCommissions ??
      0
  );
  const monthlyEarnings = Number(payload?.monthlyEarnings ?? 0);
  const pendingCommissions = Number(payload?.pendingCommissions ?? 0);
  const withdrawnCommissions = Number(payload?.withdrawnCommissions ?? 0);

  return {
    totalCustomers,
    activeCustomers: Number(payload?.activeCustomers ?? 0),
    totalCommissions: Number(payload?.totalCommissions ?? lifetimeEarnings),
    pendingCommissions,
    withdrawnCommissions,
    monthlyEarnings,
    lifetimeEarnings,
    totalCommissionsEarned: Number(
      payload?.totalCommissionsEarned ?? lifetimeEarnings
    ),
    availableBalanceAmount: Number(payload?.availableBalanceAmount ?? 0),
  };
}

export function normalizeAvailableBalance(
  response: ApiResponse<AvailableBalance>
): AvailableBalance {
  const payload: any = response?.data ?? response ?? {};
  const totalAvailable = Number(
    payload?.totalAvailable ??
      payload?.availableBalance ??
      payload?.stats?.availableBalance ??
      payload?.stats?.availableBalanceAmount ??
      0
  );

  return {
    totalAvailable,
    availableBalance: Number(payload?.availableBalance ?? totalAvailable),
    claimCount:
      typeof payload?.claimCount === "number" ? payload.claimCount : undefined,
  };
}

export function normalizeWithdrawalResponse(
  response: ApiResponse<WithdrawalResponse>,
  requestedAmount: number
): WithdrawalResponse {
  const payload: any = response?.data ?? response ?? {};

  return {
    withdrawalId:
      payload?.withdrawalId ??
      payload?.id ??
      payload?.transactionId ??
      "",
    amount: Number(payload?.amount ?? requestedAmount ?? 0),
    status: payload?.status ?? "pending",
    createdAt: payload?.createdAt ?? new Date().toISOString(),
    completedAt: payload?.completedAt ?? null,
  };
}

export function normalizeAgentAccount(payload: any): AgentAccount {
  return {
    agentId: payload?.agentId ?? payload?.id ?? "",
    userId: payload?.userId ?? payload?.user_id ?? "",
    agentCode: payload?.agentCode ?? payload?.agent_code ?? "",
    status: payload?.isActive === false ? "inactive" : "active",
    isActive: payload?.isActive ?? payload?.is_active ?? true,
    createdAt: payload?.createdAt ?? payload?.created_at ?? "",
    updatedAt: payload?.updatedAt ?? payload?.updated_at ?? "",
  };
}

export function normalizeAgentCommission(payload: any): AgentCommission {
  const earned = Number(
    payload?.commissionEarned ??
      payload?.calculatedCommission ??
      payload?.amount ??
      0
  );

  return {
    commissionId: payload?.commissionId ?? payload?.id ?? "",
    customerId: payload?.customerId ?? payload?.customerUserId ?? "",
    customerName: payload?.customerName ?? payload?.customer?.fullName ?? "",
    customerEmail: payload?.customerEmail ?? payload?.customer?.email ?? "",
    amount: earned,
    transactionId: payload?.transactionId ?? "",
    status: payload?.status ?? "earned",
    createdAt: payload?.earnedAt ?? payload?.createdAt ?? "",
    completedAt: payload?.withdrawnDate ?? payload?.processedAt ?? null,
  };
}

export function normalizeAgentCommissionsResponse(
  response: ApiResponse<PaginatedResponse<AgentCommission>>
): PaginatedResponse<AgentCommission> {
  const payload: any = response?.data ?? response ?? {};
  const rawRows = payload?.data ?? payload?.items ?? payload?.rows ?? [];
  const paginationPayload = payload?.pagination ?? payload ?? {};
  const limit = Number(paginationPayload?.limit ?? rawRows?.length ?? 20);
  const total = Number(paginationPayload?.total ?? rawRows?.length ?? 0);

  return {
    data: Array.isArray(rawRows) ? rawRows.map(normalizeAgentCommission) : [],
    pagination: {
      page: Number(paginationPayload?.page ?? 1),
      limit,
      total,
      totalPages: Number(
        paginationPayload?.totalPages ??
          (limit > 0 ? Math.ceil(total / limit) : 1)
      ),
    },
  };
}

export function normalizeBankWithdrawalHistoryItem(
  payload: any
): BankWithdrawalHistoryItem {
  return {
    id: payload?.id ?? payload?.withdrawalId ?? payload?.requestId ?? "",
    amount: Number(payload?.amount ?? 0),
    status: payload?.status ?? "pending",
    bankName: payload?.bankName ?? "",
    bankCode: payload?.bankCode,
    accountName: payload?.accountName ?? "",
    accountNumber: payload?.accountNumber ?? "",
    narration: payload?.narration ?? null,
    requestNotes: payload?.requestNotes ?? null,
    adminNotes: payload?.adminNotes ?? null,
    failureReason: payload?.failureReason ?? null,
    requestedAt:
      payload?.requestedAt ?? payload?.createdAt ?? new Date().toISOString(),
    processedAt: payload?.processedAt ?? payload?.completedAt ?? null,
  };
}

export function normalizeBankWithdrawalHistoryResponse(
  response: ApiResponse<PaginatedResponse<BankWithdrawalHistoryItem>>
): PaginatedResponse<BankWithdrawalHistoryItem> {
  const payload: any = response?.data ?? response ?? {};
  const rawRows =
    payload?.requests ??
    payload?.data ??
    payload?.items ??
    payload?.rows ??
    [];
  const paginationPayload = payload?.pagination ?? payload ?? {};
  const limit = Number(paginationPayload?.limit ?? rawRows?.length ?? 20);
  const total = Number(
    paginationPayload?.total ??
      paginationPayload?.count ??
      paginationPayload?.totalCount ??
      rawRows?.length ??
      0
  );

  return {
    data: Array.isArray(rawRows)
      ? rawRows.map(normalizeBankWithdrawalHistoryItem)
      : [],
    pagination: {
      page: Number(paginationPayload?.page ?? 1),
      limit,
      total,
      totalPages: Number(
        paginationPayload?.totalPages ??
          paginationPayload?.pages ??
          (limit > 0 ? Math.ceil(total / limit) : 1) ??
          1
      ),
    },
  };
}

export function normalizeAgentCustomer(payload: any): AgentCustomer {
  const customerProfile = payload?.customer ?? payload?.profile ?? {};

  return {
    linkId: payload?.linkId ?? payload?.id ?? payload?.agentLinkId ?? "",
    customerId:
      payload?.customerId ??
      customerProfile?.userId ??
      customerProfile?.id ??
      "",
    agentCodeUsed:
      payload?.agentCodeUsed ??
      payload?.agentCode ??
      payload?.codeUsed,
    isActive:
      typeof payload?.isActive === "boolean"
        ? payload.isActive
        : typeof payload?.linkIsActive === "boolean"
          ? payload.linkIsActive
          : undefined,
    joinedAt:
      payload?.joinedAt ??
      payload?.customerJoinedAt ??
      payload?.createdAt ??
      "",
    fullName:
      payload?.fullName ??
      customerProfile?.fullName ??
      customerProfile?.name ??
      "",
    email:
      payload?.email ??
      customerProfile?.email ??
      "",
    phoneNumber:
      payload?.phoneNumber ??
      customerProfile?.phoneNumber ??
      null,
    isVerified:
      typeof payload?.isVerified === "boolean"
        ? payload.isVerified
        : customerProfile?.isVerified,
    isSuspended:
      typeof payload?.isSuspended === "boolean"
        ? payload.isSuspended
        : customerProfile?.isSuspended,
    profilePictureUrl:
      payload?.profilePictureUrl ??
      customerProfile?.profilePictureUrl ??
      null,
    customer: {
      fullName: customerProfile?.fullName ?? payload?.fullName ?? null,
      email: customerProfile?.email ?? payload?.email ?? null,
      phoneNumber: customerProfile?.phoneNumber ?? payload?.phoneNumber ?? null,
      isVerified:
        typeof customerProfile?.isVerified === "boolean"
          ? customerProfile.isVerified
          : payload?.isVerified,
      isSuspended:
        typeof customerProfile?.isSuspended === "boolean"
          ? customerProfile.isSuspended
          : payload?.isSuspended,
      profilePictureUrl:
        customerProfile?.profilePictureUrl ??
        payload?.profilePictureUrl ??
        null,
    },
    totalSpent:
      typeof payload?.totalSpent === "number" ? payload.totalSpent : undefined,
    transactionCount:
      typeof payload?.transactionCount === "number"
        ? payload.transactionCount
        : undefined,
    lastTransactionAt: payload?.lastTransactionAt ?? null,
  };
}

export function normalizeAgentCustomersResponse(
  response: ApiResponse<PaginatedResponse<AgentCustomer>>
): PaginatedResponse<AgentCustomer> {
  const payload: any = response?.data ?? response ?? {};
  const rawRows =
    payload?.data ??
    payload?.customers ??
    payload?.rows ??
    payload?.items ??
    [];
  const paginationPayload = payload?.pagination ?? payload ?? {};
  const limit = Number(paginationPayload?.limit ?? rawRows?.length ?? 20);
  const total = Number(
    paginationPayload?.total ??
      paginationPayload?.count ??
      paginationPayload?.totalCount ??
      rawRows?.length ??
      0
  );
  const totalPages = Number(
    paginationPayload?.totalPages ??
      paginationPayload?.pages ??
      (limit > 0 ? Math.ceil(total / limit) : 1) ??
      1
  );

  return {
    data: Array.isArray(rawRows) ? rawRows.map(normalizeAgentCustomer) : [],
    pagination: {
      page: Number(paginationPayload?.page ?? 1),
      limit,
      total,
      totalPages,
    },
  };
}

/**
 * Agent Service
 * Handles all agent-related API calls for:
 * - Signup with agent code
 * - Becoming an agent
 * - Agent dashboard operations
 * - Commission management
 */

export const agentService = {
  // ==================== Public Endpoints ====================

  /**
   * Validate agent code during signup
   * GET /api/v1/agent/validate?agentCode=AGENT-ABC123
   * Note: apiClient baseURL already includes /api/v1
   */
  validateAgentCode: async (
    code: string
  ): Promise<ApiResponse<ValidateAgentCodeResponse>> => {
    const response = await apiClient.get<
      ApiResponse<ValidateAgentCodeResponse>
    >("/agent/validate", {
      params: { agentCode: code.trim().toUpperCase() },
    });
    return {
      ...response.data,
      data: normalizeAgentCodeValidation(response.data),
    };
  },

  /**
   * Register with agent code
   * POST /api/v1/auth/register
   * Includes agentCode in payload if user is signing up under an agent
   */
  registerWithAgentCode: async (
    payload: RegisterWithAgentCodePayload
  ): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>(
      "/auth/register",
      payload
    );
    return response.data;
  },

  // ==================== Authenticated Endpoints ====================

  /**
   * Activate agent account for current user
   * POST /api/v1/dashboard/agent/activate
   */
  activateAgentAccount: async (): Promise<ApiResponse<AgentAccount>> => {
    const response = await apiClient.post<ApiResponse<{ agent: AgentAccount }>>(
      "/dashboard/agent/activate"
    );

    return {
      ...response.data,
      data: normalizeAgentAccount((response.data as any)?.data?.agent),
    };
  },

  /**
   * Deactivate agent account for current user
   * Tenant backend currently deactivates agent accounts through admin.
   */
  deactivateAgentAccount: async (): Promise<ApiResponse<void>> => {
    throw new Error("Agent accounts are managed by tenant admins.");
  },

  /**
   * Get current agent account details
   * GET /api/v1/dashboard/agent/profile
   */
  getAgentAccount: async (): Promise<ApiResponse<AgentAccount>> => {
    const response = await apiClient.get<ApiResponse<{ agent: AgentAccount }>>(
      "/dashboard/agent/profile"
    );
    return {
      ...response.data,
      data: normalizeAgentAccount((response.data as any)?.data?.agent),
    };
  },

  /**
   * Get agent dashboard statistics
   * GET /api/v1/dashboard/agent/profile
   */
  getAgentStats: async (): Promise<ApiResponse<AgentStats>> => {
    const response = await apiClient.get<ApiResponse<{ stats: AgentStats }>>(
      "/dashboard/agent/profile"
    );
    return {
      ...response.data,
      data: normalizeAgentStats((response.data as any)?.data?.stats),
    };
  },

  /**
   * Get list of customers acquired by this agent
   * GET /api/v1/dashboard/agent/customers?page=1&limit=20
   */
  getAgentCustomers: async (
    params: AgentCustomersParams = {}
  ): Promise<ApiResponse<PaginatedResponse<AgentCustomer>>> => {
    const { page = 1, limit = 20, q, isActive } = params;
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<AgentCustomer>>
    >("/dashboard/agent/customers", {
      params: { page, limit, search: q, isActive },
    });
    return {
      ...response.data,
      data: normalizeAgentCustomersResponse(response.data),
    };
  },

  /**
   * Get list of commissions earned
   * GET /api/v1/dashboard/agent/commissions?page=1&limit=20
   */
  getAgentCommissions: async (
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<AgentCommission>>> => {
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<AgentCommission>>
    >("/dashboard/agent/commissions", {
      params: { page, limit },
    });
    return {
      ...response.data,
      data: normalizeAgentCommissionsResponse(response.data),
    };
  },

  /**
   * Get available balance for withdrawal
   * GET /api/v1/dashboard/agent/commissions
   */
  getAvailableBalance: async (): Promise<ApiResponse<AvailableBalance>> => {
    const response = await apiClient.get<ApiResponse<any>>(
      "/dashboard/agent/commissions",
      { params: { page: 1, limit: 1 } }
    );
    return {
      ...response.data,
      data: normalizeAvailableBalance(response.data),
    };
  },

  /**
   * Withdraw commission balance
   * POST /api/v1/dashboard/agent/commissions/withdraw
   * Body: { amount: number }
   */
  withdrawToWallet: async (
    payload: WalletWithdrawalRequest
  ): Promise<ApiResponse<WithdrawalResponse>> => {
    const response = await apiClient.post<ApiResponse<WithdrawalResponse>>(
      "/dashboard/agent/commissions/withdraw",
      { amount: payload.amount, specificCommissionIds: payload.specificCommissionIds }
    );
    return {
      ...response.data,
      data: normalizeWithdrawalResponse(response.data, payload.amount),
    };
  },

  requestBankWithdrawal: async (
    payload: BankWithdrawalRequest
  ): Promise<ApiResponse<WithdrawalResponse>> => {
    const response = await apiClient.post<ApiResponse<WithdrawalResponse>>(
      "/dashboard/agent/bank-withdrawals",
      payload
    );
    return {
      ...response.data,
      data: normalizeWithdrawalResponse(response.data, payload.amount),
    };
  },

  getBankWithdrawals: async (
    params: BankWithdrawalHistoryParams = {}
  ): Promise<ApiResponse<PaginatedResponse<BankWithdrawalHistoryItem>>> => {
    const { page = 1, limit = 20, status } = params;
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<BankWithdrawalHistoryItem>>
    >("/dashboard/agent/bank-withdrawals", {
      params: { page, limit, status },
    });
    return {
      ...response.data,
      data: normalizeBankWithdrawalHistoryResponse(response.data),
    };
  },

  /**
   * Regenerate agent code
   * Tenant backend currently manages agent codes through admin.
   */
  regenerateAgentCode: async (): Promise<
    ApiResponse<RegenerateAgentCodeResponse>
  > => {
    throw new Error("Agent codes are managed by tenant admins.");
  },
};
