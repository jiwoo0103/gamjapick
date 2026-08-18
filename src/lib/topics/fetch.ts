const USER_AGENT = "GamjaPick/0.1 (+https://github.com/jiwoo0103/gamjapick)";

export class CollectorRequestError extends Error {
  constructor(
    public readonly url: string,
    public readonly status: number | null,
    message: string,
  ) {
    super(message);
    this.name = "CollectorRequestError";
  }
}

export async function fetchPublicText(url: string): Promise<string> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let response: Response;

    try {
      response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      if (attempt === 0) {
        await backoff();
        continue;
      }
      const message = error instanceof Error ? error.message : "Unknown network error";
      throw new CollectorRequestError(url, null, `Request failed: ${message}`);
    }

    if (response.ok) return response.text();
    if (response.status === 429 && attempt === 0) {
      await backoff();
      continue;
    }

    throw new CollectorRequestError(
      url,
      response.status,
      `Request returned HTTP ${response.status}; the collector will not attempt to bypass it.`,
    );
  }

  throw new CollectorRequestError(url, null, "Request retry loop ended unexpectedly.");
}

function backoff(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 2_000));
}
