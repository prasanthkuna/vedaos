import { useRouter } from "expo-router";
import { Badge, Button, Card, Meta, Notice, Row, SectionTitle } from "../src/ui/components";
import { Screen } from "../src/ui/screen";

export default function PaywallScreen() {
  const router = useRouter();
  return (
    <Screen title="Pro Access" subtitle="Billing rollout is deferred in this build.">
      <Card>
        <Badge label="Billing later" tone="danger" />
        <SectionTitle>Plans</SectionTitle>
        <Meta>Basic: timeline + validations + one guest profile.</Meta>
        <Meta>Pro: weekly card, 12-month forecast, deeper explanations.</Meta>
        <Meta>Family: expanded profile bundle.</Meta>
        <Notice>Purchase actions are disabled until billing integration goes live.</Notice>
        <Row>
          <Button label="Enable Coming Soon" onPress={() => {}} disabled />
          <Button label="Back to Story Feed" tone="secondary" onPress={() => router.push("/story-feed")} />
        </Row>
      </Card>
    </Screen>
  );
}
