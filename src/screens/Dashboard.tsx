import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, NativeModules, FlatList, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { GlassCard } from '../components/GlassCard';
import { colors } from '../theme/colors';

const { NotificationModule } = NativeModules;

export const Dashboard = () => {
  const navigation = useNavigation<any>();
  const [rules, setRules] = useState<any>({});
  const [apps, setApps] = useState<any[]>([]);
  
  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    if (NotificationModule) {
      const [rulesData, appsData] = await Promise.all([
        NotificationModule.getRules(),
        NotificationModule.getInstalledApps()
      ]);
      setRules(rulesData);
      setApps(appsData);
    }
  };

  const removeRule = (pkg: string) => {
    if (NotificationModule && NotificationModule.removeRule) {
      NotificationModule.removeRule(pkg);
      loadData();
    }
  };

  const activeRulesCount = Object.keys(rules).length;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Overview</Text>
      
      <GlassCard style={styles.statsCard}>
        <Text style={styles.statsValue}>{activeRulesCount}</Text>
        <Text style={styles.statsLabel}>Active Rules</Text>
      </GlassCard>

      <Text style={styles.subHeader}>Your Rules</Text>
      
      {activeRulesCount === 0 ? (
        <Text style={styles.emptyText}>No rules yet. Create one to keep distractions away!</Text>
      ) : (
        <FlatList
          data={Object.keys(rules)}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const appInfo = apps.find(a => a.packageName === item);
            return (
              <GlassCard style={styles.ruleCard}>
                <View style={styles.ruleInfo}>
                  <View style={styles.iconContainer}>
                    {appInfo?.icon ? (
                      <Image 
                        source={{ uri: `data:image/png;base64,${appInfo.icon}` }} 
                        style={styles.appIcon} 
                      />
                    ) : (
                      <View style={styles.placeholderIcon}>
                        <Text style={styles.placeholderText}>{appInfo?.label?.[0] || '?'}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.ruleApp}>{appInfo?.label || item}</Text>
                    <Text style={styles.ruleDays}>Suppresses after {rules[item]} days</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => removeRule(item)} style={styles.deleteButton}>
                  <Icon name="trash-can-outline" size={24} color={colors.accent} />
                </TouchableOpacity>
              </GlassCard>
            );
          }}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('RuleEditor')}
      >
        <Icon name="plus" size={32} color="#FFF" />
      </TouchableOpacity>
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
    marginBottom: 24,
    marginTop: 40,
  },
  subHeader: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginTop: 32,
    marginBottom: 16,
  },
  statsCard: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  statsValue: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.primary,
  },
  statsLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
  ruleCard: {
    marginBottom: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ruleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: 16,
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  placeholderIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  textContainer: {
    flex: 1,
  },
  ruleApp: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 2,
  },
  ruleDays: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
    opacity: 0.9,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: '300',
    lineHeight: 36,
  },
});
