import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "./theme";

type BirthMode = "exact_time" | "six_window_approx" | "nakshatra_only" | "unknown";

const MODES: Array<{ key: BirthMode; label: string }> = [
  { key: "exact_time", label: "Exact time" },
  { key: "six_window_approx", label: "Approx window" },
  { key: "nakshatra_only", label: "Nakshatra only" },
  { key: "unknown", label: "Unknown" },
];

export const BirthModePicker = ({ value, onChange }: { value: BirthMode; onChange: (value: BirthMode) => void }) => (
  <View style={styles.modeWrap}>
    {MODES.map((mode) => {
      const active = mode.key === value;
      return (
        <Pressable key={mode.key} onPress={() => onChange(mode.key)} style={[styles.modeChip, active && styles.modeChipActive]}>
          <Text style={[styles.modeText, active && styles.modeTextActive]}>{mode.label}</Text>
        </Pressable>
      );
    })}
  </View>
);

export const DatePickerField = ({ value, onChange }: { value: Date; onChange: (value: Date) => void }) => {
  const [open, setOpen] = useState(false);
  const label = useMemo(() => value.toISOString().slice(0, 10), [value]);
  const onPicked = (_event: DateTimePickerEvent, selected?: Date) => {
    setOpen(false);
    if (selected) onChange(selected);
  };

  return (
    <View style={styles.fieldWrap}>
      <Pressable onPress={() => setOpen(true)} style={styles.fieldBtn}>
        <Text style={styles.fieldLabel}>Date of Birth</Text>
        <Text style={styles.fieldValue}>{label}</Text>
      </Pressable>
      {open ? <DateTimePicker value={value} mode="date" display="default" onChange={onPicked} /> : null}
    </View>
  );
};

export const TimePickerField = ({ value, onChange }: { value: Date; onChange: (value: Date) => void }) => {
  const [open, setOpen] = useState(false);
  const label = useMemo(() => `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`, [value]);
  const onPicked = (_event: DateTimePickerEvent, selected?: Date) => {
    setOpen(false);
    if (selected) onChange(selected);
  };

  return (
    <View style={styles.fieldWrap}>
      <Pressable onPress={() => setOpen(true)} style={styles.fieldBtn}>
        <Text style={styles.fieldLabel}>Birth Time</Text>
        <Text style={styles.fieldValue}>{label}</Text>
      </Pressable>
      {open ? <DateTimePicker value={value} mode="time" display="default" onChange={onPicked} /> : null}
    </View>
  );
};

export const CityPresetPicker = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string, lat: number, lon: number, tzIana: string) => void;
}) => {
  const presets = [
    { label: "Hyderabad", lat: 17.385, lon: 78.4867, tzIana: "Asia/Kolkata" },
    { label: "Gudivada", lat: 16.435, lon: 80.995, tzIana: "Asia/Kolkata" },
    { label: "Vijayawada", lat: 16.5062, lon: 80.648, tzIana: "Asia/Kolkata" },
    { label: "Bengaluru", lat: 12.9716, lon: 77.5946, tzIana: "Asia/Kolkata" },
    { label: "Chennai", lat: 13.0827, lon: 80.2707, tzIana: "Asia/Kolkata" },
    { label: "Mumbai", lat: 19.076, lon: 72.8777, tzIana: "Asia/Kolkata" },
  ];

  return (
    <View style={styles.modeWrap}>
      {presets.map((preset) => {
        const active = preset.label === value;
        return (
          <Pressable
            key={preset.label}
            onPress={() => onChange(preset.label, preset.lat, preset.lon, preset.tzIana)}
            style={[styles.modeChip, active && styles.modeChipActive]}
          >
            <Text style={[styles.modeText, active && styles.modeTextActive]}>{preset.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  modeWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  modeChip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: theme.colors.panelSoft,
  },
  modeChipActive: {
    borderColor: theme.colors.accent,
    backgroundColor: "#2C2320",
  },
  modeText: {
    color: theme.colors.textMuted,
    fontSize: theme.type.meta,
    fontFamily: theme.font.body,
  },
  modeTextActive: {
    color: theme.colors.text,
  },
  fieldWrap: {
    gap: 8,
  },
  fieldBtn: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.panelSoft,
    padding: 12,
    gap: 4,
  },
  fieldLabel: {
    color: theme.colors.textSoft,
    fontSize: theme.type.meta,
    fontFamily: theme.font.body,
  },
  fieldValue: {
    color: theme.colors.text,
    fontSize: theme.type.body,
    fontFamily: theme.font.display,
  },
});
