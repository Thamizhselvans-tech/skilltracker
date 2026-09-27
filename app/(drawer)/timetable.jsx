import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { ConfirmModal } from '../../components/ConfirmModal';
import { EmptyState } from '../../components/EmptyState';
import { apiGet, apiPost, apiPut, apiDelete } from '../../services/api';
import { getCachedData } from '../../services/offlineStorage';
import { DAYS_OF_WEEK } from '../../constants/config';
import { useAuth } from '../../hooks/useAuth';

export default function TimetableScreen() {
  const { theme } = useAuth();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Monday');

  // Add / Edit Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    day: 'Monday',
    startTime: '09:00 AM',
    endTime: '10:00 AM',
    faculty: '',
    room: '',
    notes: '',
  });

  // Delete modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // 1. Load cached data immediately on mount (< 30ms render)
  useEffect(() => {
    let isMounted = true;
    const initLoad = async () => {
      try {
        const cached = await getCachedData('/api/timetable');
        if (cached && isMounted) {
          const classList = cached.data || cached.timetable || (Array.isArray(cached) ? cached : []);
          if (classList.length > 0) {
            setClasses(classList.filter(c => !selectedDay || c.day === selectedDay));
            setLoading(false);
          }
        }
      } catch (e) {
        console.warn('Error reading timetable cache:', e);
      }
    };
    initLoad();
    return () => {
      isMounted = false;
    };
  }, [selectedDay]);

  const fetchTimetable = useCallback(async () => {
    try {
      const res = await apiGet(`/api/timetable?day=${selectedDay}`);
      if (res.success && res.data) {
        const classList = res.data.data || res.data.timetable || (Array.isArray(res.data) ? res.data : []);
        setClasses(classList);
      }
    } catch (err) {
      console.warn('Timetable fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDay]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTimetable();
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      subject: '',
      day: selectedDay,
      startTime: '09:00 AM',
      endTime: '10:00 AM',
      faculty: '',
      room: '',
      notes: '',
    });
    setModalVisible(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setCurrentId(item._id);
    setFormData({
      subject: item.subject,
      day: item.day,
      startTime: item.startTime,
      endTime: item.endTime,
      faculty: item.faculty || '',
      room: item.room || '',
      notes: item.notes || '',
    });
    setModalVisible(true);
  };

  const handleSaveClass = async () => {
    if (!formData.subject.trim() || !formData.startTime || !formData.endTime) {
      Alert.alert('Validation Error', 'Subject, start time, and end time are required.');
      return;
    }

    setFormLoading(true);
    let res;
    if (isEditing) {
      res = await apiPut(`/api/timetable/${currentId}`, formData);
    } else {
      res = await apiPost('/api/timetable', formData);
    }
    setFormLoading(false);

    if (res.success) {
      setModalVisible(false);
      fetchTimetable();
    } else {
      Alert.alert('Error', res.error || 'Failed to save timetable entry');
    }
  };

  const confirmDelete = (item) => {
    setItemToDelete(item);
    setDeleteModalVisible(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    const res = await apiDelete(`/api/timetable/${itemToDelete._id}`);
    setDeleteModalVisible(false);
    setItemToDelete(null);
    if (res.success) {
      fetchTimetable();
    }
  };

  const renderClassCard = ({ item }) => (
    <View style={[styles.classCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={[styles.timeBox, { backgroundColor: `${theme.primary}18` }]}>
        <Ionicons name="time-outline" size={16} color={theme.primary} style={{ marginBottom: 4 }} />
        <Text style={[styles.timeStart, { color: theme.primary }]}>{item.startTime}</Text>
        <Text style={[styles.timeEnd, { color: theme.textMuted }]}>{item.endTime}</Text>
      </View>

      <View style={styles.classInfo}>
        <Text style={[styles.subjectName, { color: theme.text }]}>{item.subject}</Text>
        <View style={styles.facultyRow}>
          <Ionicons name="person-outline" size={13} color={theme.textSubtle} />
          <Text style={[styles.infoText, { color: theme.textMuted }]}>
            {item.faculty || 'Faculty not assigned'}
          </Text>
        </View>
        <View style={styles.roomRow}>
          <Ionicons name="location-outline" size={13} color={theme.textSubtle} />
          <Text style={[styles.infoText, { color: theme.textMuted }]}>Room: {item.room || 'TBA'}</Text>
        </View>
        {item.notes ? (
          <Text style={[styles.notesText, { color: theme.textSubtle }]} numberOfLines={1}>
            Note: {item.notes}
          </Text>
        ) : null}
      </View>

      <View style={styles.actionColumn}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.inputBackground }]}
          onPress={() => handleOpenEdit(item)}
        >
          <Ionicons name="create-outline" size={16} color={theme.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: `${theme.danger}15` }]}
          onPress={() => confirmDelete(item)}
        >
          <Ionicons name="trash-outline" size={16} color={theme.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="College Timetable"
        rightComponent={
          <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.primary }]} onPress={handleOpenAdd}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Class</Text>
          </TouchableOpacity>
        }
      />

      {/* Days of week tabs */}
      <View style={styles.daySelectorContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayTabsScroll}>
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = selectedDay === day;
            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayTab,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.inputBackground,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setSelectedDay(day)}
              >
                <Text
                  style={[
                    styles.dayTabText,
                    {
                      color: isSelected ? '#FFFFFF' : theme.textMuted,
                      fontWeight: isSelected ? '800' : '500',
                    },
                  ]}
                >
                  {day.substring(0, 3)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={classes}
          keyExtractor={(item) => item._id}
          renderItem={renderClassCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="school-outline"
              title={`No classes on ${selectedDay}`}
              message={`You have no lectures or lab periods scheduled for ${selectedDay}.`}
              buttonText="Add Class for This Day"
              onPress={handleOpenAdd}
            />
          }
        />
      )}

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {isEditing ? 'Edit Class Period' : 'Add Class to Timetable'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Subject / Course Title *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="e.g. Distributed Operating Systems"
                placeholderTextColor={theme.textSubtle}
                value={formData.subject}
                onChangeText={(v) => setFormData((p) => ({ ...p, subject: v }))}
              />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Day of Week *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {DAYS_OF_WEEK.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.modalChip,
                      {
                        backgroundColor: formData.day === d ? theme.primary : theme.inputBackground,
                        borderColor: formData.day === d ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => setFormData((p) => ({ ...p, day: d }))}
                  >
                    <Text style={{ color: formData.day === d ? '#FFFFFF' : theme.textMuted, fontSize: 12 }}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Start Time *</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                    placeholder="09:00 AM"
                    placeholderTextColor={theme.textSubtle}
                    value={formData.startTime}
                    onChangeText={(v) => setFormData((p) => ({ ...p, startTime: v }))}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>End Time *</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                    placeholder="10:00 AM"
                    placeholderTextColor={theme.textSubtle}
                    value={formData.endTime}
                    onChangeText={(v) => setFormData((p) => ({ ...p, endTime: v }))}
                  />
                </View>
              </View>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Faculty Name / Professor</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="e.g. Prof. Alan Turing"
                placeholderTextColor={theme.textSubtle}
                value={formData.faculty}
                onChangeText={(v) => setFormData((p) => ({ ...p, faculty: v }))}
              />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Classroom / Lab Hall</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="e.g. Science Block Room 302"
                placeholderTextColor={theme.textSubtle}
                value={formData.room}
                onChangeText={(v) => setFormData((p) => ({ ...p, room: v }))}
              />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Notes / Preparation</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="Optional reminder, textbooks, materials..."
                placeholderTextColor={theme.textSubtle}
                value={formData.notes}
                onChangeText={(v) => setFormData((p) => ({ ...p, notes: v }))}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { backgroundColor: theme.inputBackground }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.btnText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: theme.primary }]}
                onPress={handleSaveClass}
                disabled={formLoading}
              >
                {formLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={[styles.btnText, { color: '#FFFFFF' }]}>{isEditing ? 'Save Changes' : 'Save Class'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmModal
        visible={deleteModalVisible}
        title="Delete Timetable Period"
        message={`Are you sure you want to remove "${itemToDelete?.subject}" from your ${selectedDay} timetable?`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  daySelectorContainer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  dayTabsScroll: {
    gap: 8,
  },
  dayTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  dayTabText: {
    fontSize: 13,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  timeBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 80,
    marginRight: 14,
  },
  timeStart: {
    fontSize: 12,
    fontWeight: '800',
  },
  timeEnd: {
    fontSize: 10,
    marginTop: 2,
  },
  classInfo: {
    flex: 1,
    gap: 3,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '700',
  },
  facultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
  },
  notesText: {
    fontSize: 11,
    marginTop: 2,
  },
  actionColumn: {
    gap: 6,
    marginLeft: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalScroll: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  modalChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
  },
  formRow: {
    flexDirection: 'row',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontWeight: '700',
    fontSize: 14,
  },
});
