import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Badge, Button, Card, Meta, Notice, SectionTitle } from "../src/ui/components";
import { Screen } from "../src/ui/screen";
import { useFlowStore } from "../src/state/flow";
import { vedaApi } from "../src/api/veda";
import { readableError } from "../src/lib/errors";
import { useRequiredSession } from "../src/hooks/use-required-session";

export default function AtmakarakaScreen() {
  const router = useRouter();
  const { token, profileId, ready } = useRequiredSession(true);
  const atmakaraka = useFlowStore((s) => s.atmakaraka);
  const setAtmakaraka = useFlowStore((s) => s.setAtmakaraka);
  const [narrativeKey, setNarrativeKey] = useState("");
  const [resonanceQuestion, setResonanceQuestion] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!token || !profileId) return;
      try {
        const r = await vedaApi.getAtmakaraka(token, profileId);
        setAtmakaraka(r.planet);
        setNarrativeKey(r.narrativeKey);
        setResonanceQuestion(r.resonanceQuestion);
      } catch (error) {
        setStatus(readableError(error, "atmakaraka_failed"));
      }
    };
    if (!atmakaraka) void load();
  }, [token, profileId, atmakaraka, setAtmakaraka]);

  return (
    <Screen title="Atmakaraka Intro" subtitle="Resonance check before timeline.">
      <Card>
        <Badge label="Soul marker" tone="accent" />
        <SectionTitle>Your Atmakaraka</SectionTitle>
        <Meta>{atmakaraka ?? "Loading..."}</Meta>
        {narrativeKey ? <Meta>Narrative: {narrativeKey}</Meta> : null}
        {resonanceQuestion ? <Notice>{resonanceQuestion}</Notice> : null}
        {status ? <Notice>{status}</Notice> : null}
        <Button testID="atmakaraka-quickproof" label="See My Last 5 Years" onPress={() => router.push("/quick-proof")} disabled={!ready} />
      </Card>
    </Screen>
  );
}
