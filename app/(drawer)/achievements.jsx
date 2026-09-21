import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { ProgressBar } from '../../components/ProgressBar';
import { apiGet } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export default function AchievementsScreen() {
  const { theme } = useAuth();

  const [achievements, setAchievements] = useState([]);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAchievements = useCallback(async () => {
    try {
      const res = await apiGet('/api/achievements');
      if (res.success && res.data) {
        setAchievements(res.data.data || []);
        setUnlockedCount(res.data.unlockedCount || 0);
        setTotalCount(res.data.totalCount || 0);
      }
    } catch (err) {
      console.warn('Achievements fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAchievements();
  };

  const getIconName = (key) => {
    switch (key) {
      case 'FIRST_SKILL':
        return 'star';
      case 'SKILL_BUILDER':
        return 'layers';
      case 'FIRST_PRACTICE':
        return 'timer';
      case 'PRACTICE_CHAMPION':
        return 'flash';
      case 'TASK_MASTER':
        return 'checkbox';
      case 'STREAK_7_DAYS':
        return 'flame';
      case 'CONSISTENT_LEARNER':
        return 'ribbon';
      default:
        return 'trophy';
    }
  };

  const renderAchievementCard = ({ item }) => {
    const isUnlocked = item.isUnlocked;
    const progressPercent = item.target > 0 ? Math.min(100, Math.round((item.progress / item.target) * 100)) : 0;

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: theme.card, borderColor: isUnlocked ? theme.accent : theme.cardBorder },
          !isUnlocked && { opacity: 0.8 },
        ]}
      >
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: isUnlocked ? `${theme.accent}20` : theme.inputBackground,
            },
          ]}
        >
          <Ionicons
            name={getIconName(item.key)}
            size={28}
            color={isUnlocked ? theme.accent : theme.textMuted}
          />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
            {isUnlocked ? (
              <View style={[styles.unlockedBadge, { backgroundColor: `${theme.accent}20` }]}>
                <Ionicons name="checkmark-circle" size={12} color={theme.accent} style={{ marginRight: 4 }} />
                <Text style={[styles.unlockedText, { color: theme.accent }]}>UNLOCKED</Text>
              </View>
            ) : (
              <Text style={[styles.lockedText, { color: theme.textSubtle }]}>
                {item.progress} / {item.target}
              </Text>
            )}
          </View>

          <Text style={[styles.description, { color: theme.textMuted }]}>{item.description}</Text>

          {!isUnlocked && (
            <View style={styles.progressWrap}>
              <ProgressBar progress={progressPercent} color={theme.primary} height={5} />
            </View>
          )}

          {isUnlocked && item.unlockedAt && (
            <Text style={[styles.unlockedDate, { color: theme.textSubtle }]}>
              Earned on {new Date(item.unlockedAt).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Achievements" />

      {/* Header Trophy Banner */}
      <View style={[styles.banner, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
        <View style={[styles.trophyCircle, { backgroundColor: `${theme.accent}20` }]}>
          <Ionicons name="trophy" size={38} color={theme.accent} />
        </View>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={[styles.bannerTitle, { color: theme.text }]}>Hall of Mastery</Text>
          <Text style={[styles.bannerSub, { color: theme.textMuted }]}>
            Unlocked {unlockedCount} of {totalCount} Activity Badges
          </Text>
          <ProgressBar
            progress={totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}
            color={theme.accent}
            height={6}
            style={{ marginTop: 8 }}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={achievements}
          keyExtractor={(item) => item._id || item.key}
          renderItem={renderAchievementCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        />
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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  trophyCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  bannerSub: {
    fontSize: 13,
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  unlockedText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  lockedText: {
    fontSize: 12,
    fontWeight: '700',
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
  },
  progressWrap: {
    marginTop: 8,
  },
  unlockedDate: {
    fontSize: 10,
    marginTop: 4,
  },
});
