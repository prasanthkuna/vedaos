import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Badge, Button, Card, Meta, Notice, Row, SectionTitle } from "../src/ui/components";
import { Screen } from "../src/ui/screen";
import { BottomNav } from "../src/ui/nav";
import { vedaApi } from "../src/api/veda";
import { isApiCode, readableError } from "../src/lib/errors";
import { isoWeekStartUtc } from "../src/lib/time";
import { useRequiredSession } from "../src/hooks/use-required-session";
import { useFlowStore } from "../src/state/flow";

const monthStartUtc = () => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  return start.toISOString();
};

export default function WeeklyScreen() {
  const router = useRouter();
  const { token, profileId } = useRequiredSession(true);
  const weekly = useFlowStore((s) => s.weekly);
  const setWeekly = useFlowStore((s) => s.setWeekly);
  const monthly = useFlowStore((s) => s.monthly);
  const setMonthly = useFlowStore((s) => s.setMonthly);
  const [view, setView] = useState<"week" | "month">("week");
  const [status, setStatus] = useState("");
  const [cityMissing, setCityMissing] = useState(false);

  const reload = async () => {
    if (!token || !profileId) return;
    setStatus("");
    setCityMissing(false);
    try {
      const [weekRes, monthRes] = await Promise.all([
        vedaApi.generateWeekly(token, { profileId, weekStartUtc: isoWeekStartUtc() }),
        vedaApi.generateMonthly(token, { profileId, monthStartUtc: monthStartUtc() }),
      ]);
      setWeekly(weekRes.weekly);
      setMonthly(monthRes.monthly);
    } catch (error) {
      if (isApiCode(error, "current_city_required")) {
        setCityMissing(true);
        return;
      }
      if (isApiCode(error, "pro_required")) {
        setStatus("Weekly/Month view requires Pro entitlement right now.");
        return;
      }
      setStatus(readableError(error, "weekly_failed"));
    }
  };

  useEffect(() => {
    if (!weekly || !monthly) void reload();
  }, [monthly, profileId, token, weekly]);

  const weekSummary = useMemo(() => weekly?.theme ?? "", [weekly]);

  return (
    <Screen title="This Week" subtitle="Action windows for week and month.">
      <Card>
        <Row>
          <Button compact label="Week" onPress={() => setView("week")} tone={view === "week" ? "primary" : "secondary"} />
          <Button compact label="Month" onPress={() => setView("month")} tone={view === "month" ? "primary" : "secondary"} />
          <Button compact label="Reload" onPress={() => void reload()} tone="secondary" />
        </Row>
      </Card>

      {view === "week" ? (
        <>
          <Card>
            <Badge label="Weekly" tone="accent" />
            <SectionTitle>Theme</SectionTitle>
            <Meta>{weekSummary || "Loading week..."}</Meta>
            {weekly?.upaya ? <Notice tone="success">{weekly.upaya.instruction}</Notice> : null}
          </Card>
          <Card>
            <SectionTitle>Support Windows</SectionTitle>
            {weekly?.supportWindows.slice(0, 4).map((w, idx) => (
              <Meta key={`ws-${idx}`}>{w.startUtc.slice(0, 10)}: {w.reason}</Meta>
            ))}
            <SectionTitle>Caution Windows</SectionTitle>
            {weekly?.frictionWindows.slice(0, 4).map((w, idx) => (
              <Meta key={`wf-${idx}`}>{w.startUtc.slice(0, 10)}: {w.reason}</Meta>
            ))}
          </Card>
        </>
      ) : (
        <>
          <Card>
            <Badge label="Monthly" tone="accent" />
            <SectionTitle>Month Theme</SectionTitle>
            <Meta>{monthly?.monthTheme ?? "Loading month..."}</Meta>
            {monthly?.monthlyUpaya ? <Notice tone="success">{monthly.monthlyUpaya.instruction}</Notice> : null}
          </Card>
          <Card>
            <SectionTitle>Best Dates</SectionTitle>
            <Meta>{monthly?.bestDates.join(", ") || "--"}</Meta>
            <SectionTitle>Caution Dates</SectionTitle>
            <Meta>{monthly?.cautionDates.join(", ") || "--"}</Meta>
          </Card>
        </>
      )}

      {cityMissing ? (
        <Card>
          <Notice tone="danger">Current city required for timing windows.</Notice>
          <Button label="Set Current City" onPress={() => router.push("/city-picker")} />
        </Card>
      ) : null}

      {status ? (
        <Card>
          <Notice tone="danger">{status}</Notice>
        </Card>
      ) : null}

      <BottomNav />
    </Screen>
  );
}
