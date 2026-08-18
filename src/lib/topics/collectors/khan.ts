import { load } from "cheerio";
import type { Collector } from "../collector";
import { fetchPublicJson, fetchPublicText } from "../fetch";
import { cleanText, emptyMetrics, parseCount, sourceIdFromUrl } from "../parsers";
import type { TopicDraft } from "../types";

const REALTIME_URL = "https://www.khan.co.kr/SecListData.html";
const ISSUE_URL = "https://www.khan.co.kr/issue";
type RealtimeItem = { rank?: string; art_id?: string; alt_title?: string; art_title?: string; url?: string; summary?: string };
type RealtimePayload = { result?: string; items?: RealtimeItem[] };

export function parseKhanRealtimePayload(payload: RealtimePayload): TopicDraft[] {
  if (payload.result !== "ok" || !Array.isArray(payload.items)) throw new Error("Khan realtime ranking response did not contain an item list.");
  return payload.items.slice(0, 20).flatMap((item) => {
    const title = cleanText(item.alt_title ?? item.art_title ?? ""); const url = item.url; const sourceId = item.art_id;
    if (!title || !url || !sourceId) return [];
    return [{ source: "khan" as const, sourceId, url, title, summary: cleanText(item.summary ?? "") || null, publishedAt: null, publishedAtLabel: null, metrics: emptyMetrics(), placements: [{ collectorId: "khan-realtime-most-viewed", label: "경향 지금 많이 보는", rankingType: "지금 많이 보는", rank: parseCount(item.rank ?? ""), category: null }] }];
  });
}

export function parseKhanIssueHtml(html: string): TopicDraft[] {
  const $ = load(html);
  return $("#recentList > li").slice(0, 20).toArray().flatMap((row, index) => {
    const issueLink = $(row).find("article > div > a[href]").first(); const articleLink = $(row).find("article dl dt a[href]").first();
    const issueName = cleanText(issueLink.text()); const title = cleanText(articleLink.text()); const url = articleLink.attr("href");
    if (!issueName || !title || !url) return [];
    const articleCount = cleanText($(row).find(".info .number").text()); const updatedAt = cleanText($(row).find(".info .date").text()) || null;
    return [{ source: "khan" as const, sourceId: `issue:${sourceIdFromUrl(issueLink.attr("href") ?? url, issueName)}`, url, title, summary: cleanText(`이슈 · ${issueName}${articleCount ? ` · ${articleCount}` : ""}`), publishedAt: null, publishedAtLabel: updatedAt, metrics: emptyMetrics(), placements: [{ collectorId: "khan-issue-updated", label: "경향 이슈 업데이트", rankingType: "이슈 업데이트", rank: index + 1, category: null }] }];
  });
}

export const khanCollectors: Collector[] = [
  { id: "khan-realtime-most-viewed", source: "khan", async collect() { return parseKhanRealtimePayload(await fetchPublicJson<RealtimePayload>(REALTIME_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" }, body: new URLSearchParams({ syncType: "async", type: "realtime", utm_source: "khan", category: "view", mode: "", t: String(Date.now()) }) })); } },
  { id: "khan-issue-updated", source: "khan", async collect() { return parseKhanIssueHtml(await fetchPublicText(ISSUE_URL)); } },
];
