import { isExpired } from './date';

interface StorageItem<T> {
  value: T;
  expireAt?: string;
  createdAt: string;
}

interface StorageOptions {
  /** 过期天数，设置后该存储将在指定天数后过期 */
  expireDays?: number;
  /** 过期日期（ISO字符串），优先级高于 expireDays */
  expireAt?: string | Date;
}

interface UseLocalStorageReturn<T> {
  /** 获取存储的值，过期返回null */
  get: () => T | null;
  /** 设置存储的值 */
  set: (value: T, options?: StorageOptions) => void;
  /** 移除该存储项 */
  remove: () => void;
  /** 检查是否存在且未过期 */
  exists: () => boolean;
}

/**
 * 判断是否为浏览器环境
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

/**
 * 解析存储的原始值
 * @param raw 原始字符串
 * @returns 解析后的 StorageItem 对象，解析失败返回 null
 */
function parseRaw<T>(raw: string | null): StorageItem<T> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StorageItem<T>;
    if (parsed && typeof parsed === 'object' && 'value' in parsed && 'createdAt' in parsed) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 检查存储项是否已过期
 */
function checkExpired<T>(item: StorageItem<T>): boolean {
  if (!item.expireAt) return false;
  return isExpired(item.expireAt);
}

/**
 * 生成过期日期ISO字符串
 */
function computeExpireAt(options?: StorageOptions): string | undefined {
  if (!options) return undefined;
  if (options.expireAt) {
    const d = options.expireAt instanceof Date ? options.expireAt : new Date(options.expireAt);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  }
  if (options.expireDays && options.expireDays > 0) {
    const d = new Date();
    d.setDate(d.getDate() + options.expireDays);
    return d.toISOString();
  }
  return undefined;
}

/**
 * useLocalStorage Hook 风格工具函数
 * 返回 get/set/remove/exists 四个方法，支持泛型、JSON序列化、过期时间
 * @param key localStorage 键名
 * @param defaultValue 默认值（仅在 get 取不到时返回）
 * @returns 包含 get、set、remove、exists 方法的对象
 * @example
 * const tokenStore = useLocalStorage<string>('auth_token');
 * tokenStore.set('abc123', { expireDays: 7 }); // 设置并7天后过期
 * const token = tokenStore.get(); // 获取值，过期返回null
 * tokenStore.remove(); // 删除存储
 * tokenStore.exists(); // 是否存在且未过期
 *
 * const userStore = useLocalStorage<User>('user_info');
 * userStore.set({ id: 1, name: '张三' });
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T | null = null,
): UseLocalStorageReturn<T> {
  const get = (): T | null => {
    if (!isBrowser()) return defaultValue;
    try {
      const raw = localStorage.getItem(key);
      const item = parseRaw<T>(raw);
      if (!item) return defaultValue;
      if (checkExpired(item)) {
        localStorage.removeItem(key);
        return defaultValue;
      }
      return item.value;
    } catch {
      return defaultValue;
    }
  };

  const set = (value: T, options?: StorageOptions): void => {
    if (!isBrowser()) return;
    try {
      const item: StorageItem<T> = {
        value,
        createdAt: new Date().toISOString(),
        expireAt: computeExpireAt(options),
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.warn(`[storage] set "${key}" failed:`, error);
    }
  };

  const remove = (): void => {
    if (!isBrowser()) return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`[storage] remove "${key}" failed:`, error);
    }
  };

  const exists = (): boolean => {
    if (!isBrowser()) return false;
    try {
      const raw = localStorage.getItem(key);
      const item = parseRaw<T>(raw);
      if (!item) return false;
      if (checkExpired(item)) {
        localStorage.removeItem(key);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  return { get, set, remove, exists };
}

/**
 * 通用：获取 localStorage 值
 * @param key 键名
 * @param defaultValue 默认值
 * @returns 存储的值，不存在或已过期返回 defaultValue
 * @example
 * getStorage<string>('auth_token') // 'abc123' 或 null
 */
export function getStorage<T>(key: string, defaultValue: T | null = null): T | null {
  return useLocalStorage<T>(key, defaultValue).get();
}

/**
 * 通用：设置 localStorage 值
 * @param key 键名
 * @param value 存储的值（会自动 JSON 序列化）
 * @param options 存储配置（过期时间等）
 * @example
 * setStorage('auth_token', 'abc123', { expireDays: 7 });
 * setStorage('user_info', { id: 1, name: '张三' });
 */
export function setStorage<T>(key: string, value: T, options?: StorageOptions): void {
  useLocalStorage<T>(key).set(value, options);
}

/**
 * 通用：移除 localStorage 值
 * @param key 键名
 * @example
 * removeStorage('auth_token');
 */
export function removeStorage(key: string): void {
  useLocalStorage(key).remove();
}

/**
 * 批量清理已过期的 localStorage 项
 * @returns 清理的条目数量
 * @example
 * const cleaned = clearExpiredStorage();
 * console.log(`清理了 ${cleaned} 个过期存储项`);
 */
export function clearExpiredStorage(): number {
  if (!isBrowser()) return 0;
  let count = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const raw = localStorage.getItem(key);
      const item = parseRaw<unknown>(raw);
      if (item && checkExpired(item)) {
        localStorage.removeItem(key);
        count++;
        i--;
      }
    }
  } catch (error) {
    console.warn('[storage] clear expired failed:', error);
  }
  return count;
}
