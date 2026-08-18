import type { Collector } from "../collector";
import { dcInsideCollector } from "./dcinside";
import { fmKoreaCollector } from "./fmkorea";
import { googleTrendsCollector } from "./google-trends";
import { ndtvCollector } from "./ndtv";
import { redditCollector } from "./reddit";
import { theQooCollector } from "./theqoo";

export const collectors: Collector[] = [
  dcInsideCollector,
  fmKoreaCollector,
  theQooCollector,
  redditCollector,
  ndtvCollector,
  googleTrendsCollector,
];
