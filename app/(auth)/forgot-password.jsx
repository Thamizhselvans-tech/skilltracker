import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiPost } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { theme } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleReset = async () => {
    setErrorMsg('');
    setSuccessMessage('');
    if (!email.trim()) {
      setErrorMsg('Please enter your email address');
      return;
    }

    setLoading(true);
    const res = await apiPost('/api/auth/forgot-password', { email: email.trim() });
    setLoading(false);

    if (res.success) {
      setSuccessMessage('Reset instructions have been sent to your email.');
    } else {
      setErrorMsg(res.error || 'Failed to send password reset request.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={theme.text} />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: `${theme.primary}18` }]}>
          <Ionicons name="key-outline" size={32} color={theme.primary} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Reset Password</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Enter your registered email address and we'll send you instructions to reset your password.
        </Text>
      </View>

      {errorMsg ? (
        <View style={[styles.errorBox, { backgroundColor: `${theme.danger}20`, borderColor: theme.danger }]}>
          <Ionicons name="alert-circle" size={18} color={theme.danger} style={{ marginRight: 8 }} />
          <Text style={[styles.errorText, { color: theme.danger }]}>{errorMsg}</Text>
        </View>
      ) : null}

      {successMessage ? (
        <View style={[styles.successBox, { backgroundColor: `${theme.success}20`, borderColor: theme.success }]}>
          <Ionicons name="checkmark-circle" size={18} color={theme.success} style={{ marginRight: 8 }} />
          <Text style={[styles.successText, { color: theme.success }]}>{successMessage}</Text>
        </View>
      ) : null}

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

      <TouchableOpacity
        style={[styles.submitBtn, { backgroundColor: theme.primary }]}
        onPress={handleReset}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitBtnText}>Send Reset Link</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.returnBtn} onPress={() => router.push('/(auth)/login')}>
        <Text style={[styles.returnText, { color: theme.textMuted }]}>Return to Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 300,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
    fontWeight: '600',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  successText: {
    fontSize: 13,
    flex: 1,
    fontWeight: '600',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
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
  submitBtn: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    elevation: 2,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  returnBtn: {
    alignItems: 'center',
    marginTop: 18,
    padding: 10,
  },
  returnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
