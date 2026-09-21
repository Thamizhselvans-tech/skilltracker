import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

export const StatCard = ({ title, value, subtitle, icon, iconColor, style }) => {
  const { theme } = useAuth();

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }, style]}>
      <View style={styles.topRow}>
        <Text style={[styles.title, { color: theme.textMuted }]}>{title}</Text>
        {icon && (
          <View style={[styles.iconWrap, { backgroundColor: `${iconColor || theme.primary}18` }]}>
            <Ionicons name={icon} size={18} color={iconColor || theme.primary} />
          </View>
        )}
      </View>
      <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: theme.textSubtle }]}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    flex: 1,
    minWidth: 140,
    margin: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 4,
  },
});

export default StatCard;
