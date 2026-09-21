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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { SearchFilterBar } from '../../components/SearchFilterBar';
import { ConfirmModal } from '../../components/ConfirmModal';
import { EmptyState } from '../../components/EmptyState';
import { apiGet, apiPost, apiPut, apiDelete } from '../../services/api';
import { EXTERNAL_EXAM_TYPES } from '../../constants/config';
import { useAuth } from '../../hooks/useAuth';

export default function ExternalExamsScreen() {
  const { theme } = useAuth();

  const [exams, setExams] = useState([]);
  const [nextExamId, setNextExamId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  // Add / Edit Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    subject: '',
    examType: 'University Theory',
    examDate: todayStr,
    startTime: '02:00 PM',
    endTime: '05:00 PM',
    room: '',
    semester: 'Semester 5',
    notes: '',
  });

  // Delete Confirm Modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchExams = useCallback(async () => {
    try {
      let endpoint = '/api/external-exams';
      const params = [];
      if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`);
      if (selectedType !== 'All') params.push(`examType=${encodeURIComponent(selectedType)}`);
      if (params.length > 0) endpoint += `?${params.join('&')}`;

      const res = await apiGet(endpoint);
      if (res.success && res.data) {
        const list = res.data.data || res.data.externalExams || (Array.isArray(res.data) ? res.data : []);
        setExams(list);
        setNextExamId(res.data.nextExamId || (list[0] ? list[0]._id : null));
      }
    } catch (err) {
      console.warn('External exams fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedType]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchExams();
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      subject: '',
      examType: 'University Theory',
      examDate: todayStr,
      startTime: '02:00 PM',
      endTime: '05:00 PM',
      room: '',
      semester: 'Semester 5',
      notes: '',
    });
    setModalVisible(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setCurrentId(item._id);
    setFormData({
      subject: item.subject || '',
      examType: item.examType || 'University Theory',
      examDate: item.examDate ? item.examDate.split('T')[0] : todayStr,
      startTime: item.startTime || '02:00 PM',
      endTime: item.endTime || '05:00 PM',
      room: item.room || item.centerName || '',
      semester: item.semester || '',
      notes: item.notes || item.syllabus || '',
    });
    setModalVisible(true);
  };

  const handleSaveExam = async () => {
    const { subject, examType, examDate, startTime, endTime } = formData;
    if (!subject.trim() || !examType.trim() || !examDate.trim() || !startTime.trim() || !endTime.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    setFormLoading(true);
    let res;
    if (isEditing) {
      // Optimistic update
      setExams((prev) => prev.map((e) => (e._id === currentId ? { ...e, ...formData } : e)));
      res = await apiPut(`/api/external-exams/${currentId}`, formData);
    } else {
      const tempId = 'loc_' + Date.now();
      const newExam = { _id: tempId, ...formData, createdAt: new Date().toISOString() };
      // Optimistic prepend
      setExams((prev) => [newExam, ...prev]);
      res = await apiPost('/api/external-exams', { ...formData, _id: tempId });
    }
    setFormLoading(false);

    if (res.success) {
      setModalVisible(false);
      fetchExams();
    } else {
      Alert.alert('Notice', res.error || 'Saved locally');
    }
  };

  const confirmDelete = (item) => {
    setItemToDelete(item);
    setDeleteModalVisible(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    const targetId = itemToDelete._id;
    // Optimistic delete
    setExams((prev) => prev.filter((e) => e._id !== targetId));
    setDeleteModalVisible(false);
    setItemToDelete(null);

    const res = await apiDelete(`/api/external-exams/${targetId}`);
    if (!res.success) {
      console.warn('Delete queued or failed:', res.error);
    }
    fetchExams();
  };

  const renderExamCard = ({ item }) => {
    const isNext = item._id === nextExamId;

    return (
      <View
        style={[
          styles.examCard,
          { backgroundColor: theme.card, borderColor: isNext ? theme.accent : theme.cardBorder },
          isNext && { borderWidth: 2 },
        ]}
      >
        {isNext && (
          <View style={[styles.nextBadge, { backgroundColor: theme.accent }]}>
            <Ionicons name="flag" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.nextBadgeText}>NEXT UPCOMING UNIVERSITY EXAM</Text>
          </View>
        )}

        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.tagsRow}>
              <View style={[styles.typeBadge, { backgroundColor: `${theme.accent}18` }]}>
                <Text style={[styles.typeBadgeText, { color: theme.accent }]}>{item.examType}</Text>
              </View>
              {item.semester ? (
                <View style={[styles.semBadge, { backgroundColor: theme.inputBackground }]}>
                  <Text style={[styles.semBadgeText, { color: theme.textMuted }]}>{item.semester}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.subjectTitle, { color: theme.text }]}>{item.subject}</Text>
          </View>

          <View style={styles.actions}>
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

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color={theme.accent} />
            <Text style={[styles.detailText, { color: theme.text }]}>{item.examDate}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={14} color={theme.accent} />
            <Text style={[styles.detailText, { color: theme.text }]}>
              {item.startTime} - {item.endTime}
            </Text>
          </View>
          {item.room ? (
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={14} color={theme.textSubtle} />
              <Text style={[styles.detailText, { color: theme.textMuted }]}>Room: {item.room}</Text>
            </View>
          ) : null}
        </View>

        {item.notes ? (
          <View style={[styles.notesBox, { backgroundColor: theme.inputBackground }]}>
            <Ionicons name="information-circle-outline" size={14} color={theme.textSubtle} style={{ marginRight: 6 }} />
            <Text style={[styles.notesText, { color: theme.textSubtle }]}>{item.notes}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="External Exams"
        rightComponent={
          <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.accent }]} onPress={handleOpenAdd}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Exam</Text>
          </TouchableOpacity>
        }
      />

      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search external exams by subject..."
        filterOptions={EXTERNAL_EXAM_TYPES}
        selectedFilter={selectedType}
        onFilterChange={setSelectedType}
      />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : (
        <FlatList
          data={exams}
          keyExtractor={(item) => item._id}
          renderItem={renderExamCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
          ListEmptyComponent={
            <EmptyState
              icon="newspaper-outline"
              title="No external exams added yet."
              message="Add university finals, practical lab boards, and external theory exams."
              buttonText="Add External Exam"
              onPress={handleOpenAdd}
            />
          }
        />
      )}

      {/* Add / Edit Exam Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {isEditing ? 'Edit External Exam' : '+ Add External Exam'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Subject *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="e.g. Distributed Cloud Computing University Board"
                placeholderTextColor={theme.textSubtle}
                value={formData.subject}
                onChangeText={(v) => setFormData((p) => ({ ...p, subject: v }))}
              />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Exam Type *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {EXTERNAL_EXAM_TYPES.filter((t) => t !== 'All').map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.modalChip,
                      {
                        backgroundColor: formData.examType === type ? theme.accent : theme.inputBackground,
                        borderColor: formData.examType === type ? theme.accent : theme.border,
                      },
                    ]}
                    onPress={() => setFormData((p) => ({ ...p, examType: type }))}
                  >
                    <Text style={{ color: formData.examType === type ? '#FFFFFF' : theme.textMuted, fontSize: 12 }}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Exam Date (YYYY-MM-DD) *</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.textSubtle}
                    value={formData.examDate}
                    onChangeText={(v) => setFormData((p) => ({ ...p, examDate: v }))}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Semester</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                    placeholder="e.g. Semester 5"
                    placeholderTextColor={theme.textSubtle}
                    value={formData.semester}
                    onChangeText={(v) => setFormData((p) => ({ ...p, semester: v }))}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Start Time *</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                    placeholder="02:00 PM"
                    placeholderTextColor={theme.textSubtle}
                    value={formData.startTime}
                    onChangeText={(v) => setFormData((p) => ({ ...p, startTime: v }))}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>End Time *</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                    placeholder="05:00 PM"
                    placeholderTextColor={theme.textSubtle}
                    value={formData.endTime}
                    onChangeText={(v) => setFormData((p) => ({ ...p, endTime: v }))}
                  />
                </View>
              </View>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Examination Center / Room</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="e.g. University Center Main Hall 4"
                placeholderTextColor={theme.textSubtle}
                value={formData.room}
                onChangeText={(v) => setFormData((p) => ({ ...p, room: v }))}
              />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Instructions / Notes</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="Carry Hall Ticket and ID card, no smartwatches..."
                placeholderTextColor={theme.textSubtle}
                multiline
                numberOfLines={3}
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
                style={[styles.modalSaveBtn, { backgroundColor: theme.accent }]}
                onPress={handleSaveExam}
                disabled={formLoading}
              >
                {formLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={[styles.btnText, { color: '#FFFFFF' }]}>{isEditing ? 'Update Exam' : 'Save Exam'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={deleteModalVisible}
        title="Delete External Exam"
        message="Are you sure you want to delete this external exam?"
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
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  examCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  nextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  nextBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  semBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  semBadgeText: {
    fontSize: 11,
  },
  subjectTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
  },
  notesText: {
    fontSize: 11,
    flex: 1,
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
  textArea: {
    height: 70,
    textAlignVertical: 'top',
    paddingTop: 8,
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
