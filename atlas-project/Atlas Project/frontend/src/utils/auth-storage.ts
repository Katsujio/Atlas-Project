const ACCESS_TOKEN_KEY = "atlas.accessToken";
const REFRESH_TOKEN_KEY = "atlas.refreshToken";
const USER_KEY = "atlas.user";

export type StoredUser = {
  id: number;
  email: string;
  created_at: string;
};

export type StoredTokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

export const getStoredTokens = (): StoredTokens => ({
  accessToken: window.localStorage.getItem(ACCESS_TOKEN_KEY),
  refreshToken: window.localStorage.getItem(REFRESH_TOKEN_KEY),
});

export const storeTokens = (accessToken: string, refreshToken: string) => {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const getStoredUser = (): StoredUser | null => {
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
};

export const storeUser = (user: StoredUser) => {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
};
