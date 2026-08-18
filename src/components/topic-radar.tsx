"use client";

import { useEffect, useMemo, useState } from "react";

import {
  SOURCE_ACCENTS,
  SOURCE_LABELS,
  filterAndSortTopics,
  type SourceFilter,
  type TopicSort,
} from "@/lib/topics/dashboard";
import { TOPIC_SOURCES, type TopicMetricDelta, type TopicMetrics, type TopicRecord } from "@/lib/topics/types";

type TopicRadarProps = {
  currentTopics: TopicRecord[];
  recentTopics: TopicRecord[];
};

const GITHUB_DATA_ROOT = "https://raw.githubusercontent.com/jiwoo0103/gamjapick/main/data";

const SORT_OPTIONS: Array<{ value: TopicSort; label: string }> = [
  { value: "recent", label: "최근 발견 순" },
  { value: "consecutive", label: "연속 포착 순" },
  { value: "views", label: "조회수 변화 순" },
  { value: "likes", label: "추천·좋아요 변화 순" },
  { value: "comments", label: "댓글 변화 순" },
];

export function TopicRadar({ currentTopics, recentTopics }: TopicRadarProps) {
  const [topicData, setTopicData] = useState({ current: currentTopics, recent: recentTopics });
  const [isLatestData, setIsLatestData] = useState(false);
  const [tab, setTab] = useState<"current" | "recent">("current");
  const [source, setSource] = useState<SourceFilter>("all");
  const [sort, setSort] = useState<TopicSort>("recent");

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      fetch(`${GITHUB_DATA_ROOT}/current.json`, { cache: "no-store" }),
      fetch(`${GITHUB_DATA_ROOT}/recent.json`, { cache: "no-store" }),
    ])
      .then(async ([currentResponse, recentResponse]) => {
        if (!currentResponse.ok || !recentResponse.ok) throw new Error("Latest topic data is unavailable.");
        return Promise.all([currentResponse.json(), recentResponse.json()]);
      })
      .then(([current, recent]) => {
        if (cancelled || !isTopicList(current) || !isTopicList(recent)) return;
        setTopicData({ current, recent });
        setIsLatestData(true);
      })
      .catch(() => undefined);

    return () => { cancelled = true; };
  }, []);

  const sourceTopics = tab === "current" ? topicData.current : topicData.recent;
  const topics = useMemo(() => filterAndSortTopics(sourceTopics, source, sort), [sourceTopics, source, sort]);

  return (
    <main className="min-h-screen bg-[#f7f7f4] px-4 py-8 text-stone-900 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] bg-stone-950 px-6 py-8 text-stone-50 shadow-xl sm:px-10 sm:py-10">
          <p className="text-xs font-bold tracking-[0.24em] text-amber-300">GAMJAPICK · TOPIC RADAR</p>
          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">오늘의 카드뉴스 후보</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-300 sm:text-base">
                공개 인기 목록을 30분마다 모아, 반응 변화와 지속성을 한눈에 확인합니다.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-72">
              <Summary label="현재 인기" value={topicData.current.length} />
              <Summary label="최근 48시간" value={topicData.recent.length} />
            </div>
          </div>
        </header>

        <section className="mt-8" aria-label="Topic Radar 목록">
          <div className="flex flex-col gap-5 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex w-full rounded-2xl bg-stone-100 p-1 sm:w-fit" role="tablist" aria-label="목록 범위">
                <TabButton active={tab === "current"} count={topicData.current.length} onClick={() => setTab("current")}>
                  현재 인기
                </TabButton>
                <TabButton active={tab === "recent"} count={topicData.recent.length} onClick={() => setTab("recent")}>
                  최근 48시간
                </TabButton>
              </div>
              <label className="flex items-center gap-3 text-sm font-medium text-stone-600">
                정렬
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as TopicSort)}
                  className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                >
                  {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            </div>

            <div className="flex flex-wrap gap-2" aria-label="소스 필터">
              <FilterButton active={source === "all"} onClick={() => setSource("all")}>전체</FilterButton>
              {TOPIC_SOURCES.map((topicSource) => (
                <FilterButton key={topicSource} active={source === topicSource} onClick={() => setSource(topicSource)}>
                  {SOURCE_LABELS[topicSource]}
                </FilterButton>
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between px-1 text-sm text-stone-500">
            <p><strong className="text-stone-900">{topics.length}</strong>개 항목</p>
            <p>{isLatestData ? "GitHub의 최신 수집 데이터" : tab === "current" ? "가장 최근 빌드에 포함된 인기 목록" : "최근 빌드에 포함된 48시간 항목"}</p>
          </div>

          {topics.length > 0 ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {topics.map((topic) => <TopicCard key={topic.id} topic={topic} />)}
            </div>
          ) : (
            <div className="mt-4 rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center text-stone-500">
              선택한 조건에 맞는 항목이 없습니다.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function isTopicList(value: unknown): value is TopicRecord[] {
  return Array.isArray(value) && value.every((topic) => (
    typeof topic === "object" && topic !== null && "id" in topic && "source" in topic && "url" in topic
  ));
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3">
      <p className="text-xs text-stone-400">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-white">{formatNumber(value)}</p>
    </div>
  );
}

function TabButton({ active, count, children, onClick }: { active: boolean; count: number; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition sm:flex-none ${active ? "bg-white text-stone-950 shadow-sm" : "text-stone-500 hover:text-stone-900"}`}
    >
      {children}<span className="text-xs tabular-nums text-stone-400">{formatNumber(count)}</span>
    </button>
  );
}

function FilterButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-sm font-medium transition ${active ? "border-stone-950 bg-stone-950 text-white" : "border-stone-200 bg-white text-stone-600 hover:border-stone-400 hover:text-stone-950"}`}
    >
      {children}
    </button>
  );
}

function TopicCard({ topic }: { topic: TopicRecord }) {
  const metrics = metricItems(topic.metrics, topic.delta, topic.source === "google-trends");
  const headline = topic.titleKo ?? topic.title;

  return (
    <article className="flex flex-col rounded-3xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${SOURCE_ACCENTS[topic.source]}`}>{SOURCE_LABELS[topic.source]}</span>
        <span className={`text-xs font-semibold ${topic.isCurrent ? "text-emerald-700" : "text-stone-400"}`}>{topic.isCurrent ? "현재 인기" : "목록에서 사라짐"}</span>
      </div>

      <h2 className="mt-4 text-lg font-bold leading-7 tracking-tight text-stone-950">{headline}</h2>
      {topic.titleOriginal && topic.titleOriginal !== headline ? <p className="mt-2 text-sm leading-6 text-stone-500">원문 · {topic.titleOriginal}</p> : null}

      <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3 border-y border-stone-100 py-4 text-xs leading-5 text-stone-500 sm:grid-cols-3">
        <Info label="게시 시각" value={formatPublishedAt(topic)} />
        <Info label="최초 발견" value={formatDateTime(topic.firstSeenAt)} />
        <Info label="마지막 발견" value={formatDateTime(topic.lastSeenAt)} />
        <Info label="포착 횟수" value={`${formatNumber(topic.seenCount)}회`} />
        <Info label="연속 포착" value={`${formatNumber(topic.consecutiveCount)}회`} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {metrics.length > 0 ? metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl bg-stone-50 px-3 py-2.5">
            <p className="text-xs text-stone-500">{metric.label}</p>
            <p className="mt-1 text-sm font-bold tabular-nums text-stone-900">{formatNumber(metric.value)}</p>
            <p className={`mt-0.5 text-xs font-medium ${metric.delta !== null && metric.delta > 0 ? "text-rose-600" : metric.delta !== null && metric.delta < 0 ? "text-sky-700" : "text-stone-400"}`}>
              {formatDelta(metric.delta)}
            </p>
          </div>
        )) : <p className="col-span-full rounded-2xl bg-stone-50 px-3 py-3 text-sm text-stone-500">공개 반응 지표가 제공되지 않습니다.</p>}
      </div>

      <a
        href={topic.url}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-flex w-fit items-center gap-1 text-sm font-bold text-amber-700 underline decoration-amber-300 underline-offset-4 transition hover:text-amber-900"
      >
        원문 보기 <span aria-hidden="true">↗</span>
      </a>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <p><span className="block text-stone-400">{label}</span><span className="font-medium text-stone-700">{value}</span></p>;
}

function metricItems(metrics: TopicMetrics, delta: TopicMetricDelta, isTrend: boolean) {
  if (isTrend) return metrics.searchVolume === null ? [] : [{ label: "검색량", value: metrics.searchVolume, delta: delta.searchVolume }];

  return [
    { label: "조회", value: metrics.views, delta: delta.views },
    { label: "추천", value: metrics.likes, delta: delta.likes },
    { label: "댓글", value: metrics.comments, delta: delta.comments },
  ].filter((metric): metric is { label: string; value: number; delta: number | null } => metric.value !== null);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatPublishedAt(topic: TopicRecord): string {
  if (topic.publishedAt) return formatDateTime(topic.publishedAt);
  return topic.publishedAtLabel ?? "정보 없음";
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatDelta(value: number | null): string {
  if (value === null) return "변화 정보 없음";
  return `${value > 0 ? "+" : ""}${formatNumber(value)}`;
}
