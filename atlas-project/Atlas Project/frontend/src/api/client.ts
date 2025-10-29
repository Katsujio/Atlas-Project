import axios, { AxiosError, AxiosRequestConfig } from "axios";

import {
  clearSession,
  getStoredTokens,
  storeTokens,
} from "../utils/auth-storage";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "/api";

type RetriableConfig = AxiosRequestConfig & { _retry?: boolean };

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const tokens = getStoredTokens();
  if (tokens.accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  const tokens = getStoredTokens();
  if (!tokens.refreshToken) {
    return null;
  }
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${baseURL}/auth/refresh`,
        { refresh_token: tokens.refreshToken },
        { headers: { Authorization: undefined } },
      )
      .then((response) => {
        const data = response.data as {
          access_token: string;
          refresh_token: string;
        };
        storeTokens(data.access_token, data.refresh_token);
        return data.access_token;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config as RetriableConfig;

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken && originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api.request(originalRequest);
      }
      clearSession();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
