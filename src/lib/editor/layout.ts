const DEFAULT_TITLE_SIZE = 104;
export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;
const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024;

type ImageFileCandidate = {
  name: string;
  size: number;
  type: string;
};

/**
 * Keeps a first-pass title size legible inside the fixed 4:5 cover template.
 * Manual edits can always override this value in the editor.
 */
export function getAutoTitleFontSize(title: string): number {
  const longestLine = Math.max(0, ...title.split("\n").map((line) => line.trim().length));

  if (longestLine >= 28) return 56;
  if (longestLine >= 21) return 66;
  if (longestLine >= 15) return 78;
  if (longestLine >= 9) return 92;
  return DEFAULT_TITLE_SIZE;
}

export function getImageFileError(file: ImageFileCandidate): string | null {
  const isImageMimeType = file.type.startsWith("image/");
  const hasImageExtension = /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(file.name);

  if (!isImageMimeType && !hasImageExtension) return "JPG, PNG, WebP, GIF, AVIF 또는 SVG 이미지만 사용할 수 있습니다.";
  if (file.size > MAX_IMAGE_SIZE_BYTES) return "이미지는 20MB 이하로 선택해 주세요.";
  return null;
}

export function wrapTextLines(text: string, maxWidth: number, measure: (value: string) => number): string[] {
  return text.split("\n").flatMap((paragraph) => {
    if (!paragraph) return [""];

    const lines: string[] = [];
    let current = "";
    for (const character of Array.from(paragraph)) {
      const candidate = current + character;
      if (current && measure(candidate) > maxWidth) {
        lines.push(current);
        current = character;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
    return lines;
  });
}
