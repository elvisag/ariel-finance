import axios from "axios";
import api, { setToken, getToken, removeToken } from "../../services/api";

jest.mock("expo-secure-store");

describe("api.ts — Axios client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates an axios instance with baseURL", () => {
    expect(api.defaults.baseURL).toContain("192.168");
    expect(api.defaults.headers["Content-Type"]).toBe("application/json");
  });

  it("attaches Authorization header when token exists", async () => {
    const SecureStore = require("expo-secure-store");
    SecureStore.getItemAsync.mockResolvedValue("test-token-123");

    const config = await api.interceptors.request.handlers[0].fulfilled({
      headers: {},
    });

    expect(config.headers.Authorization).toBe("Bearer test-token-123");
  });

  it("does not attach Authorization header when no token", async () => {
    const SecureStore = require("expo-secure-store");
    SecureStore.getItemAsync.mockResolvedValue(null);

    const config = await api.interceptors.request.handlers[0].fulfilled({
      headers: {},
    });

    expect(config.headers.Authorization).toBeUndefined();
  });

  it("deletes token on 401 response", () => {
    const SecureStore = require("expo-secure-store");
    const error = { response: { status: 401 } };

    expect(() => {
      api.interceptors.response.handlers[0].rejected(error);
    }).rejects.toBe(error);

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("auth_token");
  });

  it("does not delete token on non-401 errors", () => {
    const SecureStore = require("expo-secure-store");
    const error = { response: { status: 500 } };

    expect(() => {
      api.interceptors.response.handlers[0].rejected(error);
    }).rejects.toBe(error);

    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
  });
});

describe("Token helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("setToken stores the token", async () => {
    const SecureStore = require("expo-secure-store");
    await setToken("my-jwt");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("auth_token", "my-jwt");
  });

  it("getToken retrieves the token", async () => {
    const SecureStore = require("expo-secure-store");
    SecureStore.getItemAsync.mockResolvedValue("stored-token");
    const token = await getToken();
    expect(token).toBe("stored-token");
  });

  it("removeToken deletes the token", async () => {
    const SecureStore = require("expo-secure-store");
    await removeToken();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("auth_token");
  });
});
