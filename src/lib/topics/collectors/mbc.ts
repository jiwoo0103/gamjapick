import type { Collector } from "../collector";
import { fetchPublicJson } from "../fetch";
import { cleanText, emptyMetrics, koreanDateTimeToIso, sourceIdFromUrl, toAbsoluteUrl } from "../parsers";
import type { TopicDraft } from "../types";

const MAIN_URL = "https://imnews.imbc.com/pc_main.html?gnb=top";
type MbcContent = { AId?: string; Link?: string; Title?: string; StartDate?: string; Section?: string };
type MbcRankingPayload = { Data?: MbcContent[] };

export function parseMbcOriginalPayload(payload: MbcRankingPayload): TopicDraft[] {
  if (!Array.isArray(payload.Data)) throw new Error("MBC original-content response did not contain a Data list.");
  return payload.Data.filter((item) => /\/original\/(?:mbig|14f)\//.test(item.Link ?? "")).slice(0, 20).flatMap((item, index) => {
    const title = cleanText(item.Title ?? ""); const href = item.Link;
    if (!title || !href) return [];
    const url = toAbsoluteUrl(MAIN_URL, href); const category = /\/14f\//.test(url) ? "14F" : "엠빅";
    return [{ source: "mbc" as const, sourceId: item.AId ?? sourceIdFromUrl(url, href), url, title, summary: item.Section ? `분야 · ${cleanText(item.Section)}` : null, publishedAt: koreanDateTimeToIso(item.StartDate ?? ""), publishedAtLabel: cleanText(item.StartDate ?? "") || null, metrics: emptyMetrics(), placements: [{ collectorId: "mbc-mbig-14f", label: "MBC 엠빅 X 14F", rankingType: "엠빅 X 14F", rank: index + 1, category }] }];
  });
}

export function parseMbcRankingPayload(payload: MbcRankingPayload, collectorId: "mbc-portal" | "mbc-sns", label: string): TopicDraft[] {
  if (!Array.isArray(payload.Data)) throw new Error("MBC ranking response did not contain a Data list.");
  return payload.Data.slice(0, 6).flatMap((item, index) => {
    const title = cleanText(item.Title ?? ""); const href = item.Link;
    if (!title || !href) return [];
    const url = toAbsoluteUrl(MAIN_URL, href);
    return [{ source: "mbc" as const, sourceId: sourceIdFromUrl(url, href), url, title, summary: null, publishedAt: null, publishedAtLabel: null, metrics: emptyMetrics(), placements: [{ collectorId, label, rankingType: collectorId === "mbc-sns" ? "SNS" : "포털", rank: index + 1, category: null }] }];
  });
}

export const mbcCollectors: Collector[] = [
  { id: "mbc-mbig-14f", source: "mbc", async collect() { return parseMbcOriginalPayload(await fetchPublicJson<MbcRankingPayload>("https://imnews.imbc.com/original/newest.js")); } },
  { id: "mbc-portal", source: "mbc", async collect() { return parseMbcRankingPayload(await fetchPublicJson<MbcRankingPayload>("https://imnews.imbc.com/page/include/js/json/rank_portal.js"), "mbc-portal", "MBC 많이 본 뉴스 · 포털"); } },
  { id: "mbc-sns", source: "mbc", async collect() { return parseMbcRankingPayload(await fetchPublicJson<MbcRankingPayload>("https://imnews.imbc.com/page/include/js/json/rank_sns.js"), "mbc-sns", "MBC 많이 본 뉴스 · SNS"); } },
];
