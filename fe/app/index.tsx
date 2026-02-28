import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { i18n } from "../src/i18n";
import { vedaApi } from "../src/api/veda";
import type { ScoreDTO, StoryFeed } from "../src/api/types";
import { useSessionStore } from "../src/state/session";

const getWeekStartUtc = () => {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
};

const ActionButton = (props: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  compact?: boolean;
}) => (
  <Pressable
    disabled={props.disabled}
    onPress={props.onPress}
    style={[styles.button, props.compact && styles.buttonCompact, props.disabled && styles.buttonDisabled]}
  >
    <Text style={styles.buttonText}>{props.label}</Text>
  </Pressable>
);

const yearNow = new Date().getFullYear();

export default function HomeScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const introFade = useRef(new Animated.Value(0)).current;

  const token = useSessionStore((s) => s.token);
  const profileId = useSessionStore((s) => s.profileId);
  const runId = useSessionStore((s) => s.runId);
  const setToken = useSessionStore((s) => s.setToken);
  const setProfileId = useSessionStore((s) => s.setProfileId);
  const setRunId = useSessionStore((s) => s.setRunId);

  const [status, setStatus] = useState("Ready for live mobile testing.");
  const [riskLevel, setRiskLevel] = useState<string | null>(null);
  const [atmakaraka, setAtmakaraka] = useState<string | null>(null);
  const [story, setStory] = useState<StoryFeed | null>(null);
  const [scores, setScores] = useState<ScoreDTO | null>(null);
  const [weeklySummary, setWeeklySummary] = useState<string | null>(null);
  const [forecastSummary, setForecastSummary] = useState<string | null>(null);
  const [form, setForm] = useState({
    displayName: "Prashanth",
    dob: "1994-05-16",
    tobLocal: "10:20",
    pobText: "Hyderabad, Telangana, India",
    tzIana: "Asia/Kolkata",
    birthTimeCertainty: "confident" as const,
  });

  useEffect(() => {
    Animated.timing(introFade, {
      toValue: 1,
      duration: 550,
      useNativeDriver: true,
    }).start();
  }, [introFade]);

  const mutateGuard = <T,>(mutation: (payload: T) => Promise<void>, payload: T) => {
    if (!token.trim()) {
      setStatus("Add Clerk Bearer token.");
      return;
    }
    void mutation(payload);
  };

  const createProfileMutation = useMutation({
    mutationFn: async () => {
      const response = await vedaApi.createProfile(token, { ...form, isGuestProfile: false });
      setProfileId(response.profileId);
      setStatus(`Profile created: ${response.profileId}`);
    },
  });

  const riskMutation = useMutation({
    mutationFn: async () => {
      if (!profileId) throw new Error("Create profile first.");
      const response = await vedaApi.assessRisk(token, profileId);
      setRiskLevel(response.riskLevel);
      setStatus(`Risk: ${response.riskLevel}`);
    },
    onError: (error) => setStatus(error instanceof Error ? error.message : "risk_failed"),
  });

  const atmakarakaMutation = useMutation({
    mutationFn: async () => {
      if (!profileId) throw new Error("Create profile first.");
      const response = await vedaApi.getAtmakaraka(token, profileId);
      setAtmakaraka(response.planet);
      setStatus(`Atmakaraka: ${response.planet}`);
    },
    onError: (error) => setStatus(error instanceof Error ? error.message : "atmakaraka_failed"),
  });

  const storyMutation = useMutation({
    mutationFn: async (mode: "quick5y" | "full15y") => {
      if (!profileId) throw new Error("Create profile first.");
      const response = await vedaApi.generateStory(token, profileId, mode);
      setRunId(response.runId);
      setStory(response.feed);
      setStatus(`Story generated: ${mode}`);
    },
    onError: (error) => setStatus(error instanceof Error ? error.message : "story_failed"),
  });

  const validateMutation = useMutation({
    mutationFn: async (input: { claimId: string; label: "true" | "somewhat" | "false" }) => {
      if (!profileId || !runId) throw new Error("Generate story first.");
      const response = await vedaApi.validateClaim(token, {
        profileId,
        runId,
        claimId: input.claimId,
        label: input.label,
      });
      setScores(response);
      setStatus(`Validation saved: ${input.label}`);
    },
    onError: (error) => setStatus(error instanceof Error ? error.message : "validation_failed"),
  });

  const refreshScoresMutation = useMutation({
    mutationFn: async () => {
      if (!profileId) throw new Error("Create profile first.");
      const response = await vedaApi.getScores(token, profileId);
      setScores(response);
      setStatus("Scores refreshed.");
      await queryClient.invalidateQueries();
    },
    onError: (error) => setStatus(error instanceof Error ? error.message : "scores_failed"),
  });

  const weeklyMutation = useMutation({
    mutationFn: async () => {
      if (!profileId) throw new Error("Create profile first.");
      await vedaApi.updateCurrentCity(token, { profileId, cityText: "Hyderabad", lat: 17.385, lon: 78.4867 });
      const response = await vedaApi.generateWeekly(token, {
        profileId,
        weekStartUtc: getWeekStartUtc(),
      });
      const friction = response.weekly.frictionWindows[0]?.reason ?? "No friction markers.";
      setWeeklySummary(`${response.weekly.theme} | ${friction}`);
      setStatus("Weekly card generated.");
    },
    onError: (error) => setStatus(error instanceof Error ? error.message : "weekly_failed"),
  });

  const forecastMutation = useMutation({
    mutationFn: async () => {
      if (!profileId) throw new Error("Create profile first.");
      const response = await vedaApi.generateForecast(token, profileId);
      setForecastSummary(response.forecast.summary);
      setStatus("12M forecast generated.");
    },
    onError: (error) => setStatus(error instanceof Error ? error.message : "forecast_failed"),
  });

  const consentMutation = useMutation({
    mutationFn: async () => {
      await vedaApi.recordConsent(token, {
        purposeCode: "astrology_processing",
        policyVersion: "2026-02-28",
      });
      setStatus("Consent recorded.");
    },
    onError: (error) => setStatus(error instanceof Error ? error.message : "consent_failed"),
  });

  const busy = useMemo(
    () =>
      createProfileMutation.isPending ||
      riskMutation.isPending ||
      atmakarakaMutation.isPending ||
      storyMutation.isPending ||
      validateMutation.isPending ||
      refreshScoresMutation.isPending ||
      weeklyMutation.isPending ||
      forecastMutation.isPending ||
      consentMutation.isPending,
    [
      createProfileMutation.isPending,
      riskMutation.isPending,
      atmakarakaMutation.isPending,
      storyMutation.isPending,
      validateMutation.isPending,
      refreshScoresMutation.isPending,
      weeklyMutation.isPending,
      forecastMutation.isPending,
      consentMutation.isPending,
    ],
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
          <Text style={styles.label}>{t("tokenLabel")}</Text>
          <TextInput
            value={token}
            onChangeText={setToken}
            placeholder="Paste session JWT"
            placeholderTextColor="#96897d"
            style={styles.input}
            autoCapitalize="none"
          />
          <Text style={styles.status}>{status}</Text>
          {busy ? (
            <View style={styles.busyRow}>
              <ActivityIndicator color="#c48a2f" />
              <Text style={styles.busyText}>Running request...</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>{t("onboarding")}</Text>
          <TextInput style={styles.input} value={form.displayName} onChangeText={(v) => setForm((p) => ({ ...p, displayName: v }))} />
          <TextInput style={styles.input} value={form.dob} onChangeText={(v) => setForm((p) => ({ ...p, dob: v }))} />
          <TextInput style={styles.input} value={form.tobLocal} onChangeText={(v) => setForm((p) => ({ ...p, tobLocal: v }))} />
          <TextInput style={styles.input} value={form.pobText} onChangeText={(v) => setForm((p) => ({ ...p, pobText: v }))} />
          <ActionButton label={t("createProfile")} onPress={() => mutateGuard(createProfileMutation.mutateAsync, undefined)} />
          <Text style={styles.meta}>profileId: {profileId || "-"}</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>{t("engine")}</Text>
          <View style={styles.row}>
            <ActionButton label={t("assessRisk")} compact onPress={() => mutateGuard(riskMutation.mutateAsync, undefined)} />
            <ActionButton label={t("atmakaraka")} compact onPress={() => mutateGuard(atmakarakaMutation.mutateAsync, undefined)} />
          </View>
          <View style={styles.row}>
            <ActionButton label={t("quick5")} compact onPress={() => mutateGuard(storyMutation.mutateAsync, "quick5y")} />
            <ActionButton label={t("full15")} compact onPress={() => mutateGuard(storyMutation.mutateAsync, "full15y")} />
          </View>
          <View style={styles.row}>
            <ActionButton label={t("weekly")} compact onPress={() => mutateGuard(weeklyMutation.mutateAsync, undefined)} />
            <ActionButton label={t("forecast")} compact onPress={() => mutateGuard(forecastMutation.mutateAsync, undefined)} />
          </View>
          <Text style={styles.meta}>risk: {riskLevel || "-"} | atmakaraka: {atmakaraka || "-"}</Text>
          <Text style={styles.meta}>runId: {runId || "-"}</Text>
          {weeklySummary ? <Text style={styles.subtle}>{weeklySummary}</Text> : null}
          {forecastSummary ? <Text style={styles.subtle}>{forecastSummary}</Text> : null}
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>{t("scores")}</Text>
          <View style={styles.row}>
            <ActionButton label={t("refreshScores")} compact onPress={() => mutateGuard(refreshScoresMutation.mutateAsync, undefined)} />
            <ActionButton label={t("recordConsent")} compact onPress={() => mutateGuard(consentMutation.mutateAsync, undefined)} />
          </View>
          <Text style={styles.meta}>
            PSA {scores?.psa ?? 0} | PCS {scores?.pcs ?? 0} | Validated {scores?.validatedCount ?? 0}
          </Text>
          <Text style={styles.meta}>
            Coverage {scores?.yearCoverage ?? 0} | Diversity {scores?.diversityScore ?? 0}
          </Text>
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
                    <Text style={styles.claimMeta}>
                      {point.weightClass} | confidence {point.confidenceScore}
                    </Text>
                    <View style={styles.row}>
                      <ActionButton compact label="True" onPress={() => mutateGuard(validateMutation.mutateAsync, { claimId: point.claimId, label: "true" })} />
                      <ActionButton compact label="Somewhat" onPress={() => mutateGuard(validateMutation.mutateAsync, { claimId: point.claimId, label: "somewhat" })} />
                      <ActionButton compact label="False" onPress={() => mutateGuard(validateMutation.mutateAsync, { claimId: point.claimId, label: "false" })} />
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.footer}>
          Build date: {yearNow}. Billing endpoints are intentionally deferred in backend.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#18120f",
  },
  scroll: {
    padding: 18,
    paddingBottom: 34,
    gap: 14,
  },
  bgOrbTop: {
    position: "absolute",
    right: -90,
    top: -90,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "#4b2f18",
    opacity: 0.28,
  },
  bgOrbBottom: {
    position: "absolute",
    left: -85,
    top: 520,
    width: 210,
    height: 210,
    borderRadius: 999,
    backgroundColor: "#2a5540",
    opacity: 0.2,
  },
  hero: {
    borderWidth: 1,
    borderColor: "#8d6a3e",
    borderRadius: 20,
    padding: 18,
    backgroundColor: "#221914",
    gap: 8,
  },
  heroBadge: {
    color: "#d6ab6a",
    fontFamily: "serif",
    letterSpacing: 1.3,
    fontSize: 11,
  },
  heroTitle: {
    color: "#f7e6cc",
    fontFamily: "serif",
    fontSize: 30,
    lineHeight: 34,
  },
  heroText: {
    color: "#d6c3aa",
    fontSize: 14,
  },
  langRow: {
    flexDirection: "row",
    gap: 8,
  },
  panel: {
    borderWidth: 1,
    borderColor: "#705233",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#201813",
    gap: 10,
  },
  sectionTitle: {
    color: "#f6d39f",
    fontFamily: "serif",
    fontSize: 19,
  },
  label: {
    color: "#d7c4a2",
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: "#7e603f",
    borderRadius: 10,
    backgroundColor: "#19120f",
    color: "#f4e8d7",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  status: {
    color: "#ccb08d",
    fontSize: 12,
  },
  busyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  busyText: {
    color: "#d6b17f",
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  button: {
    borderWidth: 1,
    borderColor: "#c48a2f",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#3a2614",
  },
  buttonCompact: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#ffd599",
    fontSize: 12,
    letterSpacing: 0.3,
  },
  meta: {
    color: "#dfc8a9",
    fontSize: 12,
  },
  subtle: {
    color: "#bda281",
    fontSize: 12,
  },
  yearCard: {
    borderWidth: 1,
    borderColor: "#6f5438",
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  yearText: {
    color: "#f2cf98",
    fontFamily: "serif",
    fontSize: 18,
  },
  claim: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "#4b3927",
    paddingTop: 8,
  },
  claimText: {
    color: "#f2e5d1",
    fontSize: 14,
    lineHeight: 18,
  },
  claimMeta: {
    color: "#bb9a70",
    fontSize: 11,
  },
  footer: {
    color: "#94785b",
    textAlign: "center",
    marginTop: 2,
    fontSize: 11,
  },
});
