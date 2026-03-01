import { useRouter } from "expo-router";
import { Badge, Button, Card, Meta, Notice, SectionTitle } from "../src/ui/components";
import { Screen } from "../src/ui/screen";
import { useFlowStore } from "../src/state/flow";

export default function RiskScreen() {
  const router = useRouter();
  const risk = useFlowStore((s) => s.risk);
  const nextStep = useFlowStore((s) => s.nextStep);
  const rectificationRequired = useFlowStore((s) => s.rectificationRequired);

  const subtitle =
    risk === "safe"
      ? "Stable for timing."
      : risk === "medium"
        ? "Small shifts may affect some periods."
        : "Small shifts can change major periods.";

  return (
    <Screen title="Birth-Time Reliability" subtitle="Truth badge before trust flow.">
      <Card>
        <SectionTitle>Risk Level</SectionTitle>
        {risk ? <Badge label={risk.toUpperCase()} tone={risk === "safe" ? "success" : risk === "high" ? "danger" : "accent"} /> : null}
        <Meta>{risk ? risk.toUpperCase() : "UNKNOWN"}</Meta>
        <Notice>
          {rectificationRequired
            ? "Birth-time mode needs refinement. Complete quick rectification first."
            : subtitle}
        </Notice>
        <Button
          testID="risk-continue"
          label={rectificationRequired ? "Fix Accuracy (Free)" : "Continue"}
          onPress={() => router.push(nextStep === "rectification_required" ? "/rectification" : "/atmakaraka")}
          disabled={!risk}
        />
      </Card>
    </Screen>
  );
}
