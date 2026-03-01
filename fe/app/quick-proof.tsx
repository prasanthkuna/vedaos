import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Badge, Button, Card, Meta, Notice, SectionTitle } from "../src/ui/components";
import { Screen } from "../src/ui/screen";
import { vedaApi } from "../src/api/veda";
import { readableError } from "../src/lib/errors";
import { useRequiredSession } from "../src/hooks/use-required-session";

export default function QuickProofScreen() {
  const router = useRouter();
  const { token, profileId } = useRequiredSession(true);
  const [segments, setSegments] = useState<Array<{ id: string; title: string; line: string }>>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!token || !profileId) return;
      try {
        const response = await vedaApi.generateJourneyV2(token, { profileId, mode: "quick5y", explanationMode: "simple" });
        setSegments(
          response.journey.segments.slice(0, 8).map((segment) => ({
            id: segment.segmentId,
            title: segment.narrative.phaseMeaning,
            line: segment.narrative.likelyManifestation,
          })),
        );
      } catch (error) {
        setStatus(readableError(error, "quick_proof_failed"));
      }
    };
    void load();
  }, [profileId, token]);

  return (
    <Screen title="Quick Proof" subtitle="Last 5 years in phase sequence.">
      <Card>
        <Badge label="Trust check" tone="accent" />
        <SectionTitle>How close is this to your lived past?</SectionTitle>
        <Meta>If this resonates, continue to full 15-year journey.</Meta>
      </Card>

      {segments.map((segment) => (
        <Card key={segment.id}>
          <SectionTitle>{segment.title}</SectionTitle>
          <Meta>{segment.line}</Meta>
        </Card>
      ))}

      {status ? (
        <Card>
          <Notice tone="danger">{status}</Notice>
        </Card>
      ) : null}

      <Card>
        <Button label="Continue to Home" onPress={() => router.replace("/home")} />
        <Button compact label="See Full Journey" onPress={() => router.push("/journey")} />
      </Card>
    </Screen>
  );
}
