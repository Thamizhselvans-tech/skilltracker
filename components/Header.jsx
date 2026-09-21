import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useNetworkSync } from '../hooks/useNetworkSync';
import { SyncStatusModal } from './SyncStatusModal';

export const Header = ({ title, rightComponent, showBack = false }) => {
  const navigation = useNavigation();
  const { theme, toggleTheme, themeMode } = useAuth();
  const { isOnline, isSyncing, pendingCount, lastSyncTime, syncNow } = useNetworkSync();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
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
          {/* Live Sync / Network Status Pill */}
          <TouchableOpacity
            style={[
              styles.syncPill,
              {
                backgroundColor: isOnline ? `${theme.success}15` : `${theme.warning}18`,
                borderColor: isOnline ? `${theme.success}40` : theme.warning,
              },
            ]}
            onPress={() => setModalVisible(true)}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color={theme.primary} style={{ marginRight: 4 }} />
            ) : (
              <View
                style={[
                  styles.syncDot,
                  { backgroundColor: isOnline ? theme.success : theme.warning },
                ]}
              />
            )}
            <Text
              style={[
                styles.syncPillText,
                { color: isOnline ? theme.success : theme.warning },
              ]}
              numberOfLines={1}
            >
              {isSyncing
                ? 'Syncing'
                : isOnline
                ? 'Online'
                : pendingCount > 0
                ? `${pendingCount} pend`
                : 'Offline'}
            </Text>
          </TouchableOpacity>

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

      <SyncStatusModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        isOnline={isOnline}
        isSyncing={isSyncing}
        pendingCount={pendingCount}
        lastSyncTime={lastSyncTime}
        onSyncNow={syncNow}
      />
    </>
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
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 14,
    borderWidth: 1,
  },
  syncDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },
  syncPillText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

export default Header;
