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
import { StatCard } from '../../components/StatCard';
import { apiGet, apiPost, apiPut, apiDelete } from '../../services/api';
import { EXPENSE_CATEGORIES } from '../../constants/config';
import { generateExpenseReportPdf, sharePdf } from '../../services/pdfService';
import { useAuth } from '../../hooks/useAuth';

export default function ExpensesScreen() {
  const { user, theme } = useAuth();

  const [expenses, setExpenses] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Add / Edit Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    itemName: '',
    amount: '',
    category: 'Academic & Books',
    date: todayStr,
    paymentMethod: 'UPI',
    notes: '',
  });

  // Delete modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchExpenses = useCallback(async () => {
    try {
      let endpoint = '/api/expenses';
      const params = [];
      if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`);
      if (selectedCategory !== 'All') params.push(`category=${encodeURIComponent(selectedCategory)}`);
      if (params.length > 0) endpoint += `?${params.join('&')}`;

      const res = await apiGet(endpoint);
      if (res.success && res.data) {
        setExpenses(res.data.data || []);
        setTotalAmount(res.data.totalAmount || 0);
        setCategoryBreakdown(res.data.categoryBreakdown || {});
      }
    } catch (err) {
      console.warn('Expenses fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchExpenses();
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      itemName: '',
      amount: '',
      category: 'Academic & Books',
      date: todayStr,
      paymentMethod: 'UPI',
      notes: '',
    });
    setModalVisible(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setCurrentId(item._id);
    setFormData({
      itemName: item.itemName,
      amount: String(item.amount),
      category: item.category || 'General',
      date: item.date,
      paymentMethod: item.paymentMethod || 'UPI',
      notes: item.notes || '',
    });
    setModalVisible(true);
  };

  const handleSaveExpense = async () => {
    const { itemName, amount, date } = formData;
    if (!itemName.trim() || !amount || !date) {
      Alert.alert('Validation Error', 'Item name, amount, and date are required.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount greater than 0.');
      return;
    }

    setFormLoading(true);
    let res;
    if (isEditing) {
      res = await apiPut(`/api/expenses/${currentId}`, { ...formData, amount: parsedAmount });
    } else {
      res = await apiPost('/api/expenses', { ...formData, amount: parsedAmount });
    }
    setFormLoading(false);

    if (res.success) {
      setModalVisible(false);
      fetchExpenses();
    } else {
      Alert.alert('Error', res.error || 'Failed to save expense');
    }
  };

  const confirmDelete = (item) => {
    setItemToDelete(item);
    setDeleteModalVisible(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    const res = await apiDelete(`/api/expenses/${itemToDelete._id}`);
    setDeleteModalVisible(false);
    setItemToDelete(null);
    if (res.success) {
      fetchExpenses();
    } else {
      Alert.alert('Error', res.error || 'Failed to delete expense');
    }
  };

  const handleExportPdf = async () => {
    try {
      setPdfGenerating(true);
      const pdfUri = await generateExpenseReportPdf({
        user,
        expenses,
        categorySummary: categoryBreakdown,
        totalAmount,
      });
      setPdfGenerating(false);

      if (pdfUri) {
        await sharePdf(pdfUri);
      }
    } catch (err) {
      setPdfGenerating(false);
      Alert.alert('PDF Export Error', 'Could not generate report: ' + err.message);
    }
  };

  const renderExpenseCard = ({ item }) => (
    <View style={[styles.expenseCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={styles.cardLeft}>
        <View style={[styles.categoryIcon, { backgroundColor: `${theme.primary}18` }]}>
          <Ionicons name="receipt-outline" size={20} color={theme.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.itemName, { color: theme.text }]}>{item.itemName}</Text>
          <Text style={[styles.itemSub, { color: theme.textMuted }]}>
            {item.category} • {item.date} • {item.paymentMethod || 'UPI'}
          </Text>
          {item.notes ? (
            <Text style={[styles.itemNotes, { color: theme.textSubtle }]}>{item.notes}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.cardRight}>
        <Text style={[styles.itemAmount, { color: theme.text }]}>${Number(item.amount).toFixed(2)}</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.inputBackground }]}
            onPress={() => handleOpenEdit(item)}
          >
            <Ionicons name="create-outline" size={15} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: `${theme.danger}15` }]}
            onPress={() => confirmDelete(item)}
          >
            <Ionicons name="trash-outline" size={15} color={theme.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Expense Tracker"
        rightComponent={
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity
              style={[styles.pdfButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={handleExportPdf}
              disabled={pdfGenerating || expenses.length === 0}
            >
              {pdfGenerating ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <>
                  <Ionicons name="document-text-outline" size={16} color={theme.primary} />
                  <Text style={[styles.pdfButtonText, { color: theme.primary }]}>PDF</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.primary }]} onPress={handleOpenAdd}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Spending Overview Banner */}
      <View style={[styles.overviewBanner, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
        <View>
          <Text style={[styles.bannerLabel, { color: theme.textMuted }]}>TOTAL EXPENDITURE</Text>
          <Text style={[styles.bannerAmount, { color: theme.text }]}>${Number(totalAmount).toFixed(2)}</Text>
          <Text style={[styles.bannerSub, { color: theme.textSubtle }]}>{expenses.length} total entries recorded</Text>
        </View>
        <View style={[styles.bannerIconWrap, { backgroundColor: `${theme.accent}18` }]}>
          <Ionicons name="wallet" size={32} color={theme.accent} />
        </View>
      </View>

      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search expenses by item name..."
        filterOptions={EXPENSE_CATEGORIES}
        selectedFilter={selectedCategory}
        onFilterChange={setSelectedCategory}
      />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item._id}
          renderItem={renderExpenseCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="wallet-outline"
              title="No expenses logged yet"
              message="Track textbooks, cloud hosting, equipment, and courses."
              buttonText="Add First Expense"
              onPress={handleOpenAdd}
            />
          }
        />
      )}

      {/* Add / Edit Expense Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {isEditing ? 'Edit Expense' : 'Log New Expense'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Item / Purchase Name *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="e.g. Operating Systems Textbook & Code Lab"
                placeholderTextColor={theme.textSubtle}
                value={formData.itemName}
                onChangeText={(v) => setFormData((p) => ({ ...p, itemName: v }))}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Amount ($) *</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                    placeholder="45.00"
                    placeholderTextColor={theme.textSubtle}
                    keyboardType="numeric"
                    value={formData.amount}
                    onChangeText={(v) => setFormData((p) => ({ ...p, amount: v }))}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Date (YYYY-MM-DD) *</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.textSubtle}
                    value={formData.date}
                    onChangeText={(v) => setFormData((p) => ({ ...p, date: v }))}
                  />
                </View>
              </View>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {EXPENSE_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
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

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Payment Method</Text>
              <View style={styles.methodRow}>
                {['UPI', 'Credit Card', 'Cash', 'Net Banking'].map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.methodBtn,
                      {
                        backgroundColor: formData.paymentMethod === method ? theme.primary : theme.inputBackground,
                        borderColor: formData.paymentMethod === method ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => setFormData((p) => ({ ...p, paymentMethod: method }))}
                  >
                    <Text
                      style={{
                        color: formData.paymentMethod === method ? '#FFFFFF' : theme.textMuted,
                        fontSize: 11,
                        fontWeight: '700',
                      }}
                    >
                      {method}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Notes / Invoice Reference</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="Optional receipt number or vendor..."
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
                onPress={handleSaveExpense}
                disabled={formLoading}
              >
                {formLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={[styles.btnText, { color: '#FFFFFF' }]}>{isEditing ? 'Save Changes' : 'Save Expense'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={deleteModalVisible}
        title="Delete Expense"
        message={`Are you sure you want to delete "${itemToDelete?.itemName}"?`}
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
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  pdfButtonText: {
    fontWeight: '700',
    fontSize: 12,
  },
  overviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  bannerLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bannerAmount: {
    fontSize: 26,
    fontWeight: '900',
    marginTop: 4,
  },
  bannerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  bannerIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemSub: {
    fontSize: 12,
    marginTop: 2,
  },
  itemNotes: {
    fontSize: 11,
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
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
  methodRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  methodBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
