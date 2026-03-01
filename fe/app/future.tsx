import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Badge, Button, Card, Meta, Notice, Row, SectionTitle } from "../src/ui/components";
import { Screen } from "../src/ui/screen";
import type { ForecastDTO } from "../src/api/types";
import { vedaApi } from "../src/api/veda";
import { isApiCode, readableError } from "../src/lib/errors";
import { useRequiredSession } from "../src/hooks/use-required-session";

export default function FutureScreen() {
  const router = useRouter();
  const { token, profileId } = useRequiredSession(true);
  const [forecast, setForecast] = useState<ForecastDTO | null>(null);
  const [status, setStatus] = useState("");
  const [proRequired, setProRequired] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!token || !profileId) return;
    setLoading(true);
    setStatus("");
    setProRequired(false);
    try {
      const response = await vedaApi.generateForecast(token, profileId);
      setForecast(response.forecast);
    } catch (error) {
      if (isApiCode(error, "pro_required")) {
        setProRequired(true);
        return;
      }
      setStatus(readableError(error, "forecast_failed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token, profileId]);

  if (proRequired) {
    return (
      <Screen title="Future 12 Months" subtitle="This feature is in Pro access.">
        <Card>
          <Badge label="Pro required" tone="danger" />
          <Button label="Open Paywall" onPress={() => router.push("/paywall")} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen title="Future 12 Months" subtitle="Forecast blocks based on validated patterns.">
      <Card>
        <SectionTitle>Outlook</SectionTitle>
        {forecast ? (
          <>
            <Meta>{forecast.summary}</Meta>
            {forecast.windows.map((window) => (
              <Meta key={window.period}>
                {window.period}: {window.theme}
              </Meta>
            ))}
          </>
        ) : (
          <Meta>{loading ? "Loading forecast..." : "No forecast available yet."}</Meta>
        )}
        {status ? <Notice tone="danger">{status}</Notice> : null}
        <Row>
          <Button compact label="Retry" onPress={() => void load()} />
          <Button compact label="Story Feed" onPress={() => router.push("/story-feed")} />
          <Button compact label="Weekly Card" onPress={() => router.push("/weekly")} />
        </Row>
      </Card>
    </Screen>
  );
}
