import { useQuery } from "@tanstack/react-query";
import { categoriesApi } from "../services/finance";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list().then((r) => r.data),
  });
}
