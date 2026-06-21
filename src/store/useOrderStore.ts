import { create } from 'zustand';
import { generateMockData } from '../mock/seed';
import { useLocalStorage } from '../utils/storage';
import type { Order, ProductionStatus, StatusRecord } from '../types';

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
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
}

const ordersStorage = useLocalStorage<Order[]>('order_list');

const initialOrders = (() => {
  const stored = ordersStorage.get();
  if (stored && stored.length > 0) return stored;
  const { orders } = generateMockData();
  ordersStorage.set(orders);
  return orders;
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
}));
