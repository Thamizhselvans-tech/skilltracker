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
import { TASK_PRIORITIES, TASK_STATUSES } from '../../constants/config';
import { scheduleLocalReminder } from '../../services/notificationService';
import { useAuth } from '../../hooks/useAuth';

export default function PlannerScreen() {
  const { theme } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Add / Edit Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    task: '',
    date: todayStr,
    time: '12:00',
    priority: 'Medium',
    category: 'Academic',
    description: '',
    status: 'Pending',
    reminder: true,
  });

  // Delete modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchTasks = useCallback(async () => {
    try {
      let endpoint = '/api/planner';
      const params = [];
      if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`);
      if (selectedPriority !== 'All') params.push(`priority=${encodeURIComponent(selectedPriority)}`);
      if (selectedStatus !== 'All') params.push(`status=${encodeURIComponent(selectedStatus)}`);
      if (params.length > 0) endpoint += `?${params.join('&')}`;

      const res = await apiGet(endpoint);
      if (res.success && res.data) {
        const list = res.data.data || res.data.tasks || (Array.isArray(res.data) ? res.data : []);
        setTasks(list);
      }
    } catch (err) {
      console.warn('Planner fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedPriority, selectedStatus]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      task: '',
      date: todayStr,
      time: '12:00',
      priority: 'Medium',
      category: 'Academic',
      description: '',
      status: 'Pending',
      reminder: true,
    });
    setModalVisible(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setCurrentId(item._id);
    setFormData({
      task: item.task || item.title || '',
      date: item.date || todayStr,
      time: item.time || '',
      priority: item.priority || 'Medium',
      category: item.category || 'Academic',
      description: item.description || '',
      status: item.status || 'Pending',
      reminder: Boolean(item.reminder),
    });
    setModalVisible(true);
  };

  const handleSaveTask = async () => {
    if (!formData.task.trim() || !formData.date.trim()) {
      Alert.alert('Validation Error', 'Task title and date are required');
      return;
    }

    setFormLoading(true);
    let res;
    if (isEditing) {
      // Optimistic update
      setTasks((prev) => prev.map((t) => (t._id === currentId ? { ...t, ...formData } : t)));
      res = await apiPut(`/api/planner/${currentId}`, formData);
    } else {
      const tempId = 'loc_' + Date.now();
      const newTask = { _id: tempId, ...formData, createdAt: new Date().toISOString() };
      // Optimistic prepend
      setTasks((prev) => [newTask, ...prev]);
      res = await apiPost('/api/planner', { ...formData, _id: tempId });
      if (formData.reminder) {
        scheduleLocalReminder(`Task Reminder: ${formData.task}`, `Due at ${formData.time || 'today'}`);
      }
    }
    setFormLoading(false);

    if (res.success) {
      setModalVisible(false);
      fetchTasks();
    } else {
      Alert.alert('Notice', res.error || 'Saved locally');
    }
  };

  const toggleTaskStatus = async (item) => {
    const nextStatus = item.status === 'Completed' ? 'Pending' : 'Completed';
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t._id === item._id ? { ...t, status: nextStatus } : t))
    );
    await apiPut(`/api/planner/${item._id}`, { status: nextStatus });
    fetchTasks();
  };

  const confirmDelete = (item) => {
    setItemToDelete(item);
    setDeleteModalVisible(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    const targetId = itemToDelete._id;
    // Optimistic delete
    setTasks((prev) => prev.filter((t) => t._id !== targetId));
    setDeleteModalVisible(false);
    setItemToDelete(null);

    const res = await apiDelete(`/api/planner/${targetId}`);
    if (!res.success) {
      console.warn('Delete queued or failed:', res.error);
    }
    fetchTasks();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return '#EF4444';
      case 'Medium':
        return '#F59E0B';
      case 'Low':
        return '#10B981';
      default:
        return theme.primary;
    }
  };

  const renderTaskCard = ({ item }) => {
    const isCompleted = item.status === 'Completed';

    return (
      <View
        style={[
          styles.taskCard,
          { backgroundColor: theme.card, borderColor: theme.cardBorder },
          isCompleted && { opacity: 0.7 },
        ]}
      >
        <TouchableOpacity style={styles.checkBtn} onPress={() => toggleTaskStatus(item)}>
          <Ionicons
            name={isCompleted ? 'checkbox' : 'square-outline'}
            size={24}
            color={isCompleted ? theme.success : theme.textMuted}
          />
        </TouchableOpacity>

        <View style={styles.taskBody}>
          <View style={styles.taskHeaderRow}>
            <View style={[styles.priorityBadge, { backgroundColor: `${getPriorityColor(item.priority)}20` }]}>
              <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                {item.priority}
              </Text>
            </View>
            <Text style={[styles.categoryText, { color: theme.textSubtle }]}>{item.category}</Text>
          </View>

          <Text
            style={[
              styles.taskTitle,
              { color: theme.text },
              isCompleted && styles.completedText,
            ]}
          >
            {item.task}
          </Text>

          {item.description ? (
            <Text style={[styles.taskDesc, { color: theme.textMuted }]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={13} color={theme.textSubtle} />
            <Text style={[styles.metaText, { color: theme.textSubtle }]}>
              {item.date} {item.time ? `• ${item.time}` : ''}
            </Text>
            {item.reminder && (
              <Ionicons name="notifications-outline" size={13} color={theme.primary} style={{ marginLeft: 6 }} />
            )}
          </View>
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
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Weekly Planner"
        rightComponent={
          <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.primary }]} onPress={handleOpenAdd}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Task</Text>
          </TouchableOpacity>
        }
      />

      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search planner tasks..."
        filterOptions={TASK_PRIORITIES}
        selectedFilter={selectedPriority}
        onFilterChange={setSelectedPriority}
      />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item._id}
          renderItem={renderTaskCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title="No tasks in planner"
              message="Organize your weekly schedule, assignments, project sprints, and revision."
              buttonText="Add Your First Task"
              onPress={handleOpenAdd}
            />
          }
        />
      )}

      {/* Add / Edit Task Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {isEditing ? 'Edit Planner Task' : 'Add Planner Task'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Task Name *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="e.g. Study Operating Systems Memory Management"
                placeholderTextColor={theme.textSubtle}
                value={formData.task}
                onChangeText={(v) => setFormData((p) => ({ ...p, task: v }))}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Date (YYYY-MM-DD) *</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.textSubtle}
                    value={formData.date}
                    onChangeText={(v) => setFormData((p) => ({ ...p, date: v }))}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Time (e.g. 14:00)</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                    placeholder="HH:MM"
                    placeholderTextColor={theme.textSubtle}
                    value={formData.time}
                    onChangeText={(v) => setFormData((p) => ({ ...p, time: v }))}
                  />
                </View>
              </View>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Priority</Text>
              <View style={styles.prioRow}>
                {['High', 'Medium', 'Low'].map((prio) => (
                  <TouchableOpacity
                    key={prio}
                    style={[
                      styles.prioBtn,
                      {
                        backgroundColor: formData.priority === prio ? getPriorityColor(prio) : theme.inputBackground,
                        borderColor: getPriorityColor(prio),
                      },
                    ]}
                    onPress={() => setFormData((p) => ({ ...p, priority: prio }))}
                  >
                    <Text style={{ color: formData.priority === prio ? '#FFFFFF' : theme.text, fontSize: 12, fontWeight: '700' }}>
                      {prio}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Category</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="Academic, Startup, Skill, Personal..."
                placeholderTextColor={theme.textSubtle}
                value={formData.category}
                onChangeText={(v) => setFormData((p) => ({ ...p, category: v }))}
              />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Description</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="Task details and checklist..."
                placeholderTextColor={theme.textSubtle}
                multiline
                numberOfLines={3}
                value={formData.description}
                onChangeText={(v) => setFormData((p) => ({ ...p, description: v }))}
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
                onPress={handleSaveTask}
                disabled={formLoading}
              >
                {formLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={[styles.btnText, { color: '#FFFFFF' }]}>{isEditing ? 'Save Changes' : 'Create Task'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={deleteModalVisible}
        title="Delete Task"
        message={`Are you sure you want to delete "${itemToDelete?.task}"?`}
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
  taskCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  checkBtn: {
    marginRight: 12,
    marginTop: 2,
  },
  taskBody: {
    flex: 1,
  },
  taskHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  categoryText: {
    fontSize: 11,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  taskDesc: {
    fontSize: 12,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  metaText: {
    fontSize: 11,
  },
  actions: {
    gap: 6,
    marginLeft: 10,
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
  formRow: {
    flexDirection: 'row',
  },
  prioRow: {
    flexDirection: 'row',
    gap: 8,
  },
  prioBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
