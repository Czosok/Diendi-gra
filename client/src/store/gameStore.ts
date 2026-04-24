import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  username: string;
  email?: string;
}

interface GameState {
  user: User | null;
  token: string | null;
  currentCampaign: number | null;
  currentCharacter: number | null;
  isAuthenticated: boolean;
  
  // Actions
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setCurrentCampaign: (campaignId: number | null) => void;
  setCurrentCharacter: (characterId: number | null) => void;
  checkAuth: () => Promise<void>;
}

const API_URL = '/api';

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      currentCampaign: null,
      currentCharacter: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, currentCampaign: null });
      },

      setCurrentCampaign: (campaignId) => {
        set({ currentCampaign: campaignId });
      },

      setCurrentCharacter: (characterId) => {
        set({ currentCharacter: characterId });
      },

      checkAuth: async () => {
        const token = get().token;
        if (!token) return;

        try {
          const res = await fetch(`${API_URL}/auth/verify`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            set({ user: data.user, isAuthenticated: true });
          } else {
            set({ user: null, token: null, isAuthenticated: false });
          }
        } catch {
          set({ user: null, token: null, isAuthenticated: false });
        }
      }
    }),
    {
      name: 'dnd-storage',
      partialize: (state) => ({ token: state.token })
    }
  )
);

// Helper for API calls
export async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = useGameStore.getState().token;
  
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return res.json();
}