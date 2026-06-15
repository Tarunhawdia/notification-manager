import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  NativeModules,
  FlatList,
  Modal,
  Switch,
  Image,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { TimeField } from '../components/TimeField';
import { colors } from '../theme/colors';
import { AppInfo, Rule, DEFAULT_RULE } from '../types';

const { NotificationModule } = NativeModules;

const DAY_PRESETS = [1, 3, 7, 14, 30];

export const RuleEditor = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const editPackage: string | undefined = route.params?.editPackage;
  const editRule: Rule | undefined = route.params?.rule;
  const isEditing = !!editPackage;

  const [apps, setApps] = useState<AppInfo[]>([]);
  const [selectedApps, setSelectedApps] = useState<AppInfo[]>([]);
  const [days, setDays] = useState(String(editRule?.days ?? DEFAULT_RULE.days));
  const [enabled, setEnabled] = useState(editRule?.enabled ?? true);
  const [scheduled, setScheduled] = useState(
    editRule ? editRule.quietStart >= 0 && editRule.quietEnd >= 0 : false,
  );
  const [quietStart, setQuietStart] = useState(
    editRule && editRule.quietStart >= 0 ? editRule.quietStart : 22 * 60,
  );
  const [quietEnd, setQuietEnd] = useState(
    editRule && editRule.quietEnd >= 0 ? editRule.quietEnd : 7 * 60,
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!NotificationModule?.getInstalledApps) return;
    NotificationModule.getInstalledApps().then((appList: AppInfo[]) => {
      const sorted = [...appList].sort((a, b) => a.label.localeCompare(b.label));
      setApps(sorted);
      if (isEditing) {
        const found = sorted.find(a => a.packageName === editPackage);
        setSelectedApps(found ? [found] : [{ label: editPackage!, packageName: editPackage! }]);
      }
    });
  }, [isEditing, editPackage]);

  const filteredApps = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter(
      a => a.label.toLowerCase().includes(q) || a.packageName.toLowerCase().includes(q),
    );
  }, [apps, search]);

  const toggleApp = (app: AppInfo) => {
    setSelectedApps(prev => {
      const exists = prev.find(a => a.packageName === app.packageName);
      return exists
        ? prev.filter(a => a.packageName !== app.packageName)
        : [...prev, app];
    });
  };

  const canSave = selectedApps.length > 0 && parseInt(days, 10) > 0;

  const onSave = () => {
    if (!canSave || !NotificationModule) return;
    const dayNum = parseInt(days, 10);
    const qs = scheduled ? quietStart : -1;
    const qe = scheduled ? quietEnd : -1;

    if (isEditing) {
      NotificationModule.saveRule?.(editPackage, dayNum, enabled, qs, qe);
    } else {
      const packageNames = selectedApps.map(a => a.packageName);
      NotificationModule.saveRules?.(packageNames, dayNum, enabled, qs, qe);
    }
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8} style={styles.backBtn}>
          <Icon name="chevron-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{isEditing ? 'Edit Rule' : 'New Rule'}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Apps */}
        <Text style={styles.sectionLabel}>Apps</Text>
        <GlassCard style={styles.card}>
          {!isEditing && (
            <TouchableOpacity style={styles.picker} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
              <Text style={[styles.pickerValue, selectedApps.length === 0 && { color: colors.textMuted }]}>
                {selectedApps.length > 0
                  ? `${selectedApps.length} app${selectedApps.length > 1 ? 's' : ''} selected`
                  : 'Choose installed apps…'}
              </Text>
              <Icon name="plus-circle-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}

          <View style={styles.pillWrap}>
            {selectedApps.map(app => (
              <View key={app.packageName} style={styles.pill}>
                {app.icon ? (
                  <Image source={{ uri: `data:image/png;base64,${app.icon}` }} style={styles.pillIcon} />
                ) : (
                  <View style={styles.pillPlaceholder}>
                    <Text style={styles.pillInitial}>{app.label[0]?.toUpperCase()}</Text>
                  </View>
                )}
                <Text style={styles.pillText} numberOfLines={1}>{app.label}</Text>
                {!isEditing && (
                  <TouchableOpacity onPress={() => toggleApp(app)} hitSlop={6}>
                    <Icon name="close" size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </GlassCard>

        {/* Threshold */}
        <Text style={styles.sectionLabel}>Inactivity Threshold</Text>
        <GlassCard style={styles.card}>
          <View style={styles.daysRow}>
            <TextInput
              style={styles.daysInput}
              placeholder="3"
              placeholderTextColor={colors.textMuted}
              value={days}
              onChangeText={setDays}
              keyboardType="numeric"
              maxLength={3}
            />
            <Text style={styles.daysUnit}>days unused</Text>
          </View>
          <View style={styles.presetRow}>
            {DAY_PRESETS.map(p => {
              const active = String(p) === days;
              return (
                <TouchableOpacity
                  key={p}
                  style={[styles.preset, active && styles.presetActive]}
                  onPress={() => setDays(String(p))}
                >
                  <Text style={[styles.presetText, active && styles.presetTextActive]}>{p}d</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        {/* Schedule */}
        <Text style={styles.sectionLabel}>Schedule</Text>
        <GlassCard style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Only during set hours</Text>
              <Text style={styles.toggleSub}>Suppress notifications only inside this window</Text>
            </View>
            <Switch
              value={scheduled}
              onValueChange={setScheduled}
              trackColor={{ false: colors.inputBg, true: colors.primary }}
              thumbColor="#FFF"
            />
          </View>
          {scheduled && (
            <View style={styles.timeRow}>
              <TimeField label="From" value={quietStart} onChange={setQuietStart} />
              <Icon name="arrow-right" size={20} color={colors.textMuted} style={{ marginTop: 18 }} />
              <TimeField label="To" value={quietEnd} onChange={setQuietEnd} />
            </View>
          )}
        </GlassCard>

        {/* Enabled */}
        <GlassCard style={[styles.card, styles.toggleRow]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>Rule enabled</Text>
            <Text style={styles.toggleSub}>Turn off to pause without deleting</Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ false: colors.inputBg, true: colors.success }}
            thumbColor="#FFF"
          />
        </GlassCard>

        <TouchableOpacity
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={onSave}
          disabled={!canSave}
          activeOpacity={0.9}
        >
          <Text style={styles.saveText}>{isEditing ? 'Save Changes' : 'Create Rule'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 12 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Apps</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Icon name="magnify" size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search apps…"
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            <FlatList
              data={filteredApps}
              keyExtractor={item => item.packageName}
              initialNumToRender={15}
              windowSize={10}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = !!selectedApps.find(a => a.packageName === item.packageName);
                return (
                  <TouchableOpacity style={styles.appItem} onPress={() => toggleApp(item)} activeOpacity={0.7}>
                    {item.icon ? (
                      <Image source={{ uri: `data:image/png;base64,${item.icon}` }} style={styles.appItemIcon} />
                    ) : (
                      <View style={styles.appItemPlaceholder}>
                        <Text style={styles.pillInitial}>{item.label[0]?.toUpperCase()}</Text>
                      </View>
                    )}
                    <View style={styles.appItemInfo}>
                      <Text style={styles.appItemLabel}>{item.label}</Text>
                      <Text style={styles.appItemPkg} numberOfLines={1}>{item.packageName}</Text>
                    </View>
                    <Icon
                      name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                      size={22}
                      color={isSelected ? colors.primary : colors.textMuted}
                    />
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  sectionLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 18,
  },
  card: {
    marginBottom: 4,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSoft,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  pickerValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceSoft,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  pillIcon: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  pillPlaceholder: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillInitial: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '800',
  },
  pillText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 120,
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daysInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    minWidth: 72,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  daysUnit: {
    color: colors.textSecondary,
    fontSize: 15,
    marginLeft: 14,
    fontWeight: '600',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  preset: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  presetActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  presetTextActive: {
    color: '#FFF',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  toggleSub: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 28,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonDisabled: {
    backgroundColor: colors.surfaceSoft,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '88%',
    padding: 20,
    borderTopWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  doneText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceSoft,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    color: colors.text,
    fontSize: 15,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  appItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  appItemPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surfaceSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appItemInfo: {
    flex: 1,
  },
  appItemLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  appItemPkg: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
});
