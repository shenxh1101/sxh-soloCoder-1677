import { create } from 'zustand';
import { generateMockData } from '../mock/seed';
import { useLocalStorage } from '../utils/storage';
import type { Client } from '../types';

interface ClientState {
  clients: Client[];
  currentClient: Client | null;
  fetchClients: () => Promise<Client[]>;
  getClient: (id: string) => Client | undefined;
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client;
  updateClient: (id: string, data: Partial<Client>) => Client | undefined;
  searchClients: (keyword: string, consultantId?: string) => Client[];
}

const clientsStorage = useLocalStorage<Client[]>('client_list');

const initialClients = (() => {
  const stored = clientsStorage.get();
  if (stored && stored.length > 0) return stored;
  const { clients } = generateMockData();
  clientsStorage.set(clients);
  return clients;
})();

function generateClientId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `client_${timestamp}${random}`;
}

export const useClientStore = create<ClientState>((set, get) => ({
  clients: initialClients,
  currentClient: null,

  fetchClients: async () => {
    const { clients } = get();
    return clients;
  },

  getClient: (id: string) => {
    const { clients } = get();
    const client = clients.find((c) => c.id === id);
    if (client) {
      set({ currentClient: client });
    }
    return client;
  },

  addClient: (client) => {
    const newClient: Client = {
      ...client,
      id: generateClientId(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...get().clients, newClient];
    set({ clients: updated });
    clientsStorage.set(updated);
    return newClient;
  },

  updateClient: (id, data) => {
    const { clients } = get();
    const idx = clients.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    const updatedClient = { ...clients[idx], ...data };
    const updated = [...clients];
    updated[idx] = updatedClient;
    set({ clients: updated, currentClient: updatedClient });
    clientsStorage.set(updated);
    return updatedClient;
  },

  searchClients: (keyword, consultantId) => {
    const { clients } = get();
    const kw = keyword.trim().toLowerCase();
    return clients.filter((c) => {
      if (consultantId && c.consultantId !== consultantId) return false;
      if (!kw) return true;
      return (
        c.name.toLowerCase().includes(kw) ||
        c.partnerName.toLowerCase().includes(kw) ||
        c.phone.includes(kw) ||
        (c.wechat && c.wechat.toLowerCase().includes(kw))
      );
    });
  },
}));
