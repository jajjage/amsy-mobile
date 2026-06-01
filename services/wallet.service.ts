import apiClient from "@/lib/api-client";
import {
  GetTransactionsParams,
  WalletResponse,
  TransactionResponse,
  TransactionsListResponse,
} from "@/types/wallet.types";

export const walletService = {
  // Get user wallet
  getWallet: async (): Promise<WalletResponse> => {
    const response = await apiClient.get<WalletResponse>("/user/wallet");
    return response.data;
  },

  // Get wallet balance
  getBalance: async (): Promise<WalletResponse> => {
    const response = await apiClient.get<WalletResponse>(
      "/user/wallet/balance"
    );
    return response.data;
  },

  // Get all transactions with filters
  getTransactions: async (
    params?: GetTransactionsParams
  ): Promise<TransactionsListResponse> => {
    const cleanParams: GetTransactionsParams = {};
    if (params?.page) cleanParams.page = params.page;
    if (params?.limit) cleanParams.limit = params.limit;
    if (params?.search?.trim()) cleanParams.search = params.search.trim();
    if (params?.direction) cleanParams.direction = params.direction;
    if (params?.relatedType) cleanParams.relatedType = params.relatedType;
    if (params?.status) cleanParams.status = params.status;
    if (params?.startDate) cleanParams.startDate = params.startDate;
    if (params?.endDate) cleanParams.endDate = params.endDate;

    const response = await apiClient.get<TransactionsListResponse>(
      "/user/wallet/transactions",
      { params: cleanParams }
    );
    return response.data;
  },

  // Get single transaction by ID
  getTransactionById: async (id: string): Promise<TransactionResponse> => {
    const response = await apiClient.get<TransactionResponse>(
      `/user/wallet/transactions/${id}`
    );
    return response.data;
  },
};
