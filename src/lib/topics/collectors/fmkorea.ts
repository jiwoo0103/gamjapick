import { load } from "cheerio";

import type { Collector } from "../collector";
import { fetchPublicText } from "../fetch";
import { cleanText, emptyMetrics, parseCount, sourceIdFromUrl, toAbsoluteUrl } from "../parsers";
import type { TopicDraft } from "../types";

const URL = "https://www.fmkorea.com/best";

export function parseFmKoreaHtml(html: string): TopicDraft[] {
  const $ = load(html);

  return $("a.hotdeal_var8")
    .toArray()
    .flatMap((anchor) => {
      const href = $(anchor).attr("href");
      const text = cleanText($(anchor).text());
      if (!href || !text) return [];

      const commentMatch = text.match(/\s*\[(\d[\d,]*)\]\s*$/);
      const title = text.replace(/\s*\[\d[\d,]*\]\s*$/, "");
      const url = toAbsoluteUrl(URL, href);
      const item = $(anchor).closest("li");
      const metrics = emptyMetrics();
      metrics.comments = commentMatch ? parseCount(commentMatch[1]) : null;
      metrics.likes = parseCount(item.find(".pc_voted_count .count").first().text());

      return [{
        source: "fmkorea" as const,
        sourceId: sourceIdFromUrl(url, href),
        url,
        title,
        titleOriginal: null,
        publishedAt: null,
        publishedAtLabel: cleanText(item.find(".regdate").first().text()) || null,
        metrics,
      }];
    });
}

export const fmKoreaCollector: Collector = {
  source: "fmkorea",
  async collect() {
    return parseFmKoreaHtml(await fetchPublicText(URL));
  },
};
