import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { ConfirmModal } from '../../components/ConfirmModal';
import { EmptyState } from '../../components/EmptyState';
import { apiGet, apiPost, apiDelete } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export default function PracticeScreen() {
  const { theme } = useAuth();

  const [skills, setSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [totalHours, setTotalHours] = useState('0.0');
  const [loading, setLoading] = useState(true);

  // Active Timer state
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [notes, setNotes] = useState('');
  const [progressGain, setProgressGain] = useState('5');
  const timerRef = useRef(null);

  // Manual Log Modal or fields
  const [manualMinutes, setManualMinutes] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  useEffect(() => {
    loadData();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const loadData = async () => {
    try {
      const [skillsRes, practiceRes] = await Promise.all([
        apiGet('/api/skills'),
        apiGet('/api/practice'),
      ]);

      if (skillsRes.success && skillsRes.data?.data) {
        setSkills(skillsRes.data.data);
        if (skillsRes.data.data.length > 0 && !selectedSkill) {
          setSelectedSkill(skillsRes.data.data[0]);
        }
      }

      if (practiceRes.success && practiceRes.data) {
        setSessions(practiceRes.data.data || []);
        setTotalHours(practiceRes.data.totalHours || '0.0');
      }
    } catch (err) {
      console.warn('Practice load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Stopwatch Logic
  const startTimer = () => {
    if (!selectedSkill) {
      Alert.alert('Select Skill', 'Please choose a skill before starting the practice timer.');
      return;
    }
    setTimerRunning(true);
    timerRef.current = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
  };

  const pauseTimer = () => {
    setTimerRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const resetTimer = () => {
    pauseTimer();
    setSecondsElapsed(0);
  };

  const handleFinishTimer = async () => {
    pauseTimer();
    const durationMins = Math.max(1, Math.round(secondsElapsed / 60));

    if (secondsElapsed < 15 && !manualMinutes) {
      Alert.alert('Session Too Short', 'Practice sessions must be at least a few minutes long.');
      return;
    }

    await submitPracticeSession(durationMins);
    setSecondsElapsed(0);
    setNotes('');
  };

  const handleManualSubmit = async () => {
    const mins = parseInt(manualMinutes, 10);
    if (!mins || mins <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid duration in minutes.');
      return;
    }
    await submitPracticeSession(mins);
    setManualMinutes('');
    setNotes('');
    setIsManualMode(false);
  };

  const submitPracticeSession = async (durationMinutes) => {
    if (!selectedSkill) return;

    setSubmitting(true);
    const res = await apiPost('/api/practice', {
      skillId: selectedSkill._id,
      durationMinutes,
      notes,
      progressIncrement: parseInt(progressGain, 10) || 0,
    });
    setSubmitting(false);

    if (res.success) {
      Alert.alert('Practice Saved! 🎉', `Logged ${durationMinutes} minutes for ${selectedSkill.name}!`);
      loadData();
    } else {
      Alert.alert('Error', res.error || 'Failed to save practice session');
    }
  };

  const confirmDelete = (session) => {
    setSessionToDelete(session);
    setDeleteModalVisible(true);
  };

  const handleDelete = async () => {
    if (!sessionToDelete) return;
    const res = await apiDelete(`/api/practice/${sessionToDelete._id}`);
    setDeleteModalVisible(false);
    setSessionToDelete(null);
    if (res.success) {
      loadData();
    }
  };

  // Format seconds to HH:MM:SS
  const formatTime = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Practice Sessions" />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Practice Hours Summary Banner */}
          <View style={[styles.hoursBanner, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
            <View style={styles.hoursLeft}>
              <Text style={[styles.hoursLabel, { color: theme.textMuted }]}>CUMULATIVE PRACTICE</Text>
              <Text style={[styles.hoursValue, { color: theme.text }]}>{totalHours} Hours</Text>
              <Text style={[styles.hoursSub, { color: theme.textSubtle }]}>
                {sessions.length} recorded practice sessions
              </Text>
            </View>
            <View style={[styles.timerIconWrap, { backgroundColor: `${theme.primary}20` }]}>
              <Ionicons name="timer" size={32} color={theme.primary} />
            </View>
          </View>

          {/* Skill Selector */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Choose Skill to Practice</Text>
          {skills.length === 0 ? (
            <Text style={[styles.noSkillsText, { color: theme.textMuted }]}>
              No skills found. Please add a skill first in My Skills screen.
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.skillsScroll}>
              {skills.map((skill) => {
                const isSelected = selectedSkill?._id === skill._id;
                return (
                  <TouchableOpacity
                    key={skill._id}
                    style={[
                      styles.skillSelectChip,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.card,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => setSelectedSkill(skill)}
                  >
                    <Text
                      style={[
                        styles.skillSelectText,
                        { color: isSelected ? '#FFFFFF' : theme.text, fontWeight: isSelected ? '700' : '500' },
                      ]}
                    >
                      {skill.name}
                    </Text>
                    <Text
                      style={[
                        styles.skillSelectSub,
                        { color: isSelected ? '#E0E7FF' : theme.textSubtle },
                      ]}
                    >
                      {skill.progress}% • {skill.category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Interactive Stopwatch Timer Card */}
          <View style={[styles.timerCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.modeToggleRow}>
              <TouchableOpacity onPress={() => setIsManualMode(false)}>
                <Text style={[styles.modeTab, !isManualMode && { color: theme.primary, fontWeight: '800' }]}>
                  Live Stopwatch
                </Text>
              </TouchableOpacity>
              <Text style={{ color: theme.textSubtle }}>|</Text>
              <TouchableOpacity onPress={() => setIsManualMode(true)}>
                <Text style={[styles.modeTab, isManualMode && { color: theme.primary, fontWeight: '800' }]}>
                  Manual Entry
                </Text>
              </TouchableOpacity>
            </View>

            {!isManualMode ? (
              <View style={styles.timerDisplayWrap}>
                <Text style={[styles.timerNumbers, { color: theme.text }]}>{formatTime(secondsElapsed)}</Text>
                <Text style={[styles.timerActiveSkill, { color: theme.primaryLight }]}>
                  {selectedSkill ? selectedSkill.name : 'No Skill Selected'}
                </Text>

                {/* Control Buttons */}
                <View style={styles.timerButtonsRow}>
                  {!timerRunning ? (
                    <TouchableOpacity
                      style={[styles.timerControlBtn, { backgroundColor: theme.primary }]}
                      onPress={startTimer}
                    >
                      <Ionicons name="play" size={24} color="#FFFFFF" />
                      <Text style={styles.btnLabel}>Start</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.timerControlBtn, { backgroundColor: theme.warning }]}
                      onPress={pauseTimer}
                    >
                      <Ionicons name="pause" size={24} color="#000000" />
                      <Text style={[styles.btnLabel, { color: '#000000' }]}>Pause</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.timerControlBtn, { backgroundColor: theme.success }]}
                    onPress={handleFinishTimer}
                    disabled={secondsElapsed < 5 || submitting}
                  >
                    <Ionicons name="checkmark-done" size={24} color="#FFFFFF" />
                    <Text style={styles.btnLabel}>Finish</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.timerIconOnlyBtn, { backgroundColor: theme.inputBackground }]}
                    onPress={resetTimer}
                  >
                    <Ionicons name="refresh" size={20} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.manualEntryWrap}>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>Duration (Minutes) *</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                  placeholder="e.g. 60"
                  placeholderTextColor={theme.textSubtle}
                  keyboardType="numeric"
                  value={manualMinutes}
                  onChangeText={setManualMinutes}
                />
                <TouchableOpacity
                  style={[styles.submitManualBtn, { backgroundColor: theme.primary }]}
                  onPress={handleManualSubmit}
                  disabled={submitting}
                >
                  <Text style={styles.btnLabel}>Save Practice Entry</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Session Notes & Skill Progress Update */}
            <View style={styles.metaSection}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Practice Notes & Topics Learned</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="What did you build or practice today?"
                placeholderTextColor={theme.textSubtle}
                value={notes}
                onChangeText={setNotes}
              />

              <View style={styles.progressRow}>
                <Text style={[styles.fieldLabel, { color: theme.text, marginTop: 10 }]}>
                  Skill Progress Increase (+%)
                </Text>
                <TextInput
                  style={[
                    styles.textInputSmall,
                    { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border },
                  ]}
                  keyboardType="numeric"
                  value={progressGain}
                  onChangeText={setProgressGain}
                />
              </View>
            </View>
          </View>

          {/* Practice History List */}
          <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>Practice History</Text>
          {sessions.length === 0 ? (
            <EmptyState
              icon="time-outline"
              title="No practice sessions logged yet"
              message="Start the timer or log your study session above."
            />
          ) : (
            sessions.map((item) => (
              <View
                key={item._id}
                style={[styles.historyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              >
                <View style={styles.historyLeft}>
                  <View style={[styles.historyIcon, { backgroundColor: `${theme.primary}18` }]}>
                    <Ionicons name="flame" size={20} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.historySkill, { color: theme.text }]}>{item.skillName}</Text>
                    <Text style={[styles.historyDate, { color: theme.textMuted }]}>
                      {new Date(item.date).toLocaleDateString()} • {item.durationMinutes} minutes
                    </Text>
                    {item.notes ? (
                      <Text style={[styles.historyNotes, { color: theme.textSubtle }]}>{item.notes}</Text>
                    ) : null}
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.delBtn, { backgroundColor: `${theme.danger}15` }]}
                  onPress={() => confirmDelete(item)}
                >
                  <Ionicons name="trash-outline" size={16} color={theme.danger} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <ConfirmModal
        visible={deleteModalVisible}
        title="Delete Practice Session"
        message="Are you sure you want to remove this practice log?"
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  hoursBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  hoursLeft: {
    flex: 1,
  },
  hoursLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  hoursValue: {
    fontSize: 26,
    fontWeight: '900',
    marginTop: 4,
  },
  hoursSub: {
    fontSize: 12,
    marginTop: 2,
  },
  timerIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  noSkillsText: {
    fontSize: 13,
    marginBottom: 16,
  },
  skillsScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  skillSelectChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    minWidth: 120,
  },
  skillSelectText: {
    fontSize: 13,
  },
  skillSelectSub: {
    fontSize: 11,
    marginTop: 2,
  },
  timerCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  modeToggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 14,
  },
  modeTab: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  timerDisplayWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  timerNumbers: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  timerActiveSkill: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 18,
  },
  timerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timerControlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  timerIconOnlyBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  manualEntryWrap: {
    paddingVertical: 10,
  },
  submitManualBtn: {
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  metaSection: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingTop: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textInputSmall: {
    borderWidth: 1,
    borderRadius: 8,
    width: 60,
    height: 38,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historySkill: {
    fontSize: 14,
    fontWeight: '700',
  },
  historyDate: {
    fontSize: 12,
    marginTop: 2,
  },
  historyNotes: {
    fontSize: 11,
    marginTop: 2,
  },
  delBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
