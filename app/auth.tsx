import { useAuth } from "@/lib/auth-context";
import { Label } from "@react-navigation/elements";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View
} from "react-native";
import {
  Button,
  Text,
  TextInput,
  useTheme
} from "react-native-paper";

export default function AuthScreen() {
  const [isSignup, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const theme = useTheme();

  const handleAuth = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setError(null);

    const err = isSignup
      ? await signUp(email, password)
      : await signIn(email, password);

    if (err) {
      setError(err);
      return;
    }

    router.replace("/");
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "android" ? "height" : "padding"}
        style={styles.container}
      >
        <View style={styles.center}>
          <View style={styles.card}>
            <Text variant="headlineMedium" style={styles.title}>
              {isSignup ? "Create your account" : "Welcome back"}
            </Text>

            <Text variant="bodyMedium" style={styles.subtitle}>
              {isSignup
                ? "Start building better habits today"
                : "Let’s continue your progress"}
            </Text>
            <Label style={styles.label}>Email Address</Label>
            <TextInput
              mode="outlined"
              placeholder="Enter your email address"
              autoCapitalize="none"
              style={styles.input}
              onChangeText={setEmail}
            />
            <Label style={styles.label}>Password</Label>
            <TextInput
              mode="outlined"
              placeholder="Enter your email address"
              secureTextEntry
              style={styles.input}
              onChangeText={setPassword}
            />

            {error && (
              <Text style={[styles.error, { color: theme.colors.error }]}>
                {error}
              </Text>
            )}

            <Button
              mode="contained"
              style={styles.primaryButton}
              contentStyle={styles.primaryButtonContent}
              onPress={handleAuth}
            >
              {isSignup ? "Sign Up" : "Sign In"}
            </Button>

            <Button
              mode="text"
              style={styles.secondaryButton}
              onPress={() => setIsSignUp(!isSignup)}
            >
              {isSignup
                ? "Already have an account?"
                : "Create an account"}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f4f9",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    padding: 24,
    borderRadius: 16,
  },
  label: {
    textAlign: "left",
    marginBottom:8,
  },
  title: {
    textAlign: "center",
    marginBottom: 6,
    fontWeight: "bold",
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
  },
  error: {
    textAlign: "center",
    marginBottom: 12,
  },
  primaryButton: {
    marginTop: 8,
    borderRadius: 10,
  },
  primaryButtonContent: {
    height: 48,
  },
  secondaryButton: {
    marginTop: 8,
  },
});
