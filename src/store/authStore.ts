import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { api, setToken } from '../api/client';
import { User } from '../types';

function mapUser(raw: any): User {
  return {
    id: raw.id,
    name: raw.name,
    username: raw.username,
    email: raw.email ?? '',
    avatarUrl: raw.avatarUrl ?? undefined,
    avatarInitials: (raw.name ?? '??').slice(0, 2).toUpperCase(),
    bio: raw.bio,
    role: raw.role ?? 'user',
    isVerified: raw.isVerified ?? false,
    isPremium: raw.isPremium ?? false,
    followersCount: raw.followersCount ?? 0,
    followingCount: raw.followingCount ?? 0,
    tweetsCount: raw.postsCount ?? 0,
    location:
      raw.latitude != null && raw.longitude != null
        ? {
            latitude: Number(raw.latitude),
            longitude: Number(raw.longitude),
            name: raw.locationName ?? undefined,
          }
        : undefined,
  };
}

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  token: string | null;
  localAvatarUri: string | null;
  hasHydrated: boolean;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, username: string, email: string, password: string) => Promise<void>;
  initializeAuth: () => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  setLocalAvatarUri: (uri: string | null) => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      token: null,
      localAvatarUri: null,
      hasHydrated: false,
      isBootstrapping: true,

      login: async (email, password) => {
        const res = await api.post<{ access_token: string; user: any }>('/auth/login', { email, password });
        setToken(res.access_token);

        const profile = await api.get<any>('/users/me').catch(() => res.user);
        set({
          token: res.access_token,
          user: mapUser(profile),
          isLoggedIn: true,
          localAvatarUri: null,
          isBootstrapping: false,
        });
      },

      register: async (name, username, email, password) => {
        const res = await api.post<{ access_token: string; user: any }>('/auth/register', { name, username, email, password });
        setToken(res.access_token);

        const profile = await api.get<any>('/users/me').catch(() => res.user);
        set({
          token: res.access_token,
          user: mapUser(profile),
          isLoggedIn: true,
          localAvatarUri: null,
          isBootstrapping: false,
        });
      },

      initializeAuth: async () => {
        const { token, isLoggedIn } = get();

        if (!token || !isLoggedIn) {
          setToken(null);
          set({ isBootstrapping: false, localAvatarUri: null });
          return;
        }

        setToken(token);

        try {
          const profile = await api.get<any>('/users/me');
          set({
            user: mapUser(profile),
            isLoggedIn: true,
            localAvatarUri: null,
            isBootstrapping: false,
          });
        } catch {
          setToken(null);
          set({
            user: null,
            isLoggedIn: false,
            token: null,
            localAvatarUri: null,
            isBootstrapping: false,
          });
        }
      },

      logout: () => {
        setToken(null);
        set({
          user: null,
          isLoggedIn: false,
          token: null,
          localAvatarUri: null,
          isBootstrapping: false,
        });
      },

      setLocalAvatarUri: (uri) => set({ localAvatarUri: uri }),

      setHasHydrated: (value) => set({ hasHydrated: value }),

      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isLoggedIn: state.isLoggedIn,
        token: state.token,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          useAuthStore.setState({ hasHydrated: true, isBootstrapping: false });
          return;
        }
        if (state.token) setToken(state.token);
        state.setHasHydrated(true);
      },
    },
  ),
);
