import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, NativeModules, AppState } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { GlassCard } from '../components/GlassCard';
import { colors } from '../theme/colors';

const { NotificationModule, UsageStatsModule } = NativeModules;

export const Permissions = () => {
  const navigation = useNavigation<any>();
  const [hasNotifAccess, setHasNotifAccess] = useState(false);
  const [hasUsageAccess, setHasUsageAccess] = useState(false);

  useEffect(() => {
    checkPermissions();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') checkPermissions();
    });
    return () => sub.remove();
  }, []);

  const checkPermissions = async () => {
    if (NotificationModule?.checkPermission) {
      setHasNotifAccess(await NotificationModule.checkPermission());
    }
    if (UsageStatsModule?.checkPermission) {
      setHasUsageAccess(await UsageStatsModule.checkPermission());
    }
  };

  useEffect(() => {
    if (hasNotifAccess && hasUsageAccess) {
      navigation.replace('Dashboard');
    }
  }, [hasNotifAccess, hasUsageAccess]);

  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <Icon name="bell-cancel-outline" size={34} color={colors.primary} />
      </View>
      <Text style={styles.header}>Welcome to BuzzKill</Text>
      <Text style={styles.subtitle}>
        Grant two permissions so we can quietly handle notifications from apps you've stopped using.
      </Text>

      <PermissionCard
        icon="bell-ring-outline"
        title="Notification Access"
        desc="Lets the app intercept and suppress notifications for inactive apps."
        granted={hasNotifAccess}
        onPress={() => NotificationModule?.requestPermission()}
      />
      <PermissionCard
        icon="chart-timeline-variant"
        title="Usage Access"
        desc="Lets the app check how long it's been since you opened an app."
        granted={hasUsageAccess}
        onPress={() => UsageStatsModule?.requestPermission()}
      />

      <Text style={styles.footnote}>
        <Icon name="lock-outline" size={12} color={colors.textMuted} /> Everything stays on your device.
      </Text>
    </View>
  );
};

const PermissionCard = ({
  icon,
  title,
  desc,
  granted,
  onPress,
}: {
  icon: string;
  title: string;
  desc: string;
  granted: boolean;
  onPress: () => void;
}) => (
  <GlassCard style={styles.card}>
    <View style={styles.cardHead}>
      <View style={styles.cardIcon}>
        <Icon name={icon} size={22} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
    </View>
    <Text style={styles.desc}>{desc}</Text>
    <TouchableOpacity
      style={[styles.btn, granted && styles.btnSuccess]}
      onPress={onPress}
      disabled={granted}
      activeOpacity={0.9}
    >
      <Text style={styles.btnText}>{granted ? 'Granted' : 'Grant Access'}</Text>
      <Icon name={granted ? 'check-circle' : 'arrow-right'} size={16} color="#FFF" />
    </TouchableOpacity>
  </GlassCard>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: 'center',
  },
  logoWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  header: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 28,
    lineHeight: 22,
  },
  card: {
    marginBottom: 14,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  desc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 14,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnSuccess: {
    backgroundColor: colors.success,
  },
  btnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footnote: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 18,
  },
});
