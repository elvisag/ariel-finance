import { act } from "@testing-library/react-native";
import { useAuthStore } from "../../store/auth";
import { authApi } from "../../services/finance";
import { setToken, getToken, removeToken } from "../../services/api";

jest.mock("../../services/api", () => ({
  __esModule: true,
  setToken: jest.fn(),
  getToken: jest.fn(),
  removeToken: jest.fn(),
}));

jest.mock("../../services/finance", () => ({
  __esModule: true,
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    me: jest.fn(),
    googleAuth: jest.fn(),
  },
}));

describe("auth.ts — Zustand auth store", () => {
  const mockUser = {
    id: "uuid-1",
    email: "test@example.com",
    name: "Test User",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: true,
    });
  });

  describe("login", () => {
    it("authenticates user on successful login", async () => {
      (authApi.login as jest.Mock).mockResolvedValue({
        data: { access_token: "jwt-token", token_type: "bearer" },
      });
      (authApi.me as jest.Mock).mockResolvedValue({ data: mockUser });

      await act(async () => {
        await useAuthStore.getState().login("test@example.com", "pass");
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(setToken).toHaveBeenCalledWith("jwt-token");
    });

    it("throws on invalid credentials", async () => {
      (authApi.login as jest.Mock).mockRejectedValue(new Error("Invalid"));

      await act(async () => {
        try {
          await useAuthStore.getState().login("test@example.com", "wrong");
        } catch {
          // expected
        }
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });

  describe("register", () => {
    it("authenticates user after successful registration", async () => {
      (authApi.register as jest.Mock).mockResolvedValue({
        data: { access_token: "jwt-token", token_type: "bearer" },
      });
      (authApi.me as jest.Mock).mockResolvedValue({ data: mockUser });

      await act(async () => {
        await useAuthStore.getState().register("test@example.com", "Test User", "pass");
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(setToken).toHaveBeenCalledWith("jwt-token");
    });
  });

  describe("logout", () => {
    it("clears user and deauthenticates", async () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true, isLoading: false });

      await act(async () => {
        await useAuthStore.getState().logout();
      });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(removeToken).toHaveBeenCalled();
    });
  });

  describe("checkAuth", () => {
    it("sets authenticated when token is valid", async () => {
      (getToken as jest.Mock).mockResolvedValue("valid-token");
      (authApi.me as jest.Mock).mockResolvedValue({ data: mockUser });

      await act(async () => {
        await useAuthStore.getState().checkAuth();
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it("sets unauthenticated when no token exists", async () => {
      (getToken as jest.Mock).mockResolvedValue(null);

      await act(async () => {
        await useAuthStore.getState().checkAuth();
      });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it("sets unauthenticated when token is invalid", async () => {
      (getToken as jest.Mock).mockResolvedValue("invalid-token");
      (authApi.me as jest.Mock).mockRejectedValue(new Error("401"));

      await act(async () => {
        await useAuthStore.getState().checkAuth();
      });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(removeToken).toHaveBeenCalled();
    });
  });
});
