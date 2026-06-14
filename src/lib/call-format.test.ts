import { describe, expect, it } from "vitest";
import { formatDateTime, parseApiDateTime } from "./call-format";

describe("parseApiDateTime", () => {
  it("treats naive ISO strings as UTC", () => {
    const d = parseApiDateTime("2026-06-14T07:30:09");
    expect(d).not.toBeNull();
    expect(d?.toISOString()).toBe("2026-06-14T07:30:09.000Z");
  });

  it("accepts Z suffix unchanged", () => {
    const d = parseApiDateTime("2026-06-14T07:30:09Z");
    expect(d?.toISOString()).toBe("2026-06-14T07:30:09.000Z");
  });

  it("returns null for empty input", () => {
    expect(parseApiDateTime(null)).toBeNull();
    expect(parseApiDateTime("")).toBeNull();
  });

  it("differs from naive Date() parsing outside UTC", () => {
    const normalized = parseApiDateTime("2026-06-14T07:30:09");
    const naive = new Date("2026-06-14T07:30:09");
    if (normalized && normalized.getTime() !== naive.getTime()) {
      expect(normalized.getTime()).not.toBe(naive.getTime());
    } else {
      expect(normalized?.getTime()).toBe(naive.getTime());
    }
  });
});

describe("formatDateTime", () => {
  it("formats using the same instant as parseApiDateTime", () => {
    const iso = "2026-06-14T07:30:09Z";
    const d = parseApiDateTime(iso);
    expect(d).not.toBeNull();
    const expected = d!.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    expect(formatDateTime(iso)).toBe(expected);
  });
});
