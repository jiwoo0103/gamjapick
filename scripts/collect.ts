import path from "node:path";

import { runCollectors } from "../src/lib/topics/collector";
import { collectors } from "../src/lib/topics/collectors";
import { mergeTopicState } from "../src/lib/topics/state";
import { readRecentTopics, writeTopicState } from "../src/lib/topics/storage";

const dataDirectory = path.resolve(process.cwd(), "data");

async function main() {
  const results = await runCollectors(collectors);
  const collectedAt = new Date().toISOString();
  const previousRecent = await readRecentTopics(dataDirectory);
  const state = mergeTopicState(previousRecent, results, collectedAt);
  const dryRun = process.argv.includes("--dry-run");

  if (!dryRun) await writeTopicState(dataDirectory, state);

  const report = results.map((result) => result.status === "success"
    ? {
      collectorId: result.collectorId,
      source: result.source,
      status: result.status,
      itemCount: result.items.length,
      sample: result.items[0] ?? null,
    }
    : { collectorId: result.collectorId, source: result.source, status: result.status, error: result.error });

  console.log(JSON.stringify({
    mode: dryRun ? "dry-run" : "write",
    currentCount: state.current.length,
    recentCount: state.recent.length,
    collectors: report,
  }, null, 2));
}

void main();
