import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../services/finance";

export function useMonthlySummary(year?: number, month?: number) {
  return useQuery({
    queryKey: ["analytics", "monthly-summary", year, month],
    queryFn: () => analyticsApi.monthlySummary(year, month).then((r) => r.data),
  });
}

export function useMonthlyTrend(months: number = 6) {
  return useQuery({
    queryKey: ["analytics", "monthly-trend", months],
    queryFn: () => analyticsApi.monthlyTrend(months).then((r) => r.data),
  });
}

export function useSpendingByCategory(start_date?: string, end_date?: string) {
  return useQuery({
    queryKey: ["analytics", "spending-by-category", start_date, end_date],
    queryFn: () => analyticsApi.spendingByCategory(start_date, end_date).then((r) => r.data),
  });
}
