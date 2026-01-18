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
      <Text style={style.title}>Habits Streaks</Text>

      {rankedHabits.length > 0 && (
        <View style={style.rankingContainer}>
          <Text style={style.rankingTitle}>Top Streaks</Text>
          {rankedHabits.slice(0, 3).map((item, key) => (
            <View key={key} style={style.rankingRow}>
              <View style={[style.rankingBadge, badgeStyles[key]]}>
                <Text style={style.rankingBadgeText}>{key + 1}</Text>
              </View>
              <Text style={style.rankingHabit}>{item.habit.title}</Text>
              <Text style={style.rankingStreak}>{item.bestStreak}</Text>
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
            <Card key={key} style={[style.card, key === 0 && style.firstCard]}>
              <Card.Content>
                <Text variant="titleMedium" style={style.habitTitle}>{habit.title}</Text>
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
              </Card.Content>
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
    backgroundColor: "#f5f5f5"
  },
  title: {
    fontWeight: "bold",
    marginBottom: 16,
  },
  card: {
    marginBottom: 18,
    borderRadius: 18,
    backgroundColor: "#f1f4f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderColor: "#f0f0f0"
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateText: {
    color: "#666666"
  },
  firstCard: {
    borderWidth: 2,
    borderColor: "#7c4dff",
  },
  habitTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 2,
  },
  habitDescription: {
    color: "#6c6c80",
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 8,
  },
  statBadge: {
    backgroundColor: "#fff3a0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 60,

  },
  statBadgeGold: {
    backgroundColor: "#fffde7",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 60,

  },
  statBadgeGreen: {
    backgroundColor: "#e8f5e9",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 60,

  },
  statLabel: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
    fontWeight: 500,
  },
  statBadgeText: {
    fontWeight: "bold",
    fontSize: 15,
    color: "#22223b",

  },
  rankingContainer: {
    marginBottom: 18,
    borderRadius: 18,
    backgroundColor: "#f1f4f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderColor: "#f0f0f0"
  },
  rankingTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 12,
    color: "#7c4dff",
    letterSpacing: 0.5,
  },
  rankingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 8,
  },
  rankingBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: "#e0e0e0",
  },
  badge1: { backgroundColor: "#ffd700" },
  badge2: { backgroundColor: "#c0c0c0" },
  badge3: { backgroundColor: "#cd7f32" },
  rankingBadgeText: {
    fontWeight: "bold",
    color: "#fff",
    fontSize: 15,
  },
  rankingHabit: {
    fontWeight: "bold",
    color: "#fff",
    fontSize: 14,
  },
  rankingStreak: {
    color: "#7c4dff",
    fontSize: 14,
    fontWeight: "bold",
  }

})