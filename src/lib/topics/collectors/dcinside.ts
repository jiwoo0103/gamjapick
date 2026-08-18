import { load } from "cheerio";

import type { Collector } from "../collector";
import { fetchPublicText } from "../fetch";
import { cleanText, emptyMetrics, parseCount, sourceIdFromUrl, toAbsoluteUrl } from "../parsers";
import type { TopicDraft } from "../types";

const URL = "https://gall.dcinside.com/board/lists?id=dcbest";

export function parseDcInsideHtml(html: string): TopicDraft[] {
  const $ = load(html);

  return $("tr.ub-content")
    .toArray()
    .flatMap((row) => {
      if ($(row).hasClass("ub-notice") || !/^\d+$/.test(cleanText($(row).find(".gall_num").text()))) return [];

      const anchor = $(row).find(".gall_tit a[href*='/board/view/']").first();
      const href = anchor.attr("href");
      const title = cleanText(anchor.clone().find(".reply_num").remove().end().text());
      if (!href || !title) return [];

      const url = toAbsoluteUrl(URL, href);
      const metrics = emptyMetrics();
      const publishedAtLabel = cleanText($(row).find(".gall_date").attr("title") ?? $(row).find(".gall_date").text());
      metrics.views = parseCount($(row).find(".gall_count").text());
      metrics.likes = parseCount($(row).find(".gall_recommend").text());
      metrics.comments = parseCount($(row).find(".reply_num").first().text().replace(/[\[\]]/g, ""));

      return [{
        source: "dcinside" as const,
        sourceId: sourceIdFromUrl(url, href),
        url,
        title,
        titleOriginal: null,
        publishedAt: koreanDateTimeToIso(publishedAtLabel),
        publishedAtLabel: publishedAtLabel || null,
        metrics,
      }];
    });
}

export const dcInsideCollector: Collector = {
  source: "dcinside",
  async collect() {
    return parseDcInsideHtml(await fetchPublicText(URL));
  },
};

function koreanDateTimeToIso(value: string): string | null {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})\s(\d{2}:\d{2}:\d{2})$/);
  if (!match) return null;

  const publishedAt = new Date(`${match[1]}T${match[2]}+09:00`);
  return Number.isNaN(publishedAt.getTime()) ? null : publishedAt.toISOString();
}
