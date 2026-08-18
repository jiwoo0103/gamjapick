import { load } from "cheerio";

import type { Collector } from "../collector";
import { fetchPublicText } from "../fetch";
import { cleanText, emptyMetrics, parseCount, sourceIdFromUrl, toAbsoluteUrl } from "../parsers";
import type { TopicDraft } from "../types";

const URL = "https://theqoo.net/hot";

export function parseTheQooHtml(html: string, collectedAt = new Date()): TopicDraft[] {
  const $ = load(html);
  const seen = new Set<string>();

  return $("td.title > a[href^='/hot/']:not(.replyNum)")
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
      metrics.comments = parseCount(row.find(".replyNum").first().text());
      const publishedAtLabel = cleanText(row.find(".time").first().text()) || null;
      return [{
        source: "theqoo" as const,
        sourceId: sourceIdFromUrl(url, href),
        url,
        title,
        titleOriginal: null,
        publishedAt: koreanTodayTimeToIso(publishedAtLabel, collectedAt),
        publishedAtLabel,
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

function koreanTodayTimeToIso(value: string | null, referenceDate: Date): string | null {
  const match = value?.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;

  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(referenceDate);
  const part = (type: Intl.DateTimeFormatPartTypes) => dateParts.find((item) => item.type === type)?.value;
  const year = part("year");
  const month = part("month");
  const day = part("day");
  if (!year || !month || !day) return null;

  const publishedAt = new Date(`${year}-${month}-${day}T${match[1]}:${match[2]}:00+09:00`);
  return Number.isNaN(publishedAt.getTime()) ? null : publishedAt.toISOString();
}
