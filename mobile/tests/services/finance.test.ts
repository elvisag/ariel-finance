import api from "../../services/api";
import {
  authApi,
  accountsApi,
  transactionsApi,
  categoriesApi,
  budgetsApi,
} from "../../services/finance";

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  },
}));

describe("finance.ts — API services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("authApi", () => {
    it("login calls POST /auth/login", () => {
      const payload = { email: "a@b.com", password: "pass" };
      authApi.login(payload);
      expect(api.post).toHaveBeenCalledWith("/auth/login", payload);
    });

    it("register calls POST /auth/register", () => {
      const payload = { email: "a@b.com", name: "A", password: "pass" };
      authApi.register(payload);
      expect(api.post).toHaveBeenCalledWith("/auth/register", payload);
    });

    it("me calls GET /users/me", () => {
      authApi.me();
      expect(api.get).toHaveBeenCalledWith("/users/me");
    });

    it("googleAuth sends id_token", () => {
      authApi.googleAuth("google-id-token");
      expect(api.post).toHaveBeenCalledWith("/auth/google", {
        id_token: "google-id-token",
      });
    });
  });

  describe("accountsApi", () => {
    it("list calls GET /accounts/", () => {
      accountsApi.list();
      expect(api.get).toHaveBeenCalledWith("/accounts/");
    });

    it("create calls POST /accounts/", () => {
      const data = { name: "Cash", type: "checking", balance: 100, currency: "USD" };
      accountsApi.create(data);
      expect(api.post).toHaveBeenCalledWith("/accounts/", data);
    });

    it("get calls GET /accounts/:id", () => {
      accountsApi.get("abc-123");
      expect(api.get).toHaveBeenCalledWith("/accounts/abc-123");
    });
  });

  describe("transactionsApi", () => {
    it("list calls GET /transactions/ with params", () => {
      transactionsApi.list({ account_id: "a1", type: "expense" });
      expect(api.get).toHaveBeenCalledWith("/transactions/", {
        params: { account_id: "a1", type: "expense" },
      });
    });

    it("list works without params", () => {
      transactionsApi.list();
      expect(api.get).toHaveBeenCalledWith("/transactions/", { params: undefined });
    });

    it("create calls POST /transactions/", () => {
      const data = {
        account_id: "a1",
        category_id: "c1",
        amount: 50,
        description: "Coffee",
        type: "expense" as const,
        transaction_date: "2024-01-01",
        is_recurring: false,
        recurrence_frequency: null,
        recurrence_end_date: null,
      };
      transactionsApi.create(data);
      expect(api.post).toHaveBeenCalledWith("/transactions/", data);
    });

    it("delete calls DELETE /transactions/:id", () => {
      transactionsApi.delete("tx-1");
      expect(api.delete).toHaveBeenCalledWith("/transactions/tx-1");
    });
  });

  describe("categoriesApi", () => {
    it("list calls GET /categories/", () => {
      categoriesApi.list();
      expect(api.get).toHaveBeenCalledWith("/categories/");
    });

    it("create calls POST /categories/", () => {
      const data = { name: "Food", icon: "🍕", color: "#FF0000", type: "expense" };
      categoriesApi.create(data);
      expect(api.post).toHaveBeenCalledWith("/categories/", data);
    });

    it("delete calls DELETE /categories/:id", () => {
      categoriesApi.delete("cat-1");
      expect(api.delete).toHaveBeenCalledWith("/categories/cat-1");
    });
  });

  describe("budgetsApi", () => {
    it("list calls GET /budgets/", () => {
      budgetsApi.list();
      expect(api.get).toHaveBeenCalledWith("/budgets/");
    });

    it("create calls POST /budgets/", () => {
      const data = { category_id: "c1", amount: 500, period: "monthly", start_date: "2024-01-01", end_date: null };
      budgetsApi.create(data);
      expect(api.post).toHaveBeenCalledWith("/budgets/", data);
    });

    it("delete calls DELETE /budgets/:id", () => {
      budgetsApi.delete("budget-1");
      expect(api.delete).toHaveBeenCalledWith("/budgets/budget-1");
    });
  });
});
