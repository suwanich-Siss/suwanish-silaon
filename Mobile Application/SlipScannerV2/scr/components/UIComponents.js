import React, { useState } from "react";
import { Text, TouchableOpacity, TextInput, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../styles/colors";

// 🔘 ปุ่มกดสวยๆ (Custom Button)
export const CustomButton = ({ title, onPress, type = "primary" }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        type === "primary" ? styles.btnPrimary : styles.btnOutline,
      ]}
    >
      <Text
        style={[
          styles.btnText,
          type === "primary" ? styles.textWhite : styles.textPrimary,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

// 📝 ช่องกรอกข้อมูล (Custom Input)
// props:
//   showToggle={true}  → แสดงปุ่มรูปตาสำหรับ toggle ดู/ซ่อนรหัสผ่าน
//   ต้องใช้คู่กับ isPassword={true} เสมอ
export const CustomInput = ({ icon, placeholder, isPassword, value, onChangeText, showToggle = false, keyboardType }) => {
  const [isVisible, setIsVisible] = useState(false);

  // ถ้าเป็น password field และ toggle เปิดอยู่ → แสดงตัวอักษร
  const secure = isPassword ? !isVisible : false;

  return (
    <View style={styles.inputContainer}>
      <Ionicons name={icon} size={20} color={COLORS.gray} style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.gray}
        secureTextEntry={secure}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
      {/* แสดงปุ่มตาเฉพาะ field ที่เป็น password และ showToggle=true */}
      {isPassword && showToggle && (
        <TouchableOpacity
          onPress={() => setIsVisible((prev) => !prev)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isVisible ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={COLORS.gray}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

// ประกาศ styles ครั้งเดียวที่ตรงนี้
const styles = StyleSheet.create({
  button: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  btnOutline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  btnText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  textWhite: { color: COLORS.white },
  textPrimary: { color: COLORS.primary },
  
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: COLORS.dark },
});