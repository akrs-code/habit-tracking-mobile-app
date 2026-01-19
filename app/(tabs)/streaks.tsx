import { client, COMPLETIONS_COLLECTION_ID, DATABASE_ID, databases, HABITS_COLLECTION_ID, RealTimeResponse } from '@/lib/appwrite';
import { useAuth } from '@/lib/auth-context';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Query } from 'react-native-appwrite';
import { ScrollView } from 'react-native-gesture-handler';
import { Card, Text } from 'react-native-paper';
import { Habit, HabitCompletion } from '../types/database.type';

export default function StreaksScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedHabits, setCompletedHabits] = useState<HabitCompletion[]>([]);

  const { user } = useAuth();

  useEffect(() => {

    if (user) {
      const habitschannel = `databases.${DATABASE_ID}.collections.${HABITS_COLLECTION_ID}.documents`
      const habitSubscription = client.subscribe(
        habitschannel, (response: RealTimeResponse) => {
          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            fetchHabits();
          } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
            fetchHabits();
          } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
            fetchHabits();
          }
        }
      );
      const completionschannel = `databases.${DATABASE_ID}.collections.${COMPLETIONS_COLLECTION_ID}.documents`
      const completionsSubscription = client.subscribe(
        completionschannel, (response: RealTimeResponse) => {
          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            fetchCompletions();
          } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
            fetchCompletions();
          } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
            fetchCompletions();
          }
        }
      );

      fetchHabits();
      fetchCompletions();
      return () => {
        habitSubscription();
        completionsSubscription();
      }
    }
  }, [user]);

  const fetchHabits = async () => {
    if (!user?.$id) return;

    try {
      const response = await databases.listDocuments<Habit>(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        [Query.equal("user_id", user.$id)]
      );
      setHabits(response.documents as Habit[]);

    } catch (error) {
      console.error(error);
    }
  };

  const fetchCompletions = async () => {
    try {
      if (!user?.$id) return;

      const response = await databases.listDocuments<HabitCompletion>(
        DATABASE_ID,
        COMPLETIONS_COLLECTION_ID,
        [Query.equal("user_id", user.$id)]
      );

      const completions = response.documents as HabitCompletion[];

      setCompletedHabits(completions);
    } catch (error) {
      console.error(error);
    }
  };

  interface StreakData {
    streak: number,
    bestStreak: number,
    total: number,
  }
  const getStreakData = (habitId: string): StreakData => {
    const habitCompletions = completedHabits?.filter((c) => c.habit_id === habitId).sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime());

    if (habitCompletions?.length === 0) {
      return { streak: 0, bestStreak: 0, total: 0 };
    }

    let streak = 0;
    let bestStreak = 0;
    const total = habitCompletions.length;

    let lastDate: Date | null = null;
    let currentStreak = 0;

    // Sort completions by date ascending
    habitCompletions
      .sort(
        (a, b) =>
          new Date(a.completed_at).getTime() -
          new Date(b.completed_at).getTime()
      )
      .forEach((c) => {
        const date = new Date(c.completed_at);
        date.setHours(0, 0, 0, 0); // normalize to midnight

        if (!lastDate) {
          // First completion
          currentStreak = 1;
        } else {
          const diffDays =
            (date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

          if (diffDays === 0) {
            // Same day → ignore
          } else if (diffDays <= 1.5) {
            // Consecutive day → continue streak
            currentStreak += 1;
          } else {
            // Streak broken
            currentStreak = 1;
          }
        }

        bestStreak = Math.max(bestStreak, currentStreak);
        lastDate = date;
      });

    streak = currentStreak;

    return { streak, bestStreak, total };
  }


  const habitStreak = habits.map((habit) => {
    const { streak, bestStreak, total } = getStreakData(habit.$id);
    return { habit, streak, bestStreak, total };
  });

  const rankedHabits = habitStreak.sort((a, b) => b.bestStreak - a.bestStreak);

  const badgeStyles = [style.badge1, style.badge2, style.badge3]
  return (
    <View style={style.container}>
      <View style={style.header}>
        <Text variant="headlineSmall" style={style.title}>
          Your Streaks
        </Text>
      </View>

      {rankedHabits.length > 0 && (
        <View style={style.rankingContainer}>
          <Text style={style.rankingTitle}>Top Streaks</Text>

          {rankedHabits.slice(0, 3).map((item, index) => (
            <View key={index} style={style.rankingRow}>
              {/* Rank badge */}
              <View style={[style.rankingBadge, badgeStyles[index]]}>
                <Text style={style.rankingBadgeText}>{index + 1}</Text>
              </View>

              {/* Habit name */}
              <Text style={style.rankingHabit} numberOfLines={1}>
                {item.habit.title}
              </Text>

              {/* Best streak */}
              <Text style={style.rankingStreak}>
                🔥 {item.bestStreak}
              </Text>
            </View>
          ))}
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {habitStreak.length === 0 ? (
          <View style={style.emptyState}>
            <Text style={style.emptyStateText}>
              No habits yet. Add your first habit!
            </Text>
          </View>
        ) : (
          rankedHabits.map(({ habit, streak, bestStreak, total }, key) => (
            <Card key={key} style={style.card}>
              <View style={style.cardContent}>
                <Text style={style.habitTitle}>{habit.title}</Text>
                <Text style={style.habitDescription}>{habit.description}</Text>
                <View style={style.statsRow}>
                  <View style={style.statBadge}>
                    <Text style={style.statBadgeText}>{streak}</Text>
                    <Text style={style.statLabel}>Current</Text>
                  </View>
                  <View style={style.statBadgeGold}>
                    <Text style={style.statBadgeText}>{bestStreak}</Text>
                    <Text style={style.statLabel}>Best</Text>
                  </View>
                  <View style={style.statBadgeGreen}>
                    <Text style={style.statBadgeText}>{total}</Text>
                    <Text style={style.statLabel}>Total</Text>
                  </View>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f1f4f9",
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 16,
  },
  title: {
    fontWeight: "700",
    fontSize: 22,
  },
  cardContent: {
    padding: 20,
  },

  rankingContainer: {
    marginBottom: 18,
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,

  },

  rankingTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
    color: "#22223b",
  },

  rankingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },

  rankingBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  badge1: { backgroundColor: "#FFD700" }, // gold
  badge2: { backgroundColor: "#C0C0C0" }, // silver
  badge3: { backgroundColor: "#CD7F32" }, // bronze

  rankingBadgeText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },

  rankingHabit: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },

  rankingStreak: {
    fontSize: 20,
    fontWeight: "700",
    color: "#22223b",
  },

  /* ===== HABIT CARDS ===== */

  card: {
    marginBottom: 18,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  habitTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
    color: "#22223b",
  },

  habitDescription: {
    fontSize: 15,
    color: "#555",
  },

  /* ===== STATS ===== */

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  statBadge: {
    backgroundColor: "#f3f4ff",
    borderRadius: 14,
    paddingVertical: 8,
    alignItems: "center",
    minWidth: 70,
  },

  statBadgeGold: {
    backgroundColor: "#fff8e1",
    borderRadius: 14,
    paddingVertical: 8,
    alignItems: "center",
    minWidth: 70,
  },

  statBadgeGreen: {
    backgroundColor: "#e8f5e9",
    borderRadius: 14,
    paddingVertical: 8,
    alignItems: "center",
    minWidth: 70,
  },

  statBadgeText: {
    fontWeight: "800",
    fontSize: 16,
    color: "#22223b",
  },

  statLabel: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
    fontWeight: "500",
  },

  /* ===== EMPTY ===== */

  emptyState: {
    alignItems: "center",
    marginTop: 80,
  },

  emptyStateText: {
    color: "#777",
    fontSize: 14,
  },
});
