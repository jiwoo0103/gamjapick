import type { TopicMetrics } from "./types";

export const emptyMetrics = (): TopicMetrics => ({ likes: null, comments: null });
export function cleanText(value: string): string { return value.replace(/\s+/g, " ").trim(); }
export function parseCount(value: string): number | null {
  const normalized = value.replace(/[,+\s]/g, "");
  if (!/^\d+$/.test(normalized)) return null;
  const count = Number(normalized);
  return Number.isSafeInteger(count) ? count : null;
}
export function toAbsoluteUrl(baseUrl: string, href: string): string { return new URL(href, baseUrl).toString(); }
export function sourceIdFromUrl(url: string, fallback: string): string {
  const articleId = url.match(/\/(\d{6,})\/\d+(?:[/?#]|$)/)?.[1] ?? url.match(/(?:document_srl=|\/)(\d{6,})(?:[/?#]|$)/)?.[1];
  if (articleId) return articleId;
  const parsed = new URL(url);
  return `${parsed.hostname}${parsed.pathname}` || fallback;
}
export function koreanDateTimeToIso(value: string): string | null {
  const match = cleanText(value).match(/^(\d{4})[.-](\d{2})[.-](\d{2})\s+(\d{2}):(\d{2})$/);
  if (!match) return null;
  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:00+09:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
