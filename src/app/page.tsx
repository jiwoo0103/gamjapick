import currentTopics from "../../data/current.json";
import recentTopics from "../../data/recent.json";

import { TopicRadar } from "@/components/topic-radar";
import type { TopicRecord } from "@/lib/topics/types";

export default function Home() {
  return <TopicRadar currentTopics={currentTopics as TopicRecord[]} recentTopics={recentTopics as TopicRecord[]} />;
}
