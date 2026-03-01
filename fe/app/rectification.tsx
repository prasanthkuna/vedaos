import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Badge, Button, Card, Input, Meta, Notice, SectionTitle } from "../src/ui/components";
import { Screen } from "../src/ui/screen";
import { useFlowStore } from "../src/state/flow";
import { vedaApi } from "../src/api/veda";
import { readableError } from "../src/lib/errors";
import { useRequiredSession } from "../src/hooks/use-required-session";

export default function RectificationScreen() {
  const router = useRouter();
  const { token, profileId } = useRequiredSession(true);
  const setRectification = useFlowStore((s) => s.setRectification);
  const [status, setStatus] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [prompts, setPrompts] = useState<Array<{ promptId: string; text: string }>>([]);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        const r = await vedaApi.getRectificationPrompts(token, "en");
        setPrompts(r.prompts);
      } catch (error) {
        setStatus(readableError(error, "prompt_load_failed"));
      }
    };
    void load();
  }, [token]);

  const submit = async () => {
    if (!token || !profileId) return setStatus("Sign in and select profile first.");
    const payload = Object.entries(answers)
      .filter(([, value]) => value.trim().length > 0)
      .map(([promptId, value]) => ({ promptId, textValue: value }));
    if (payload.length < 3) return setStatus("Answer at least 3 anchors.");
    try {
      const result = await vedaApi.submitRectification(token, { profileId, answers: payload });
      setRectification(result);
      router.push("/atmakaraka");
    } catch (error) {
      setStatus(readableError(error, "rectification_failed"));
    }
  };

  return (
    <Screen title="Rectification (Free Baseline)" subtitle="Answer 3-5 anchors to lock a usable time window.">
      <Card>
        <Badge label="High-risk flow" tone="danger" />
        <SectionTitle>Anchors</SectionTitle>
        {prompts.map((p) => (
          <Input
            key={p.promptId}
            value={answers[p.promptId] ?? ""}
            onChangeText={(v) => setAnswers((s) => ({ ...s, [p.promptId]: v }))}
            placeholder={p.text}
          />
        ))}
        {status ? <Notice>{status}</Notice> : <Meta>Avoid exact dates if unsure. Approximate windows are fine.</Meta>}
        <Button label="Lock & Continue" onPress={submit} />
      </Card>
    </Screen>
  );
}
