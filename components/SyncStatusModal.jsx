import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { getBaseApiUrl } from '../services/api';

export const SyncStatusModal = ({
  visible,
  onClose,
  isOnline,
  isSyncing,
  pendingCount,
  lastSyncTime,
  onSyncNow,
}) => {
  const { theme } = useAuth();
  const [serverUrl, setServerUrl] = useState('');

  useEffect(() => {
    if (visible) {
      getBaseApiUrl().then((url) => setServerUrl(url || ''));
    }
  }, [visible]);

  const formattedLastSync = lastSyncTime
    ? new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Never';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.titleRow}>
              <Ionicons
                name={isOnline ? 'cloud-done' : 'cloud-offline'}
                size={22}
                color={isOnline ? theme.success : theme.warning}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.title, { color: theme.text }]}>Sync & Network Status</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.statusBanner,
              {
                backgroundColor: isOnline ? `${theme.success}18` : `${theme.warning}18`,
                borderColor: isOnline ? theme.success : theme.warning,
              },
            ]}
          >
            <View style={[styles.indicatorDot, { backgroundColor: isOnline ? theme.success : theme.warning }]} />
            <Text style={[styles.statusText, { color: isOnline ? theme.success : theme.warning }]}>
              {isOnline ? 'Online • Connected to Server' : 'Offline Mode • Saving locally'}
            </Text>
          </View>

          {/* Details List */}
          <View style={styles.detailsList}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Server URL</Text>
              <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={1}>
                {serverUrl || 'Default Localhost'}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Pending Offline Changes</Text>
              <View style={[styles.countBadge, { backgroundColor: pendingCount > 0 ? theme.warning : theme.inputBackground }]}>
                <Text
                  style={[
                    styles.countText,
                    { color: pendingCount > 0 ? '#000' : theme.textMuted, fontWeight: '700' },
                  ]}
                >
                  {pendingCount}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Last Synchronized</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>{formattedLastSync}</Text>
            </View>
          </View>

          {/* Sync Now Button */}
          <TouchableOpacity
            style={[
              styles.syncBtn,
              { backgroundColor: theme.primary },
              (!isOnline || isSyncing) && styles.syncBtnDisabled,
            ]}
            onPress={onSyncNow}
            disabled={!isOnline || isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="sync" size={18} color="#fff" style={{ marginRight: 8 }} />
            )}
            <Text style={styles.syncBtnText}>
              {isSyncing ? 'Synchronizing...' : isOnline ? 'Sync Pending Data Now' : 'Connect to Network to Sync'}
            </Text>
          </TouchableOpacity>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={[styles.closeBtnText, { color: theme.textMuted }]}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailsList: {
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
    maxWidth: 180,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 10,
    marginBottom: 10,
  },
  syncBtnDisabled: {
    opacity: 0.65,
  },
  syncBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default SyncStatusModal;
