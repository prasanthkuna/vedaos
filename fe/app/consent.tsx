import { useState } from "react";
import { useRouter } from "expo-router";
import { Badge, Button, Card, Meta, Notice, SectionTitle, Toggle } from "../src/ui/components";
import { Screen } from "../src/ui/screen";
import { useFlowStore } from "../src/state/flow";
import { useSessionStore } from "../src/state/session";
import { vedaApi } from "../src/api/veda";
import { readableError } from "../src/lib/errors";
import { useRequiredSession } from "../src/hooks/use-required-session";

export default function ConsentScreen() {
  const router = useRouter();
  const token = useRequiredSession(false).token;
  const consent = useFlowStore((s) => s.consent);
  const patchConsent = useFlowStore((s) => s.patchConsent);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onContinue = async () => {
    if (submitting) return;
    if (!consent.age18) {
      setStatus("Age gate required.");
      return;
    }
    if (!token) {
      setStatus("Sign in with Google to continue.");
      return;
    }
    if (!consent.generate) {
      setStatus("Chart generation consent is required to proceed.");
      return;
    }

    try {
      setSubmitting(true);
      if (consent.generate) {
        await vedaApi.recordConsent(token, { purposeCode: "chart_generation", policyVersion: "2026-03-01" });
      }
      if (consent.personalization) {
        await vedaApi.recordConsent(token, { purposeCode: "personalization", policyVersion: "2026-03-01" });
      }
      if (consent.analytics) {
        await vedaApi.recordConsent(token, { purposeCode: "analytics", policyVersion: "2026-03-01" });
      }
      router.push("/birth-details");
    } catch (error) {
      setStatus(readableError(error, "consent_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen title="Age Gate + Consent" subtitle="India-first compliance by design.">
      <Card>
        <Badge label="Required" tone="accent" />
        <SectionTitle>Eligibility</SectionTitle>
        <Toggle testID="consent-age18" label="I am 18+" value={consent.age18} onToggle={() => patchConsent({ age18: !consent.age18 })} />
      </Card>
      <Card>
        <SectionTitle>Consent Toggles</SectionTitle>
        <Toggle label="Generate chart + story" value={consent.generate} onToggle={() => patchConsent({ generate: !consent.generate })} />
        <Toggle
          label="Use validations for personalization"
          value={consent.personalization}
          onToggle={() => patchConsent({ personalization: !consent.personalization })}
        />
        <Toggle label="Analytics (optional)" value={consent.analytics} onToggle={() => patchConsent({ analytics: !consent.analytics })} />
        {status ? <Notice>{status}</Notice> : <Meta>Required: 18+ and at least chart-generation consent.</Meta>}
        <Button testID="consent-continue" label={submitting ? "Saving..." : "Continue"} onPress={onContinue} disabled={submitting} />
      </Card>
    </Screen>
  );
}
