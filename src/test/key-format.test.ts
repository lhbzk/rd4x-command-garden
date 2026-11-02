import { describe, expect, it } from "vitest";
import { formatKeyInput, isCompleteKey } from "@/lib/format";
import { DEMO_KEYS, validateKey } from "@/lib/api";

describe("RD4X key", () => {
  it("formats raw input as RD4X-XXXX-XXXX-XXXX", () => {
    expect(formatKeyInput("rd4xabcd1234efgh")).toBe("RD4X-ABCD-1234-EFGH");
    expect(formatKeyInput("abcd12")).toBe("RD4X-ABCD-12");
  });

  it("only accepts complete keys", () => {
    expect(isCompleteKey("RD4X-ABCD-1234-EFGH")).toBe(true);
    expect(isCompleteKey("RD4X-ABCD-1234")).toBe(false);
  });

  it("returns success, expired and invalid states", async () => {
    expect((await validateKey(DEMO_KEYS.valid)).status).toBe("success");
    expect((await validateKey(DEMO_KEYS.expired)).status).toBe("expired");
    expect((await validateKey("RD4X-ZZZZ-ZZZZ-ZZZZ")).status).toBe("invalid");
  }, 10_000);
});
