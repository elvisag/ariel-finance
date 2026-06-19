/**
 * Capa de servicios para comunicarse con la API del backend.
 * ==========================================================
 *
 * Esta es la ÚNICA capa que conoce los endpoints de la API.
 * Los componentes y stores NUNCA llaman a Axios directamente,
 * siempre usan estas funciones.
 *
 * Cada recurso (auth, accounts, transactions, etc.) tiene
 * su propio objeto con métodos tipados.
 *
 * Ejemplo de uso en un componente:
 *   const { data } = useQuery({ queryKey: ["accounts"], queryFn: () => accountsApi.list() });
 */

import api from "./api";

// ═══════════════════════════════════════════════════════════════
//  TIPOS (interfaces)
// ═══════════════════════════════════════════════════════════════
// Definen la forma de los datos que vienen del backend.
// Coinciden 1:1 con los schemas Pydantic del backend.

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

// ═══════════════════════════════════════════════════════════════
//  SERVICIOS
// ═══════════════════════════════════════════════════════════════
// Cada función retorna una Promise con la respuesta de Axios.
// Los componentes envuelven estas llamadas con React Query o
// llamadas directas según el caso.

export const authApi = {
  /** Iniciar sesión → recibe un JWT */
  login: (data: LoginPayload) => api.post<TokenResponse>("/auth/login", data),

  /** Registrar nuevo usuario → recibe un JWT */
  register: (data: RegisterPayload) => api.post<TokenResponse>("/auth/register", data),

  /** Obtener perfil del usuario autenticado */
  me: () => api.get<User>("/users/me"),

  /** Autenticación con Google (recibe el id_token de Google) */
  googleAuth: (idToken: string) =>
    api.post<TokenResponse>("/auth/google", { id_token: idToken }),
};

export const accountsApi = {
  /** Listar todas las cuentas del usuario */
  list: () => api.get<Account[]>("/accounts/"),

  /** Crear una nueva cuenta */
  create: (data: Omit<Account, "id" | "is_active" | "created_at">) =>
    api.post<Account>("/accounts/", data),

  /** Obtener una cuenta específica por ID */
  get: (id: string) => api.get<Account>(`/accounts/${id}`),
};

export const transactionsApi = {
  /**
   * Listar transacciones con filtros opcionales.
   *
   * @param params.account_id  Filtrar por cuenta
   * @param params.start_date  Desde (YYYY-MM-DD)
   * @param params.end_date    Hasta (YYYY-MM-DD)
   * @param params.type        "income", "expense" o "transfer"
   */
  list: (params?: {
    account_id?: string;
    start_date?: string;
    end_date?: string;
    type?: string;
  }) => api.get<Transaction[]>("/transactions/", { params }),

  /** Crear una nueva transacción */
  create: (data: Omit<Transaction, "id" | "created_at">) =>
    api.post<Transaction>("/transactions/", data),

  /** Eliminar una transacción (revierte el balance) */
  delete: (id: string) => api.delete(`/transactions/${id}`),
};

export const categoriesApi = {
  /** Listar categorías (globales + del usuario) */
  list: () => api.get<Category[]>("/categories/"),

  /** Crear una categoría personalizada */
  create: (data: Omit<Category, "id" | "created_at">) =>
    api.post<Category>("/categories/", data),

  /** Eliminar una categoría propia */
  delete: (id: string) => api.delete(`/categories/${id}`),
};

export const budgetsApi = {
  /** Listar presupuestos del usuario */
  list: () => api.get<Budget[]>("/budgets/"),

  /** Crear un presupuesto */
  create: (data: Omit<Budget, "id" | "created_at">) =>
    api.post<Budget>("/budgets/", data),

  /** Eliminar un presupuesto */
  delete: (id: string) => api.delete(`/budgets/${id}`),
};
