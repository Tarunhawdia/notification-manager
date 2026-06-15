import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  NativeModules,
  FlatList,
  Image,
  Switch,
  TextInput,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { Segmented } from '../components/Segmented';
import { formatMinutes } from '../components/TimeField';
import { colors } from '../theme/colors';
import { AppInfo, RulesMap, Stats, hasSchedule } from '../types';

const { NotificationModule } = NativeModules;

type SortKey = 'name' | 'days' | 'silenced';

export const Dashboard = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [rules, setRules] = useState<RulesMap>({});
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, perApp: {} });
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('name');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!NotificationModule) return;
    const [rulesData, appsData, statsData] = await Promise.all([
      NotificationModule.getRules(),
      NotificationModule.getInstalledApps(),
      NotificationModule.getStats ? NotificationModule.getStats() : Promise.resolve({ total: 0, perApp: {} }),
    ]);
    setRules(rulesData || {});
    setApps(appsData || []);
    setStats(statsData || { total: 0, perApp: {} });
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const removeRule = (pkg: string) => {
    NotificationModule?.removeRule?.(pkg);
    setRules(prev => {
      const next = { ...prev };
      delete next[pkg];
      return next;
    });
  };

  const toggleRule = (pkg: string, enabled: boolean) => {
    NotificationModule?.setRuleEnabled?.(pkg, enabled);
    setRules(prev => ({ ...prev, [pkg]: { ...prev[pkg], enabled } }));
  };

  const appFor = useCallback(
    (pkg: string) => apps.find(a => a.packageName === pkg),
    [apps],
  );

  const visibleRules = useMemo(() => {
    const q = search.trim().toLowerCase();
    const entries = Object.keys(rules).map(pkg => ({
      pkg,
      rule: rules[pkg],
      app: appFor(pkg),
      silenced: stats.perApp[pkg] || 0,
    }));
    const filtered = q
      ? entries.filter(
          e =>
            (e.app?.label || e.pkg).toLowerCase().includes(q) ||
            e.pkg.toLowerCase().includes(q),
        )
      : entries;
    return filtered.sort((a, b) => {
      if (sort === 'days') return b.rule.days - a.rule.days;
      if (sort === 'silenced') return b.silenced - a.silenced;
      return (a.app?.label || a.pkg).localeCompare(b.app?.label || b.pkg);
    });
  }, [rules, appFor, search, sort, stats]);

  const activeRulesCount = Object.keys(rules).length;

  const header = (
    <View>
      <Text style={styles.header}>BuzzKill</Text>
      <Text style={styles.tagline}>Silence apps you've forgotten about</Text>

      <View style={styles.statsRow}>
        <GlassCard style={styles.statCard}>
          <Text style={styles.statValue}>{activeRulesCount}</Text>
          <Text style={styles.statLabel}>Active Rules</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.accent }]}>{stats.total}</Text>
          <Text style={styles.statLabel}>Silenced</Text>
        </GlassCard>
      </View>

      {activeRulesCount > 0 && (
        <>
          <View style={styles.searchBar}>
            <Icon name="magnify" size={18} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search rules..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                <Icon name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.sortRow}>
            <Segmented<SortKey>
              value={sort}
              onChange={setSort}
              options={[
                { label: 'Name', value: 'name' },
                { label: 'Days', value: 'days' },
                { label: 'Silenced', value: 'silenced' },
              ]}
            />
          </View>
        </>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <FlatList
        data={visibleRules}
        keyExtractor={item => item.pkg}
        ListHeaderComponent={header}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="bell-sleep-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>
              {search ? 'No matching rules' : 'No rules yet'}
            </Text>
            <Text style={styles.emptyText}>
              {search
                ? 'Try a different search term.'
                : 'Tap + to silence notifications from apps you rarely open.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const { pkg, rule, app, silenced } = item;
          return (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('RuleEditor', { editPackage: pkg, rule })}
            >
              <GlassCard style={[styles.ruleCard, !rule.enabled && styles.ruleCardDisabled]}>
                <View style={styles.iconWrap}>
                  {app?.icon ? (
                    <Image source={{ uri: `data:image/png;base64,${app.icon}` }} style={styles.appIcon} />
                  ) : (
                    <View style={styles.placeholderIcon}>
                      <Text style={styles.placeholderText}>{(app?.label || pkg)[0]?.toUpperCase()}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.ruleText}>
                  <Text style={styles.ruleApp} numberOfLines={1}>{app?.label || pkg}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.ruleMeta}>After {rule.days}d inactive</Text>
                    {hasSchedule(rule) && (
                      <View style={styles.badge}>
                        <Icon name="clock-outline" size={11} color={colors.warning} />
                        <Text style={styles.badgeText}>
                          {formatMinutes(rule.quietStart)}–{formatMinutes(rule.quietEnd)}
                        </Text>
                      </View>
                    )}
                    {silenced > 0 && (
                      <View style={[styles.badge, styles.badgeAccent]}>
                        <Icon name="bell-off-outline" size={11} color={colors.accent} />
                        <Text style={[styles.badgeText, { color: colors.accent }]}>{silenced}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <Switch
                  value={rule.enabled}
                  onValueChange={v => toggleRule(pkg, v)}
                  trackColor={{ false: colors.inputBg, true: colors.primary }}
                  thumbColor="#FFF"
                />
                <TouchableOpacity onPress={() => removeRule(pkg)} style={styles.deleteBtn} hitSlop={8}>
                  <Icon name="trash-can-outline" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </GlassCard>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={() => navigation.navigate('RuleEditor')}
        activeOpacity={0.9}
      >
        <Icon name="plus" size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceSoft,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    color: colors.text,
    fontSize: 14,
  },
  sortRow: {
    marginTop: 10,
    marginBottom: 4,
  },
  ruleCard: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ruleCardDisabled: {
    opacity: 0.55,
  },
  iconWrap: {
    marginRight: 12,
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  placeholderIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surfaceSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  ruleText: {
    flex: 1,
    marginRight: 8,
  },
  ruleApp: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  ruleMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeAccent: {
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.warning,
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 4,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 14,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: 22,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
});
