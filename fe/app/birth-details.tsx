import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { Badge, Button, Card, Input, Meta, Notice, SectionTitle } from "../src/ui/components";
import { Screen } from "../src/ui/screen";
import { useSessionStore } from "../src/state/session";
import { useFlowStore } from "../src/state/flow";
import { vedaApi } from "../src/api/veda";
import { readableError } from "../src/lib/errors";
import { useRequiredSession } from "../src/hooks/use-required-session";
import { BirthModePicker, CityPresetPicker, DatePickerField, TimePickerField } from "../src/ui/pickers";

type BirthMode = "exact_time" | "six_window_approx" | "nakshatra_only" | "unknown";

const toLocalDate = (d: Date) => d.toISOString().slice(0, 10);
const toLocalTime = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

export default function BirthDetailsScreen() {
  const router = useRouter();
  const token = useRequiredSession(false).token;
  const { user } = useUser();
  const setProfileId = useSessionStore((s) => s.setProfileId);
  const setPreferredName = useSessionStore((s) => s.setPreferredName);
  const setRisk = useFlowStore((s) => s.setRisk);
  const setRectificationRequired = useFlowStore((s) => s.setRectificationRequired);
  const setNextStep = useFlowStore((s) => s.setNextStep);

  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dob, setDob] = useState(new Date(1992, 9, 24));
  const [tob, setTob] = useState(new Date(1992, 9, 24, 0, 30, 0));
  const [mode, setMode] = useState<BirthMode>("exact_time");
  const [city, setCity] = useState("Gudivada");
  const [lat, setLat] = useState(16.435);
  const [lon, setLon] = useState(80.995);
  const [tzIana, setTzIana] = useState("Asia/Kolkata");
  const [nakshatraHint, setNakshatraHint] = useState("");

  const inferredName = useMemo(() => {
    const first = user?.firstName?.trim();
    const full = user?.fullName?.trim();
    return first || full || "Friend";
  }, [user?.firstName, user?.fullName]);

  const submit = async () => {
    if (submitting) return;
    if (!token) return setStatus("Sign in with Google to continue.");

    if (mode === "nakshatra_only" && !nakshatraHint.trim()) {
      setStatus("Please enter known nakshatra to continue.");
      return;
    }

    try {
      setSubmitting(true);
      setStatus("");
      setPreferredName(inferredName);

      const body = {
        dob: toLocalDate(dob),
        tobLocal: mode === "exact_time" ? toLocalTime(tob) : undefined,
        pobText: city,
        tzIana,
        lat,
        lon,
        birthTimeInputMode: mode,
        birthNakshatraHint: mode === "nakshatra_only" ? nakshatraHint.trim() : undefined,
        birthTimeCertainty: mode === "exact_time" ? "verified" : "uncertain",
        isGuestProfile: false,
      } as const;

      const profile = await vedaApi.createProfile(token, body);
      setProfileId(profile.profileId);

      const risk = await vedaApi.assessRisk(token, profile.profileId);
      setRisk(risk.riskLevel as "safe" | "medium" | "high");
      setRectificationRequired(Boolean(risk.rectificationRequired));
      setNextStep(risk.nextStep);

      router.push(risk.nextStep === "rectification_required" ? "/rectification" : "/atmakaraka");
    } catch (error) {
      setStatus(readableError(error, "birth_details_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen title="Birth Details" subtitle="Minimal inputs. Maximum precision.">
      <Card>
        <Badge label="Auto profile" tone="accent" />
        <SectionTitle>Hello, {inferredName}</SectionTitle>
        <Meta>We use your Google sign-in name now. You can rename this anytime in Profile settings.</Meta>
      </Card>

      <Card>
        <SectionTitle>Birth Inputs</SectionTitle>
        <DatePickerField value={dob} onChange={setDob} />
        <BirthModePicker value={mode} onChange={setMode} />
        {mode === "exact_time" ? <TimePickerField value={tob} onChange={setTob} /> : null}
        {mode === "nakshatra_only" ? (
          <Input value={nakshatraHint} onChangeText={setNakshatraHint} placeholder="Known Nakshatra (example: Revati)" />
        ) : null}
      </Card>

      <Card>
        <SectionTitle>Birth City</SectionTitle>
        <CityPresetPicker
          value={city}
          onChange={(label, nextLat, nextLon, nextTz) => {
            setCity(label);
            setLat(nextLat);
            setLon(nextLon);
            setTzIana(nextTz);
          }}
        />
        <Meta>
          Selected: {city} ({lat.toFixed(3)}, {lon.toFixed(3)})
        </Meta>
      </Card>

      <Card>
        {status ? <Notice tone="danger">{status}</Notice> : <Meta>Exact-time users skip mandatory rectification.</Meta>}
        <Button testID="birth-generate" label={submitting ? "Casting..." : "Cast My Chart"} onPress={submit} disabled={submitting} />
      </Card>
    </Screen>
  );
}
