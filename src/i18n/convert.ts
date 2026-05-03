import { s2t as convertFn } from "chinese-s2t";

function deepConvert(obj: unknown, convert: (s: string) => string): unknown {
  if (typeof obj === "string") return convert(obj);
  if (Array.isArray(obj)) return obj.map((v) => deepConvert(v, convert));
  if (obj && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = deepConvert(value, convert);
    }
    return result;
  }
  return obj;
}

let tradCache: Record<string, unknown> | null = null;

export async function getTraditionalMessages(): Promise<
  Record<string, unknown>
> {
  if (tradCache) return tradCache;
  const zhMessages = (await import("../messages/zh.json")).default;
  tradCache = deepConvert(zhMessages, convertFn) as Record<string, unknown>;
  return tradCache;
}
