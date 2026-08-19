import { useMutation } from "@tanstack/react-query";
import { updateNip05Identity } from "~/lib/api";
import logger from "~/lib/log";
import { useServerStore } from "~/store/serverStore";
import { useAlert } from "~/contexts/AlertProvider";

const log = logger("useUpdateNip05Identity");

const updateNip05IdentityWrapper = async ({
  username,
  nostrPubkey,
}: {
  username: string;
  nostrPubkey: string;
}) => {
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedNostrPubkey = nostrPubkey.trim();

  if (!normalizedUsername) {
    throw new Error("Enter a username");
  }
  if (!normalizedNostrPubkey) {
    throw new Error("Enter a Nostr public key");
  }
  if (normalizedNostrPubkey.toLowerCase().startsWith("nsec1")) {
    throw new Error("Never paste a Nostr private key. Enter an npub or hex public key.");
  }

  const result = await updateNip05Identity({
    username: normalizedUsername,
    nostr_pubkey: normalizedNostrPubkey,
  });

  if (result.isErr()) {
    throw result.error;
  }

  return result.value;
};

export const useUpdateNip05Identity = (callbacks?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  const setNip05Identity = useServerStore((state) => state.setNip05Identity);
  const { showAlert } = useAlert();

  return useMutation({
    mutationFn: updateNip05IdentityWrapper,
    onSuccess: (identity) => {
      setNip05Identity(identity.lightning_address, identity.nostr_pubkey);
      log.d("Successfully configured NIP-05 identity");
      callbacks?.onSuccess?.();
    },
    onError: (error: Error) => {
      log.w("Failed to configure NIP-05 identity", [error]);
      callbacks?.onError?.(error);
      showAlert({
        title: "Error",
        description: error.message,
      });
    },
  });
};
