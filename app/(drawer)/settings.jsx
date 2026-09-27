import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { getBaseApiUrl, setCustomApiUrl } from '../../services/api';
import { clearAllCache } from '../../services/offlineStorage';
import { scheduleLocalReminder } from '../../services/notificationService';
import { changePassword } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { useNetworkSync } from '../../hooks/useNetworkSync';

export default function SettingsScreen() {
  const { theme, themeMode, toggleTheme, user } = useAuth();
  const { isOnline, isSyncing, pendingCount, lastSyncTime, syncNow } = useNetworkSync();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Advanced developer options toggle
  const [showAdvancedNetwork, setShowAdvancedNetwork] = useState(false);
  const [apiUrl, setApiUrl] = useState('');

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    getBaseApiUrl().then((url) => setApiUrl(url));
  }, []);

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    if (!newPassword) {
      setPasswordError('New password is required');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Confirm password does not match new password');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    setPasswordLoading(true);
    const res = await changePassword({ currentPassword, newPassword, confirmPassword });
    setPasswordLoading(false);

    if (res.success) {
      setPasswordSuccess(res.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Your password has been changed successfully.');
    } else {
      setPasswordError(res.error || 'Failed to change password. Please check your current password.');
      Alert.alert('Error', res.error || 'Failed to change password');
    }
  };

  const handleManualSync = async () => {
    const res = await syncNow();
    if (res && res.success) {
      Alert.alert('Cloud Sync', res.syncedCount > 0 ? `Successfully synced ${res.syncedCount} changes!` : 'All data is already up to date!');
    } else {
      Alert.alert('Cloud Sync', isOnline ? 'Sync complete.' : 'Currently working offline. Changes queued safely.');
    }
  };

  const handleSaveApiUrl = async () => {
    if (!apiUrl.trim()) {
      Alert.alert('Validation Error', 'API URL cannot be empty');
      return;
    }
    await setCustomApiUrl(apiUrl);
    Alert.alert('Saved', 'API URL updated successfully.');
  };

  const handleClearCache = async () => {
    await clearAllCache();
    Alert.alert('Cache Cleared', 'All offline cached requests have been cleared.');
  };

  const handleTestNotification = async () => {
    const id = await scheduleLocalReminder(
      'SkillTracker Test Alert',
      'This is a sample study alert verifying your device notifications work!'
    );
    if (id) {
      Alert.alert('Success', 'Test notification scheduled for 5 seconds from now!');
    } else {
      Alert.alert('Notice', 'Could not schedule notification. Please check system permissions.');
    }
  };

  const formatLastSync = (timestamp) => {
    if (!timestamp) return 'Never';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Settings" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cloud Sync & Offline Status */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Cloud Sync & Offline Mode</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.syncHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={[styles.syncStatusDot, { backgroundColor: isOnline ? theme.success : theme.warning }]} />
              <View style={{ marginLeft: 8 }}>
                <Text style={[styles.syncStatusTitle, { color: theme.text }]}>
                  {isOnline ? 'Online • Cloud Connected' : 'Offline • Local Storage Active'}
                </Text>
                <Text style={[styles.syncStatusSub, { color: theme.textMuted }]}>
                  {isSyncing
                    ? 'Syncing changes in background...'
                    : pendingCount > 0
                    ? `${pendingCount} offline change(s) waiting to upload`
                    : 'All records are fully up to date'}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.syncStatsGrid, { borderColor: theme.border }]}>
            <View style={styles.syncStatCol}>
              <Text style={[styles.syncStatLabel, { color: theme.textSubtle }]}>LAST CLOUD SYNC</Text>
              <Text style={[styles.syncStatVal, { color: theme.text }]}>{formatLastSync(lastSyncTime)}</Text>
            </View>
            <View style={[styles.syncStatDivider, { backgroundColor: theme.border }]} />
            <View style={styles.syncStatCol}>
              <Text style={[styles.syncStatLabel, { color: theme.textSubtle }]}>PENDING UPLOADS</Text>
              <Text style={[styles.syncStatVal, { color: pendingCount > 0 ? theme.warning : theme.success }]}>
                {pendingCount}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: theme.primary, marginTop: 14 }]}
            onPress={handleManualSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="sync-outline" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.btnText}>Sync with Cloud Now</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Collapsible Custom Endpoint for advanced developers only */}
          <TouchableOpacity
            style={{ marginTop: 12, alignItems: 'center' }}
            onPress={() => setShowAdvancedNetwork(!showAdvancedNetwork)}
          >
            <Text style={{ fontSize: 12, color: theme.textSubtle, textDecorationLine: 'underline' }}>
              {showAdvancedNetwork ? 'Hide Advanced Server Settings' : 'Advanced: Custom Server Configuration'}
            </Text>
          </TouchableOpacity>

          {showAdvancedNetwork && (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border }}>
              <Text style={[styles.fieldLabel, { color: theme.text, fontSize: 12 }]}>Custom API Endpoint</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border, height: 38, fontSize: 13, marginTop: 4 }]}
                value={apiUrl}
                onChangeText={setApiUrl}
                placeholder="https://your-api.com"
                placeholderTextColor={theme.textSubtle}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, marginTop: 8, paddingVertical: 8 }]}
                onPress={handleSaveApiUrl}
              >
                <Text style={[styles.btnText, { color: theme.text, fontSize: 13 }]}>Save Custom URL</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Appearance & Themes */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 16 }]}>Appearance</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingName, { color: theme.text }]}>Dark Mode</Text>
              <Text style={[styles.settingSub, { color: theme.textMuted }]}>
                Switch between high-contrast dark and light productivity themes
              </Text>
            </View>
            <Switch
              value={themeMode === 'dark'}
              onValueChange={toggleTheme}
              thumbColor={themeMode === 'dark' ? theme.primary : '#F1F5F9'}
              trackColor={{ false: '#94A3B8', true: `${theme.primary}60` }}
            />
          </View>
        </View>

        {/* Security / Change Password */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 16 }]}>Security & Authentication</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.securityHeader}>
            <Ionicons name="key-outline" size={18} color={theme.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.fieldLabel, { color: theme.text, fontSize: 14 }]}>Change Account Password</Text>
          </View>
          <Text style={[styles.helperText, { color: theme.textMuted }]}>
            Enter your current password and set a new secure password (min 6 characters).
          </Text>

          {passwordError ? (
            <View style={[styles.feedbackBanner, { backgroundColor: `${theme.danger}18`, borderColor: theme.danger }]}>
              <Ionicons name="alert-circle-outline" size={16} color={theme.danger} style={{ marginRight: 6 }} />
              <Text style={[styles.feedbackText, { color: theme.danger }]}>{passwordError}</Text>
            </View>
          ) : null}

          {passwordSuccess ? (
            <View style={[styles.feedbackBanner, { backgroundColor: `${theme.success}18`, borderColor: theme.success }]}>
              <Ionicons name="checkmark-circle-outline" size={16} color={theme.success} style={{ marginRight: 6 }} />
              <Text style={[styles.feedbackText, { color: theme.success }]}>{passwordSuccess}</Text>
            </View>
          ) : null}

          {/* Current Password */}
          <Text style={[styles.inputLabel, { color: theme.text }]}>Current Password *</Text>
          <View style={[styles.passInputWrapper, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
            <TextInput
              style={[styles.passTextInput, { color: theme.text }]}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor={theme.textSubtle}
              secureTextEntry={!showCurrentPass}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowCurrentPass(!showCurrentPass)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={showCurrentPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* New Password */}
          <Text style={[styles.inputLabel, { color: theme.text }]}>New Password *</Text>
          <View style={[styles.passInputWrapper, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
            <TextInput
              style={[styles.passTextInput, { color: theme.text }]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="At least 6 characters"
              placeholderTextColor={theme.textSubtle}
              secureTextEntry={!showNewPass}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowNewPass(!showNewPass)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={showNewPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Confirm New Password */}
          <Text style={[styles.inputLabel, { color: theme.text }]}>Confirm New Password *</Text>
          <View style={[styles.passInputWrapper, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
            <TextInput
              style={[styles.passTextInput, { color: theme.text }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter new password"
              placeholderTextColor={theme.textSubtle}
              secureTextEntry={!showConfirmPass}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowConfirmPass(!showConfirmPass)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={showConfirmPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: theme.primary, marginTop: 14 }]}
            onPress={handleChangePassword}
            disabled={passwordLoading}
          >
            {passwordLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.btnText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Offline & Cache Management */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 16 }]}>Offline Storage & Cache</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingName, { color: theme.text }]}>Local Cache</Text>
              <Text style={[styles.settingSub, { color: theme.textMuted }]}>
                AsyncStorage caches your latest academic and skill records for offline access.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.actionOutlineBtn, { borderColor: theme.danger }]}
              onPress={handleClearCache}
            >
              <Text style={[styles.actionBtnText, { color: theme.danger }]}>Clear Cache</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 16 }]}>System Notifications</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingName, { color: theme.text }]}>Exam & Class Reminders</Text>
              <Text style={[styles.settingSub, { color: theme.textMuted }]}>
                Alerts before upcoming internal/external exams and planner deadlines
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              thumbColor={notificationsEnabled ? theme.primary : '#F1F5F9'}
              trackColor={{ false: '#94A3B8', true: `${theme.primary}60` }}
            />
          </View>

          <TouchableOpacity
            style={[styles.testBtn, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
            onPress={handleTestNotification}
          >
            <Ionicons name="notifications-outline" size={16} color={theme.text} style={{ marginRight: 6 }} />
            <Text style={[styles.testBtnText, { color: theme.text }]}>Send Test Notification</Text>
          </TouchableOpacity>
        </View>

        {/* Application Information */}
        <View style={styles.appInfo}>
          <Text style={[styles.infoTitle, { color: theme.textSubtle }]}>SkillTracker Enterprise v1.0.0</Text>
          <Text style={[styles.infoSub, { color: theme.textSubtle }]}>
            Student Skills • Academic Management • Productivity Suite
          </Text>
          <Text style={[styles.infoSub, { color: theme.textSubtle }]}>Built with Expo SDK 54 & Express MongoDB</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
  },
  saveBtn: {
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  syncHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  syncStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  syncStatusTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  syncStatusSub: {
    fontSize: 11,
    marginTop: 2,
  },
  syncStatsGrid: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 10,
    marginVertical: 4,
  },
  syncStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  syncStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  syncStatVal: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  syncStatDivider: {
    width: 1,
    height: '100%',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingName: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingSub: {
    fontSize: 12,
    marginTop: 2,
    paddingRight: 10,
  },
  actionOutlineBtn: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  testBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    height: 42,
    marginTop: 14,
  },
  testBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 30,
    gap: 4,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoSub: {
    fontSize: 11,
    textAlign: 'center',
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 5,
  },
  passInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  passTextInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});
