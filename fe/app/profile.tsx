import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-expo";
import { Button, Card, Input, Meta, Notice, Row, SectionTitle } from "../src/ui/components";
import { Screen } from "../src/ui/screen";
import { BottomNav } from "../src/ui/nav";
import { useRequiredSession } from "../src/hooks/use-required-session";
import { useSessionStore } from "../src/state/session";
import { vedaApi } from "../src/api/veda";
import { readableError } from "../src/lib/errors";

export default function ProfileScreen() {
  const { token, profileId } = useRequiredSession(true);
  const { user } = useUser();
  const preferredName = useSessionStore((s) => s.preferredName);
  const setPreferredName = useSessionStore((s) => s.setPreferredName);
  const [nameInput, setNameInput] = useState(preferredName);
  const [status, setStatus] = useState("");
  const [consentCount, setConsentCount] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    void vedaApi
      .getConsentStatus(token)
      .then((res) => setConsentCount(res.consentCount))
      .catch((err) => setStatus(readableError(err, "consent_status_failed")));
  }, [token]);

  return (
    <Screen title="Profile" subtitle="Preferences and controls.">
      <Card>
        <SectionTitle>What should we call you?</SectionTitle>
        <Meta>Google name: {user?.firstName || user?.fullName || "Not available"}</Meta>
        <Input value={nameInput} onChangeText={setNameInput} placeholder="Preferred name" />
        <Button
          compact
          label="Save Name"
          onPress={() => {
            setPreferredName(nameInput.trim());
            setStatus("Preferred name saved.");
          }}
        />
      </Card>

      <Card>
        <SectionTitle>Language</SectionTitle>
        <Row>
          <Button compact label="English" onPress={() => token && profileId && void vedaApi.updateLanguage(token, { profileId, languageCode: "en", languageMode: "manual" })} />
          <Button compact label="Telugu" onPress={() => token && profileId && void vedaApi.updateLanguage(token, { profileId, languageCode: "te", languageMode: "manual" })} />
        </Row>
      </Card>

      <Card>
        <SectionTitle>Calendar Mode</SectionTitle>
        <Row>
          <Button compact label="Civil" onPress={() => token && profileId && void vedaApi.updateCalendarMode(token, { profileId, calendarMode: "civil" })} />
          <Button compact label="Vedic" onPress={() => token && profileId && void vedaApi.updateCalendarMode(token, { profileId, calendarMode: "vedic_sunrise" })} />
        </Row>
      </Card>

      <Card>
        <SectionTitle>Consent and Privacy</SectionTitle>
        <Meta>Consent records: {consentCount ?? "--"}</Meta>
        <Button
          tone="danger"
          label="Request Deletion"
          onPress={() => token && void vedaApi.requestDeletion(token, "requested_from_profile")}
        />
      </Card>

      {status ? (
        <Card>
          <Notice>{status}</Notice>
        </Card>
      ) : null}

      <BottomNav />
    </Screen>
  );
}
