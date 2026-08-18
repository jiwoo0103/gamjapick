import type { TopicMetrics } from "./types";

export const emptyMetrics = (): TopicMetrics => ({
  views: null,
  likes: null,
  comments: null,
  searchVolume: null,
});

export function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function parseCount(value: string): number | null {
  const normalized = value.replace(/[,+\s]/g, "");
  if (!/^\d+$/.test(normalized)) return null;

  const count = Number(normalized);
  return Number.isSafeInteger(count) ? count : null;
}

export function parseApproximateCount(value: string): number | null {
  return parseCount(value.replace(/\+$/, ""));
}

export function toAbsoluteUrl(baseUrl: string, href: string): string {
  return new URL(href, baseUrl).toString();
}

export function sourceIdFromUrl(url: string, fallback: string): string {
  const numericId = url.match(/(?:no=|document_srl=|\/best\/)(\d+)/)?.[1];
  if (numericId) return numericId;

  return url.match(/\/([^/?#]+)(?:[?#]|$)/)?.[1] ?? fallback;
}

export function toIsoDate(value: string | undefined): string | null {
  if (!value) return null;

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString();
}
