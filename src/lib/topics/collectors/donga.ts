import { load } from "cheerio";
import type { Collector } from "../collector";
import { fetchPublicText } from "../fetch";
import { cleanText, parseCount, sourceIdFromUrl, toAbsoluteUrl } from "../parsers";
import type { TopicDraft } from "../types";

export type DongaList = { id: string; url: string; label: string; rankingType: string };
const LISTS: DongaList[] = [
  { id: "donga-popular", url: "https://www.donga.com/news/TrendNews/daily", label: "동아 실시간 인기순", rankingType: "인기순" },
  { id: "donga-share", url: "https://www.donga.com/news/TrendNews/daily?m=share", label: "동아 실시간 공유순", rankingType: "공유순" },
];
const ALLOWED_CATEGORIES = new Set(["경제", "국제", "사회"]);

export function parseDongaTrendHtml(html: string, list: DongaList): TopicDraft[] {
  const $ = load(html); const items: TopicDraft[] = [];
  const add = (node: ReturnType<typeof $>, category: string) => {
    const anchor = node.find("a[href]").filter((_, element) => /\/news\//.test($(element).attr("href") ?? "")).first();
    const href = anchor.attr("href"); const title = cleanText(node.find("h4.tit, h5.tit").first().text()) || cleanText(anchor.text());
    if (!href || !title) return;
    const url = toAbsoluteUrl(list.url, href); const sourceId = anchor.attr("data-ep_contentdata_content_id") ?? sourceIdFromUrl(url, href);
    items.push({ source: "donga", sourceId, url, title, summary: null, publishedAt: null, publishedAtLabel: null, metrics: { likes: parseCount(node.find(".count_emotion").text()), comments: parseCount(node.find(".count_comment").text()) }, placements: [{ collectorId: list.id, label: list.label, rankingType: list.rankingType, rank: parseCount(node.find(".num").first().text()), category }] });
  };
  $(".trend_ranking .news_card").each((_, card) => add($(card), "종합"));
  $(".field_news_node").each((_, section) => {
    const category = cleanText($(section).find(".field_news_head .tit").text()); if (!ALLOWED_CATEGORIES.has(category)) return;
    $(section).find(".field_news_body > ul > li").slice(0, 5).each((_, item) => add($(item), category));
  });
  return items.filter((item) => item.placements[0].rank === null || item.placements[0].rank <= 5);
}

export const dongaCollectors: Collector[] = LISTS.map((list) => ({ id: list.id, source: "donga", async collect() { return parseDongaTrendHtml(await fetchPublicText(list.url), list); } }));
