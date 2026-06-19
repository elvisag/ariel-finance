import axios from "axios";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || "http://192.168.0.1:8000/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      SecureStore.deleteItemAsync(TOKEN_KEY);
    }
    return Promise.reject(error);
  }
);

export async function setToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removeToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export default api;
