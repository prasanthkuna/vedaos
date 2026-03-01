import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Badge, Button, Card, Meta, Notice, SectionTitle } from "../src/ui/components";
import { Screen } from "../src/ui/screen";
import { BottomNav } from "../src/ui/nav";
import { useFlowStore } from "../src/state/flow";
import { vedaApi } from "../src/api/veda";
import { readableError } from "../src/lib/errors";
import { useRequiredSession } from "../src/hooks/use-required-session";

export default function JourneyScreen() {
  const router = useRouter();
  const { token, profileId } = useRequiredSession(true);
  const journeyV2 = useFlowStore((s) => s.journeyV2);
  const setJourneyV2 = useFlowStore((s) => s.setJourneyV2);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!token || !profileId) return;
      try {
        const response = await vedaApi.generateJourneyV2(token, { profileId, mode: "full15y", explanationMode: "simple" });
        setJourneyV2(response.journey);
      } catch (error) {
        setStatus(readableError(error, "journey_load_failed"));
      }
    };
    if (!journeyV2) void load();
  }, [journeyV2, profileId, setJourneyV2, token]);

  return (
    <Screen title="My Journey" subtitle="Your last 15 years in phase order.">
      <Card>
        <Badge label="Phase feed" tone="accent" />
        <SectionTitle>Active</SectionTitle>
        <Meta>
          {journeyV2?.activePhaseRefs.md ?? "--"} / {journeyV2?.activePhaseRefs.ad ?? "--"} / {journeyV2?.activePhaseRefs.pd ?? "--"}
        </Meta>
      </Card>

      {journeyV2?.segments.map((segment) => (
        <Card key={segment.segmentId}>
          <SectionTitle>{segment.narrative.phaseMeaning}</SectionTitle>
          <Meta>{segment.startUtc.slice(0, 10)} {"->"} {segment.endUtc.slice(0, 10)}</Meta>
          <Meta>{segment.narrative.likelyManifestation}</Meta>
          <Notice tone="danger">Caution: {segment.narrative.caution}</Notice>
          <Notice tone="success">Action: {segment.narrative.action}</Notice>
          {segment.keyTransitTriggers.slice(0, 2).map((trigger, idx) => (
            <Meta key={`${segment.segmentId}-trigger-${idx}`}>Trigger: {trigger.type} {trigger.ref ? `(${trigger.ref})` : ""}</Meta>
          ))}
        </Card>
      ))}

      {!journeyV2 ? (
        <Card>
          <Meta>Generating phase journey...</Meta>
        </Card>
      ) : null}

      {status ? (
        <Card>
          <Notice tone="danger">{status}</Notice>
          <Button compact label="Retry" onPress={() => setJourneyV2(undefined)} />
          <Button compact label="Birth Details" onPress={() => router.push("/birth-details")} />
        </Card>
      ) : null}

      <BottomNav />
    </Screen>
  );
}
