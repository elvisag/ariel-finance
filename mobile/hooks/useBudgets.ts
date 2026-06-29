import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { budgetsApi } from "../services/finance";
import type { Budget } from "../services/finance";

export function useBudgets() {
  return useQuery({
    queryKey: ["budgets"],
    queryFn: () => budgetsApi.list().then((r) => r.data),
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Budget, "id" | "created_at">) =>
      budgetsApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => budgetsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}
