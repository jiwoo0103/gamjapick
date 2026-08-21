"use client";

import Link from "next/link";
import { type ChangeEvent, type DragEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CARD_HEIGHT, CARD_WIDTH, getAutoTitleFontSize, getImageFileError, wrapTextLines } from "@/lib/editor/layout";

const FONT_OPTIONS = [
  { value: "sans", label: "깔끔한 산세리프", family: "Arial, Helvetica, sans-serif", canvasFamily: "Arial, Helvetica, sans-serif" },
  { value: "serif", label: "감성적인 명조", family: "Georgia, 'Times New Roman', serif", canvasFamily: "Georgia, 'Times New Roman', serif" },
  { value: "mono", label: "모노스페이스", family: "var(--font-geist-mono), 'Courier New', monospace", canvasFamily: "'Courier New', monospace" },
] as const;

type FontOption = (typeof FONT_OPTIONS)[number]["value"];
type Alignment = "left" | "center";
type EditorPanel = "content" | "text" | "image" | "export";
type EditorImage = { url: string; name: string };
type TextLines = { title: string[]; subtitle: string[] };
type TextHighlight = { id: string; term: string; color: string };

const TEXT_BOX_WIDTH_PERCENT = 84;
const TEXT_BOX_MAX_X_PERCENT = 100 - TEXT_BOX_WIDTH_PERCENT;
const DEFAULT_TEXT_COLOR = "#ffffff";
const BRAND_LOGO_SRC = "/gamjapick-logo.png";
const BRAND_LOGO_WIDTH = 260;
const BRAND_LOGO_BOTTOM = 64;
const BRAND_LOGO_OPACITY = 0.42;
const EDITOR_PANELS: { id: EditorPanel; label: string }[] = [
  { id: "content", label: "내용" },
  { id: "text", label: "글자" },
  { id: "image", label: "이미지" },
  { id: "export", label: "저장" },
];

export function CardEditor() {
  const imageUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const textDragRef = useRef<{ pointerId: number; startClientX: number; startClientY: number; startTextX: number; startTextY: number } | null>(null);
  const [image, setImage] = useState<EditorImage | null>(null);
  const [imageMessage, setImageMessage] = useState<string | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [font, setFont] = useState<FontOption>("sans");
  const [weight, setWeight] = useState<500 | 700 | 900>(900);
  const [isAutoTitleSize, setIsAutoTitleSize] = useState(false);
  const [manualTitleSize, setManualTitleSize] = useState(59);
  const [lineHeight, setLineHeight] = useState(1.45);
  const [align, setAlign] = useState<Alignment>("left");
  const [textX, setTextX] = useState(8);
  const [textY, setTextY] = useState(70);
  const [highlights, setHighlights] = useState<TextHighlight[]>([]);
  const [highlightTerm, setHighlightTerm] = useState("");
  const [highlightColor, setHighlightColor] = useState("#facc15");
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [activePanel, setActivePanel] = useState<EditorPanel>("content");
  const [imageScale, setImageScale] = useState(100);
  const [imageX, setImageX] = useState(0);
  const [imageY, setImageY] = useState(0);
  const [gradientStrength, setGradientStrength] = useState(68);

  useEffect(() => () => {
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const topicTitle = params.get("title");
    if (!topicTitle) return;

    const timer = window.setTimeout(() => {
      if (topicTitle) setTitle(topicTitle);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const applyImage = useCallback((file: File) => {
    const error = getImageFileError(file);
    if (error) {
      setImageMessage(error);
      return;
    }

    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    const nextUrl = URL.createObjectURL(file);
    imageUrlRef.current = nextUrl;
    setImage({ url: nextUrl, name: file.name });
    setImageMessage(`${file.name}을(를) 적용했습니다.`);
  }, []);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (isTextEntry(event.target)) return;
      const file = findImageFile(event.clipboardData?.files);
      if (!file) return;
      event.preventDefault();
      applyImage(file);
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [applyImage]);

  const titleSize = isAutoTitleSize ? getAutoTitleFontSize(title) : manualTitleSize;
  const selectedFont = useMemo(() => FONT_OPTIONS.find((option) => option.value === font) ?? FONT_OPTIONS[0], [font]);
  const titleColor = DEFAULT_TEXT_COLOR;
  const subtitleColor = DEFAULT_TEXT_COLOR;
  const previewLines = useMemo(
    () => getTextLines(title, subtitle, titleSize, weight, selectedFont.canvasFamily),
    [selectedFont.canvasFamily, subtitle, title, titleSize, weight],
  );

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = findImageFile(event.target.files);
    if (file) applyImage(file);
    event.target.value = "";
  }

  function handleImageDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDraggingImage(false);
    const file = findImageFile(event.dataTransfer.files);
    if (file) applyImage(file);
    else setImageMessage("이미지 파일 하나를 놓아 주세요.");
  }

  function removeImage() {
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    imageUrlRef.current = null;
    setImage(null);
    setImageMessage("사진을 제거했습니다.");
  }

  function addHighlight() {
    const term = highlightTerm.trim();
    if (!term) return;
    setHighlights((previous) => [...previous.filter((highlight) => highlight.term !== term), { id: `${Date.now()}-${term}`, term, color: highlightColor }]);
    setHighlightTerm("");
  }

  function handleTextPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!previewRef.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    textDragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startTextX: textX,
      startTextY: textY,
    };
    setIsDraggingText(true);
  }

  function handleTextPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = textDragRef.current;
    const preview = previewRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !preview) return;
    const bounds = preview.getBoundingClientRect();
    setTextX(clamp(drag.startTextX + ((event.clientX - drag.startClientX) / bounds.width) * 100, 0, TEXT_BOX_MAX_X_PERCENT));
    setTextY(clamp(drag.startTextY + ((event.clientY - drag.startClientY) / bounds.height) * 100, 8, 80));
  }

  function stopTextDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (textDragRef.current?.pointerId !== event.pointerId) return;
    textDragRef.current = null;
    setIsDraggingText(false);
  }

  async function exportPng() {
    setExportMessage(null);
    setIsExporting(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = CARD_WIDTH;
      canvas.height = CARD_HEIGHT;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("이 브라우저는 PNG 내보내기를 지원하지 않습니다.");

      if (image) {
        const sourceImage = await loadImage(image.url);
        drawCoverImage(context, sourceImage, imageScale, imageX, imageY);
      } else {
        drawPlaceholderBackground(context);
      }

      const gradient = context.createLinearGradient(0, 0, 0, CARD_HEIGHT);
      gradient.addColorStop(0.2, "rgba(12, 10, 9, 0.03)");
      gradient.addColorStop(1, `rgba(12, 10, 9, ${gradientStrength / 100})`);
      context.fillStyle = gradient;
      context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

      const textBoxLeft = CARD_WIDTH * (textX / 100);
      const textXPosition = align === "center" ? textBoxLeft + (CARD_WIDTH * (TEXT_BOX_WIDTH_PERCENT / 100) / 2) : textBoxLeft;
      let cursorY = CARD_HEIGHT * (textY / 100);
      context.textAlign = align;
      context.textBaseline = "top";
      const textLines = getTextLines(title, subtitle, titleSize, weight, selectedFont.canvasFamily, context);

      context.font = `${weight} ${titleSize}px ${selectedFont.canvasFamily}`;
      const titleLineHeight = titleSize * lineHeight;
      textLines.title.forEach((line, index) => drawHighlightedLine(context, line, textXPosition, cursorY + (index * titleLineHeight), titleColor, highlights));
      cursorY += textLines.title.length * titleLineHeight;

      if (textLines.subtitle.length > 0) {
        cursorY += 36;
        context.globalAlpha = 0.9;
        context.font = `500 32px ${selectedFont.canvasFamily}`;
        textLines.subtitle.forEach((line, index) => drawHighlightedLine(context, line, textXPosition, cursorY + (index * 46), subtitleColor, highlights));
        context.globalAlpha = 1;
      }

      const brandLogo = await loadImage(BRAND_LOGO_SRC);
      const brandLogoHeight = brandLogo.naturalHeight * (BRAND_LOGO_WIDTH / brandLogo.naturalWidth);
      context.globalAlpha = BRAND_LOGO_OPACITY;
      context.drawImage(brandLogo, (CARD_WIDTH - BRAND_LOGO_WIDTH) / 2, CARD_HEIGHT - BRAND_LOGO_BOTTOM - brandLogoHeight, BRAND_LOGO_WIDTH, brandLogoHeight);
      context.globalAlpha = 1;

      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("PNG를 만들지 못했습니다.")), "image/png"));
      downloadBlob(blob, "gamjapick-card.png");
      setExportMessage("PNG 파일을 저장했습니다.");
    } catch (error) {
      setExportMessage(error instanceof Error ? error.message : "PNG 내보내기에 실패했습니다.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <main className="relative min-h-screen bg-stone-100 px-4 py-5 text-stone-900 sm:px-6 lg:h-screen lg:overflow-hidden lg:px-10 lg:py-8">
      <Link href="/" className="absolute left-4 top-3 z-20 rounded-full border border-stone-200 bg-white/90 px-3 py-1.5 text-xs font-black text-stone-700 shadow-sm backdrop-blur transition hover:border-amber-300 hover:text-amber-800 sm:left-6 lg:left-10 lg:top-3">← Topic Radar</Link>
      <div className="mx-auto max-w-7xl lg:flex lg:h-full lg:flex-col">
        <div className="grid gap-6 lg:h-full lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-stretch">
          <section aria-label="카드뉴스 미리보기" className="rounded-[2rem] border border-stone-200 bg-white p-4 shadow-sm sm:p-7 lg:flex lg:h-full lg:min-h-0 lg:items-center">
            <div className="mx-auto w-full max-w-[620px] lg:max-w-[min(620px,calc((100vh_-_8rem)*0.8))]">
              <div ref={previewRef} className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-stone-900 shadow-2xl [container-type:inline-size]">
                {image ? (
                  // Object URLs are browser-only, so Next.js image optimization cannot process this preview.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="선택한 카드뉴스 배경" className="absolute inset-0 h-full w-full object-cover" src={image.url} style={{ transform: `translate(${imageX}%, ${imageY}%) scale(${imageScale / 100})` }} />
                ) : <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,#facc15,transparent_30%),radial-gradient(circle_at_80%_25%,#fb7185,transparent_32%),linear-gradient(145deg,#292524_15%,#0c0a09_78%)]" />}
                <div aria-hidden="true" className="absolute inset-0" style={{ background: `linear-gradient(to bottom, rgba(12,10,9,0.03) 20%, rgba(12,10,9,${gradientStrength / 100}) 100%)` }} />
                <div onPointerDown={handleTextPointerDown} onPointerMove={handleTextPointerMove} onPointerUp={stopTextDrag} onPointerCancel={stopTextDrag} className={`absolute select-none ${isDraggingText ? "cursor-grabbing" : "cursor-grab"}`} style={{ left: `${textX}%`, width: `${TEXT_BOX_WIDTH_PERCENT}%`, top: `${textY}%`, textAlign: align, fontFamily: selectedFont.family, touchAction: "none" }}>
                  {previewLines.title.length > 0 ? <h2 data-title-line-count={previewLines.title.length} style={{ fontSize: `${(titleSize / CARD_WIDTH) * 100}cqw`, fontWeight: weight, lineHeight }}>{previewLines.title.map((line, index) => <span key={`${line}-${index}`} className="block whitespace-nowrap"><HighlightedLine line={line} baseColor={titleColor} highlights={highlights} /></span>)}</h2> : null}
                  {previewLines.subtitle.length > 0 ? <p className="font-medium" style={{ opacity: 0.9, fontSize: `${(32 / CARD_WIDTH) * 100}cqw`, lineHeight: 1.4375, marginTop: `${(36 / CARD_WIDTH) * 100}cqw` }}>{previewLines.subtitle.map((line, index) => <span key={`${line}-${index}`} className="block whitespace-nowrap"><HighlightedLine line={line} baseColor={subtitleColor} highlights={highlights} /></span>)}</p> : null}
                </div>
                {/* Logo stays separate from the draggable copy and anchored at the card footer. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img aria-hidden="true" alt="" className="pointer-events-none absolute left-1/2 w-[24.1%] -translate-x-1/2" src={BRAND_LOGO_SRC} style={{ bottom: `${(BRAND_LOGO_BOTTOM / CARD_HEIGHT) * 100}%`, opacity: BRAND_LOGO_OPACITY }} />
              </div>
            </div>
          </section>

          <aside className="space-y-3 lg:h-full lg:min-h-0" aria-label="카드 편집 도구">
            <nav aria-label="편집 도구 메뉴" className="grid grid-cols-4 gap-1 rounded-2xl border border-stone-200 bg-white p-1.5 shadow-sm">
              {EDITOR_PANELS.map((panel) => <button key={panel.id} type="button" aria-pressed={activePanel === panel.id} className={`rounded-xl px-1 py-2.5 text-xs font-black transition ${activePanel === panel.id ? "bg-stone-900 text-white" : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"}`} onClick={() => setActivePanel(panel.id)}>{panel.label}</button>)}
            </nav>

            {activePanel === "content" ? <Panel title="사진과 내용">
              <input ref={fileInputRef} id="background-image" className="sr-only" type="file" accept="image/avif,image/gif,image/jpeg,image/png,image/svg+xml,image/webp" onChange={handleImageChange} />
              <button type="button" onClick={() => fileInputRef.current?.click()} onDragEnter={(event) => { event.preventDefault(); setIsDraggingImage(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setIsDraggingImage(false)} onDrop={handleImageDrop} className={`w-full rounded-2xl border-2 border-dashed px-4 py-3 text-center transition ${isDraggingImage ? "border-amber-500 bg-amber-50" : "border-stone-300 bg-stone-50 hover:border-amber-400 hover:bg-amber-50/50"}`}>
                <span className="block text-sm font-black text-stone-800">사진 선택 · 끌어놓기 · 붙여넣기</span>
                <span className="mt-2 block text-xs leading-5 text-stone-500">JPG, PNG, WebP, GIF, AVIF, SVG · 최대 20MB</span>
              </button>
              {image ? <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800"><span className="truncate">{image.name}</span><button className="shrink-0 font-bold underline" type="button" onClick={removeImage}>제거</button></div> : null}
              {imageMessage ? <p aria-live="polite" className={`mt-2 text-xs ${imageMessage.includes("적용") ? "text-emerald-700" : "text-rose-700"}`}>{imageMessage}</p> : null}

              <label className="field-label mt-3" htmlFor="title">제목</label>
              <textarea id="title" className="text-input min-h-16" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="카드 제목을 입력하세요" />
              <label className="field-label mt-3" htmlFor="subtitle">부제 <span className="font-normal text-stone-400">선택</span></label>
              <textarea id="subtitle" className="text-input min-h-14" value={subtitle} onChange={(event) => setSubtitle(event.target.value)} placeholder="짧은 설명을 입력하세요" />
            </Panel> : null}

            {activePanel === "text" ? <Panel title="글자">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div><label className="field-label" htmlFor="font">폰트</label><select id="font" className="text-input" value={font} onChange={(event) => setFont(event.target.value as FontOption)}>{FONT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
                <div><span className="field-label">굵기</span><div className="grid grid-cols-3 gap-1" aria-label="글자 굵기">{[500, 700, 900].map((value) => <button key={value} type="button" className={`rounded-lg border px-1 py-2 text-xs font-bold ${weight === value ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-600"}`} onClick={() => setWeight(value as 500 | 700 | 900)}>{value === 500 ? "보통" : value === 700 ? "굵게" : "강조"}</button>)}</div></div>
                <div className="col-span-2 flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2"><label className="text-xs font-bold text-stone-700" htmlFor="auto-size">제목 크기 자동 맞춤</label><input id="auto-size" className="h-4 w-4 accent-amber-600" type="checkbox" checked={isAutoTitleSize} onChange={(event) => setIsAutoTitleSize(event.target.checked)} /></div>
                <RangeControl compact label="제목 크기" value={titleSize} min={48} max={120} disabled={isAutoTitleSize} onChange={(value) => { setManualTitleSize(value); setIsAutoTitleSize(false); }} unit="px" />
                <RangeControl compact label="줄 간격" value={lineHeight} min={0.9} max={1.7} step={0.05} onChange={setLineHeight} unit="" />
                <div className="col-span-2 rounded-xl bg-stone-50 p-2"><div className="flex items-center gap-2"><input aria-label="강조 단어" className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-xs" value={highlightTerm} onChange={(event) => setHighlightTerm(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addHighlight(); } }} placeholder="강조할 단어" /><input aria-label="강조 색상" className="h-8 w-9 cursor-pointer rounded border border-stone-300 bg-white p-0.5" type="color" value={highlightColor} onChange={(event) => setHighlightColor(event.target.value)} /><button type="button" className="rounded-lg bg-stone-900 px-2 py-1.5 text-xs font-bold text-white" onClick={addHighlight}>추가</button></div>{highlights.length > 0 ? <div className="mt-2 flex gap-1 overflow-x-auto pb-0.5">{highlights.map((highlight) => <button key={highlight.id} type="button" className="shrink-0 rounded-full border px-2 py-1 text-[11px] font-bold" style={{ borderColor: highlight.color, color: highlight.color }} onClick={() => setHighlights((previous) => previous.filter((item) => item.id !== highlight.id))}>{highlight.term} ×</button>)}</div> : <p className="mt-1 text-[11px] text-stone-500">단어를 추가하면 제목·부제·출처에서 해당 단어만 강조합니다.</p>}</div>
                <div><span className="mb-1 block text-xs font-bold text-stone-700">정렬</span><div className="flex rounded-lg border border-stone-200 p-0.5">{(["left", "center"] as const).map((value) => <button key={value} type="button" aria-pressed={align === value} className={`flex-1 rounded-md px-1 py-1.5 text-[11px] font-bold ${align === value ? "bg-stone-900 text-white" : "text-stone-500"}`} onClick={() => setAlign(value)}>{value === "left" ? "왼쪽" : "가운데"}</button>)}</div></div>
                <RangeControl compact label="좌우" value={textX} min={0} max={TEXT_BOX_MAX_X_PERCENT} onChange={setTextX} unit="%" />
                <RangeControl compact label="상하" value={textY} min={8} max={80} onChange={setTextY} unit="%" />
              </div>
              <p className="mt-3 text-xs text-stone-500">글자 영역은 큰 미리보기에서 직접 드래그해 옮길 수도 있습니다.</p>
            </Panel> : null}

            {activePanel === "image" ? <Panel title="이미지와 분위기">
              <RangeControl label="이미지 확대" value={imageScale} min={100} max={180} onChange={setImageScale} unit="%" />
              <RangeControl label="이미지 좌우 이동" value={imageX} min={-30} max={30} onChange={setImageX} unit="%" />
              <RangeControl label="이미지 상하 이동" value={imageY} min={-30} max={30} onChange={setImageY} unit="%" />
              <RangeControl label="하단 그라데이션" value={gradientStrength} min={20} max={92} onChange={setGradientStrength} unit="%" />
            </Panel> : null}

            {activePanel === "export" ? <Panel title="PNG 저장">
              <button type="button" onClick={() => void exportPng()} disabled={isExporting} className="w-full rounded-2xl bg-amber-400 px-4 py-3 text-sm font-black text-stone-950 transition hover:bg-amber-300 disabled:cursor-wait disabled:opacity-60">{isExporting ? "PNG 만드는 중…" : "PNG로 저장"}</button>
              <p aria-live="polite" className="mt-3 text-xs leading-5 text-stone-500">{exportMessage ?? "현재 배경·문구·폰트·정렬·그라데이션을 1080 × 1350 PNG로 저장합니다."}</p>
            </Panel> : null}
          </aside>
        </div>
      </div>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm"><h2 className="mb-4 text-base font-black">{title}</h2>{children}</section>;
}

function RangeControl({ label, value, min, max, step = 1, onChange, unit, disabled = false, compact = false }: { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void; unit: string; disabled?: boolean; compact?: boolean }) {
  const displayValue = Number.isInteger(value) ? value : value.toFixed(2);
  const labelClassName = compact ? "mb-1 flex items-center justify-between text-xs font-semibold text-stone-700" : "mb-2 flex items-center justify-between text-sm font-semibold text-stone-700";
  return <label className={`${compact ? "block" : "mt-5 block"} ${disabled ? "opacity-45" : ""}`}><span className={labelClassName}><span>{label}</span><span className="font-mono text-[11px] text-stone-500">{displayValue}{unit}</span></span><input className="w-full accent-amber-600" type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

function getTextLines(title: string, subtitle: string, titleSize: number, weight: number, fontFamily: string, context?: CanvasRenderingContext2D): TextLines {
  if (!context && typeof document === "undefined") {
    return { title: title ? title.split("\n") : [], subtitle: subtitle ? subtitle.split("\n") : [] };
  }
  const measuringContext = context ?? document.createElement("canvas").getContext("2d");
  if (!measuringContext) return { title: title ? title.split("\n") : [], subtitle: subtitle ? subtitle.split("\n") : [] };

  const maxTextWidth = CARD_WIDTH * (TEXT_BOX_WIDTH_PERCENT / 100);
  measuringContext.font = `${weight} ${titleSize}px ${fontFamily}`;
  const titleLines = title ? wrapTextLines(title, maxTextWidth, (value) => measuringContext.measureText(value).width) : [];
  measuringContext.font = `500 32px ${fontFamily}`;
  const subtitleLines = subtitle ? wrapTextLines(subtitle, maxTextWidth, (value) => measuringContext.measureText(value).width) : [];
  return { title: titleLines, subtitle: subtitleLines };
}

function HighlightedLine({ line, baseColor, highlights }: { line: string; baseColor: string; highlights: TextHighlight[] }) {
  return <>{splitHighlightedSegments(line, highlights).map((segment, index) => <span key={`${segment.text}-${index}`} style={{ color: segment.color ?? baseColor }}>{segment.text}</span>)}</>;
}

function drawHighlightedLine(context: CanvasRenderingContext2D, line: string, x: number, y: number, baseColor: string, highlights: TextHighlight[]) {
  const segments = splitHighlightedSegments(line, highlights);
  const totalWidth = segments.reduce((sum, segment) => sum + context.measureText(segment.text).width, 0);
  const originalAlignment = context.textAlign;
  let cursor = originalAlignment === "center" ? x - (totalWidth / 2) : x;
  context.textAlign = "left";
  for (const segment of segments) {
    context.fillStyle = segment.color ?? baseColor;
    context.fillText(segment.text, cursor, y);
    cursor += context.measureText(segment.text).width;
  }
  context.textAlign = originalAlignment;
}

function splitHighlightedSegments(line: string, highlights: TextHighlight[]): { text: string; color: string | null }[] {
  const matchingHighlights = [...highlights].filter((highlight) => highlight.term).sort((left, right) => right.term.length - left.term.length);
  if (matchingHighlights.length === 0) return [{ text: line, color: null }];

  const expression = new RegExp(`(${matchingHighlights.map((highlight) => escapeRegularExpression(highlight.term)).join("|")})`, "g");
  return line.split(expression).filter(Boolean).map((text) => ({ text, color: matchingHighlights.find((highlight) => highlight.term === text)?.color ?? null }));
}

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function findImageFile(files: FileList | null | undefined): File | null {
  return Array.from(files ?? []).find((file) => file.type.startsWith("image/") || /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(file.name)) ?? null;
}

function isTextEntry(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || (target instanceof HTMLElement && target.isContentEditable);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("선택한 이미지를 브라우저가 읽지 못했습니다. JPG 또는 PNG로 다시 선택해 주세요."));
    image.src = url;
  });
}

function drawCoverImage(context: CanvasRenderingContext2D, image: HTMLImageElement, scalePercent: number, xPercent: number, yPercent: number) {
  const baseScale = Math.max(CARD_WIDTH / image.naturalWidth, CARD_HEIGHT / image.naturalHeight);
  const width = image.naturalWidth * baseScale * (scalePercent / 100);
  const height = image.naturalHeight * baseScale * (scalePercent / 100);
  const x = ((CARD_WIDTH - width) / 2) + (CARD_WIDTH * (xPercent / 100));
  const y = ((CARD_HEIGHT - height) / 2) + (CARD_HEIGHT * (yPercent / 100));
  context.drawImage(image, x, y, width, height);
}

function drawPlaceholderBackground(context: CanvasRenderingContext2D) {
  context.fillStyle = "#0c0a09";
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  const yellow = context.createRadialGradient(CARD_WIDTH * 0.2, CARD_HEIGHT * 0.15, 0, CARD_WIDTH * 0.2, CARD_HEIGHT * 0.15, CARD_WIDTH * 0.45);
  yellow.addColorStop(0, "#facc15");
  yellow.addColorStop(1, "rgba(250,204,21,0)");
  context.fillStyle = yellow;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  const pink = context.createRadialGradient(CARD_WIDTH * 0.8, CARD_HEIGHT * 0.25, 0, CARD_WIDTH * 0.8, CARD_HEIGHT * 0.25, CARD_WIDTH * 0.48);
  pink.addColorStop(0, "#fb7185");
  pink.addColorStop(1, "rgba(251,113,133,0)");
  context.fillStyle = pink;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
