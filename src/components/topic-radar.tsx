"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  SOURCE_ACCENTS,
  SOURCE_LABELS,
  bestRank,
  filterAndSortTopics,
  type SourceFilter,
  type TopicRegion,
  type TopicSort,
} from "@/lib/topics/dashboard";
import {
  TOPIC_SOURCES,
  type TopicMetricDelta,
  type TopicMetrics,
  type TopicRecord,
} from "@/lib/topics/types";

type TopicRadarProps = {
  currentTopics: TopicRecord[];
  recentTopics: TopicRecord[];
};

type CopyStatus = { topicId: string; success: boolean } | null;
type ViewMode = "card" | "list";

const GITHUB_DATA_ROOT = "https://raw.githubusercontent.com/jiwoo0103/gamjapick/main/data";
const PAGE_SIZE = 9;
const SORT_OPTIONS: Array<{ value: TopicSort; label: string }> = [
  { value: "recent", label: "최근 발견 순" },
  { value: "rank", label: "상위 랭킹 순" },
  { value: "consecutive", label: "연속 포착 순" },
  { value: "likes", label: "추천 변화 순" },
  { value: "comments", label: "댓글 변화 순" },
];

export function TopicRadar({ currentTopics, recentTopics }: TopicRadarProps) {
  const [topicData, setTopicData] = useState({
    current: validTopicList(currentTopics),
    recent: validTopicList(recentTopics),
  });
  const [tab, setTab] = useState<"current" | "recent">("current");
  const [source, setSource] = useState<SourceFilter>("all");
  const [region, setRegion] = useState<TopicRegion>("all");
  const [sort, setSort] = useState<TopicSort>("recent");
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [page, setPage] = useState(1);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>(null);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      fetch(`${GITHUB_DATA_ROOT}/current.json`, { cache: "no-store" }),
      fetch(`${GITHUB_DATA_ROOT}/recent.json`, { cache: "no-store" }),
    ])
      .then(async ([currentResponse, recentResponse]) => {
        if (!currentResponse.ok || !recentResponse.ok) {
          throw new Error("Latest topic data is unavailable.");
        }
        return Promise.all([currentResponse.json(), recentResponse.json()]);
      })
      .then(([current, recent]) => {
        if (!cancelled && isTopicList(current) && isTopicList(recent)) {
          setTopicData({ current, recent });
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const sourceTopics = tab === "current" ? topicData.current : topicData.recent;
  const topics = useMemo(
    () => filterAndSortTopics(sourceTopics, source, sort, region),
    [sourceTopics, source, sort, region],
  );
  const totalPages = Math.max(1, Math.ceil(topics.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pagedTopics = topics.slice(pageStart, pageStart + PAGE_SIZE);

  async function copyTopicUrl(topic: TopicRecord) {
    try {
      await navigator.clipboard.writeText(topic.url);
      setCopyStatus({ topicId: topic.id, success: true });
    } catch {
      setCopyStatus({ topicId: topic.id, success: false });
    }
  }

  function resetToFirstPage(action: () => void) {
    action();
    setPage(1);
  }

  return (
    <main className="min-h-screen bg-[#f7f7f4] px-4 py-8 text-stone-900 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] bg-stone-950 px-6 py-8 text-stone-50 shadow-xl sm:px-10 sm:py-10">
          <p className="text-xs font-bold tracking-[0.24em] text-amber-300">GAMJAPICK · TOPIC RADAR</p>
          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">오늘의 카드뉴스 후보</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-300 sm:text-base">사이트가 직접 선정한 인기·공유·많이 본·이슈 목록만 모아 보여줍니다.</p>
            </div>
            <div className="flex flex-col gap-3 sm:min-w-72">
              <div className="grid grid-cols-2 gap-3">
                <Summary label="현재 인기" value={topicData.current.length} />
                <Summary label="최근 48시간" value={topicData.recent.length} />
              </div>
              <Link href="/editor" className="rounded-2xl bg-amber-300 px-4 py-3 text-center text-sm font-black text-stone-950 transition hover:bg-amber-200">카드 편집기 열기 →</Link>
            </div>
          </div>
        </header>

        <section className="mt-8" aria-label="Topic Radar 목록">
          <div className="flex flex-col gap-5 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex w-full rounded-2xl bg-stone-100 p-1 sm:w-fit" role="tablist" aria-label="목록 범위">
                <TabButton active={tab === "current"} count={topicData.current.length} onClick={() => resetToFirstPage(() => setTab("current"))}>현재 인기</TabButton>
                <TabButton active={tab === "recent"} count={topicData.recent.length} onClick={() => resetToFirstPage(() => setTab("recent"))}>최근 48시간</TabButton>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm font-medium text-stone-600">
                  정렬
                  <select value={sort} onChange={(event) => resetToFirstPage(() => setSort(event.target.value as TopicSort))} className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100">
                    {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2" aria-label="이슈 범위 필터">
                <span className="mr-1 text-xs font-bold text-stone-500">이슈</span>
                <FilterButton active={region === "all"} onClick={() => resetToFirstPage(() => setRegion("all"))}>전체</FilterButton>
                <FilterButton active={region === "domestic"} onClick={() => resetToFirstPage(() => setRegion("domestic"))}>국내 이슈</FilterButton>
                <FilterButton active={region === "overseas"} onClick={() => resetToFirstPage(() => setRegion("overseas"))}>해외 이슈</FilterButton>
              </div>
              <div className="flex flex-wrap items-center gap-2" aria-label="소스 필터">
                <span className="mr-1 text-xs font-bold text-stone-500">출처</span>
                <FilterButton active={source === "all"} onClick={() => resetToFirstPage(() => setSource("all"))}>전체</FilterButton>
              {TOPIC_SOURCES.map((topicSource) => <FilterButton key={topicSource} active={source === topicSource} onClick={() => resetToFirstPage(() => setSource(topicSource))}>{SOURCE_LABELS[topicSource]}</FilterButton>)}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 px-1 text-sm text-stone-500">
            <p><strong className="text-stone-900">{topics.length}</strong>개 항목 {topics.length ? <span>· {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, topics.length)}번째</span> : null}</p>
            <div className="inline-flex rounded-xl border border-stone-200 bg-white p-1 shadow-sm" role="group" aria-label="보기 방식">
              <ViewModeButton active={viewMode === "card"} mode="card" onClick={() => setViewMode("card")} />
              <ViewModeButton active={viewMode === "list"} mode="list" onClick={() => setViewMode("list")} />
            </div>
          </div>

          {topics.length ? (
            <>
              {viewMode === "card" ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {pagedTopics.map((topic) => <TopicCard key={topic.id} topic={topic} copyStatus={copyStatus?.topicId === topic.id ? copyStatus : null} onCopy={() => void copyTopicUrl(topic)} />)}
                </div>
              ) : (
                <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white">
                  {pagedTopics.map((topic) => <TopicListItem key={topic.id} topic={topic} copyStatus={copyStatus?.topicId === topic.id ? copyStatus : null} onCopy={() => void copyTopicUrl(topic)} />)}
                </div>
              )}
              <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
            </>
          ) : (
            <div className="mt-4 rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center text-stone-500">선택한 조건에 맞는 항목이 없습니다.</div>
          )}
        </section>
      </div>
    </main>
  );
}

function isTopicList(value: unknown): value is TopicRecord[] {
  return Array.isArray(value) && value.every(isTopicRecord);
}

function validTopicList(value: unknown): TopicRecord[] {
  return isTopicList(value) ? value : [];
}

function isTopicRecord(topic: unknown): topic is TopicRecord {
  return typeof topic === "object" && topic !== null && "id" in topic && "source" in topic && "url" in topic && "metrics" in topic && "placements" in topic && Array.isArray((topic as TopicRecord).placements);
}

function Summary({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3"><p className="text-xs text-stone-400">{label}</p><p className="mt-1 text-2xl font-bold tabular-nums text-white">{formatNumber(value)}</p></div>;
}

function TabButton({ active, count, children, onClick }: { active: boolean; count: number; children: React.ReactNode; onClick: () => void }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition sm:flex-none ${active ? "bg-white text-stone-950 shadow-sm" : "text-stone-500 hover:text-stone-900"}`}>{children}<span className="text-xs tabular-nums text-stone-400">{formatNumber(count)}</span></button>;
}

function FilterButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`rounded-full border px-3.5 py-2 text-sm font-medium transition ${active ? "border-stone-950 bg-stone-950 text-white" : "border-stone-200 bg-white text-stone-600 hover:border-stone-400 hover:text-stone-950"}`}>{children}</button>;
}

function ViewModeButton({ active, mode, onClick }: { active: boolean; mode: ViewMode; onClick: () => void }) {
  const label = mode === "card" ? "카드로 보기" : "표로 보기";
  return <button type="button" aria-label={label} title={label} aria-pressed={active} onClick={onClick} className={`grid size-9 place-items-center rounded-lg transition ${active ? "bg-stone-950 text-white" : "text-stone-500 hover:bg-stone-100 hover:text-stone-950"}`}><ViewModeIcon mode={mode} /></button>;
}

function ViewModeIcon({ mode }: { mode: ViewMode }) {
  if (mode === "card") {
    return <span aria-hidden="true" className="grid grid-cols-2 gap-0.5"><span className="size-2 rounded-[2px] bg-current" /><span className="size-2 rounded-[2px] bg-current" /><span className="size-2 rounded-[2px] bg-current" /><span className="size-2 rounded-[2px] bg-current" /></span>;
  }
  return <span aria-hidden="true" className="grid w-4 gap-0.5"><span className="h-0.5 rounded-full bg-current" /><span className="h-0.5 rounded-full bg-current" /><span className="h-0.5 rounded-full bg-current" /></span>;
}

function TopicCard({ topic, copyStatus, onCopy }: { topic: TopicRecord; copyStatus: CopyStatus; onCopy: () => void }) {
  const primary = topic.placements[0];
  const rank = bestRank(topic);
  const metrics = metricItems(topic.metrics, topic.delta);

  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <span className={`truncate rounded-full px-2.5 py-1 text-xs font-bold ${SOURCE_ACCENTS[topic.source]}`}>{SOURCE_LABELS[topic.source]}</span>
        {rank !== null ? <span className="shrink-0 text-xs font-bold text-amber-800">{rank}위</span> : null}
      </div>
      <div className="mt-2 flex min-w-0 items-center gap-2 text-xs font-medium text-stone-500"><span className="truncate">{primary?.label}</span>{primary?.category ? <span className="shrink-0 text-stone-400">· {primary.category}</span> : null}</div>
      <h2><a href={topic.url} target="_blank" rel="noreferrer" title={`${topic.title} 원문 열기`} className="mt-2 line-clamp-2 text-base font-bold leading-6 tracking-tight text-stone-950 underline decoration-transparent underline-offset-4 transition hover:text-amber-800 hover:decoration-amber-400">{topic.title}</a></h2>
      {topic.summary ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-500">{topic.summary}</p> : null}
      <TopicMeta topic={topic} metrics={metrics} />
      <div className="mt-3 border-t border-stone-100 pt-3"><CopyButton topic={topic} copyStatus={copyStatus} onCopy={onCopy} /></div>
    </article>
  );
}

function TopicListItem({ topic, copyStatus, onCopy }: { topic: TopicRecord; copyStatus: CopyStatus; onCopy: () => void }) {
  const primary = topic.placements[0];
  const rank = bestRank(topic);

  return (
    <article className="grid gap-2 border-b border-stone-100 px-4 py-3 last:border-b-0 md:grid-cols-[minmax(11rem,auto)_minmax(0,1fr)_auto] md:items-center md:gap-4">
      <div className="flex min-w-0 items-center gap-2 text-xs">
        <span className={`truncate rounded-full px-2.5 py-1 font-bold ${SOURCE_ACCENTS[topic.source]}`}>{SOURCE_LABELS[topic.source]}</span>
        {rank !== null ? <span className="shrink-0 font-bold text-amber-800">{rank}위</span> : null}
      </div>
      <div className="min-w-0">
        <a href={topic.url} target="_blank" rel="noreferrer" title={`${topic.title} 원문 열기`} className="block truncate text-sm font-bold text-stone-950 underline decoration-transparent underline-offset-4 transition hover:text-amber-800 hover:decoration-amber-400">{topic.title}</a>
        <p className="mt-0.5 truncate text-xs text-stone-500">{primary?.label}{primary?.category ? ` · ${primary.category}` : ""} · 포착 {formatNumber(topic.seenCount)}회 · {formatPublishedAt(topic)}</p>
      </div>
      <CopyButton topic={topic} copyStatus={copyStatus} onCopy={onCopy} />
    </article>
  );
}

function TopicMeta({ topic, metrics }: { topic: TopicRecord; metrics: Array<{ label: string; value: number; delta: number | null }> }) {
  return <>
    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-stone-100 pt-3 text-xs text-stone-500"><span>갱신 {formatPublishedAt(topic)}</span><span>포착 {formatNumber(topic.seenCount)}회</span><span>연속 {formatNumber(topic.consecutiveCount)}회</span></div>
    {metrics.length ? <div className="mt-2 flex flex-wrap gap-2 text-xs">{metrics.map((metric) => <span key={metric.label} className="rounded-full bg-stone-100 px-2 py-1 text-stone-600">{metric.label} {formatNumber(metric.value)} <span className={metric.delta !== null && metric.delta > 0 ? "text-rose-600" : "text-stone-400"}>{formatDelta(metric.delta)}</span></span>)}</div> : null}
  </>;
}

function CopyButton({ topic, copyStatus, onCopy }: { topic: TopicRecord; copyStatus: CopyStatus; onCopy: () => void }) {
  return <button type="button" onClick={onCopy} className="text-xs font-bold text-stone-600 underline decoration-stone-300 underline-offset-4 transition hover:text-stone-950" aria-label={`${topic.title} 원문 링크 복사`}>{copyStatus ? (copyStatus.success ? "복사됨" : "복사 실패") : "링크 복사"}</button>;
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-6 flex items-center justify-center gap-3" aria-label="페이지 이동">
      <button type="button" disabled={page === 1} onClick={() => onPageChange(page - 1)} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-bold text-stone-700 transition enabled:hover:border-stone-400 enabled:hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40">이전</button>
      <span className="text-sm font-medium tabular-nums text-stone-600">{page} / {totalPages}</span>
      <button type="button" disabled={page === totalPages} onClick={() => onPageChange(page + 1)} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-bold text-stone-700 transition enabled:hover:border-stone-400 enabled:hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40">다음</button>
    </nav>
  );
}

function metricItems(metrics: TopicMetrics, delta: TopicMetricDelta) {
  return [{ label: "추천", value: metrics.likes, delta: delta.likes }, { label: "댓글", value: metrics.comments, delta: delta.comments }].filter((metric): metric is { label: string; value: number; delta: number | null } => metric.value !== null);
}

function formatPublishedAt(topic: TopicRecord) {
  return topic.publishedAt ? formatDateTime(topic.publishedAt) : topic.publishedAtLabel ?? "정보 없음";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatDelta(value: number | null) {
  return value === null ? "" : `${value > 0 ? "+" : ""}${formatNumber(value)}`;
}
