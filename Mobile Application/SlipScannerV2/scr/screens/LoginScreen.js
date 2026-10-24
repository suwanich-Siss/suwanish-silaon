import React, { useState } from "react";
import { View, Text, TouchableOpacity, Platform, KeyboardAvoidingView, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CustomInput, CustomButton } from "../components/UIComponents";
import { COLORS } from "../styles/commonStyles";
import { loginStyle } from "../styles/authStyles";
import { loginUser } from "../database/database";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen({ navigation }) {

  const {login} = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    setIsLoading(true);
    try {
      const userData = await loginUser(identifier, password);
      if (!userData) {
        Alert.alert("เข้าสู่ระบบไม่สำเร็จ", "อีเมลหรือรหัสผ่านไม่ถูกต้อง")
        return;
      }
      await login(userData);
    } catch (e) {
      Alert.alert("เกิดข้อผิดพลาด", e.message);
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
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
          
          {/* Header */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color="#11213D" />
          </TouchableOpacity>
          
          <View style={{ marginTop: 20, marginBottom: 40 }}>
            <Text style={styles.title}>ยินดีต้อนรับ 👋</Text>
            <Text style={styles.subtitle}>กรอกข้อมูลเพื่อเข้าใช้งาน I&E Traacker</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <CustomInput icon="mail-outline" placeholder="อีเมล" value={identifier} onChangeText={setIdentifier} />
            <View style={{ height: 16 }} />
            <CustomInput icon="lock-closed-outline" placeholder="รหัสผ่าน" isPassword showToggle value={password} onChangeText={setPassword} />
            
            {/* <TouchableOpacity style={styles.forgotPass}>
                <Text style={styles.linkText}>ลืมรหัสผ่าน?</Text>
            </TouchableOpacity> */}

            <View style={{ marginTop: 30 }}>
              <CustomButton 
                  title="เข้าสู่ระบบ" 
                  onPress={handleLogin} 
              />
            </View>
          </View>
          {/* Footer */}
          <View style={styles.footer}>
            <Text style={{color: COLORS.gray}}>ยังไม่มีบัญชี? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
                <Text style={styles.linkText}>ลงทะเบียน</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = loginStyle;