import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '../../components/Header';
import { StatCard } from '../../components/StatCard';
import { ProgressBar } from '../../components/ProgressBar';
import { apiGet } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const DEFAULT_DASHBOARD = {
  overallProgress: 70,
  totalSkills: 5,
  totalPracticeHours: 42,
  completedTasks: 8,
  totalTasks: 11,
  upcomingInternalExams: 2,
  upcomingExternalExams: 2,
  totalExpenses: 2330,
  recentSkills: [],
  upcomingTasks: [],
  nextInternalExam: null,
};

export default function HomeScreen() {
  const router = useRouter();
  const { user, theme } = useAuth();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(DEFAULT_DASHBOARD);
  const [isOffline, setIsOffline] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await apiGet('/api/progress/dashboard');
      if (res.success && res.data?.data) {
        setDashboardData(res.data.data);
      }
      setIsOffline(Boolean(res.isOffline));
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="SkillTracker" />

      {/* Offline banner if offline */}
      {isOffline && (
        <View style={[styles.offlineBanner, { backgroundColor: theme.warning }]}>
          <Ionicons name="cloud-offline" size={14} color="#000" style={{ marginRight: 6 }} />
          <Text style={styles.offlineText}>Viewing offline cached data. Reconnecting...</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        >
          {/* Welcome Banner */}
          <View style={[styles.welcomeCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
            <View style={styles.welcomeRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.welcomeDate, { color: theme.primaryLight }]}>{todayFormatted}</Text>
                <Text style={[styles.welcomeName, { color: theme.text }]}>
                  Welcome back, {user?.name?.split(' ')[0] || 'Student'}! 👋
                </Text>
                <Text style={[styles.welcomeSub, { color: theme.textMuted }]}>
                  {user?.college ? `${user.college} • ` : ''}
                  {user?.department || 'Academic & Startup Track'}
                </Text>
              </View>
              <View style={[styles.progressBadge, { backgroundColor: `${theme.primary}18`, borderColor: theme.primary }]}>
                <Text style={[styles.progressScore, { color: theme.primary }]}>
                  {dashboardData?.overallProgress || 0}%
                </Text>
                <Text style={[styles.progressLabel, { color: theme.textSubtle }]}>PRODUCTIVITY</Text>
              </View>
            </View>
            <ProgressBar progress={dashboardData?.overallProgress || 0} color={theme.primary} height={6} style={{ marginTop: 14 }} />
          </View>

          {/* Quick Metrics Grid */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Real-Time Metrics</Text>
          </View>

          <View style={styles.statsGrid}>
            <StatCard
              title="Total Skills"
              value={dashboardData?.skills?.total ?? 0}
              subtitle={`${dashboardData?.skills?.averageProgress ?? 0}% avg proficiency`}
              icon="ribbon-outline"
              iconColor="#818CF8"
            />
            <StatCard
              title="Practice"
              value={`${dashboardData?.practice?.todayMinutes ?? 0}m`}
              subtitle={`${dashboardData?.practice?.totalHours ?? 0} hrs total logged`}
              icon="timer-outline"
              iconColor="#10B981"
            />
          </View>

          <View style={styles.statsGrid}>
            <StatCard
              title="Weekly Tasks"
              value={`${dashboardData?.tasks?.completed ?? 0}/${dashboardData?.tasks?.total ?? 0}`}
              subtitle={`${dashboardData?.tasks?.pending ?? 0} tasks pending`}
              icon="calendar-outline"
              iconColor="#F59E0B"
            />
            <StatCard
              title="Monthly Spend"
              value={`$${Number(dashboardData?.expenses?.monthTotal ?? 0).toFixed(2)}`}
              subtitle={`${dashboardData?.expenses?.count ?? 0} purchases`}
              icon="wallet-outline"
              iconColor="#EC4899"
            />
          </View>

          {/* Upcoming Internal & External Exams ⭐ */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Upcoming Exams ⭐</Text>
          </View>

          <View style={styles.examCardsRow}>
            {/* Next Internal Exam */}
            <TouchableOpacity
              style={[styles.examCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              onPress={() => router.push('/(drawer)/internal-exams')}
            >
              <View style={styles.examCardHeader}>
                <View style={[styles.examBadge, { backgroundColor: `${theme.primary}20` }]}>
                  <Text style={[styles.examBadgeText, { color: theme.primary }]}>INTERNAL EXAM</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.textSubtle} />
              </View>

              {dashboardData?.exams?.nextInternal ? (
                <View style={styles.examDetails}>
                  <Text style={[styles.examSubject, { color: theme.text }]} numberOfLines={1}>
                    {dashboardData.exams.nextInternal.subject}
                  </Text>
                  <Text style={[styles.examType, { color: theme.textMuted }]}>
                    {dashboardData.exams.nextInternal.examType}
                  </Text>
                  <View style={styles.examTimeRow}>
                    <Ionicons name="calendar-outline" size={13} color={theme.primary} />
                    <Text style={[styles.examTimeText, { color: theme.text }]}>
                      {dashboardData.exams.nextInternal.examDate} • {dashboardData.exams.nextInternal.startTime}
                    </Text>
                  </View>
                  {dashboardData.exams.nextInternal.room ? (
                    <Text style={[styles.examRoom, { color: theme.textSubtle }]}>
                      Room: {dashboardData.exams.nextInternal.room}
                    </Text>
                  ) : null}
                </View>
              ) : (
                <Text style={[styles.emptyExamText, { color: theme.textMuted }]}>No upcoming internal exams</Text>
              )}
            </TouchableOpacity>

            {/* Next External Exam */}
            <TouchableOpacity
              style={[styles.examCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              onPress={() => router.push('/(drawer)/external-exams')}
            >
              <View style={styles.examCardHeader}>
                <View style={[styles.examBadge, { backgroundColor: `${theme.accent}20` }]}>
                  <Text style={[styles.examBadgeText, { color: theme.accent }]}>EXTERNAL EXAM</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.textSubtle} />
              </View>

              {dashboardData?.exams?.nextExternal ? (
                <View style={styles.examDetails}>
                  <Text style={[styles.examSubject, { color: theme.text }]} numberOfLines={1}>
                    {dashboardData.exams.nextExternal.subject}
                  </Text>
                  <Text style={[styles.examType, { color: theme.textMuted }]}>
                    {dashboardData.exams.nextExternal.examType}
                  </Text>
                  <View style={styles.examTimeRow}>
                    <Ionicons name="calendar-outline" size={13} color={theme.accent} />
                    <Text style={[styles.examTimeText, { color: theme.text }]}>
                      {dashboardData.exams.nextExternal.examDate} • {dashboardData.exams.nextExternal.startTime}
                    </Text>
                  </View>
                  {dashboardData.exams.nextExternal.room ? (
                    <Text style={[styles.examRoom, { color: theme.textSubtle }]}>
                      Room: {dashboardData.exams.nextExternal.room}
                    </Text>
                  ) : null}
                </View>
              ) : (
                <Text style={[styles.emptyExamText, { color: theme.textMuted }]}>No upcoming external exams</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Today's Classes */}
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Schedule</Text>
              <View style={[styles.countBadge, { backgroundColor: theme.inputBackground }]}>
                <Text style={[styles.countText, { color: theme.text }]}>
                  {dashboardData?.classes?.todayCount ?? 0} classes
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push('/(drawer)/timetable')}>
              <Text style={[styles.viewAll, { color: theme.primary }]}>View Timetable</Text>
            </TouchableOpacity>
          </View>

          {dashboardData?.classes?.todayList?.length > 0 ? (
            dashboardData.classes.todayList.map((cls) => (
              <View key={cls._id} style={[styles.classItem, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <View style={[styles.classTimeBox, { backgroundColor: `${theme.primary}18` }]}>
                  <Text style={[styles.classTime, { color: theme.primary }]}>{cls.startTime}</Text>
                  <Text style={[styles.classTimeEnd, { color: theme.textMuted }]}>{cls.endTime}</Text>
                </View>
                <View style={styles.classInfo}>
                  <Text style={[styles.classSubject, { color: theme.text }]}>{cls.subject}</Text>
                  <Text style={[styles.classFaculty, { color: theme.textMuted }]}>
                    {cls.faculty || 'Faculty TBA'} • {cls.room || 'Room TBA'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={[styles.emptyClassBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="calendar-clear-outline" size={24} color={theme.textMuted} style={{ marginBottom: 6 }} />
              <Text style={[styles.emptyClassText, { color: theme.textMuted }]}>
                No scheduled classes for today! Great time for practice.
              </Text>
            </View>
          )}

          {/* Startup Summary ⭐⭐⭐ */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Startup Management ⭐⭐⭐</Text>
            <TouchableOpacity onPress={() => router.push('/(drawer)/startup')}>
              <Text style={[styles.viewAll, { color: theme.primary }]}>Manage Startup</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.startupBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.startupHeader}>
              <Ionicons name="rocket-outline" size={22} color={theme.primary} />
              <Text style={[styles.startupBoxTitle, { color: theme.text }]}>Business Pipeline</Text>
            </View>

            <View style={styles.startupMetricsRow}>
              <View style={styles.startupMetricItem}>
                <Text style={[styles.startupNum, { color: theme.primary }]}>
                  {dashboardData?.startup?.totalClients ?? 0}
                </Text>
                <Text style={[styles.startupLabel, { color: theme.textMuted }]}>Clients</Text>
              </View>
              <View style={styles.startupMetricItem}>
                <Text style={[styles.startupNum, { color: '#10B981' }]}>
                  {dashboardData?.startup?.activeProjects ?? 0}
                </Text>
                <Text style={[styles.startupLabel, { color: theme.textMuted }]}>Active Proj</Text>
              </View>
              <View style={styles.startupMetricItem}>
                <Text style={[styles.startupNum, { color: '#F59E0B' }]}>
                  {dashboardData?.startup?.teamMembers ?? 0}
                </Text>
                <Text style={[styles.startupLabel, { color: theme.textMuted }]}>Members</Text>
              </View>
              <View style={styles.startupMetricItem}>
                <Text style={[styles.startupNum, { color: '#EC4899' }]}>
                  ${dashboardData?.startup?.totalBudget ?? 0}
                </Text>
                <Text style={[styles.startupLabel, { color: theme.textMuted }]}>Budget</Text>
              </View>
            </View>
          </View>

          {/* Achievements Summary */}
          <TouchableOpacity
            style={[styles.achievementBanner, { backgroundColor: `${theme.accent}15`, borderColor: `${theme.accent}30` }]}
            onPress={() => router.push('/(drawer)/achievements')}
          >
            <Ionicons name="trophy" size={28} color={theme.accent} style={{ marginRight: 14 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.achievementTitle, { color: theme.text }]}>
                {dashboardData?.achievements?.unlocked ?? 0} of {dashboardData?.achievements?.total ?? 7} Badges Unlocked
              </Text>
              <Text style={[styles.achievementSub, { color: theme.textMuted }]}>
                Complete practice sessions & tasks to earn master badges
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.accent} />
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  offlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  welcomeCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginBottom: 20,
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeDate: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  welcomeName: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  welcomeSub: {
    fontSize: 13,
    marginTop: 2,
  },
  progressBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  progressScore: {
    fontSize: 18,
    fontWeight: '900',
  },
  progressLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  examCardsRow: {
    gap: 12,
  },
  examCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  examCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  examBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  examBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  examDetails: {
    gap: 3,
  },
  examSubject: {
    fontSize: 16,
    fontWeight: '700',
  },
  examType: {
    fontSize: 12,
  },
  examTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  examTimeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  examRoom: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyExamText: {
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  classTimeBox: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 12,
    minWidth: 70,
  },
  classTime: {
    fontSize: 12,
    fontWeight: '800',
  },
  classTimeEnd: {
    fontSize: 10,
  },
  classInfo: {
    flex: 1,
  },
  classSubject: {
    fontSize: 15,
    fontWeight: '700',
  },
  classFaculty: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyClassBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyClassText: {
    fontSize: 13,
    textAlign: 'center',
  },
  startupBox: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  startupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  startupBoxTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  startupMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  startupMetricItem: {
    alignItems: 'center',
  },
  startupNum: {
    fontSize: 20,
    fontWeight: '900',
  },
  startupLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  achievementBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginTop: 16,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  achievementSub: {
    fontSize: 11,
    marginTop: 2,
  },
});
