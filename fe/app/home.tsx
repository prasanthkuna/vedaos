import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Badge, Button, Card, Meta, Notice, SectionTitle } from "../src/ui/components";
import { Screen } from "../src/ui/screen";
import { BottomNav } from "../src/ui/nav";
import { useFlowStore } from "../src/state/flow";
import { vedaApi } from "../src/api/veda";
import { readableError } from "../src/lib/errors";
import { useRequiredSession } from "../src/hooks/use-required-session";
import { useSessionStore } from "../src/state/session";

const monthStartUtc = () => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  return start.toISOString();
};

export default function HomeScreen() {
  const router = useRouter();
  const { token, profileId } = useRequiredSession(true);
  const preferredName = useSessionStore((s) => s.preferredName);
  const homeV2 = useFlowStore((s) => s.homeV2);
  const setHomeV2 = useFlowStore((s) => s.setHomeV2);
  const monthly = useFlowStore((s) => s.monthly);
  const setMonthly = useFlowStore((s) => s.setMonthly);
  const [status, setStatus] = useState("");

  const greeting = useMemo(() => preferredName || "Kuna", [preferredName]);

  useEffect(() => {
    const load = async () => {
      if (!token || !profileId) return;
      try {
        const [home, month] = await Promise.all([
          vedaApi.getHomeV2(token, profileId),
          vedaApi.generateMonthly(token, { profileId, monthStartUtc: monthStartUtc() }),
        ]);
        setHomeV2(home);
        setMonthly(month.monthly);
      } catch (error) {
        setStatus(readableError(error, "home_load_failed"));
      }
    };
    if (!homeV2) void load();
  }, [homeV2, profileId, setHomeV2, setMonthly, token]);

  return (
    <Screen title={`Namaskaram, ${greeting}`} subtitle="Your daily Jyotish briefing.">
      <Card>
        <Badge label="Today" tone="accent" />
        <SectionTitle>Cosmic Snapshot</SectionTitle>
        <Meta>Rashi: {homeV2?.today.cosmicSnapshot.rashi ?? "--"}</Meta>
        <Meta>Nakshatra: {homeV2?.today.cosmicSnapshot.nakshatra ?? "--"}</Meta>
        <Meta>Active phase: {homeV2?.today.cosmicSnapshot.activePhase ?? "--"}</Meta>
      </Card>

      <Card>
        <SectionTitle>Now Active Phase</SectionTitle>
        <Meta>
          {homeV2?.today.nowActivePhase.md ?? "--"} / {homeV2?.today.nowActivePhase.ad ?? "--"} / {homeV2?.today.nowActivePhase.pd ?? "--"}
        </Meta>
        <Meta>
          {homeV2?.today.nowActivePhase.startUtc.slice(0, 10) ?? "--"} {"->"} {homeV2?.today.nowActivePhase.endUtc.slice(0, 10) ?? "--"}
        </Meta>
      </Card>

      <Card>
        <SectionTitle>Today's Windows</SectionTitle>
        {homeV2?.today.windows.support.slice(0, 2).map((item, idx) => (
          <Meta key={`sp-${idx}`}>Support: {item.reason}</Meta>
        ))}
        {homeV2?.today.windows.caution.slice(0, 2).map((item, idx) => (
          <Meta key={`ct-${idx}`}>Caution: {item.reason}</Meta>
        ))}
      </Card>

      <Card>
        <SectionTitle>Today's Upaya</SectionTitle>
        <Notice tone="success">{homeV2?.today.upaya.instruction ?? "--"}</Notice>
      </Card>

      <Card>
        <SectionTitle>This Month Preview</SectionTitle>
        <Meta>{monthly?.monthTheme ?? "Loading month context..."}</Meta>
        {monthly?.phaseShifts.slice(0, 1).map((shift) => (
          <Meta key={shift.startsAtUtc}>Upcoming shift: {shift.phase} ({shift.startsAtUtc.slice(0, 10)})</Meta>
        ))}
        <Button compact label="Open Week / Month" onPress={() => router.push("/weekly")} />
      </Card>

      {status ? (
        <Card>
          <Notice tone="danger">{status}</Notice>
        </Card>
      ) : null}

      <BottomNav />
    </Screen>
  );
}
