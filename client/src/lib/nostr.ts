import { bech32 } from "bech32";

const HEX_PUBKEY_PATTERN = /^[0-9a-f]{64}$/i;

export const hexPubkeyToNpub = (hexPubkey: string | null): string => {
  if (!hexPubkey || !HEX_PUBKEY_PATTERN.test(hexPubkey)) {
    return "";
  }

  const bytes = new Uint8Array(32);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hexPubkey.slice(index * 2, index * 2 + 2), 16);
  }

  return bech32.encode("npub", bech32.toWords(bytes), 1000);
};
