import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, NativeModules, FlatList, Modal, Platform, Image, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { GlassCard } from '../components/GlassCard';
import { colors } from '../theme/colors';

const { NotificationModule } = NativeModules;

export const RuleEditor = () => {
  const navigation = useNavigation<any>();
  const [selectedApps, setSelectedApps] = useState<any[]>([]);
  const [days, setDays] = useState('3');
  const [apps, setApps] = useState<any[]>([]);
  const [filteredApps, setFilteredApps] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (NotificationModule && NotificationModule.getInstalledApps) {
      NotificationModule.getInstalledApps().then((appList: any[]) => {
        const sorted = appList.sort((a, b) => a.label.localeCompare(b.label));
        setApps(sorted);
        setFilteredApps(sorted);
      });
    }
  }, []);

  const onSearch = (text: string) => {
    setSearch(text);
    const filtered = apps.filter(app => 
      app.label.toLowerCase().includes(text.toLowerCase()) ||
      app.packageName.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredApps(filtered);
  };

  const toggleApp = (app: any) => {
    setSelectedApps(prev => {
      const exists = prev.find(a => a.packageName === app.packageName);
      if (exists) {
        return prev.filter(a => a.packageName !== app.packageName);
      } else {
        return [...prev, app];
      }
    });
  };

  const onSave = () => {
    if (selectedApps.length > 0 && days) {
      if (NotificationModule && NotificationModule.saveRules) {
        const packageNames = selectedApps.map(a => a.packageName);
        NotificationModule.saveRules(packageNames, parseInt(days, 10));
      }
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>New Rule</Text>
        
        <GlassCard style={styles.card}>
          <Text style={styles.label}>Selected Apps</Text>
          <TouchableOpacity 
            style={styles.pickerTrigger} 
            onPress={() => setModalVisible(true)}
          >
            <Text style={[styles.pickerValue, selectedApps.length === 0 && { color: colors.textSecondary }]}>
              {selectedApps.length > 0 
                ? `${selectedApps.length} app${selectedApps.length > 1 ? 's' : ''} selected` 
                : "Choose from installed apps..."}
            </Text>
            <Icon name="plus-circle-outline" size={24} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.selectedContainer}>
            {selectedApps.map(app => (
              <View key={app.packageName} style={styles.selectedPill}>
                {app.icon ? (
                  <Image 
                    source={{ uri: `data:image/png;base64,${app.icon}` }} 
                    style={styles.pillIcon} 
                  />
                ) : (
                  <View style={styles.pillPlaceholder}><Text style={styles.pillInitial}>{app.label[0]}</Text></View>
                )}
                <Text style={styles.pillText} numberOfLines={1}>{app.label}</Text>
                <TouchableOpacity onPress={() => toggleApp(app)}>
                  <Icon name="close" size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: 24 }]}>Inactivity Threshold</Text>
          <View style={styles.daysInputRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="e.g. 3"
              placeholderTextColor={colors.textSecondary}
              value={days}
              onChangeText={setDays}
              keyboardType="numeric"
            />
            <Text style={styles.daysLabel}>Days</Text>
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, selectedApps.length === 0 && styles.saveButtonDisabled]} 
            onPress={onSave}
            disabled={selectedApps.length === 0}
          >
            <Text style={styles.saveText}>Save Rules</Text>
          </TouchableOpacity>
        </GlassCard>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Apps</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Icon name="magnify" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search apps..."
                placeholderTextColor={colors.textSecondary}
                value={search}
                onChangeText={onSearch}
              />
            </View>

            <FlatList
              data={filteredApps}
              keyExtractor={(item) => item.packageName}
              renderItem={({ item }) => {
                const isSelected = selectedApps.find(a => a.packageName === item.packageName);
                return (
                  <TouchableOpacity 
                    style={styles.appItem}
                    onPress={() => toggleApp(item)}
                  >
                    <View style={styles.appIconContainer}>
                      {item.icon ? (
                        <Image 
                          source={{ uri: `data:image/png;base64,${item.icon}` }} 
                          style={styles.appIcon} 
                        />
                      ) : (
                        <View style={styles.appIconPlaceholder}>
                          <Text style={styles.appInitial}>{item.label[0].toUpperCase()}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.appInfo}>
                      <Text style={styles.appLabel}>{item.label}</Text>
                      <Text style={styles.appPackage} numberOfLines={1}>{item.packageName}</Text>
                    </View>
                    <Icon 
                      name={isSelected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} 
                      size={24} 
                      color={isSelected ? colors.primary : colors.textSecondary} 
                    />
                  </TouchableOpacity>
                );
              }}
              initialNumToRender={15}
              windowSize={10}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  header: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 32,
    marginTop: 40,
  },
  card: {
    padding: 24,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pillIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 6,
  },
  pillPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  pillInitial: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '800',
  },
  selectedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  pillText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 6,
    maxWidth: 100,
  },
  pickerValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  daysInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daysLabel: {
    color: colors.text,
    fontSize: 18,
    marginLeft: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 14,
    padding: 16,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 32,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    height: '90%',
    padding: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  doneText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    color: colors.text,
    fontSize: 16,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  appIconContainer: {
    marginRight: 16,
  },
  appIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  appIconPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appInitial: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  appInfo: {
    flex: 1,
  },
  appLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  appPackage: {
    fontSize: 12,
    color: colors.textSecondary,
    opacity: 0.7,
  },
});
