import { load } from "cheerio";

import type { Collector } from "../collector";
import { fetchPublicText } from "../fetch";
import { cleanText, emptyMetrics, sourceIdFromUrl, toIsoDate } from "../parsers";
import type { TopicDraft } from "../types";

const URL = "https://www.reddit.com/r/nottheonion/.rss";

export function parseRedditAtom(xml: string): TopicDraft[] {
  const $ = load(xml, { xmlMode: true });

  return $("entry")
    .toArray()
    .flatMap((entry) => {
      const url = $(entry).find("link[rel='alternate']").attr("href") ?? $(entry).find("link").first().attr("href");
      const titleOriginal = cleanText($(entry).find("title").first().text());
      if (!url || !titleOriginal) return [];

      return [{
        source: "reddit" as const,
        sourceId: sourceIdFromUrl(url, $(entry).find("id").text()),
        url,
        title: titleOriginal,
        titleOriginal,
        publishedAt: toIsoDate($(entry).find("published").text() || $(entry).find("updated").text()),
        publishedAtLabel: null,
        metrics: emptyMetrics(),
      }];
    });
}

export const redditCollector: Collector = {
  source: "reddit",
  async collect() {
    return parseRedditAtom(await fetchPublicText(URL));
  },
};
