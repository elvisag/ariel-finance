import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionsApi } from "../services/finance";
import type { Transaction, TransferPayload } from "../services/finance";

export function useTransactions(params?: {
  account_id?: string;
  start_date?: string;
  end_date?: string;
  type?: string;
  is_recurring?: boolean;
  search?: string;
}) {
  return useQuery({
    queryKey: ["transactions", params],
    queryFn: () => transactionsApi.list(params).then((r) => r.data),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Transaction, "id" | "created_at" | "recurrence_last_date">) =>
      transactionsApi.create(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useTransferMoney() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TransferPayload) =>
      transactionsApi.transfer(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Transaction, "id" | "created_at" | "recurrence_last_date">> }) =>
      transactionsApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
