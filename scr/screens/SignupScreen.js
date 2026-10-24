// ─────────────────────────────────────────────
// screens/SignupScreen.js
// ─────────────────────────────────────────────

import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, Platform,
  KeyboardAvoidingView, ScrollView, Modal, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CustomInput, CustomButton } from "../components/UIComponents";
import { COLORS } from "../styles/commonStyles";
import { SignupStyle as styles } from "../styles/authStyles";
import { createUser, acceptPDPA, getUserByEmail } from "../database/database";
import { useAuth } from "../context/AuthContext";

export default function SignupScreen({ navigation }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [occupation, setOccupation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [isAgreed, setIsAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleRegister = async () => {
    // ── Validation ──────────────────────────────────────────────────────────
    if (!firstName || !lastName || !email || !password || !dob) {
      Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอกข้อมูลให้ครบทุกช่องครับ");
      return;
    }
    if (password !== confirmPwd) {
      Alert.alert("แจ้งเตือน", "รหัสผ่านไม่ตรงกัน กรุณากรอกใหม่");
      return;
    }
    if (!isAgreed) {
      Alert.alert("แจ้งเตือน", "กรุณายอมรับเงื่อนไขการให้บริการก่อนลงทะเบียน");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createUser({
        firstName,
        lastName,
        email,
        password,   // TODO: hash ก่อน store ใน production
        birthdate: dob,
        occupation,
      });

      // บันทึกเวลายอมรับ PDPA
      await acceptPDPA(result.lastInsertRowId);
      const newUser = await getUserByEmail(email.toLowerCase().trim());
      await login(newUser);
    } catch (error) {
      // email ซ้ำ จะเกิด UNIQUE constraint error
      if (error.message?.includes("UNIQUE")) {
        Alert.alert("อีเมลซ้ำ", "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น");
      } else {
        Alert.alert("เกิดข้อผิดพลาด", error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }} showsVerticalScrollIndicator={false}>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
          </TouchableOpacity>

          <View style={{ marginTop: 10, marginBottom: 30 }}>
            <Text style={styles.title}>สร้างบัญชีใหม่ 🚀</Text>
            <Text style={styles.subtitle}>เริ่มต้นจัดการการเงินของคุณได้ฟรี</Text>
          </View>

          <View style={styles.form}>
            <CustomInput icon="person-outline" placeholder="ชื่อ" value={firstName} onChangeText={setFirstName} />
            <View style={styles.spacer} />
            <CustomInput icon="person-outline" placeholder="นามสกุล" value={lastName} onChangeText={setLastName} />
            <View style={styles.spacer} />
            <CustomInput icon="calendar-outline" placeholder="วัน/เดือน/ปีเกิด (DD/MM/YYYY)" value={dob} onChangeText={setDob} />
            <View style={styles.spacer} />
            <CustomInput icon="briefcase-outline" placeholder="อาชีพ" value={occupation} onChangeText={setOccupation} />
            <View style={styles.spacer} />
            <CustomInput icon="mail-outline" placeholder="อีเมล" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <View style={styles.spacer} />
            <CustomInput icon="lock-closed-outline" placeholder="รหัสผ่าน" isPassword showToggle value={password} onChangeText={setPassword} />
            <View style={styles.spacerforpassword} />
            <CustomInput icon="shield-checkmark-outline" placeholder="ยืนยันรหัสผ่าน" isPassword showToggle value={confirmPwd} onChangeText={setConfirmPwd} />

            {/* Checkbox PDPA */}
            <View style={styles.checkboxContainer}>
              <TouchableOpacity onPress={() => setIsAgreed(!isAgreed)}>
                <Ionicons
                  name={isAgreed ? "checkbox" : "square-outline"}
                  size={24}
                  color={isAgreed ? "#206B64" : "#94A3B8"}
                />
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>
                ฉันยอมรับ{" "}
                <Text style={styles.linkText} onPress={() => setShowTerms(true)}>
                  เงื่อนไขการให้บริการ และนโยบายความเป็นส่วนตัว (PDPA)
                </Text>
              </Text>
            </View>

            <View style={{ marginTop: 24 }}>
              <CustomButton
                title={isLoading ? "กำลังลงทะเบียน..." : "ลงทะเบียน"}
                onPress={handleRegister}
                disabled={isLoading}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={{ color: COLORS.gray }}>มีบัญชีแล้ว? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.linkText}>เข้าสู่ระบบ</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal เงื่อนไขการใช้งาน */}
      <Modal visible={showTerms} animationType="slide" transparent onRequestClose={() => setShowTerms(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>นโยบายความเป็นส่วนตัว (PDPA)</Text>
            <ScrollView style={{ flex: 1 }}>
              <Text style={styles.modalBody}>
                แอปพลิเคชัน I&E Tracker เก็บข้อมูลส่วนบุคคลของคุณเพื่อใช้ในการให้บริการจัดการการเงิน
                ข้อมูลจะถูกเก็บไว้บนอุปกรณ์ของคุณและจะไม่ถูกส่งให้บุคคลที่สาม
                โดยไม่ได้รับความยินยอมจากคุณ
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowTerms(false)}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>ปิด</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
