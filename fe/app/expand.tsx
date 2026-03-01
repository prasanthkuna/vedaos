import { useRouter } from "expo-router";
import { Badge, Button, Card, Meta, Notice, SectionTitle } from "../src/ui/components";
import { Screen } from "../src/ui/screen";
import { useFlowStore } from "../src/state/flow";

export default function ExpandScreen() {
  const router = useRouter();
  const quickProofEligible = useFlowStore((s) => s.quickProofEligible);

  return (
    <Screen title="Expand to 15 Years" subtitle="Make expansion feel earned.">
      <Card>
        <Badge label="Gate check" />
        <SectionTitle>Readiness</SectionTitle>
        {quickProofEligible ? <Notice>Your validations shaped your pattern. Ready to expand.</Notice> : <Meta>You can still expand, but trust score may be low.</Meta>}
        <Button label="Open Full Story Feed" onPress={() => router.push("/story-feed")} />
      </Card>
    </Screen>
  );
}
