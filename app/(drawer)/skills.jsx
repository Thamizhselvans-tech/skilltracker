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
import { ProgressBar } from '../../components/ProgressBar';
import { ConfirmModal } from '../../components/ConfirmModal';
import { EmptyState } from '../../components/EmptyState';
import { apiGet, apiPost, apiPut, apiDelete } from '../../services/api';
import { SKILL_CATEGORIES, SKILL_LEVELS } from '../../constants/config';
import { useAuth } from '../../hooks/useAuth';

export default function SkillsScreen() {
  const { theme } = useAuth();

  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Add / Edit Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Programming',
    description: '',
    skillLevel: 'Beginner',
    progress: '0',
    targetDate: '',
    notes: '',
  });

  // Delete Confirm Modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchSkills = useCallback(async () => {
    try {
      let endpoint = '/api/skills';
      const params = [];
      if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`);
      if (selectedCategory !== 'All') params.push(`category=${encodeURIComponent(selectedCategory)}`);
      if (params.length > 0) endpoint += `?${params.join('&')}`;

      const res = await apiGet(endpoint);
      if (res.success && res.data?.data) {
        setSkills(res.data.data);
      }
    } catch (err) {
      console.warn('Skills load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSkills();
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      name: '',
      category: 'Programming',
      description: '',
      skillLevel: 'Beginner',
      progress: '0',
      targetDate: '',
      notes: '',
    });
    setModalVisible(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setCurrentId(item._id);
    setFormData({
      name: item.name,
      category: item.category || 'General',
      description: item.description || '',
      skillLevel: item.skillLevel || 'Beginner',
      progress: String(item.progress || 0),
      targetDate: item.targetDate ? item.targetDate.split('T')[0] : '',
      notes: item.notes || '',
    });
    setModalVisible(true);
  };

  const handleSaveSkill = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Skill name is required');
      return;
    }

    const payload = {
      ...formData,
      progress: Math.min(100, Math.max(0, parseInt(formData.progress, 10) || 0)),
    };

    setFormLoading(true);
    let res;
    if (isEditing) {
      res = await apiPut(`/api/skills/${currentId}`, payload);
    } else {
      res = await apiPost('/api/skills', payload);
    }
    setFormLoading(false);

    if (res.success) {
      setModalVisible(false);
      fetchSkills();
    } else {
      Alert.alert('Error', res.error || 'Failed to save skill');
    }
  };

  const confirmDelete = (item) => {
    setItemToDelete(item);
    setDeleteModalVisible(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    const res = await apiDelete(`/api/skills/${itemToDelete._id}`);
    setDeleteModalVisible(false);
    setItemToDelete(null);
    if (res.success) {
      fetchSkills();
    } else {
      Alert.alert('Error', res.error || 'Failed to delete skill');
    }
  };

  const renderSkillCard = ({ item }) => (
    <View style={[styles.skillCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <View style={styles.tagRow}>
            <View style={[styles.categoryTag, { backgroundColor: `${theme.primary}18` }]}>
              <Text style={[styles.categoryText, { color: theme.primary }]}>{item.category}</Text>
            </View>
            <View style={[styles.levelTag, { backgroundColor: theme.inputBackground }]}>
              <Text style={[styles.levelText, { color: theme.textMuted }]}>{item.skillLevel}</Text>
            </View>
          </View>
          <Text style={[styles.skillName, { color: theme.text }]}>{item.name}</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.inputBackground }]}
            onPress={() => handleOpenEdit(item)}
          >
            <Ionicons name="create-outline" size={18} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: `${theme.danger}15` }]}
            onPress={() => confirmDelete(item)}
          >
            <Ionicons name="trash-outline" size={18} color={theme.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {item.description ? (
        <Text style={[styles.description, { color: theme.textMuted }]} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      <View style={styles.progressSection}>
        <View style={styles.progressLabelRow}>
          <Text style={[styles.progressLabel, { color: theme.textMuted }]}>Proficiency</Text>
          <Text style={[styles.progressValue, { color: theme.primary }]}>{item.progress}%</Text>
        </View>
        <ProgressBar progress={item.progress} color={theme.primary} height={7} />
      </View>

      {item.notes ? (
        <View style={[styles.notesBox, { backgroundColor: theme.inputBackground }]}>
          <Ionicons name="information-circle-outline" size={14} color={theme.textSubtle} style={{ marginRight: 6 }} />
          <Text style={[styles.notesText, { color: theme.textSubtle }]} numberOfLines={1}>
            {item.notes}
          </Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="My Skills"
        rightComponent={
          <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.primary }]} onPress={handleOpenAdd}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        }
      />

      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search skills by name..."
        filterOptions={SKILL_CATEGORIES}
        selectedFilter={selectedCategory}
        onFilterChange={setSelectedCategory}
      />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={skills}
          keyExtractor={(item) => item._id}
          renderItem={renderSkillCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="ribbon-outline"
              title="No skills added yet"
              message="Track programming, academic, or professional skills to measure your growth."
              buttonText="Add Your First Skill"
              onPress={handleOpenAdd}
            />
          }
        />
      )}

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {isEditing ? 'Edit Skill' : 'Add New Skill'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Skill Name *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="e.g. React Native & Mobile Systems"
                placeholderTextColor={theme.textSubtle}
                value={formData.name}
                onChangeText={(v) => setFormData((p) => ({ ...p, name: v }))}
              />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {SKILL_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.modalChip,
                      {
                        backgroundColor: formData.category === cat ? theme.primary : theme.inputBackground,
                        borderColor: formData.category === cat ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => setFormData((p) => ({ ...p, category: cat }))}
                  >
                    <Text style={{ color: formData.category === cat ? '#FFFFFF' : theme.textMuted, fontSize: 12 }}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Skill Level</Text>
              <View style={styles.levelRow}>
                {SKILL_LEVELS.filter((l) => l !== 'All').map((lvl) => (
                  <TouchableOpacity
                    key={lvl}
                    style={[
                      styles.modalChip,
                      {
                        flex: 1,
                        alignItems: 'center',
                        backgroundColor: formData.skillLevel === lvl ? theme.primary : theme.inputBackground,
                        borderColor: formData.skillLevel === lvl ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => setFormData((p) => ({ ...p, skillLevel: lvl }))}
                  >
                    <Text style={{ color: formData.skillLevel === lvl ? '#FFFFFF' : theme.textMuted, fontSize: 11 }}>
                      {lvl}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Progress Percentage (0 - 100)%</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="0 - 100"
                placeholderTextColor={theme.textSubtle}
                keyboardType="numeric"
                value={formData.progress}
                onChangeText={(v) => setFormData((p) => ({ ...p, progress: v }))}
              />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Description</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="Brief summary of syllabus, frameworks, or topics..."
                placeholderTextColor={theme.textSubtle}
                multiline
                numberOfLines={3}
                value={formData.description}
                onChangeText={(v) => setFormData((p) => ({ ...p, description: v }))}
              />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Notes / Milestone</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="Optional notes or milestone target"
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
                onPress={handleSaveSkill}
                disabled={formLoading}
              >
                {formLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={[styles.btnText, { color: '#FFFFFF' }]}>{isEditing ? 'Save Changes' : 'Create Skill'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={deleteModalVisible}
        title="Delete Skill"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? All practice records for this skill will remain.`}
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
  skillCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  levelTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  levelText: {
    fontSize: 11,
  },
  skillName: {
    fontSize: 17,
    fontWeight: '800',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  progressSection: {
    marginTop: 12,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '700',
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
  textArea: {
    height: 70,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  levelRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  modalChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
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
