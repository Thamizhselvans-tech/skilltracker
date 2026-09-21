import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '../../components/Header';
import { ConfirmModal } from '../../components/ConfirmModal';
import { updateProfile } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, refreshUser, theme } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    college: user?.college || '',
    department: user?.department || '',
    year: user?.year || '',
    bio: user?.bio || '',
  });

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Full Name is required');
      return;
    }

    setLoading(true);
    const res = await updateProfile(formData);
    setLoading(false);

    if (res.success) {
      await refreshUser();
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } else {
      Alert.alert('Error', res.error || 'Failed to update profile');
    }
  };

  const handleLogout = async () => {
    setLogoutModalVisible(false);
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Student Profile"
        rightComponent={
          !isEditing ? (
            <TouchableOpacity
              style={[styles.editBtn, { backgroundColor: theme.inputBackground }]}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="create-outline" size={18} color={theme.text} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.saveHeaderBtn, { backgroundColor: theme.primary }]} onPress={handleSave}>
              <Text style={styles.saveHeaderText}>Done</Text>
            </TouchableOpacity>
          )
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar & Header Card */}
        <View style={[styles.avatarCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <View style={[styles.avatarLarge, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarLetter}>{user?.name ? user.name.charAt(0).toUpperCase() : 'S'}</Text>
          </View>
          <Text style={[styles.profileName, { color: theme.text }]}>{user?.name || 'Student'}</Text>
          <Text style={[styles.profileEmail, { color: theme.textMuted }]}>{user?.email || 'N/A'}</Text>
          <View style={[styles.academicBadge, { backgroundColor: `${theme.primary}18` }]}>
            <Text style={[styles.academicText, { color: theme.primary }]}>
              {[user?.year, user?.department || user?.college].filter(Boolean).join(' • ') || 'Verified Student'}
            </Text>
          </View>
        </View>

        {/* Profile Details Form */}
        <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.formHeading, { color: theme.text }]}>Personal & Academic Details</Text>

          {/* Full Name */}
          <Text style={[styles.label, { color: theme.text }]}>Full Name</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                color: theme.text,
                borderColor: theme.border,
                opacity: isEditing ? 1 : 0.8,
              },
            ]}
            value={formData.name}
            onChangeText={(v) => setFormData((p) => ({ ...p, name: v }))}
            editable={isEditing}
          />

          {/* Email (Read only) */}
          <Text style={[styles.label, { color: theme.text }]}>Registered Email (Read-only)</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                color: theme.textSubtle,
                borderColor: theme.border,
                opacity: 0.6,
              },
            ]}
            value={user?.email || ''}
            editable={false}
          />

          {/* Phone */}
          <Text style={[styles.label, { color: theme.text }]}>Phone Number</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                color: theme.text,
                borderColor: theme.border,
                opacity: isEditing ? 1 : 0.8,
              },
            ]}
            value={formData.phone}
            onChangeText={(v) => setFormData((p) => ({ ...p, phone: v }))}
            editable={isEditing}
          />

          {/* College */}
          <Text style={[styles.label, { color: theme.text }]}>College / University</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                color: theme.text,
                borderColor: theme.border,
                opacity: isEditing ? 1 : 0.8,
              },
            ]}
            value={formData.college}
            onChangeText={(v) => setFormData((p) => ({ ...p, college: v }))}
            editable={isEditing}
          />

          {/* Department */}
          <Text style={[styles.label, { color: theme.text }]}>Department / Branch</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                color: theme.text,
                borderColor: theme.border,
                opacity: isEditing ? 1 : 0.8,
              },
            ]}
            value={formData.department}
            onChangeText={(v) => setFormData((p) => ({ ...p, department: v }))}
            editable={isEditing}
          />

          {/* Year */}
          <Text style={[styles.label, { color: theme.text }]}>Academic Year</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                color: theme.text,
                borderColor: theme.border,
                opacity: isEditing ? 1 : 0.8,
              },
            ]}
            value={formData.year}
            onChangeText={(v) => setFormData((p) => ({ ...p, year: v }))}
            editable={isEditing}
          />

          {/* Bio */}
          <Text style={[styles.label, { color: theme.text }]}>Bio & Career Goals</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: theme.inputBackground,
                color: theme.text,
                borderColor: theme.border,
                opacity: isEditing ? 1 : 0.8,
              },
            ]}
            placeholder="e.g. Aspiring Full-Stack Software Engineer & Tech Founder"
            placeholderTextColor={theme.textSubtle}
            multiline
            numberOfLines={3}
            value={formData.bio}
            onChangeText={(v) => setFormData((p) => ({ ...p, bio: v }))}
            editable={isEditing}
          />

          {isEditing && (
            <TouchableOpacity
              style={[styles.submitSaveBtn, { backgroundColor: theme.primary }]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.btnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* 15. Logout Button */}
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: theme.danger }]}
          onPress={() => setLogoutModalVisible(true)}
        >
          <Ionicons name="log-out-outline" size={20} color={theme.danger} style={{ marginRight: 8 }} />
          <Text style={[styles.logoutText, { color: theme.danger }]}>Sign Out of SkillTracker</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Logout Confirmation */}
      <ConfirmModal
        visible={logoutModalVisible}
        title="Sign Out"
        message="Are you sure you want to sign out of your account on this device?"
        confirmText="Sign Out"
        onConfirm={handleLogout}
        onCancel={() => setLogoutModalVisible(false)}
      />
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
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveHeaderBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveHeaderText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  avatarCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarLetter: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
  },
  profileEmail: {
    fontSize: 13,
    marginTop: 3,
  },
  academicBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  academicText: {
    fontSize: 11,
    fontWeight: '700',
  },
  formCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  formHeading: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  submitSaveBtn: {
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    height: 50,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
