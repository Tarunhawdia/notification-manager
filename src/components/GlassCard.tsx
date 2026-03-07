import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { colors } from '../theme/colors';

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
}

export const GlassCard = ({ children, style, ...props }: GlassCardProps) => {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
});
