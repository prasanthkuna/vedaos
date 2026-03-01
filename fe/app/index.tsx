import { Redirect } from "expo-router";
import { useSessionStore } from "../src/state/session";

export default function Index() {
  const token = useSessionStore((s) => s.token);
  const profileId = useSessionStore((s) => s.profileId);
  if (!token) return <Redirect href="/welcome" />;
  return <Redirect href={profileId ? "/home" : "/welcome"} />;
}
