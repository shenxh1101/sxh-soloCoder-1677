import { create } from 'zustand';
import { generateMockData } from '../mock/seed';
import { useLocalStorage } from '../utils/storage';
import type { Order, ProductionStatus, StatusRecord, SelectionConfirm, SelectionReminder, AdditionalService } from '../types';

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  selectionConfirms: Record<string, SelectionConfirm>;
  fetchOrders: () => Promise<Order[]>;
  getOrder: (id: string) => Order | undefined;
  getOrderByToken: (token: string) => Order | undefined;
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'statusHistory'>) => Order;
  updateOrder: (id: string, data: Partial<Order>) => Order | undefined;
  updateStatus: (
    orderId: string,
    status: ProductionStatus,
    operatorId: string,
    remark?: string
  ) => Order | undefined;
  setSatisfaction: (orderId: string, score: number) => Order | undefined;
  getOrdersByConsultant: (id: string) => Order[];
  getOrdersByStatus: (status: ProductionStatus) => Order[];
  saveSelectionConfirm: (confirm: SelectionConfirm) => void;
  getSelectionConfirm: (orderId: string) => SelectionConfirm | undefined;
  selectionReminders: Record<string, SelectionReminder[]>;
  additionalServices: Record<string, AdditionalService[]>;
  addSelectionReminder: (reminder: Omit<SelectionReminder, 'id' | 'createdAt'>) => void;
  getSelectionReminders: (orderId: string) => SelectionReminder[];
  addAdditionalService: (service: Omit<AdditionalService, 'id' | 'createdAt'>) => void;
  getAdditionalServices: (orderId: string) => AdditionalService[];
}

const ordersStorage = useLocalStorage<Order[]>('order_list');
const selectionConfirmsStorage = useLocalStorage<Record<string, SelectionConfirm>>('selection_confirms');
const selectionRemindersStorage = useLocalStorage<Record<string, SelectionReminder[]>>('selection_reminders');
const additionalServicesStorage = useLocalStorage<Record<string, AdditionalService[]>>('additional_services');

const initialOrders = (() => {
  const stored = ordersStorage.get();
  if (stored && stored.length > 0) return stored;
  const { orders } = generateMockData();
  ordersStorage.set(orders);
  return orders;
})();

const initialSelectionConfirms = (() => {
  const stored = selectionConfirmsStorage.get();
  return stored || {};
})();

const initialSelectionReminders = (() => {
  const stored = selectionRemindersStorage.get();
  return stored || {};
})();

const initialAdditionalServices = (() => {
  const stored = additionalServicesStorage.get();
  return stored || {};
})();

function generateOrderId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `order_${timestamp}${random}`;
}

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function persistOrders(orders: Order[]) {
  ordersStorage.set(orders);
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: initialOrders,
  currentOrder: null,
  selectionConfirms: initialSelectionConfirms,
  selectionReminders: initialSelectionReminders,
  additionalServices: initialAdditionalServices,

  fetchOrders: async () => {
    const { orders } = get();
    return orders;
  },

  getOrder: (id: string) => {
    const { orders } = get();
    const order = orders.find((o) => o.id === id);
    if (order) {
      set({ currentOrder: order });
    }
    return order;
  },

  getOrderByToken: (token: string) => {
    const { orders } = get();
    const order = orders.find((o) => o.selectToken === token);
    if (order) {
      set({ currentOrder: order });
    }
    return order;
  },

  addOrder: (order) => {
    const now = new Date();
    const expireAt = new Date(now);
    expireAt.setDate(expireAt.getDate() + 30);

    const statusRecord: StatusRecord = {
      status: 'pending_photos',
      updatedAt: now.toISOString(),
      operatorId: order.consultantId,
      remark: '订单已创建，等待拍摄',
    };

    const newOrder: Order = {
      ...order,
      id: generateOrderId(),
      status: 'pending_photos',
      selectToken: generateToken(),
      selectExpireAt: expireAt.toISOString(),
      statusHistory: [statusRecord],
      createdAt: now.toISOString(),
    };
    const updated = [...get().orders, newOrder];
    set({ orders: updated, currentOrder: newOrder });
    persistOrders(updated);
    return newOrder;
  },

  updateOrder: (id, data) => {
    const { orders } = get();
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) return undefined;
    const updatedOrder = { ...orders[idx], ...data };
    const updated = [...orders];
    updated[idx] = updatedOrder;
    set({ orders: updated, currentOrder: updatedOrder });
    persistOrders(updated);
    return updatedOrder;
  },

  updateStatus: (orderId, status, operatorId, remark) => {
    const { orders } = get();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return undefined;

    const statusRecord: StatusRecord = {
      status,
      updatedAt: new Date().toISOString(),
      operatorId,
      remark,
    };

    const targetOrder = orders[idx];
    const historyExists = targetOrder.statusHistory.some(
      (h) => h.status === status && h.updatedAt === statusRecord.updatedAt
    );

    let newHistory = targetOrder.statusHistory;
    if (!historyExists) {
      newHistory = [...targetOrder.statusHistory, statusRecord];
    }

    const updatedOrder: Order = {
      ...targetOrder,
      status,
      statusHistory: newHistory,
    };

    const updated = [...orders];
    updated[idx] = updatedOrder;
    set({ orders: updated, currentOrder: updatedOrder });
    persistOrders(updated);
    return updatedOrder;
  },

  setSatisfaction: (orderId, score) => {
    const { orders } = get();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return undefined;
    const clampedScore = Math.max(0, Math.min(5, score));
    const updatedOrder = { ...orders[idx], satisfaction: clampedScore };
    const updated = [...orders];
    updated[idx] = updatedOrder;
    set({ orders: updated, currentOrder: updatedOrder });
    persistOrders(updated);
    return updatedOrder;
  },

  getOrdersByConsultant: (id: string) => {
    return get().orders.filter((o) => o.consultantId === id);
  },

  getOrdersByStatus: (status: ProductionStatus) => {
    return get().orders.filter((o) => o.status === status);
  },

  saveSelectionConfirm: (confirm: SelectionConfirm) => {
    const updated = { ...get().selectionConfirms, [confirm.orderId]: confirm };
    set({ selectionConfirms: updated });
    selectionConfirmsStorage.set(updated);
  },

  getSelectionConfirm: (orderId: string) => {
    return get().selectionConfirms[orderId];
  },

  addSelectionReminder: (reminder) => {
    const now = new Date().toISOString();
    const newReminder: SelectionReminder = {
      ...reminder,
      id: `rem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: now,
    };
    const { selectionReminders } = get();
    const existing = selectionReminders[reminder.orderId] || [];
    const updated = {
      ...selectionReminders,
      [reminder.orderId]: [...existing, newReminder],
    };
    set({ selectionReminders: updated });
    selectionRemindersStorage.set(updated);
  },

  getSelectionReminders: (orderId: string) => {
    const reminders = get().selectionReminders[orderId] || [];
    return [...reminders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  addAdditionalService: (service) => {
    const now = new Date().toISOString();
    const newService: AdditionalService = {
      ...service,
      id: `svc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: now,
    };
    const { additionalServices } = get();
    const existing = additionalServices[service.orderId] || [];
    const updated = {
      ...additionalServices,
      [service.orderId]: [...existing, newService],
    };
    set({ additionalServices: updated });
    additionalServicesStorage.set(updated);
  },

  getAdditionalServices: (orderId: string) => {
    const services = get().additionalServices[orderId] || [];
    return [...services].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
}));
