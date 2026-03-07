import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, NativeModules, FlatList, Modal, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { GlassCard } from '../components/GlassCard';
import { colors } from '../theme/colors';

const { NotificationModule } = NativeModules;

export const RuleEditor = () => {
  const navigation = useNavigation<any>();
  const [packageName, setPackageName] = useState('');
  const [appName, setAppName] = useState('');
  const [days, setDays] = useState('3');
  const [apps, setApps] = useState<any[]>([]);
  const [filteredApps, setFilteredApps] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  React.useEffect(() => {
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

  const selectApp = (app: any) => {
    setPackageName(app.packageName);
    setAppName(app.label);
    setModalVisible(false);
  };

  const onSave = () => {
    if (packageName && days) {
      if (NotificationModule && NotificationModule.saveRule) {
        NotificationModule.saveRule(packageName, parseInt(days, 10));
      }
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>New Rule</Text>
      
      <GlassCard style={styles.card}>
        <Text style={styles.label}>Select App</Text>
        <TouchableOpacity 
          style={styles.pickerTrigger} 
          onPress={() => setModalVisible(true)}
        >
          <Text style={[styles.pickerValue, !appName && { color: colors.textSecondary }]}>
            {appName || "Choose from installed apps..."}
          </Text>
          <Icon name="chevron-down" size={24} color={colors.primary} />
        </TouchableOpacity>

        {packageName ? (
          <Text style={styles.packageSubtext}>{packageName}</Text>
        ) : null}

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
          style={[styles.saveButton, !packageName && styles.saveButtonDisabled]} 
          onPress={onSave}
          disabled={!packageName}
        >
          <Text style={styles.saveText}>Save Rule</Text>
        </TouchableOpacity>
      </GlassCard>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select App</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={28} color={colors.text} />
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
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.appItem}
                  onPress={() => selectApp(item)}
                >
                  <View style={styles.appIconPlaceholder}>
                    <Text style={styles.appInitial}>{item.label[0].toUpperCase()}</Text>
                  </View>
                  <View style={styles.appInfo}>
                    <Text style={styles.appLabel}>{item.label}</Text>
                    <Text style={styles.appPackage}>{item.packageName}</Text>
                  </View>
                </TouchableOpacity>
              )}
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
    padding: 24,
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
  pickerValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  packageSubtext: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 8,
    marginLeft: 4,
    opacity: 0.8,
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
    borderRadius: 12,
    padding: 16,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 32,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '85%',
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
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  appIconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  appInitial: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  appInfo: {
    flex: 1,
  },
  appLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  appPackage: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
