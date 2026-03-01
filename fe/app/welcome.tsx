import { useRouter } from "expo-router";
import { useOAuth, useAuth } from "@clerk/clerk-expo";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Badge, Button, Card, Meta, Notice, Row, SectionTitle } from "../src/ui/components";
import { Screen } from "../src/ui/screen";

WebBrowser.maybeCompleteAuthSession();

export default function WelcomeScreen() {
  const router = useRouter();
  const { isSignedIn, signOut } = useAuth();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const onGoogleLogin = async () => {
    const redirectUrl = AuthSession.makeRedirectUri({ path: "oauth-native-callback" });
    const { createdSessionId, setActive } = await startOAuthFlow({ redirectUrl });
    if (createdSessionId && setActive) {
      await setActive({ session: createdSessionId });
    }
  };

  return (
    <Screen title="Validate past, then unlock future" subtitle="Guidance only. No guaranteed outcomes.">
      <Card>
        <Badge label="India launch" tone="accent" />
        <SectionTitle>Sign In</SectionTitle>
        {isSignedIn ? (
          <Notice tone="success">Google sign-in connected.</Notice>
        ) : (
          <Notice>Continue with Google to access your secured chart flow.</Notice>
        )}
        <Row>
          {!isSignedIn ? <Button label="Continue with Google" testID="welcome-google-login" onPress={() => void onGoogleLogin()} /> : null}
          {isSignedIn ? <Button label="Sign out" testID="welcome-signout" tone="secondary" onPress={() => void signOut()} /> : null}
        </Row>
      </Card>
      <Card>
        <SectionTitle>Start</SectionTitle>
        <Meta>We start with consent, then birth-time reliability, then a 5-year proof loop.</Meta>
        <Row>
          <Button testID="welcome-start" label="Start" onPress={() => router.push("/consent")} disabled={!isSignedIn} />
        </Row>
      </Card>
    </Screen>
  );
}
