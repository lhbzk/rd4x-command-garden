import { describe, expect, it } from "vitest";
import { sortByUrgency } from "@/lib/ai/triage";

describe("ticket triage order", () => {
  it("puts the most urgent ticket first and unclassified last", () => {
    const triage = new Map([
      ["a", { id: "a", urgency: 2, reason: "" }],
      ["b", { id: "b", urgency: 5, reason: "" }],
    ]);
    const out = sortByUrgency([{ id: "c" }, { id: "a" }, { id: "b" }], triage).map((t) => t.id);
    expect(out).toEqual(["b", "a", "c"]);
  });
});
