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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { getBaseApiUrl, setCustomApiUrl } from '../../services/api';
import { clearAllCache } from '../../services/offlineStorage';
import { scheduleLocalReminder } from '../../services/notificationService';
import { useAuth } from '../../hooks/useAuth';

export default function SettingsScreen() {
  const { theme, themeMode, toggleTheme, user } = useAuth();

  const [apiUrl, setApiUrl] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    getBaseApiUrl().then((url) => setApiUrl(url));
  }, []);

  const handleSaveApiUrl = async () => {
    if (!apiUrl.trim()) {
      Alert.alert('Validation Error', 'API URL cannot be empty');
      return;
    }
    await setCustomApiUrl(apiUrl);
    Alert.alert('Saved', 'API URL updated to: ' + apiUrl);
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Settings" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Network & Backend Configuration */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Network & Backend Server</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.fieldLabel, { color: theme.text }]}>Backend Server URL</Text>
          <Text style={[styles.helperText, { color: theme.textMuted }]}>
            Android Emulator: http://10.0.2.2:5000 • Physical Phone: http://YOUR_PC_IP:5000
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="http://10.0.2.2:5000"
            placeholderTextColor={theme.textSubtle}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: theme.primary }]}
            onPress={handleSaveApiUrl}
          >
            <Text style={styles.btnText}>Save Server URL</Text>
          </TouchableOpacity>
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

        {/* Offline & Cache Management */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 16 }]}>Offline Storage & Cache</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingName, { color: theme.text }]}>Local Cache</Text>
              <Text style={[styles.settingSub, { color: theme.textMuted }]}>
                AsyncStorage caches your latest academic and startup records for offline access.
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
            Student Skills • Academic Management • Productivity • Startup Suite
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
});
