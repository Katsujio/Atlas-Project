import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "./client";
import {
  DashboardSummary,
  Paginated,
  Portfolio,
  PortfolioPayload,
  Property,
  PropertyPayload,
  RentCastPreview,
  StockHolding,
  StockPayload,
} from "./types";

export const useDashboard = () =>
  useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const response = await api.get<DashboardSummary>("/dashboard");
      return response.data;
    },
  });

export const usePortfolios = () => {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["portfolios"],
    queryFn: async () => {
      const response = await api.get<Paginated<Portfolio>>("/portfolios");
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: PortfolioPayload) => {
      const response = await api.post<Portfolio>("/portfolios", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<PortfolioPayload> }) => {
      const response = await api.put<Portfolio>(`/portfolios/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/portfolios/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
    },
  });

  return {
    listQuery,
    createMutation,
    updateMutation,
    deleteMutation,
  };
};

export const useProperties = (portfolioId?: number) => {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["properties", portfolioId ?? "all"],
    queryFn: async () => {
      const response = await api.get<Paginated<Property>>("/properties", {
        params: portfolioId ? { portfolio_id: portfolioId } : undefined,
      });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: PropertyPayload) => {
      const response = await api.post<Property>("/properties", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<PropertyPayload> }) => {
      const response = await api.put<Property>(`/properties/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/properties/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const refreshRentCastMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<Property>(`/properties/${id}/refresh-rentcast`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const previewRentCast = async (address: string) => {
    const response = await api.get<RentCastPreview>("/integrations/rentcast/preview", {
      params: { address },
    });
    return response.data;
  };

  return {
    listQuery,
    createMutation,
    updateMutation,
    deleteMutation,
    refreshRentCastMutation,
    previewRentCast,
  };
};

export const useStocks = (portfolioId?: number) => {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["stocks", portfolioId ?? "all"],
    queryFn: async () => {
      const response = await api.get<Paginated<StockHolding>>("/stocks", {
        params: portfolioId ? { portfolio_id: portfolioId } : undefined,
      });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: StockPayload) => {
      const response = await api.post<StockHolding>("/stocks", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<StockPayload> }) => {
      const response = await api.put<StockHolding>(`/stocks/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/stocks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return {
    listQuery,
    createMutation,
    updateMutation,
    deleteMutation,
  };
};
