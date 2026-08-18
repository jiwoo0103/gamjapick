import { load } from "cheerio";
import type { Collector } from "../collector";
import { fetchPublicText } from "../fetch";
import { cleanText, parseCount, sourceIdFromUrl, toAbsoluteUrl } from "../parsers";
import type { TopicDraft } from "../types";

export type DogdripList = { id: string; url: string; label: string; category: string };
const LISTS: DogdripList[] = [
  { id: "dogdrip-main-popular", url: "https://www.dogdrip.net/?mid=dogdrip&sort_index=popular", label: "개드립 인기글", category: "개드립" },
  { id: "dogdrip-user-popular", url: "https://www.dogdrip.net/?mid=userdog&sort_index=popular", label: "유저 개드립 인기글", category: "유저 개드립" },
  { id: "dogdrip-doc-popular", url: "https://www.dogdrip.net/doc?sort_index=popular", label: "읽을 거리 판 인기글", category: "읽을 거리" },
];

export function parseDogdripPopularHtml(html: string, list: DogdripList): TopicDraft[] {
  const $ = load(html);
  return $("tr.ed").toArray().flatMap((row) => {
    const anchor = $(row).find("a[data-document-srl][href]").first();
    const href = anchor.attr("href"); const sourceId = anchor.attr("data-document-srl");
    const title = cleanText(anchor.clone().find(".replyNum, .comment_count").remove().end().text());
    if (!href || !sourceId || !title) return [];
    const url = toAbsoluteUrl(list.url, href);
    const comments = parseCount($(row).find(".replyNum, .comment_count").first().text()) ?? parseCount(title.match(/@(\d+)$/)?.[1] ?? "");
    const category = cleanText($(row).find(".category, .document_category").first().text()) || list.category;
    return [{ source: "dogdrip" as const, sourceId: sourceIdFromUrl(url, sourceId), url, title: title.replace(/\s*@\d+$/, ""), summary: null, publishedAt: null, publishedAtLabel: cleanText($(row).find(".regdate, .date").last().text()) || null, metrics: { likes: parseCount($(row).find(".voted_count, .votedNum, .voted").last().text()), comments }, placements: [{ collectorId: list.id, label: list.label, rankingType: "인기글", rank: null, category }] }];
  }).slice(0, 30);
}

export const dogdripCollectors: Collector[] = LISTS.map((list) => ({
  id: list.id,
  source: "dogdrip",
  async collect() {
    const items = parseDogdripPopularHtml(await fetchPublicText(list.url), list);
    if (items.length === 0) throw new Error("Dogdrip popular-list markup contained no eligible rows; treating it as a blocked or changed page.");
    return items;
  },
}));
