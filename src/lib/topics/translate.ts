import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
let availability: Promise<TranslationResult> | undefined;

export type TranslationResult = {
  text: string | null;
  error: string | null;
};

/**
 * Calls a locally installed Argos Translate package. No network translation
 * provider is used, and callers keep the original title when it is unavailable.
 */
export async function translateEnglishToKoreanBatch(texts: string[]): Promise<TranslationResult[]> {
  if (texts.length === 0) return [];

  const available = await checkArgosAvailability();
  if (!available.text) return texts.map(() => available);

  try {
    const bundledPython = getPythonCommand();
    const { stdout } = await execFileAsync(
      process.env.ARGOS_PYTHON ?? bundledPython,
      ["scripts/translate/argos.py", "--batch", JSON.stringify(texts)],
      { cwd: process.cwd(), env: argosEnvironment(), timeout: 15_000, windowsHide: true },
    );
    const translated = JSON.parse(stdout) as unknown;
    if (!Array.isArray(translated) || translated.length !== texts.length || translated.some((value) => typeof value !== "string" || !value.trim())) {
      return texts.map(() => ({ text: null, error: "Argos returned an invalid batch translation." }));
    }

    return translated.map((text) => ({ text, error: null }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Argos Translate error";
    return texts.map(() => ({ text: null, error: message }));
  }
}

function getPythonCommand(): string {
  return process.env.ARGOS_PYTHON ?? (process.platform === "win32" ? ".venv\\Scripts\\python.exe" : ".venv/bin/python");
}

function checkArgosAvailability(): Promise<TranslationResult> {
  availability ??= execFileAsync(getPythonCommand(), ["scripts/translate/argos.py", "--check"], {
    cwd: process.cwd(),
    env: argosEnvironment(),
    timeout: 15_000,
    windowsHide: true,
  })
    .then(() => ({ text: "available", error: null }))
    .catch((error) => ({
      text: null,
      error: error instanceof Error ? error.message : "Argos Translate is unavailable.",
    }));

  return availability;
}

function argosEnvironment(): NodeJS.ProcessEnv {
  const dataRoot = path.resolve(process.cwd(), ".argos-data");
  return {
    ...process.env,
    XDG_DATA_HOME: path.join(dataRoot, "data"),
    XDG_CONFIG_HOME: path.join(dataRoot, "config"),
    XDG_CACHE_HOME: path.join(dataRoot, "cache"),
  };
}
