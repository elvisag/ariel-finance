import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionsApi } from "../services/finance";
import type { Transaction, TransferPayload } from "../services/finance";

const PAGE_SIZE = 50;

export function useTransactions(params?: {
  account_id?: string;
  start_date?: string;
  end_date?: string;
  type?: string;
  is_recurring?: boolean;
  search?: string;
}) {
  const [items, setItems] = useState<Transaction[]>([]);
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const query = useQuery({
    queryKey: ["transactions", params, skip],
    queryFn: () =>
      transactionsApi.list({ ...params, skip, limit: PAGE_SIZE }).then((r) => r.data),
  });

  useEffect(() => {
    if (query.data) {
      if (skip === 0) {
        setItems(query.data.items);
      } else {
        setItems((prev) => [...prev, ...query.data.items]);
      }
      setTotal(query.data.total);
      setHasMore(skip + PAGE_SIZE < query.data.total);
    }
  }, [query.data]);

  useEffect(() => {
    setSkip(0);
    setItems([]);
    setHasMore(true);
  }, [params]);

  const loadMore = useCallback(() => {
    if (!query.isFetching && hasMore) {
      setSkip((prev) => prev + PAGE_SIZE);
    }
  }, [query.isFetching, hasMore]);

  const refetch = useCallback(() => {
    setSkip(0);
    setItems([]);
    setHasMore(true);
  }, []);

  return {
    transactions: items,
    total,
    hasMore,
    loadMore,
    isLoading: query.isLoading && skip === 0,
    isLoadingMore: query.isFetching && skip > 0,
    isError: query.isError,
    error: query.error,
    refetch,
    isRefetching: query.isRefetching,
  };
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
