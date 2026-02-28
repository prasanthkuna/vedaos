import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { useTranslation } from "react-i18next";
import { i18n } from "../src/i18n";
import { vedaApi } from "../src/api/veda";
import type { ScoreDTO, StoryFeed } from "../src/api/types";
import { useSessionStore } from "../src/state/session";

const getWeekStartUtc = () => {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - (day === 0 ? 6 : day - 1));
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
};

const ActionButton = ({ label, onPress, compact }: { label: string; onPress: () => void; compact?: boolean }) => (
  <Pressable onPress={onPress} style={[styles.button, compact && styles.buttonCompact]}>
    <Text style={styles.buttonText}>{label}</Text>
  </Pressable>
);

export default function HomeScreen() {
  const { t } = useTranslation();
  const { isSignedIn, getToken } = useAuth();
  const queryClient = useQueryClient();
  const introFade = useRef(new Animated.Value(0)).current;
  const profileId = useSessionStore((s) => s.profileId);
  const runId = useSessionStore((s) => s.runId);
  const setProfileId = useSessionStore((s) => s.setProfileId);
  const setRunId = useSessionStore((s) => s.setRunId);
  const [status, setStatus] = useState("Sign in with Clerk to start.");
  const [riskLevel, setRiskLevel] = useState<string | null>(null);
  const [atmakaraka, setAtmakaraka] = useState<string | null>(null);
  const [story, setStory] = useState<StoryFeed | null>(null);
  const [scores, setScores] = useState<ScoreDTO | null>(null);
  const [weeklySummary, setWeeklySummary] = useState<string | null>(null);
  const [forecastSummary, setForecastSummary] = useState<string | null>(null);
  const [form, setForm] = useState({ displayName: "", dob: "", tobLocal: "", pobText: "", tzIana: "Asia/Kolkata", birthTimeCertainty: "confident" as const });
  const [city, setCity] = useState({ cityText: "", lat: "", lon: "" });

  useEffect(() => {
    Animated.timing(introFade, { toValue: 1, duration: 550, useNativeDriver: true }).start();
    if (isSignedIn) setStatus("Clerk session active.");
  }, [introFade, isSignedIn]);

  const withToken = async <T,>(fn: (token: string) => Promise<T>) => {
    if (!isSignedIn) throw new Error("Clerk session missing.");
    const token = await getToken();
    if (!token) throw new Error("Unable to fetch Clerk token.");
    return fn(token);
  };

  const createProfile = useMutation({
    mutationFn: () =>
      withToken((token) => vedaApi.createProfile(token, { ...form, isGuestProfile: false }).then((r) => {
        setProfileId(r.profileId);
        setStatus(`Profile created: ${r.profileId}`);
      })),
    onError: (e) => setStatus(e instanceof Error ? e.message : "create_failed"),
  });

  const risk = useMutation({
    mutationFn: () =>
      withToken((token) => vedaApi.assessRisk(token, profileId).then((r) => {
        setRiskLevel(r.riskLevel);
        setStatus(`Risk: ${r.riskLevel}`);
      })),
    onError: (e) => setStatus(e instanceof Error ? e.message : "risk_failed"),
  });

  const atma = useMutation({
    mutationFn: () =>
      withToken((token) => vedaApi.getAtmakaraka(token, profileId).then((r) => {
        setAtmakaraka(r.planet);
        setStatus(`Atmakaraka: ${r.planet}`);
      })),
    onError: (e) => setStatus(e instanceof Error ? e.message : "atmakaraka_failed"),
  });

  const storyMutation = useMutation({
    mutationFn: (mode: "quick5y" | "full15y") =>
      withToken((token) => vedaApi.generateStory(token, profileId, mode).then((r) => {
        setRunId(r.runId);
        setStory(r.feed);
        setStatus(`Story generated: ${mode}`);
      })),
    onError: (e) => setStatus(e instanceof Error ? e.message : "story_failed"),
  });

  const validate = useMutation({
    mutationFn: (input: { claimId: string; label: "true" | "somewhat" | "false" }) =>
      withToken((token) => vedaApi.validateClaim(token, { profileId, runId, ...input }).then(setScores)),
    onError: (e) => setStatus(e instanceof Error ? e.message : "validation_failed"),
  });

  const refreshScores = useMutation({
    mutationFn: () =>
      withToken((token) => vedaApi.getScores(token, profileId).then(async (r) => {
        setScores(r);
        await queryClient.invalidateQueries();
      })),
    onError: (e) => setStatus(e instanceof Error ? e.message : "scores_failed"),
  });

  const weekly = useMutation({
    mutationFn: () =>
      withToken(async (token) => {
        await vedaApi.updateCurrentCity(token, { profileId, cityText: city.cityText, lat: Number(city.lat), lon: Number(city.lon) });
        const r = await vedaApi.generateWeekly(token, { profileId, weekStartUtc: getWeekStartUtc() });
        setWeeklySummary(`${r.weekly.theme} | ${r.weekly.frictionWindows[0]?.reason ?? "No friction markers."}`);
      }),
    onError: (e) => setStatus(e instanceof Error ? e.message : "weekly_failed"),
  });

  const forecast = useMutation({
    mutationFn: () => withToken((token) => vedaApi.generateForecast(token, profileId).then((r) => setForecastSummary(r.forecast.summary))),
    onError: (e) => setStatus(e instanceof Error ? e.message : "forecast_failed"),
  });

  const consent = useMutation({
    mutationFn: () =>
      withToken((token) => vedaApi.recordConsent(token, { purposeCode: "astrology_processing", policyVersion: "2026-02-28" }).then(() => setStatus("Consent recorded."))),
    onError: (e) => setStatus(e instanceof Error ? e.message : "consent_failed"),
  });

  const busy = useMemo(
    () => [createProfile, risk, atma, storyMutation, validate, refreshScores, weekly, forecast, consent].some((m) => m.isPending),
    [createProfile, risk, atma, storyMutation, validate, refreshScores, weekly, forecast, consent],
  );

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.bgOrbTop} />
        <View style={styles.bgOrbBottom} />
        <Animated.View style={[styles.hero, { opacity: introFade }]}>
          <Text style={styles.heroBadge}>{t("heroBadge")}</Text>
          <Text style={styles.heroTitle}>{t("heroTitle")}</Text>
          <Text style={styles.heroText}>{t("heroText")}</Text>
          <View style={styles.langRow}>
            <ActionButton compact label="EN" onPress={() => void i18n.changeLanguage("en")} />
            <ActionButton compact label="HI" onPress={() => void i18n.changeLanguage("hi")} />
            <ActionButton compact label="TE" onPress={() => void i18n.changeLanguage("te")} />
          </View>
        </Animated.View>

        <View style={styles.panel}>
          <Text style={styles.label}>Auth</Text>
          <Text style={styles.status}>{isSignedIn ? "Signed in with Clerk." : "Not signed in. Complete Clerk sign-in first."}</Text>
          <Text style={styles.status}>{status}</Text>
          {busy ? <View style={styles.busyRow}><ActivityIndicator color="#c48a2f" /><Text style={styles.busyText}>Running request...</Text></View> : null}
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>{t("onboarding")}</Text>
          <TextInput style={styles.input} placeholder="Display name" placeholderTextColor="#96897d" value={form.displayName} onChangeText={(v) => setForm((p) => ({ ...p, displayName: v }))} />
          <TextInput style={styles.input} placeholder="DOB YYYY-MM-DD" placeholderTextColor="#96897d" value={form.dob} onChangeText={(v) => setForm((p) => ({ ...p, dob: v }))} />
          <TextInput style={styles.input} placeholder="TOB HH:mm" placeholderTextColor="#96897d" value={form.tobLocal} onChangeText={(v) => setForm((p) => ({ ...p, tobLocal: v }))} />
          <TextInput style={styles.input} placeholder="Birth place" placeholderTextColor="#96897d" value={form.pobText} onChangeText={(v) => setForm((p) => ({ ...p, pobText: v }))} />
          <ActionButton label={t("createProfile")} onPress={() => createProfile.mutate()} />
          <Text style={styles.meta}>profileId: {profileId || "-"}</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>{t("engine")}</Text>
          <View style={styles.row}>
            <ActionButton compact label={t("assessRisk")} onPress={() => risk.mutate()} />
            <ActionButton compact label={t("atmakaraka")} onPress={() => atma.mutate()} />
          </View>
          <View style={styles.row}>
            <ActionButton compact label={t("quick5")} onPress={() => storyMutation.mutate("quick5y")} />
            <ActionButton compact label={t("full15")} onPress={() => storyMutation.mutate("full15y")} />
          </View>
          <TextInput style={styles.input} placeholder="Current city" placeholderTextColor="#96897d" value={city.cityText} onChangeText={(v) => setCity((p) => ({ ...p, cityText: v }))} />
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.inputHalf]} placeholder="Latitude" placeholderTextColor="#96897d" value={city.lat} onChangeText={(v) => setCity((p) => ({ ...p, lat: v }))} />
            <TextInput style={[styles.input, styles.inputHalf]} placeholder="Longitude" placeholderTextColor="#96897d" value={city.lon} onChangeText={(v) => setCity((p) => ({ ...p, lon: v }))} />
          </View>
          <View style={styles.row}>
            <ActionButton compact label={t("weekly")} onPress={() => weekly.mutate()} />
            <ActionButton compact label={t("forecast")} onPress={() => forecast.mutate()} />
          </View>
          <Text style={styles.meta}>risk: {riskLevel || "-"} | atmakaraka: {atmakaraka || "-"}</Text>
          <Text style={styles.meta}>runId: {runId || "-"}</Text>
          {weeklySummary ? <Text style={styles.subtle}>{weeklySummary}</Text> : null}
          {forecastSummary ? <Text style={styles.subtle}>{forecastSummary}</Text> : null}
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>{t("scores")}</Text>
          <View style={styles.row}>
            <ActionButton compact label={t("refreshScores")} onPress={() => refreshScores.mutate()} />
            <ActionButton compact label={t("recordConsent")} onPress={() => consent.mutate()} />
          </View>
          <Text style={styles.meta}>PSA {scores?.psa ?? 0} | PCS {scores?.pcs ?? 0} | Validated {scores?.validatedCount ?? 0}</Text>
          <Text style={styles.meta}>Coverage {scores?.yearCoverage ?? 0} | Diversity {scores?.diversityScore ?? 0}</Text>
        </View>

        {story ? (
          <View style={styles.panel}>
            <Text style={styles.sectionTitle}>Story Feed ({story.mode})</Text>
            {story.years.slice(0, 4).map((yearBlock) => (
              <View key={yearBlock.year} style={styles.yearCard}>
                <Text style={styles.yearText}>{yearBlock.year}</Text>
                {yearBlock.points.slice(0, 2).map((point) => (
                  <View key={point.claimId} style={styles.claim}>
                    <Text style={styles.claimText}>{point.text}</Text>
                    <Text style={styles.claimMeta}>{point.weightClass} | confidence {point.confidenceScore}</Text>
                    <View style={styles.row}>
                      <ActionButton compact label="True" onPress={() => validate.mutate({ claimId: point.claimId, label: "true" })} />
                      <ActionButton compact label="Somewhat" onPress={() => validate.mutate({ claimId: point.claimId, label: "somewhat" })} />
                      <ActionButton compact label="False" onPress={() => validate.mutate({ claimId: point.claimId, label: "false" })} />
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#18120f" },
  scroll: { padding: 18, paddingBottom: 34, gap: 14 },
  bgOrbTop: { position: "absolute", right: -90, top: -90, width: 220, height: 220, borderRadius: 999, backgroundColor: "#4b2f18", opacity: 0.28 },
  bgOrbBottom: { position: "absolute", left: -85, top: 520, width: 210, height: 210, borderRadius: 999, backgroundColor: "#2a5540", opacity: 0.2 },
  hero: { borderWidth: 1, borderColor: "#8d6a3e", borderRadius: 20, padding: 18, backgroundColor: "#221914", gap: 8 },
  heroBadge: { color: "#d6ab6a", fontFamily: "serif", letterSpacing: 1.3, fontSize: 11 },
  heroTitle: { color: "#f7e6cc", fontFamily: "serif", fontSize: 30, lineHeight: 34 },
  heroText: { color: "#d6c3aa", fontSize: 14 },
  langRow: { flexDirection: "row", gap: 8 },
  panel: { borderWidth: 1, borderColor: "#705233", borderRadius: 16, padding: 14, backgroundColor: "#201813", gap: 10 },
  sectionTitle: { color: "#f6d39f", fontFamily: "serif", fontSize: 19 },
  label: { color: "#d7c4a2", fontSize: 13 },
  input: { borderWidth: 1, borderColor: "#7e603f", borderRadius: 10, backgroundColor: "#19120f", color: "#f4e8d7", paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, flex: 1 },
  inputHalf: { minWidth: 120 },
  status: { color: "#ccb08d", fontSize: 12 },
  busyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  busyText: { color: "#d6b17f", fontSize: 12 },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  button: { borderWidth: 1, borderColor: "#c48a2f", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: "#3a2614" },
  buttonCompact: { paddingHorizontal: 10, paddingVertical: 8 },
  buttonText: { color: "#ffd599", fontSize: 12, letterSpacing: 0.3 },
  meta: { color: "#dfc8a9", fontSize: 12 },
  subtle: { color: "#bda281", fontSize: 12 },
  yearCard: { borderWidth: 1, borderColor: "#6f5438", borderRadius: 12, padding: 10, gap: 8 },
  yearText: { color: "#f2cf98", fontFamily: "serif", fontSize: 18 },
  claim: { gap: 6, borderTopWidth: 1, borderTopColor: "#4b3927", paddingTop: 8 },
  claimText: { color: "#f2e5d1", fontSize: 14, lineHeight: 18 },
  claimMeta: { color: "#bb9a70", fontSize: 11 },
});
