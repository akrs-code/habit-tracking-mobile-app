import { client, DATABASE_ID, databases, HABITS_COLLECTION_ID, RealTimeResponse } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Query } from "react-native-appwrite";
import { Button, Surface, Text } from "react-native-paper";
import { Habit } from "../types/database.type";


export default function Index() {
  const { signOut, user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    if (user) {
      const channel = `databases.${DATABASE_ID}.collections.${HABITS_COLLECTION_ID}.documents`
      const habitSubscription = client.subscribe(
        channel, (response: RealTimeResponse) => {
          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            fetchHabits();
          } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
            fetchHabits();
          } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
            fetchHabits();
          }
        }
      );
      fetchHabits();
      return () => {
        habitSubscription();
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

  return (
    <View style={style.container}>
      {/* Header */}
      <View style={style.header}>
        <Text variant="headlineSmall" style={style.title}>Today's Habit</Text>
        <Button mode="text" onPress={signOut} icon="logout" style={style.button}>
          Sign Out
        </Button>
      </View>

      {habits.length === 0 ? (
        <View style={style.emptyState}>
          <Text style={style.emptyStateText}>No habits yet. Add your first habit!</Text>
        </View>
      ) : (
        habits.map((habit) => (
          <Surface key={habit.$id} style={style.card} elevation={0}>
            <View style={style.cardContent}>
              <Text style={style.cardTitle}>{habit.title}</Text>
              <Text style={style.cardDescription}>{habit.description}</Text>
              <View style={style.cardFooter}>
                <View style={style.streakBadge}>
                  <MaterialCommunityIcons name="fire" size={18} color={"#ff9800"} />
                  <Text style={style.streakText}>{habit.streak_count} day streak</Text>
                </View>
                <View style={style.frequencyBadge}>
                  <Text style={style.frequencyText}>
                    {habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
          </Surface>
        ))
      )}
    </View>

  );
}

// Styles
const style = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontWeight: "bold",
  },
  card: {
    marginBottom: 18,
    borderRadius: 18,
    backgroundColor: "#e1dbf2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#22223b"
  },
  cardDescription: {
    fontSize: 15,
    marginBottom: 16,
    color: "#c2c2f1"
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3e0",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  streakText: {
    marginLeft: 6,
    color: "#ff9800",
    fontWeight: "bold",
    fontSize: 14,
  },
  frequencyBadge: {
    backgroundColor: "#ede7f6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  frequencyText: {
    color: "#7c4dff",
    fontWeight: "bold",
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateText: {
    color: "#666666"
  },
  button: {
    borderRadius: 8,
  }

});