import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import * as Google from "expo-auth-session/providers/google";
import { authApi } from "../../services/finance";
import { setToken } from "../../services/api";
import * as WebBrowser from "expo-web-browser";

jest.mock("expo-secure-store");
jest.mock("expo-web-browser");
jest.mock("expo-auth-session/providers/google", () => ({
  useIdTokenAuthRequest: jest.fn(),
}));

jest.mock("../../services/api", () => ({
  __esModule: true,
  setToken: jest.fn(),
  getToken: jest.fn(),
  removeToken: jest.fn(),
}));

jest.mock("../../services/finance", () => ({
  __esModule: true,
  authApi: {
    googleAuth: jest.fn(),
  },
}));

const mockCheckAuth = jest.fn();
jest.mock("../../store/auth", () => {
  const mockStore = { checkAuth: mockCheckAuth };
  const useAuthStore = Object.assign(
    (selector?: (s: typeof mockStore) => any) =>
      selector ? selector(mockStore) : mockStore,
    { getState: () => mockStore },
  );
  return { useAuthStore };
});

describe("useGoogleAuth hook", () => {
  const mockCheckAuth = jest.fn();
  const mockPromptAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (Google.useIdTokenAuthRequest as jest.Mock).mockReturnValue([
      null,
      null,
      mockPromptAsync,
    ]);
  });

  it("returns the correct initial state", () => {
    const { result } = renderHook(() => useGoogleAuth());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("calls promptAsync on signInWithGoogle", async () => {
    const { result } = renderHook(() => useGoogleAuth());

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(mockPromptAsync).toHaveBeenCalled();
  });

  it("sends id_token to backend on successful Google response", async () => {
    (authApi.googleAuth as jest.Mock).mockResolvedValue({
      data: { access_token: "our-jwt", token_type: "bearer" },
    });

    const { rerender } = renderHook(() => useGoogleAuth());

    const mockResponse = { type: "success", params: { id_token: "google-id-token" } };
    (Google.useIdTokenAuthRequest as jest.Mock).mockReturnValue([
      null,
      mockResponse,
      mockPromptAsync,
    ]);

    rerender(undefined);

    await waitFor(() => {
      expect(authApi.googleAuth).toHaveBeenCalledWith("google-id-token");
    });
  });

  it("sets error on failed Google authentication", async () => {
    (authApi.googleAuth as jest.Mock).mockRejectedValue({
      response: { data: { detail: "Token inválido" } },
    });

    const { rerender, result } = renderHook(() => useGoogleAuth());

    const mockResponse = { type: "success", params: { id_token: "bad-token" } };
    (Google.useIdTokenAuthRequest as jest.Mock).mockReturnValue([
      null,
      mockResponse,
      mockPromptAsync,
    ]);

    rerender(undefined);

    await waitFor(() => {
      expect(result.current.error).toBe("Token inválido");
    });
  });

  it("sets error when auth is cancelled", async () => {
    const { rerender, result } = renderHook(() => useGoogleAuth());

    const mockResponse = { type: "error", params: {} };
    (Google.useIdTokenAuthRequest as jest.Mock).mockReturnValue([
      null,
      mockResponse,
      mockPromptAsync,
    ]);

    rerender(undefined);

    expect(result.current.error).toBe("Autenticación cancelada o fallida");
  });
});
