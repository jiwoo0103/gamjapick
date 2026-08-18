import { load } from "cheerio";

import type { Collector } from "../collector";
import { fetchPublicText } from "../fetch";
import { cleanText, emptyMetrics, parseCount, sourceIdFromUrl, toAbsoluteUrl } from "../parsers";
import type { TopicDraft } from "../types";

const URL = "https://theqoo.net/hot";

export function parseTheQooHtml(html: string): TopicDraft[] {
  const $ = load(html);
  const seen = new Set<string>();

  return $("a[href^='/hot/']")
    .toArray()
    .flatMap((anchor) => {
      const row = $(anchor).closest("tr");
      const label = cleanText(row.find(".no").first().text());
      if (row.hasClass("notice") || label === "공지" || label === "이벤트") return [];
      const href = $(anchor).attr("href");
      const title = cleanText($(anchor).text());
      if (!href || href.startsWith("/hot/category/") || !title || seen.has(href)) return [];
      seen.add(href);

      const url = toAbsoluteUrl(URL, href);
      const metrics = emptyMetrics();
      metrics.views = parseCount(row.find(".m_no").first().text());
      return [{
        source: "theqoo" as const,
        sourceId: sourceIdFromUrl(url, href),
        url,
        title,
        titleOriginal: null,
        publishedAt: null,
        publishedAtLabel: cleanText(row.find(".time").first().text()) || null,
        metrics,
      }];
    });
}

export const theQooCollector: Collector = {
  source: "theqoo",
  async collect() {
    return parseTheQooHtml(await fetchPublicText(URL));
  },
};
