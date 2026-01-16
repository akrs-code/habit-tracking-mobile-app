import { useAuth } from "@/lib/auth-context";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";

export default function Index() {
  const {signOut} = useAuth();
  return (
    // like div used for container
    <View
      style={style.view}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
      <Button mode="text" onPress={signOut} icon={"logout"}>
        {" "} Sign Out {" "}
      </Button>
    </View>
    // creating a navigation to login
  );
}
// adding style
const style = StyleSheet.create({
  view: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  navButton: {
    width: 100,
    height: 50,
    backgroundColor: "coral",
    borderRadius: 0,
    textAlign: "center",
    padding: 10
  }
})