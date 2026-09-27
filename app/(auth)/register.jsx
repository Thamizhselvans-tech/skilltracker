import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, theme } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    college: '',
    department: '',
    year: '',
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    setErrorMsg('');
    const { name, email, phone, password, confirmPassword } = formData;

    if (!name.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      setErrorMsg('Please fill in all required fields marked with *');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        ...formData,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
      });
      if (res.success) {
        router.replace('/(drawer)');
      } else {
        setErrorMsg(res.error || res.message || 'Registration failed. Please check your information.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Join SkillTracker to manage your academics & skills
          </Text>
        </View>

        {errorMsg ? (
          <View style={[styles.errorBox, { backgroundColor: `${theme.danger}20`, borderColor: theme.danger }]}>
            <Ionicons name="alert-circle" size={18} color={theme.danger} style={{ marginRight: 8 }} />
            <Text style={[styles.errorText, { color: theme.danger }]}>{errorMsg}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          {/* Full Name */}
          <Text style={[styles.label, { color: theme.text }]}>Full Name *</Text>
          <View style={[styles.inputBox, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
            <Ionicons name="person-outline" size={18} color={theme.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="e.g. Alex Johnson"
              placeholderTextColor={theme.textSubtle}
              value={formData.name}
              onChangeText={(val) => updateField('name', val)}
            />
          </View>

          {/* Email */}
          <Text style={[styles.label, { color: theme.text }]}>Email Address *</Text>
          <View style={[styles.inputBox, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
            <Ionicons name="mail-outline" size={18} color={theme.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="alex@college.edu"
              placeholderTextColor={theme.textSubtle}
              autoCapitalize="none"
              keyboardType="email-address"
              value={formData.email}
              onChangeText={(val) => updateField('email', val)}
            />
          </View>

          {/* Phone */}
          <Text style={[styles.label, { color: theme.text }]}>Phone Number *</Text>
          <View style={[styles.inputBox, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
            <Ionicons name="call-outline" size={18} color={theme.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="+1 (555) 000-0000"
              placeholderTextColor={theme.textSubtle}
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(val) => updateField('phone', val)}
            />
          </View>

          {/* College */}
          <Text style={[styles.label, { color: theme.text }]}>College / University</Text>
          <View style={[styles.inputBox, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
            <Ionicons name="school-outline" size={18} color={theme.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Institute of Technology"
              placeholderTextColor={theme.textSubtle}
              value={formData.college}
              onChangeText={(val) => updateField('college', val)}
            />
          </View>

          {/* Department */}
          <Text style={[styles.label, { color: theme.text }]}>Department / Major</Text>
          <View style={[styles.inputBox, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
            <Ionicons name="book-outline" size={18} color={theme.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Computer Science & Engineering"
              placeholderTextColor={theme.textSubtle}
              value={formData.department}
              onChangeText={(val) => updateField('department', val)}
            />
          </View>

          {/* Year */}
          <Text style={[styles.label, { color: theme.text }]}>Academic Year</Text>
          <View style={[styles.inputBox, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
            <Ionicons name="time-outline" size={18} color={theme.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="e.g. 3rd Year / Semester 5"
              placeholderTextColor={theme.textSubtle}
              value={formData.year}
              onChangeText={(val) => updateField('year', val)}
            />
          </View>

          {/* Password */}
          <Text style={[styles.label, { color: theme.text }]}>Password *</Text>
          <View style={[styles.inputBox, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
            <Ionicons name="lock-closed-outline" size={18} color={theme.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="At least 6 characters"
              placeholderTextColor={theme.textSubtle}
              secureTextEntry={!showPassword}
              value={formData.password}
              onChangeText={(val) => updateField('password', val)}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 6 }}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={theme.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <Text style={[styles.label, { color: theme.text }]}>Confirm Password *</Text>
          <View style={[styles.inputBox, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
            <Ionicons name="lock-closed-outline" size={18} color={theme.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Re-enter password"
              placeholderTextColor={theme.textSubtle}
              secureTextEntry={!showPassword}
              value={formData.confirmPassword}
              onChangeText={(val) => updateField('confirmPassword', val)}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: theme.primary }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: theme.textMuted }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={[styles.footerLink, { color: theme.primary }]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    marginBottom: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
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
  form: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
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
});
