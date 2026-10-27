import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const AUTH_TOKEN_KEY = 'auth_session_token';
const ISSUER_URL =
  process.env.EXPO_PUBLIC_ISSUER_URL ?? 'https://replit.com/oidc';

export interface AeroUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

interface AuthContextValue {
  user: AeroUser | null;
  isLoading: boolean;
  isReady: boolean;
  isAuthenticated: boolean;
  isLoginPending: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function getAeroApiBaseUrl(): string {
  const configuredBase =
    process.env.EXPO_PUBLIC_API_BASE_URL ?? process.env.EXPO_PUBLIC_DOMAIN;
  if (!configuredBase) return '';
  return configuredBase.startsWith('http')
    ? configuredBase.replace(/\/+$/, '')
    : `https://${configuredBase.replace(/\/+$/, '')}`;
}

export async function getAeroSessionToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof window === 'undefined'
      ? null
      : window.localStorage.getItem(AUTH_TOKEN_KEY);
  }
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

async function storeAeroSessionToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
    return;
  }
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

async function clearAeroSessionToken(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
    }
    return;
  }
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AeroUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginPending, setIsLoginPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nonceRef = useRef<string | null>(null);
  if (!nonceRef.current) nonceRef.current = Crypto.randomUUID();
  const discovery = AuthSession.useAutoDiscovery(ISSUER_URL);
  const redirectUri = AuthSession.makeRedirectUri();
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_REPL_ID ?? '',
      scopes: ['openid', 'email', 'profile', 'offline_access'],
      redirectUri,
      extraParams: { nonce: nonceRef.current },
      prompt: AuthSession.Prompt.Login,
    },
    discovery,
  );

  const fetchUser = useCallback(async () => {
    const token = await getAeroSessionToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const apiBase = getAeroApiBaseUrl();
    if (!apiBase) {
      setError('The account service is not available in this preview.');
      setIsLoading(false);
      return;
    }

    try {
      const result = await fetch(`${apiBase}/api/auth/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!result.ok) throw new Error('Could not check your sign-in.');
      const data = (await result.json()) as { user: AeroUser | null };
      if (data.user) {
        setUser(data.user);
      } else {
        await clearAeroSessionToken();
        setUser(null);
      }
      setError(null);
    } catch (requestError) {
      setUser(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not check your sign-in.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (response?.type !== 'success' || !request?.codeVerifier) return;

    const { code, state } = response.params;
    let cancelled = false;

    void (async () => {
      try {
        const apiBase = getAeroApiBaseUrl();
        if (!apiBase || !code || !state) {
          throw new Error('The sign-in response was incomplete.');
        }

        const exchange = await fetch(
          `${apiBase}/api/mobile-auth/token-exchange`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code,
              code_verifier: request.codeVerifier,
              redirect_uri: redirectUri,
              state,
              nonce: nonceRef.current,
            }),
          },
        );
        if (!exchange.ok) {
          throw new Error('Sign-in could not be completed. Please try again.');
        }

        const data = (await exchange.json()) as { token?: string };
        if (!data.token) throw new Error('The account service returned no session.');
        await storeAeroSessionToken(data.token);
        if (!cancelled) {
          setIsLoading(true);
          await fetchUser();
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Sign-in could not be completed.',
          );
          setIsLoading(false);
        }
      } finally {
        if (!cancelled) setIsLoginPending(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchUser, redirectUri, request, response]);

  const login = useCallback(async () => {
    if (!request) return;
    setError(null);
    setIsLoginPending(true);
    try {
      const result = await promptAsync();
      if (result.type !== 'success') setIsLoginPending(false);
    } catch {
      setError('Sign-in could not be opened. Please try again.');
      setIsLoginPending(false);
    }
  }, [promptAsync, request]);

  const logout = useCallback(async () => {
    const token = await getAeroSessionToken();
    const apiBase = getAeroApiBaseUrl();
    try {
      if (token && apiBase) {
        await fetch(`${apiBase}/api/mobile-auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } finally {
      await clearAeroSessionToken();
      setUser(null);
      setError(null);
      setIsLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isReady: !!request,
      isAuthenticated: !!user,
      isLoginPending,
      error,
      login,
      logout,
    }),
    [user, isLoading, request, isLoginPending, error, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}
