import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { getBaseApiUrl, setCustomApiUrl } from '../../services/api';
import { DEFAULT_API_URL } from '../../constants/config';

export default function LoginScreen() {
  const router = useRouter();
  const { login, demoLogin, theme } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  // Server IP config state
  const [serverUrl, setServerUrl] = useState(DEFAULT_API_URL);
  const [modalVisible, setModalVisible] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    getBaseApiUrl().then((url) => {
      if (url) {
        setServerUrl(url);
        setCustomUrlInput(url);
      }
    });
  }, []);

  const handleLogin = async () => {
    setErrorMsg('');
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login({ email: email.trim().toLowerCase(), password });
      if (res.success) {
        router.replace('/(drawer)');
      } else {
        setErrorMsg(res.error || res.message || 'Unable to sign in. Please verify credentials.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      await demoLogin();
      router.replace('/(drawer)');
    } catch (err) {
      setErrorMsg(err.message || 'Demo login failed');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleSaveServerUrl = async (newUrl) => {
    const trimmed = (newUrl || customUrlInput).trim().replace(/\/+$/, '');
    if (!trimmed) return;
    await setCustomApiUrl(trimmed);
    setServerUrl(trimmed);
    setModalVisible(false);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const trimmed = customUrlInput.trim().replace(/\/+$/, '');
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${trimmed}/api/health`, { signal: controller.signal });
      clearTimeout(tid);
      if (res.ok) {
        setTestResult({ success: true, message: 'Server reached successfully!' });
      } else {
        setTestResult({ success: false, message: `Server responded with status ${res.status}` });
      }
    } catch (e) {
      setTestResult({ success: false, message: 'Cannot reach server: ' + (e.message || 'Timeout') });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.serverBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => {
              setCustomUrlInput(serverUrl);
              setTestResult(null);
              setModalVisible(true);
            }}
          >
            <View style={styles.onlineDot} />
            <Text style={[styles.serverBadgeText, { color: theme.textMuted }]} numberOfLines={1}>
              Server IP
            </Text>
            <Ionicons name="settings-outline" size={14} color={theme.primary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <View style={styles.logoBadgeContainer}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>SkillTracker</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Student Skill & Startup Management System
          </Text>
        </View>

        {errorMsg ? (
          <View style={[styles.errorBox, { backgroundColor: `${theme.danger}15`, borderColor: theme.danger }]}>
            <Ionicons name="alert-circle" size={20} color={theme.danger} style={{ marginRight: 8, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.errorText, { color: theme.danger }]}>{errorMsg}</Text>
              <View style={styles.errorActionsRow}>
                <TouchableOpacity
                  style={[styles.quickDemoActionBtn, { backgroundColor: theme.primary }]}
                  onPress={handleDemoLogin}
                >
                  <Ionicons name="flash" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.quickDemoActionText}>Instant Offline Demo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickIpActionBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
                  onPress={() => setModalVisible(true)}
                >
                  <Text style={[styles.quickIpActionText, { color: theme.text }]}>Edit IP</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.form}>
          {/* Email */}
          <Text style={[styles.label, { color: theme.text }]}>Email Address</Text>
          <View style={[styles.inputBox, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
            <Ionicons name="mail-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="student@college.edu"
              placeholderTextColor={theme.textSubtle}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password */}
          <Text style={[styles.label, { color: theme.text }]}>Password</Text>
          <View style={[styles.inputBox, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="••••••••"
              placeholderTextColor={theme.textSubtle}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={theme.textMuted}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <Text style={[styles.forgotText, { color: theme.primary }]}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: theme.primary }]}
            onPress={handleLogin}
            disabled={loading || demoLoading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Instant Demo Login Button */}
          <TouchableOpacity
            style={[styles.demoBtn, { backgroundColor: '#059669' }]}
            onPress={handleDemoLogin}
            disabled={loading || demoLoading}
          >
            {demoLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.demoBtnRow}>
                <Ionicons name="flash" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.demoBtnText}>Instant Demo Login (Zero Wait)</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: theme.textMuted }]}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={[styles.footerLink, { color: theme.primary }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Server IP Config Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Backend Server Settings</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDescription, { color: theme.textMuted }]}>
              Enter the IP address of the machine running the Node.js backend.
            </Text>

            <View style={[styles.inputBox, { backgroundColor: theme.inputBackground, borderColor: theme.border, marginVertical: 12 }]}>
              <Ionicons name="globe-outline" size={20} color={theme.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={customUrlInput}
                onChangeText={setCustomUrlInput}
                placeholder="http://192.168.1.100:5000"
                placeholderTextColor={theme.textSubtle}
                autoCapitalize="none"
              />
            </View>

            {testResult ? (
              <View style={[styles.testResultBox, { backgroundColor: testResult.success ? '#10B98120' : '#EF444420' }]}>
                <Ionicons
                  name={testResult.success ? 'checkmark-circle' : 'alert-circle'}
                  size={16}
                  color={testResult.success ? '#10B981' : '#EF4444'}
                  style={{ marginRight: 6 }}
                />
                <Text style={{ color: testResult.success ? '#10B981' : '#EF4444', fontSize: 13, fontWeight: '600', flex: 1 }}>
                  {testResult.message}
                </Text>
              </View>
            ) : null}

            <View style={styles.presetsRow}>
              <Text style={[styles.presetsTitle, { color: theme.textMuted }]}>Quick Presets:</Text>
              <TouchableOpacity
                style={[styles.presetChip, { borderColor: theme.border, backgroundColor: theme.background }]}
                onPress={() => setCustomUrlInput('http://10.10.6.138:5000')}
              >
                <Text style={[styles.presetText, { color: theme.primary }]}>10.10.6.138:5000</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.presetChip, { borderColor: theme.border, backgroundColor: theme.background }]}
                onPress={() => setCustomUrlInput('http://10.0.2.2:5000')}
              >
                <Text style={[styles.presetText, { color: theme.primary }]}>Emulator (10.0.2.2)</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.testBtn, { borderColor: theme.primary }]}
                onPress={handleTestConnection}
                disabled={testingConnection}
              >
                {testingConnection ? (
                  <ActivityIndicator color={theme.primary} size="small" />
                ) : (
                  <Text style={[styles.testBtnText, { color: theme.primary }]}>Test Connection</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                onPress={() => handleSaveServerUrl()}
              >
                <Text style={styles.saveBtnText}>Save & Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  serverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  serverBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadgeContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  errorActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  quickDemoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  quickDemoActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  quickIpActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickIpActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  form: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 6,
    marginBottom: 12,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    elevation: 2,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  demoBtn: {
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
  },
  demoBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  demoBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  testResultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  presetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 10,
  },
  presetsTitle: {
    fontSize: 12,
    fontWeight: '600',
    width: '100%',
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  testBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
