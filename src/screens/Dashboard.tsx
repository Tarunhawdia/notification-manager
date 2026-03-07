import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, NativeModules, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GlassCard } from '../components/GlassCard';
import { colors } from '../theme/colors';

const { NotificationModule } = NativeModules;

export const Dashboard = () => {
  const navigation = useNavigation<any>();
  const [rules, setRules] = useState<any>({});
  
  useEffect(() => {
    loadRules();
    const unsubscribe = navigation.addListener('focus', () => {
      loadRules();
    });
    return unsubscribe;
  }, [navigation]);

  const loadRules = async () => {
    if (NotificationModule && NotificationModule.getRules) {
      const data = await NotificationModule.getRules();
      setRules(data);
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
          renderItem={({ item }) => (
            <GlassCard style={styles.ruleCard}>
              <Text style={styles.ruleApp}>{item}</Text>
              <Text style={styles.ruleDays}>Hide if inactive for {rules[item]} days</Text>
            </GlassCard>
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('RuleEditor')}
      >
        <Text style={styles.fabIcon}>+</Text>
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
    padding: 16,
  },
  ruleApp: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '700',
  },
  ruleDays: {
    fontSize: 14,
    color: colors.accent,
    marginTop: 4,
    fontWeight: '500',
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: '300',
    lineHeight: 36,
  },
});
