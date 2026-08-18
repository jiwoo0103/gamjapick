import assert from "node:assert/strict";
import test from "node:test";

import { getAutoTitleFontSize, getImageFileError, wrapTextLines } from "./layout";

test("reduces the automatic title size for long lines", () => {
  assert.equal(getAutoTitleFontSize("짧은 제목"), 104);
  assert.equal(getAutoTitleFontSize("가".repeat(21)), 66);
  assert.equal(getAutoTitleFontSize("가".repeat(28)), 56);
});

test("uses the longest explicit title line for the automatic size", () => {
  assert.equal(getAutoTitleFontSize("짧은 제목\n조금 더 긴 제목입니다"), 92);
});

test("validates local image input before creating a preview", () => {
  assert.equal(getImageFileError({ name: "cover.jpg", type: "image/jpeg", size: 1024 }), null);
  assert.match(getImageFileError({ name: "note.txt", type: "text/plain", size: 1024 }) ?? "", /이미지/);
  assert.match(getImageFileError({ name: "cover.png", type: "image/png", size: 21 * 1024 * 1024 }) ?? "", /20MB/);
});

test("wraps canvas text at the available width and respects explicit newlines", () => {
  const measure = (value: string) => value.length * 10;
  assert.deepEqual(wrapTextLines("abcdef", 30, measure), ["abc", "def"]);
  assert.deepEqual(wrapTextLines("abc\ndef", 40, measure), ["abc", "def"]);
});
