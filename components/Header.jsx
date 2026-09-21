import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

export const Header = ({ title, rightComponent, showBack = false }) => {
  const navigation = useNavigation();
  const { theme, toggleTheme, themeMode } = useAuth();

  return (
    <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              if (navigation.openDrawer) {
                navigation.openDrawer();
              }
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="menu" size={26} color={theme.text} />
          </TouchableOpacity>
        )}
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={styles.right}>
        {rightComponent}
        <TouchableOpacity
          style={[styles.themeButton, { backgroundColor: theme.inputBackground }]}
          onPress={toggleTheme}
        >
          <Ionicons
            name={themeMode === 'dark' ? 'sunny' : 'moon'}
            size={18}
            color={themeMode === 'dark' ? '#F59E0B' : '#6366F1'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconButton: {
    padding: 6,
    marginRight: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Header;
