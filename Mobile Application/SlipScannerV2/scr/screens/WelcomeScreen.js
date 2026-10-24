import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WelcomeStyle } from "../styles/authStyles";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

        <View style={styles.contentContainer}>
          <View style={styles.logoGlowWrapper}>
            <Image source={require("../../assets/Logoapp.png")}
            style={styles.logoImage}
            resizeMode="contain"
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.titleTop}>I&E</Text>
            <Text style={styles.titleBottom}>Tracker</Text>
            <Text style={styles.subtitle}>จัดการเรื่องเงินให้เป็นเรื่องง่าย{"\n"}ด้วยพลัง OCR อัจฉริยะ</Text>
          </View>

        </View>

        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate("Login")} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>เริ่มต้นใช้งาน</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.btnIcon}/>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate("Signup")} activeOpacity={0.7}>
            <Text style={styles.secondaryBtnText}>สร้างบัญชีใหม่</Text>
          </TouchableOpacity>

          <Text style={styles.footerText} >Version 1.5.25</Text>
        </View>
    </SafeAreaView>
  );
}

const styles = WelcomeStyle;