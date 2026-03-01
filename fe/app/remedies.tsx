import { useMemo } from "react";
import { useRouter } from "expo-router";
import { Button, Card, Meta, Notice, SectionTitle } from "../src/ui/components";
import { Screen } from "../src/ui/screen";
import { BottomNav } from "../src/ui/nav";
import { useFlowStore } from "../src/state/flow";

export default function RemediesScreen() {
  const router = useRouter();
  const weekly = useFlowStore((s) => s.weekly);
  const monthly = useFlowStore((s) => s.monthly);

  const daily = useMemo(() => weekly?.upaya?.instruction ?? "Open Week to generate upaya.", [weekly?.upaya?.instruction]);
  const monthlyLine = useMemo(() => monthly?.monthlyUpaya?.instruction ?? "Open Month to generate monthly upaya.", [monthly?.monthlyUpaya?.instruction]);

  return (
    <Screen title="Remedies" subtitle="Simple sattvic actions you can actually do.">
      <Card>
        <SectionTitle>Daily Protocol</SectionTitle>
        <Notice tone="success">{daily}</Notice>
      </Card>
      <Card>
        <SectionTitle>Monthly Protocol</SectionTitle>
        <Notice tone="success">{monthlyLine}</Notice>
      </Card>
      <Card>
        <SectionTitle>How to Use</SectionTitle>
        <Meta>1) Follow during support windows.</Meta>
        <Meta>2) Avoid forced outcomes on caution dates.</Meta>
        <Meta>3) Keep practice consistent for 4 weeks.</Meta>
        <Button compact label="Go to Week/Month" onPress={() => router.push("/weekly")} />
      </Card>
      <BottomNav />
    </Screen>
  );
}
