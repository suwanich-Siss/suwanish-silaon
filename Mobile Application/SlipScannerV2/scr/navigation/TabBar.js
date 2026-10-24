import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../styles/colors";
import { navStyles as styles } from "../styles/commonStyles";

// ── TabIcon ────────────────────────────────────────────────────────────────────
const TabIcon = ({ name, label, focused, onPress, onLayout }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const scale      = useRef(new Animated.Value(1)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (focused) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: -8, friction: 5, tension: 40, useNativeDriver: true }),
        Animated.spring(scale,      { toValue: 1.35, friction: 6,              useNativeDriver: true }),
        Animated.timing(opacity,    { toValue: 1,   duration: 200,            useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0,  friction: 6, useNativeDriver: true }),
        Animated.spring(scale,      { toValue: 1,  friction: 6,  useNativeDriver: true }),
        Animated.timing(opacity,    { toValue: 0,  duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [focused]);

  return (
    <TouchableOpacity onPress={onPress} onLayout={onLayout} style={styles.tabItem} activeOpacity={1}>
      <View style={styles.iconContainer}>
        <Animated.View style={[
        styles.iconContainer, 
        { 
          backgroundColor: "transparent", // เอาพื้นหลังวงกลมออกถาวร
          transform: [{ translateY }, { scale }] // สั่งให้ View นี้ขยับและขยายขนาดตาม Animation
        } 
      ]}>
          <Ionicons name={name} size={24} color={focused ? COLORS.dark : COLORS.gray} />
        </Animated.View>
      </View>
      <Animated.Text style={[styles.activeLabel, { opacity: focused ? 1 : 0 }]}>
        {label}
      </Animated.Text>
    </TouchableOpacity>
  );
};

// ── TAB_ICONS: map ชื่อ route → icon ─────────────────────────────────────────
// ✏️ เพิ่ม/แก้ icon แค่ที่นี่ที่เดียว
const TAB_ICONS = {
  Home:     "home",
  History:  "time",
  Add:      "add",
  Analysis: "pie-chart",
  Menu:     "grid",
};

// ── CustomTabBar ───────────────────────────────────────────────────────────────
export function CustomTabBar({ state, descriptors, navigation }) {
  const [measures, setMeasures]     = useState([]);
  const [isMenuVisible, setMenuVisible] = useState(false);

  const containerRef        = useRef();
  const indicatorPosition   = useRef(new Animated.Value(0)).current;
  const indicatorScale      = useRef(new Animated.Value(0)).current;
  const menuAnim            = useRef(new Animated.Value(0)).current;

  // animate indicator เมื่อเปลี่ยน tab
  useEffect(() => {
    if (measures.length > state.index && measures[state.index]) {
      const { x, width } = measures[state.index];
      const targetX = x - 12 + width / 2 - 25;
      Animated.parallel([
        Animated.spring(indicatorPosition, { toValue: targetX, stiffness: 120, damping: 14, mass: 1, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(indicatorScale, { toValue: 0.9, duration: 50, useNativeDriver: true }),
          Animated.spring(indicatorScale, { toValue: 1, friction: 6, useNativeDriver: true }),
        ]),
      ]).start();
    }
  }, [state.index, measures]);

  const toggleMenu = () => {
    if (isMenuVisible) {
      Animated.timing(menuAnim, { toValue: 0, duration: 200, useNativeDriver: true })
        .start(() => setMenuVisible(false));
    } else {
      setMenuVisible(true);
      Animated.spring(menuAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    }
  };

  const navigateTo = (screen) => {
      Animated.timing(menuAnim, {
        toValue:0, duration: 200, useNativeDriver: true
      }).start(() => {
        setMenuVisible(false);
        navigation.navigate(screen);
      });
  };

  const saveMeasure = (index, layout) => {
    setMeasures((prev) => {
      const next = [...prev];
      next[index] = layout;
      return next;
    });
  };

  return (
    <View style={styles.tabBarContainer}>
      {/* ── Action Modal ─────────────────────────────────────────────── */}
      <Modal transparent visible={isMenuVisible} animationType="none" onRequestClose={toggleMenu}>
        <TouchableWithoutFeedback onPress={toggleMenu}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBackground} />
            <View style={styles.menuContainer}>
              {/* ปุ่มสแกนสลิป */}
              <Animated.View style={[styles.menuItemWrapper, {
                transform: [
                  { scale: menuAnim },
                  { translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) },
                ],
              }]}>
                <TouchableOpacity style={styles.menuButton} onPress={() => navigateTo("Scanslip")} activeOpacity={0.8}>
                  <LinearGradient colors={["#E5C07B", "#D4AF37"]} style={styles.menuIconCircle}>
                    <Ionicons name="scan" size={28} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.menuLabel}>สแกนสลิป</Text>
                </TouchableOpacity>
              </Animated.View>

              {/* ปุ่มจดเอง */}
              <Animated.View style={[styles.menuItemWrapper, {
                transform: [
                  { scale: menuAnim },
                  { translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) },
                ],
              }]}>
                <TouchableOpacity style={styles.menuButton} onPress={() => navigateTo("Add")} activeOpacity={0.8}>
                  <LinearGradient colors={["#00C4B5", "#0D9488"]} style={styles.menuIconCircle}>
                    <MaterialCommunityIcons name="pencil" size={28} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.menuLabel}>จดบันทึกเอง</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={toggleMenu} activeOpacity={0.9}>
              <View style={styles.closeButtonInner}>
              <Ionicons name="close" size={30} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Tab Bar ──────────────────────────────────────────────────── */}
      <View style={styles.tabBar} ref={containerRef}>
        {/* Animated indicator */}
        {state.routes[state.index]?.name !== "Add" && state.routes[state.index]?.name !== "Scanslip" && measures.length > 0 && (
          <Animated.View style={{
            position: "absolute",
            left: 12,
            top: -5,
            width: 50,
            height: 50,
            borderRadius: 25,
            transform: [{ translateX: indicatorPosition }, { scale: indicatorScale }],
            zIndex: 0,
          }} />
        )}

        {state.routes.map((route, index) => {
          if (route.name === "Scanslip") return null;

          const focused = state.index === index;

          const onPress = () => {
            if (route.name === "Add") {
              toggleMenu();
            } else {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }
          };

          const { options } = descriptors[route.key];

          if (route.name === "Add") {
            return (
              <View key={route.key} onLayout={(e) => saveMeasure(index, e.nativeEvent.layout)}>
                <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.centerButtonWrapper}>
                  <View style={styles.centerButton}>
                    <Ionicons name="add" size={32} color="#fff" />
                  </View>
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <TabIcon
              key={route.key}
              name={TAB_ICONS[route.name]}
              label={options.tabBarLabel}
              focused={focused}
              onPress={onPress}
              onLayout={(e) => saveMeasure(index, e.nativeEvent.layout)}
            />
          );
        })}
      </View>
    </View>
  );
}