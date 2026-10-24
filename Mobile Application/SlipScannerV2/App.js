import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { initDatabase } from "./scr/database/database";
import { AuthProvider, useAuth } from "./scr/context/AuthContext";  // ← ใหม่

// Screens
import WelcomeScreen  from "./scr/screens/WelcomeScreen";
import LoginScreen    from "./scr/screens/LoginScreen";
import SignupScreen   from "./scr/screens/SignupScreen";
import MainNavigator  from "./scr/navigation/MainNavigator";
import CategoryScreen from "./scr/screens/CategoryScreen";

// ลบ Scanslip และ AnalysisScreen ออกจากนี้
// เพราะทั้งสองอยู่ใน MainNavigator อยู่แล้ว

const Stack = createStackNavigator();

// ── ตัดสิน route ตาม login state ──────────────────────────────────────────────
function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#206B64" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // ── login แล้ว ────────────────────────────────────────────────────────
        <>
          <Stack.Screen name="MainApp" component={MainNavigator} />
          <Stack.Screen name="CategoryManagement" component={CategoryScreen}/>
        </>
      ) : (
        // ── ยังไม่ login ──────────────────────────────────────────────────────
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login"   component={LoginScreen}   />
          <Stack.Screen name="Signup"  component={SignupScreen}  />
        </>
      )}
    </Stack.Navigator>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function App() {
  useEffect(() => {
    initDatabase()
      .then(() => console.log("✅ Database initialized"))
      .catch((e) => console.log("❌ DB Error:", e));
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}