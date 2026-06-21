/**
 * 生成32位随机选片链接Token
 * 字符集：a-z, A-Z, 0-9，共62个字符，安全且URL友好
 * @param length Token长度，默认32位
 * @returns 随机Token字符串
 * @example
 * generateSelectToken() // 'aB3xK9mP2qR7sT5wN8vL1cX4yZ6fG0hJ'
 * generateSelectToken(16) // 16位长度Token
 */
export function generateSelectToken(length: number = 32): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const charsLength = chars.length;
  let result = '';

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      result += chars[values[i] % charsLength];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * charsLength)];
    }
  }

  return result;
}

/**
 * 生成UUID v4 格式的唯一ID
 * 优先使用浏览器原生 crypto.randomUUID()，不支持时使用兼容实现
 * @returns UUID字符串，格式如：550e8400-e29b-41d4-a716-446655440000
 * @example
 * generateId() // '550e8400-e29b-41d4-a716-446655440000'
 */
export function generateId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  const hex = '0123456789abcdef';
  const uuid: string[] = new Array(36);
  let random: number;

  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid[i] = '-';
      continue;
    }
    if (i === 14) {
      uuid[i] = '4';
      continue;
    }
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const arr = new Uint8Array(1);
      crypto.getRandomValues(arr);
      random = arr[0] % 16;
    } else {
      random = Math.floor(Math.random() * 16);
    }
    if (i === 19) {
      random = (random & 0x3) | 0x8;
    }
    uuid[i] = hex[random];
  }

  return uuid.join('');
}

/**
 * 复制文本到剪贴板
 * 优先使用 Clipboard API，不支持时降级到 textarea + execCommand 方案
 * @param text 要复制的文本内容
 * @returns Promise<boolean> 复制成功返回true，失败返回false
 * @example
 * await copyToClipboard('Hello World') // true
 *
 * copyToClipboard(token).then(success => {
 *   if (success) toast('复制成功');
 *   else toast('复制失败，请手动复制');
 * });
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) {
    console.warn('[copyToClipboard] 空内容无需复制');
    return false;
  }

  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.warn('[copyToClipboard] Clipboard API 失败，降级方案:', error);
    }
  }

  if (typeof document === 'undefined') {
    console.warn('[copyToClipboard] 非浏览器环境，无法复制');
    return false;
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    textarea.setAttribute('readonly', '');
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (error) {
    console.warn('[copyToClipboard] 降级复制失败:', error);
    return false;
  }
}

/**
 * 生成选片链接URL（便捷方法）
 * @param baseUrl 基础域名，如 'https://select.example.com'
 * @param token 选片Token，不传则自动生成
 * @returns 完整的选片链接URL
 * @example
 * buildSelectLink('https://select.example.com')
 * // 'https://select.example.com/s/aB3xK9mP2qR7sT5wN8vL1cX4yZ6fG0hJ'
 *
 * buildSelectLink('https://select.example.com', 'mytoken123')
 * // 'https://select.example.com/s/mytoken123'
 */
export function buildSelectLink(baseUrl: string, token?: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const t = token ?? generateSelectToken();
  return `${cleanBase}/s/${t}`;
}
