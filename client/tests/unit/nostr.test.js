import { describe, expect, test } from "bun:test";
import { hexPubkeyToNpub } from "../../src/lib/nostr";

describe("hexPubkeyToNpub", () => {
  test("encodes a canonical Nostr public key", () => {
    expect(
      hexPubkeyToNpub("b0635d6a9851d3aed0cd6c495b282167acf761729078d975fc341b22650b07b9"),
    ).toBe("npub1kp34665c28f6a5xdd3y4k2ppv7k0wctjjpudja0uxsdjyegtq7us853d4g");
  });

  test("returns an empty value for missing or malformed keys", () => {
    expect(hexPubkeyToNpub(null)).toBe("");
    expect(hexPubkeyToNpub("not-a-public-key")).toBe("");
  });
});
