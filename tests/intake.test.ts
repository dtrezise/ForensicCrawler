import { describe, expect, it } from "vitest";
import { findDuplicateSubject, normalizeSubject } from "../src/intake";

describe("research intake duplicate resolver", () => {
  const candidates = [
    { id: "kirk", title: "Charlie Kirk · UVU", aliases: ["Charlie Kirk assassination — public-record reconstruction"], kind: "existing_case" as const },
    { id: "vessels", title: "Southern Spear · vessel strikes", aliases: ["Venezuela boat bombings"], kind: "existing_case" as const },
  ];

  it("normalizes punctuation and ordinal suffixes", () => {
    expect(normalizeSubject(" October 7th ")).toBe("october 7");
  });

  it("resolves a known alias without creating another case", () => {
    expect(findDuplicateSubject("Venezuela boat bombings", candidates)).toMatchObject({ id: "vessels", matchType: "alias" });
  });

  it("keeps a new subject distinct", () => {
    expect(findDuplicateSubject("October 7th", candidates)).toBeNull();
  });
});
