export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6 text-stone-900">
      <section className="w-full max-w-xl rounded-3xl border border-stone-200 bg-white p-10 shadow-sm">
        <p className="text-sm font-semibold tracking-[0.18em] text-amber-700">GAMJAPICK</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Topic Radar를 준비하고 있어요.</h1>
        <p className="mt-4 leading-7 text-stone-600">
          국내외 공개 인기 주제의 수집 가능성을 검증했습니다. 대시보드는 데이터 누적 기능을 구현한 뒤 제공됩니다.
        </p>
        <code className="mt-8 block rounded-xl bg-stone-950 px-4 py-3 text-sm text-stone-100">npm run collect:check</code>
      </section>
    </main>
  );
}
