import type { Collector } from "../collector";
import { dogdripCollectors } from "./dogdrip";
import { dongaCollectors } from "./donga";
import { hankyungCollectors } from "./hankyung";
import { khanCollectors } from "./khan";
import { mbcCollectors } from "./mbc";
export const collectors: Collector[] = [...dogdripCollectors, ...dongaCollectors, ...hankyungCollectors, ...khanCollectors, ...mbcCollectors];
