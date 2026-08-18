import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import type { MergedTopicState } from "./state";
import { TOPIC_SOURCES, type TopicRecord } from "./types";

const CURRENT_FILE = "current.json";
const RECENT_FILE = "recent.json";

export async function readRecentTopics(dataDirectory: string): Promise<TopicRecord[]> {
  try {
    const parsed: unknown = JSON.parse(await readFile(path.join(dataDirectory, RECENT_FILE), "utf8"));
    return Array.isArray(parsed) ? parsed.filter(isCurrentSchemaRecord) : [];
  } catch (error) {
    if (isMissingFile(error)) return [];
    throw error;
  }
}

export async function writeTopicState(dataDirectory: string, state: MergedTopicState): Promise<void> {
  await mkdir(dataDirectory, { recursive: true });
  await Promise.all([writeJsonAtomically(path.join(dataDirectory, CURRENT_FILE), state.current), writeJsonAtomically(path.join(dataDirectory, RECENT_FILE), state.recent)]);
}

function isCurrentSchemaRecord(value: unknown): value is TopicRecord {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Partial<TopicRecord>;
  return typeof record.id === "string" && TOPIC_SOURCES.includes(record.source as typeof TOPIC_SOURCES[number]) && Array.isArray(record.placements) && Array.isArray(record.history);
}

async function writeJsonAtomically(filePath: string, value: TopicRecord[]): Promise<void> {
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryPath, filePath);
}

function isMissingFile(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
