import { load } from "cheerio";

import type { Collector } from "../collector";
import { fetchPublicText } from "../fetch";
import { cleanText, emptyMetrics, parseApproximateCount, toIsoDate } from "../parsers";
import type { TopicDraft } from "../types";

const URL = "https://trends.google.com/trending/rss?geo=KR";

export function parseGoogleTrendsRss(xml: string): TopicDraft[] {
  const $ = load(xml, { xmlMode: true });

  return $("item")
    .toArray()
    .flatMap((item) => {
      const title = cleanText($(item).find("title").first().text());
      const articleUrl = cleanText($(item).find("ht\\:news_item_url").first().text());
      if (!title || !articleUrl) return [];

      const metrics = emptyMetrics();
      metrics.searchVolume = parseApproximateCount($(item).find("ht\\:approx_traffic").first().text());

      return [{
        source: "google-trends" as const,
        sourceId: `${title}:${articleUrl}`,
        url: articleUrl,
        title,
        titleOriginal: null,
        publishedAt: toIsoDate($(item).find("pubDate").first().text()),
        publishedAtLabel: null,
        metrics,
      }];
    });
}

export const googleTrendsCollector: Collector = {
  source: "google-trends",
  async collect() {
    return parseGoogleTrendsRss(await fetchPublicText(URL));
  },
};
