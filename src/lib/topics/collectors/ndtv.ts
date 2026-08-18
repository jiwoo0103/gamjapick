import { load } from "cheerio";

import type { Collector } from "../collector";
import { fetchPublicText } from "../fetch";
import { cleanText, emptyMetrics, sourceIdFromUrl, toIsoDate } from "../parsers";
import type { TopicDraft } from "../types";

const URL = "https://feeds.feedburner.com/ndtvnews-offbeat-news";

export function parseNdtvRss(xml: string): TopicDraft[] {
  const $ = load(xml, { xmlMode: true });

  return $("item")
    .toArray()
    .flatMap((item) => {
      const url = cleanText($(item).find("link").first().text());
      const titleOriginal = cleanText($(item).find("title").first().text());
      if (!url || !titleOriginal) return [];

      return [{
        source: "ndtv" as const,
        sourceId: sourceIdFromUrl(url, cleanText($(item).find("guid").text())),
        url,
        title: titleOriginal,
        titleOriginal,
        publishedAt: toIsoDate($(item).find("pubDate").text()),
        publishedAtLabel: null,
        metrics: emptyMetrics(),
      }];
    });
}

export const ndtvCollector: Collector = {
  source: "ndtv",
  async collect() {
    return parseNdtvRss(await fetchPublicText(URL));
  },
};
