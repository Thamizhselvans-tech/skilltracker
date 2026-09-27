import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { StatCard } from '../../components/StatCard';
import { ProgressBar } from '../../components/ProgressBar';
import { apiGet } from '../../services/api';
import { getCachedData } from '../../services/offlineStorage';
import { useAuth } from '../../hooks/useAuth';

export default function ProgressScreen() {
  const { theme } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);

  // 1. Load cached data immediately on mount (< 30ms render)
  useEffect(() => {
    let isMounted = true;
    const initLoad = async () => {
      try {
        const cached = await getCachedData('/api/progress/dashboard');
        if (cached && isMounted) {
          const dash = cached.data || cached;
          if (dash && (dash.skills || dash.tasks)) {
            setData(dash);
            setLoading(false);
          }
        }
      } catch (e) {
        console.warn('Error reading progress cache:', e);
      }
    };
    initLoad();
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await apiGet('/api/progress/dashboard');
      if (res.success && res.data?.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.warn('Progress load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProgress();
  };

  const skillsList = data?.skills?.list || [];
  const completedTasks = data?.tasks?.completed || 0;
  const totalTasks = data?.tasks?.total || 0;
  const taskRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Progress & Analytics" />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        >
          {/* Overall Score Card */}
          <View style={[styles.scoreCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
            <Text style={[styles.scoreTitle, { color: theme.textMuted }]}>OVERALL ACADEMIC & PRODUCTIVITY INDEX</Text>
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreNumber, { color: theme.primary }]}>{data?.overallProgress || 0}%</Text>
              <View style={styles.scoreBreakdown}>
                <Text style={[styles.breakdownItem, { color: theme.text }]}>
                  • Skills: {data?.skills?.averageProgress || 0}% avg
                </Text>
                <Text style={[styles.breakdownItem, { color: theme.text }]}>
                  • Tasks: {taskRate}% completed
                </Text>
                <Text style={[styles.breakdownItem, { color: theme.text }]}>
                  • Badges: {data?.achievements?.unlocked || 0}/{data?.achievements?.total || 7}
                </Text>
              </View>
            </View>
            <ProgressBar progress={data?.overallProgress || 0} color={theme.primary} height={8} style={{ marginTop: 14 }} />
          </View>

          {/* Section: Real Metrics Cards */}
          <Text style={[styles.sectionHeading, { color: theme.text }]}>Core Pillars Performance</Text>
          <View style={styles.gridRow}>
            <StatCard
              title="Total Skills"
              value={data?.skills?.total || 0}
              subtitle="Registered competencies"
              icon="ribbon-outline"
              iconColor="#818CF8"
            />
            <StatCard
              title="Practice Log"
              value={`${data?.practice?.totalHours || '0.0'}h`}
              subtitle="Total hours dedicated"
              icon="timer-outline"
              iconColor="#10B981"
            />
          </View>

          <View style={styles.gridRow}>
            <StatCard
              title="Task Velocity"
              value={`${completedTasks}/${totalTasks}`}
              subtitle={`${taskRate}% completion rate`}
              icon="checkbox-outline"
              iconColor="#F59E0B"
            />
            <StatCard
              title="Finance Health"
              value={`$${Number(data?.expenses?.monthTotal || 0).toFixed(2)}`}
              subtitle="Current month spend"
              icon="wallet-outline"
              iconColor="#EC4899"
            />
          </View>

          {/* Skill Progress Bars List */}
          <View style={[styles.skillsBreakdownBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.boxTitle, { color: theme.text }]}>Individual Skills Mastery</Text>
            {skillsList.length === 0 ? (
              <Text style={[styles.emptyNote, { color: theme.textMuted }]}>No skills registered yet.</Text>
            ) : (
              skillsList.map((skill) => (
                <View key={skill._id} style={styles.skillItem}>
                  <View style={styles.skillRow}>
                    <Text style={[styles.skillName, { color: theme.text }]}>{skill.name}</Text>
                    <Text style={[styles.skillPercent, { color: theme.primary }]}>{skill.progress}%</Text>
                  </View>
                  <ProgressBar progress={skill.progress} color={theme.primary} height={6} />
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
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
  scoreCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 18,
  },
  scoreTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '900',
  },
  scoreBreakdown: {
    gap: 4,
  },
  breakdownItem: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
    marginBottom: 10,
  },
  gridRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginBottom: 8,
  },
  skillsBreakdownBox: {
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    marginTop: 12,
  },
  boxTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 14,
  },
  emptyNote: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  skillItem: {
    marginBottom: 12,
  },
  skillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  skillName: {
    fontSize: 14,
    fontWeight: '600',
  },
  skillPercent: {
    fontSize: 13,
    fontWeight: '700',
  },
});
