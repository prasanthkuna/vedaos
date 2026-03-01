import { useState } from "react";
import { useRouter } from "expo-router";
import { Badge, Button, Card, Meta, Notice, SectionTitle } from "../src/ui/components";
import { Screen } from "../src/ui/screen";
import { vedaApi } from "../src/api/veda";
import { readableError } from "../src/lib/errors";
import { useRequiredSession } from "../src/hooks/use-required-session";
import { CityPresetPicker } from "../src/ui/pickers";

export default function CityPickerScreen() {
  const router = useRouter();
  const { token, profileId } = useRequiredSession(true);
  const [cityText, setCityText] = useState("Gudivada");
  const [lat, setLat] = useState(16.435);
  const [lon, setLon] = useState(80.995);
  const [status, setStatus] = useState("");

  const submit = async () => {
    if (!token || !profileId) return setStatus("Sign in and select profile first.");
    try {
      await vedaApi.updateCurrentCity(token, { profileId, cityText, lat, lon });
      router.replace("/weekly");
    } catch (error) {
      setStatus(readableError(error, "city_update_failed"));
    }
  };

  return (
    <Screen title="Current City" subtitle="Used for weekly and monthly timing windows.">
      <Card>
        <Badge label="Location" tone="accent" />
        <SectionTitle>Select City</SectionTitle>
        <CityPresetPicker
          value={cityText}
          onChange={(label, nextLat, nextLon) => {
            setCityText(label);
            setLat(nextLat);
            setLon(nextLon);
          }}
        />
        <Meta>
          Selected: {cityText} ({lat.toFixed(3)}, {lon.toFixed(3)})
        </Meta>
        {status ? <Notice tone="danger">{status}</Notice> : null}
        <Button label="Save City" onPress={submit} />
      </Card>
    </Screen>
  );
}
