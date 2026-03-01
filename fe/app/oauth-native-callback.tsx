import { useEffect } from "react";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Screen } from "../src/ui/screen";
import { Card, Meta, SectionTitle } from "../src/ui/components";

WebBrowser.maybeCompleteAuthSession();

export default function OAuthNativeCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/welcome");
    }, 250);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Screen title="Signing you in" subtitle="Completing secure Google authentication.">
      <Card>
        <SectionTitle>One moment</SectionTitle>
        <Meta>Redirecting back to your VEDA journey...</Meta>
      </Card>
    </Screen>
  );
}
