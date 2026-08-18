import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import type { MergedTopicState } from "./state";
import type { TopicRecord } from "./types";

const CURRENT_FILE = "current.json";
const RECENT_FILE = "recent.json";

export async function readRecentTopics(dataDirectory: string): Promise<TopicRecord[]> {
  try {
    const content = await readFile(path.join(dataDirectory, RECENT_FILE), "utf8");
    const parsed = JSON.parse(content) as unknown;
    return Array.isArray(parsed) ? parsed as TopicRecord[] : [];
  } catch (error) {
    if (isMissingFile(error)) return [];
    throw error;
  }
}

export async function writeTopicState(dataDirectory: string, state: MergedTopicState): Promise<void> {
  await mkdir(dataDirectory, { recursive: true });
  await Promise.all([
    writeJsonAtomically(path.join(dataDirectory, CURRENT_FILE), state.current),
    writeJsonAtomically(path.join(dataDirectory, RECENT_FILE), state.recent),
  ]);
}

async function writeJsonAtomically(filePath: string, value: TopicRecord[]): Promise<void> {
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryPath, filePath);
}

function isMissingFile(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
