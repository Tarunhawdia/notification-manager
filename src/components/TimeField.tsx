import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/colors';

interface TimeFieldProps {
  label: string;
  /** Minutes from midnight (0..1439). */
  value: number;
  onChange: (minutes: number) => void;
}

const pad = (n: number) => n.toString().padStart(2, '0');

export const formatMinutes = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${pad(h)}:${pad(m)}`;
};

const wrap = (mins: number) => (mins + 1440) % 1440;

export const TimeField = ({ label, value, onChange }: TimeFieldProps) => {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  const stepHour = (delta: number) => onChange(wrap(value + delta * 60));
  const stepMinute = (delta: number) => onChange(wrap(value + delta * 15));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Unit
          value={pad(hours)}
          onUp={() => stepHour(1)}
          onDown={() => stepHour(-1)}
        />
        <Text style={styles.colon}>:</Text>
        <Unit
          value={pad(minutes)}
          onUp={() => stepMinute(1)}
          onDown={() => stepMinute(-1)}
        />
      </View>
    </View>
  );
};

const Unit = ({ value, onUp, onDown }: { value: string; onUp: () => void; onDown: () => void }) => (
  <View style={styles.unit}>
    <TouchableOpacity onPress={onUp} hitSlop={8} style={styles.chevron}>
      <Icon name="chevron-up" size={22} color={colors.textSecondary} />
    </TouchableOpacity>
    <Text style={styles.value}>{value}</Text>
    <TouchableOpacity onPress={onDown} hitSlop={8} style={styles.chevron}>
      <Icon name="chevron-down" size={22} color={colors.textSecondary} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  unit: {
    alignItems: 'center',
  },
  chevron: {
    paddingVertical: 1,
  },
  value: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginVertical: 1,
  },
  colon: {
    color: colors.textSecondary,
    fontSize: 22,
    fontWeight: '800',
    marginHorizontal: 6,
  },
});
