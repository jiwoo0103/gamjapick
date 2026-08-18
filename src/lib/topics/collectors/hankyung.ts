import { load } from "cheerio";
import type { Collector } from "../collector";
import { fetchPublicText } from "../fetch";
import { cleanText, emptyMetrics, koreanDateTimeToIso, parseCount, sourceIdFromUrl, toAbsoluteUrl } from "../parsers";
import type { TopicDraft } from "../types";

export type HankyungList = { id: string; url: string; category: string };
const LISTS: HankyungList[] = [
  { id: "hankyung-society-most-read", url: "https://www.hankyung.com/society", category: "사회" },
  { id: "hankyung-tech-most-read", url: "https://www.hankyung.com/tech", category: "테크" },
];
export function parseHankyungMostReadHtml(html: string, list: HankyungList): TopicDraft[] {
  const $ = load(html);
  return $(".aside-ranking .ranking-list > li").slice(0, 5).toArray().flatMap((row) => {
    const anchor = $(row).find(".news-tit a[href]").first(); const href = anchor.attr("href"); const title = cleanText(anchor.text());
    if (!href || !title) return [];
    const url = toAbsoluteUrl(list.url, href); const publishedAtLabel = cleanText($(row).find(".txt-date").text()) || null;
    return [{ source: "hankyung" as const, sourceId: sourceIdFromUrl(url, href), url, title, summary: null, publishedAt: koreanDateTimeToIso(publishedAtLabel ?? ""), publishedAtLabel, metrics: emptyMetrics(), placements: [{ collectorId: list.id, label: `${list.category} 많이 본 뉴스`, rankingType: "많이 본 뉴스", rank: parseCount($(row).find(".txt-num").text()), category: list.category }] }];
  });
}
export const hankyungCollectors: Collector[] = LISTS.map((list) => ({ id: list.id, source: "hankyung", async collect() { return parseHankyungMostReadHtml(await fetchPublicText(list.url), list); } }));
