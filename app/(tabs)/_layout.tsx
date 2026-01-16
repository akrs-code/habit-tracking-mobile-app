import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    // create a tab navigation containing this tabs
    <Tabs screenOptions={{ tabBarActiveTintColor: 'coral' }}>
      <Tabs.Screen name="index" options={{
        title: "Home", tabBarIcon: ({ color, focused }) => {
          return focused ? (
            <FontAwesome name="home" size={24} color={color} />
          ) : (
            <FontAwesome name="home" size={24} color="black" />) //make the icon adopt the color tint by using destructuring
        }
      }} />
    </Tabs>
  ) //shared ui elements in different routes like headers, tabs
}