import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, NativeModules, AppState } from 'react-native';
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
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkPermissions();
      }
    });
    return () => sub.remove();
  }, []);

  const checkPermissions = async () => {
    if (NotificationModule && NotificationModule.checkPermission) {
      const notif = await NotificationModule.checkPermission();
      setHasNotifAccess(notif);
    }
    if (UsageStatsModule && UsageStatsModule.checkPermission) {
      const usage = await UsageStatsModule.checkPermission();
      setHasUsageAccess(usage);
    }
  };

  useEffect(() => {
    if (hasNotifAccess && hasUsageAccess) {
      navigation.replace('Dashboard');
    }
  }, [hasNotifAccess, hasUsageAccess]);

  const requestNotif = () => NotificationModule?.requestPermission();
  const requestUsage = () => UsageStatsModule?.requestPermission();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Setup Required</Text>
      <Text style={styles.subtitle}>
        We need a few permissions to seamlessly manage your notifications.
      </Text>

      <GlassCard style={styles.card}>
        <Text style={styles.title}>Notification Access</Text>
        <Text style={styles.desc}>Allows the app to intercept and suppress notifications for inactive apps.</Text>
        <TouchableOpacity 
          style={[styles.btn, hasNotifAccess && styles.btnSuccess]} 
          onPress={requestNotif}
          disabled={hasNotifAccess}
        >
          <Text style={styles.btnText}>{hasNotifAccess ? 'Granted ✓' : 'Grant Access'}</Text>
        </TouchableOpacity>
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.title}>Usage Access</Text>
        <Text style={styles.desc}>Allows the app to check how many days you've been inactive on an app.</Text>
        <TouchableOpacity 
          style={[styles.btn, hasUsageAccess && styles.btnSuccess]} 
          onPress={requestUsage}
          disabled={hasUsageAccess}
        >
          <Text style={styles.btnText}>{hasUsageAccess ? 'Granted ✓' : 'Grant Access'}</Text>
        </TouchableOpacity>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 40,
    lineHeight: 28,
  },
  card: {
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  desc: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 20,
  },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnSuccess: {
    backgroundColor: colors.success,
  },
  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
