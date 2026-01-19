import { DATABASE_ID, databases, HABITS_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { Label } from "@react-navigation/elements";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ID } from "react-native-appwrite";
import {
  Button,
  SegmentedButtons,
  Text,
  TextInput,
  useTheme
} from "react-native-paper";

const FREQUENCIES = ["daily", "weekly", "monthly"] as const;
type Frequency = (typeof FREQUENCIES)[number];

export default function AddHabitScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const theme = useTheme();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!user) return;

    try {
      await databases.createDocument(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        ID.unique(),
        {
          user_id: user.$id,
          title,
          description,
          frequency,
          streak_count: 0,
          last_completed: new Date().toISOString(),
          created_at: new Date().toISOString(),
        }
      );

      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create habit");
    }
  };

  return (
    <View
      style={
        styles.container
      }
    >
      <Text variant="headlineSmall" style={styles.title}>
        Create a habit
      </Text>

      <Text style={styles.subtitle}>
        Small actions, repeated consistently.
      </Text>

      <View style={styles.card}>
        <Label style={styles.label}>Email Address</Label>
        <TextInput
          placeholder="Enter your habit name"
          mode="outlined"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />
        <Label style={styles.label}>Email Address</Label>
        <TextInput
          placeholder="Why this habit matters"
          mode="outlined"
          value={description}
          onChangeText={setDescription}
          style={styles.input}
        />

        <Text style={styles.sectionLabel}>Frequency</Text>

        <SegmentedButtons
          value={frequency}
          onValueChange={(value) => setFrequency(value as Frequency)}
          buttons={FREQUENCIES.map((freq) => ({
            value: freq,
            label: freq[0].toUpperCase() + freq.slice(1),
          }))}
        />

        {error && (
          <Text style={[styles.error, { color: theme.colors.error }]}>
            {error}
          </Text>
        )}

        <Button
          mode="contained"
          onPress={handleSubmit}
          disabled={!title || !description}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Create habit
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    backgroundColor: "#f1f4f9",
  },
  title: {
    textAlign: "center",
    marginBottom: 6,
    fontWeight: "bold",
  },
  label: {
    textAlign: "left",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 20,
  },
  card: {
    padding: 24,
    borderRadius: 16,
  },
  input: {
    marginBottom: 16,
  },
  sectionLabel: {
    marginBottom: 8,
    fontWeight: "500",
    opacity: 0.8,
  },
  error: {
    textAlign: "center",
    marginTop: 12,
  },
  button: {
    marginTop: 8,
    borderRadius: 10,
  },
  buttonContent: {
    height: 48,
    marginTop: 8,
  },
});
