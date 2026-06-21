import { create } from 'zustand';
import type { User, UserRole } from '@/types';
import { generateMockData } from '@/mock/seed';

interface AuthState {
  currentUser: User | null;
  users: User[];
  isAuthenticated: boolean;
  login: (username: string, password?: string) => Promise<boolean>;
  logout: () => void;
  getUserById: (id: string) => User | undefined;
  getUsersByRole: (role: UserRole) => User[];
}

const mockData = generateMockData();

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: mockData.users[0],
  users: mockData.users,
  isAuthenticated: true,

  login: async (username: string) => {
    const user = mockData.users.find((u) => u.username === username);
    if (user && user.isActive) {
      set({ currentUser: user, isAuthenticated: true });
      return true;
    }
    return false;
  },

  logout: () => {
    set({ currentUser: null, isAuthenticated: false });
  },

  getUserById: (id: string) => {
    return get().users.find((u) => u.id === id);
  },

  getUsersByRole: (role: UserRole) => {
    return get().users.filter((u) => u.role === role);
  },
}));
