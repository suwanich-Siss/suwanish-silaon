// ─────────────────────────────────────────────
// navigation/MainNavigator.js
// แค่ประกาศ Tab Screens เท่านั้น
// UI ของ TabBar ย้ายไปอยู่ TabBar.js แล้ว
// ─────────────────────────────────────────────

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { CustomTabBar } from "./TabBar";

import HomeScreen     from "../screens/HomeScreen";
import AddScreen      from "../screens/AddScreen";
import HistoryScreen  from "../screens/HistoryScreen";
import AnalysisScreen from "../screens/AnalysisScreen";
import MenuScreen     from "../screens/MenuScreen";
import Scanslip       from "../screens/Scanslip";

const Tab = createBottomTabNavigator();

// ✏️ เพิ่ม/ลบ Tab ที่นี่ได้เลย
export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Home"     component={HomeScreen}     options={{ tabBarLabel: "หน้าหลัก" }} />
      <Tab.Screen name="History"  component={HistoryScreen}  options={{ tabBarLabel: "ประวัติ"  }} />
      <Tab.Screen name="Add"      component={AddScreen}      options={{ tabBarLabel: "เพิ่ม"    }} />
      <Tab.Screen name="Scanslip" component={Scanslip}       options={{ tabBarLabel: "สแกน"     }} />
      <Tab.Screen name="Analysis" component={AnalysisScreen} options={{ tabBarLabel: "วิเคราะห์"}} />
      <Tab.Screen name="Menu"     component={MenuScreen}     options={{ tabBarLabel: "เมนู"     }} />
    </Tab.Navigator>
  );
}