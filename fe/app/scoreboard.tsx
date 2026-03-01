import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Badge, Button, Card, Meta, Notice, Row, SectionTitle } from "../src/ui/components";
import { Screen } from "../src/ui/screen";
import { vedaApi } from "../src/api/veda";
import { useFlowStore } from "../src/state/flow";
import { readableError } from "../src/lib/errors";
import { useRequiredSession } from "../src/hooks/use-required-session";

export default function ScoreboardScreen() {
  const router = useRouter();
  const { token, profileId } = useRequiredSession(true);
  const scores = useFlowStore((s) => s.scores);
  const setScores = useFlowStore((s) => s.setScores);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!token || !profileId) return;
    setLoading(true);
    setStatus("");
    try {
      const next = await vedaApi.getScores(token, profileId);
      setScores(next);
    } catch (error) {
      setStatus(readableError(error, "score_load_failed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!scores) void load();
  }, [token, profileId, scores, setScores]);

  return (
    <Screen title="Scoreboard" subtitle="Trust metrics that control expansion and unlock.">
      <Card>
        <Badge label="Conversion proof" tone="accent" />
        <SectionTitle>Current Scores</SectionTitle>
        <Meta>PSA: {scores?.psa ?? 0}</Meta>
        <Meta>PCS: {scores?.pcs ?? 0}</Meta>
        <Meta>Validated: {scores?.validatedCount ?? 0}</Meta>
        <Meta>Year Coverage: {scores?.yearCoverage ?? 0}</Meta>
        <Meta>Diversity: {scores?.diversityScore ?? 0}</Meta>
        <Notice tone={scores?.unlock.quickProofEligible ? "success" : "info"}>
          {scores?.unlock.quickProofEligible ? "Quick-proof guardrails passed." : "Quick-proof guardrails not passed yet."}
        </Notice>
        {!scores && loading ? <Meta>Loading score snapshot...</Meta> : null}
        {scores?.unlock.nextSteps?.map((step) => (
          <Meta key={step}>Next: {step}</Meta>
        ))}
        {status ? <Notice tone="danger">{status}</Notice> : null}
        <Row>
          <Button compact label="Refresh" onPress={() => void load()} />
          <Button compact label="Quick Proof" onPress={() => router.push("/quick-proof")} />
          <Button compact label="Story Feed" onPress={() => router.push("/story-feed")} />
        </Row>
      </Card>
    </Screen>
  );
}
