import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { Input } from "../components/ui/input";
import { Text } from "../components/ui/text";
import { NoahSafeAreaView } from "~/components/NoahSafeAreaView";
import { useUpdateNip05Identity } from "../hooks/useUpdateNip05Identity";
import { getLnurlDomain } from "../constants";
import { useServerStore } from "../store/serverStore";
import { useWalletStore } from "../store/walletStore";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { CheckCircle } from "lucide-react-native";
import type { OnboardingStackParamList, SettingsStackParamList } from "../Navigators";
import { NativeNoahButton } from "~/components/ui/NativeNoahButton";
import { NativeNoahBackButton } from "~/components/ui/NativeNoahIconButton";

type LightningAddressScreenRouteProp = RouteProp<
  OnboardingStackParamList & SettingsStackParamList,
  "LightningAddress"
>;

const LightningAddressScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<LightningAddressScreenRouteProp>();
  const { fromOnboarding } = route.params || {};
  const { finishOnboarding } = useWalletStore();
  const { lightningAddress, nostrPubkey } = useServerStore();
  const domain = getLnurlDomain();
  const currentUsername = lightningAddress ? lightningAddress.split("@")[0] : "";
  const [username, setUsername] = useState(currentUsername);
  const [nostrKey, setNostrKey] = useState(nostrPubkey ?? "");
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedNostrKey = nostrKey.trim();
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);

  const updateIdentityMutation = useUpdateNip05Identity({
    onSuccess: () => {
      setShowUpdateSuccess(true);
      setTimeout(() => {
        setShowUpdateSuccess(false);
        if (fromOnboarding) {
          finishOnboarding();
        } else {
          navigation.goBack();
        }
      }, 2000);
    },
  });

  const handleSave = () => {
    if (!normalizedUsername || !normalizedNostrKey) {
      return;
    }

    const newAddress = `${normalizedUsername}@${domain}`;
    if (newAddress === lightningAddress && normalizedNostrKey === nostrPubkey) {
      if (fromOnboarding) {
        finishOnboarding();
      } else {
        navigation.goBack();
      }
      return;
    }

    updateIdentityMutation.mutate({
      username: normalizedUsername,
      nostrPubkey: normalizedNostrKey,
    });
  };

  return (
    <NoahSafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        <View className="mb-8 flex-row items-center">
          {!fromOnboarding && (
            <NativeNoahBackButton
              onPress={() => navigation.goBack()}
              className="mr-3"
              testID="lightning-address-back-button"
            />
          )}
          <Text className="text-2xl font-bold text-foreground">
            {fromOnboarding ? "Create your NIP-05 Identity" : "Lightning & NIP-05"}
          </Text>
        </View>
        {showUpdateSuccess && (
          <Alert icon={CheckCircle} className="mb-4">
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>
              Your Lightning address and NIP-05 identity have been updated.
            </AlertDescription>
          </Alert>
        )}
        <View className="mt-6">
          <Text className="mb-3 text-muted-foreground">
            Link a Nostr public key so the same address works for Lightning and NIP-05.
          </Text>
          <View className="space-y-5 rounded-2xl border border-border bg-card p-5">
            <View>
              <Text className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
                Username
              </Text>
              <Input
                value={username}
                onChangeText={(value) => setUsername(value.trim().toLowerCase())}
                className="h-16 rounded-2xl border border-border bg-background/90 px-4 text-lg leading-6 text-foreground"
                placeholder="fiatjaf"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View>
              <Text className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
                Nostr public key
              </Text>
              <Input
                value={nostrKey}
                onChangeText={setNostrKey}
                className="h-16 rounded-2xl border border-border bg-background/90 px-4 text-lg leading-6 text-foreground"
                placeholder="npub1... or 64-character hex"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text className="mt-2 text-sm text-muted-foreground">
                Use a public npub or hex key. Never paste an nsec private key.
              </Text>
            </View>
            <View className="rounded-xl border border-border/60 bg-background/70 p-3">
              <Text className="text-xs text-muted-foreground">
                Your Lightning address and NIP-05 identifier will be
              </Text>
              <Text className="mt-1 text-md font-semibold text-foreground">
                {normalizedUsername}@{domain}
              </Text>
            </View>
            <Text className="text-sm text-muted-foreground">
              Add this exact identifier to the NIP-05 field in the Nostr profile for this public
              key. Nostr clients will then verify it against Noah.
            </Text>
          </View>
        </View>
        <NativeNoahButton
          label={
            `${normalizedUsername}@${domain}` === lightningAddress &&
            normalizedNostrKey === nostrPubkey
              ? "Continue"
              : "Save"
          }
          onPress={handleSave}
          className="mt-8"
          isLoading={updateIdentityMutation.isPending}
          loadingLabel="Saving..."
          disabled={!normalizedUsername || !normalizedNostrKey}
          fullWidth
        />
      </ScrollView>
    </NoahSafeAreaView>
  );
};

export default LightningAddressScreen;
