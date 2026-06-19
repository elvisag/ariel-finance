import api from "./api";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  name: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  category_id: string | null;
  amount: number;
  description: string | null;
  type: "income" | "expense" | "transfer";
  transaction_date: string;
  is_recurring: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
  created_at: string;
}

export interface Budget {
  id: string;
  category_id: string;
  amount: number;
  period: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

export const authApi = {
  login: (data: LoginPayload) => api.post<TokenResponse>("/auth/login", data),
  register: (data: RegisterPayload) => api.post<TokenResponse>("/auth/register", data),
  me: () => api.get<User>("/users/me"),
};

export const accountsApi = {
  list: () => api.get<Account[]>("/accounts/"),
  create: (data: Omit<Account, "id" | "is_active" | "created_at">) =>
    api.post<Account>("/accounts/", data),
  get: (id: string) => api.get<Account>(`/accounts/${id}`),
};

export const transactionsApi = {
  list: (params?: { account_id?: string; start_date?: string; end_date?: string; type?: string }) =>
    api.get<Transaction[]>("/transactions/", { params }),
  create: (data: Omit<Transaction, "id" | "created_at">) =>
    api.post<Transaction>("/transactions/", data),
  delete: (id: string) => api.delete(`/transactions/${id}`),
};

export const categoriesApi = {
  list: () => api.get<Category[]>("/categories/"),
  create: (data: Omit<Category, "id" | "created_at">) =>
    api.post<Category>("/categories/", data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

export const budgetsApi = {
  list: () => api.get<Budget[]>("/budgets/"),
  create: (data: Omit<Budget, "id" | "created_at">) =>
    api.post<Budget>("/budgets/", data),
  delete: (id: string) => api.delete(`/budgets/${id}`),
};
