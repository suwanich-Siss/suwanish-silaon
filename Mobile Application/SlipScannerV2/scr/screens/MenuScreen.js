import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  Image,
  ScrollView,
  Alert,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { menuStyles as styles, exportModalStyles } from "../styles/menuStyles";
import { COLORS } from "../styles/commonStyles";
import * as ImagePicker from "expo-image-picker";

import { askForFolderPermission } from "../services/storageService";

// นำเข้าโมดูลจัดการข้อมูลและระบบ Export จริง (แทนค่าจำลองตัวเดิม)
import {
  fetchTransactions,
  calculatePreviewSummary,
} from "../services/exportService";
import { generateExcelReport } from "../services/excelService";
import { generatePDFReport } from "../services/pdfService";
import { useAuth } from "../context/AuthContext";
import { updateUser, changePassword } from "../database/database";
import AsyncStorage from "@react-native-async-storage/async-storage";

// AsyncStorage keys สำหรับ notification settings
const NOTIFY_OCR_KEY    = "notify_ocr_enabled";
const NOTIFY_BUDGET_KEY = "notify_budget_enabled";

const { width } = Dimensions.get("window");

const getCurrentDate = () => {
  const now = new Date();
  return {
    day: now.getDate(),
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
};

const getFirstDayOfMonth = () => {
  const now = new Date();
  return { day: 1, month: now.getMonth() + 1, year: now.getFullYear() };
};

const daysInMonth = (month, year) => new Date(year, month, 0).getDate();

const MONTH_NAMES_TH = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

// ────────────────────────────────────────────────
// Sub-component: DateSpinner (คงโครงสร้างเดิมที่ใช้งานได้ดีอยู่แล้ว)
// ────────────────────────────────────────────────
const DateSpinner = ({ label, dateObj, onDateChange }) => {
  const maxDay = daysInMonth(dateObj.month, dateObj.year);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const changeDay = (delta) => {
    const newDay = clamp(dateObj.day + delta, 1, maxDay);
    onDateChange({ ...dateObj, day: newDay });
  };

  const changeMonth = (delta) => {
    let newMonth = dateObj.month + delta;
    let newYear = dateObj.year;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    const newMax = daysInMonth(newMonth, newYear);
    const newDay = clamp(dateObj.day, 1, newMax);
    onDateChange({ day: newDay, month: newMonth, year: newYear });
  };

  const changeYear = (delta) => {
    const newYear = dateObj.year + delta;
    const newMax = daysInMonth(dateObj.month, newYear);
    const newDay = clamp(dateObj.day, 1, newMax);
    onDateChange({ ...dateObj, year: newYear, day: newDay });
  };

  const SpinnerUnit = ({ value, label: unitLabel, onInc, onDec }) => (
    <View style={exportModalStyles.spinnerUnit}>
      <TouchableOpacity
        onPress={onInc}
        style={exportModalStyles.arrowBtn}
        activeOpacity={0.7}
      >
        <Ionicons
          name="chevron-up"
          size={18}
          color={COLORS.primary || "#6C63FF"}
        />
      </TouchableOpacity>
      <View style={exportModalStyles.spinnerValueBox}>
        <Text style={exportModalStyles.spinnerValue}>{value}</Text>
        <Text style={exportModalStyles.spinnerUnitLabel}>{unitLabel}</Text>
      </View>
      <TouchableOpacity
        onPress={onDec}
        style={exportModalStyles.arrowBtn}
        activeOpacity={0.7}
      >
        <Ionicons
          name="chevron-down"
          size={18}
          color={COLORS.primary || "#6C63FF"}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={exportModalStyles.spinnerRow}>
      <Text style={exportModalStyles.spinnerLabel}>{label}</Text>
      <View style={exportModalStyles.spinnerGroup}>
        <SpinnerUnit
          value={String(dateObj.day).padStart(2, "0")}
          label="วัน"
          onInc={() => changeDay(1)}
          onDec={() => changeDay(-1)}
        />
        <View style={exportModalStyles.spinnerDivider} />
        <SpinnerUnit
          value={MONTH_NAMES_TH[dateObj.month - 1]}
          label="เดือน"
          onInc={() => changeMonth(1)}
          onDec={() => changeMonth(-1)}
        />
        <View style={exportModalStyles.spinnerDivider} />
        <SpinnerUnit
          value={String(dateObj.year + 543)}
          label="ปี (พ.ศ.)"
          onInc={() => changeYear(1)}
          onDec={() => changeYear(-1)}
        />
      </View>
    </View>
  );
};

// ────────────────────────────────────────────────
// Main Screen Component
// ────────────────────────────────────────────────
export default function MenuScreen({ navigation }) {
  const { user, logout } = useAuth();
  const userId = user?.user_id;

  // --- States เดิมจากระบบ ---
  // ค่าเริ่มต้น true — จะถูก overwrite จาก AsyncStorage ใน useEffect ด้านล่าง
  const [isOCRNotifyEnabled,    setIsOCRNotifyEnabled]    = useState(true);
  const [isBudgetAlertEnabled,  setIsBudgetAlertEnabled]  = useState(true);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);

  const [userProfile, setUserProfile] = useState({
    name: user && user.first_name ? `${user.first_name} ${user.last_name}` : "-",
    email: user?.email ?? "-",
    image: null,
    dob: user?.birthdate ?? "-",
    occupation: user?.occupation ?? "-",
    slipPath: "DCIM/Screenshots/Slips",
  });

  useEffect(() => {
    if (user) {
      setUserProfile((prev) => ({
        ...prev,
        name: user.first_name ? `${user.first_name} ${user.last_name}` : "-",
        email: user.email ?? "-",
        dob: user.birthdate ?? "-",
        occupation: user.occupation ?? "-",
      }));
    }
  }, [user]);

  // โหลดค่า notification settings และรูปโปรไฟล์จาก AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const [ocrVal, budgetVal] = await Promise.all([
          AsyncStorage.getItem(NOTIFY_OCR_KEY),
          AsyncStorage.getItem(NOTIFY_BUDGET_KEY),
        ]);
        if (ocrVal    !== null) setIsOCRNotifyEnabled(ocrVal === "true");
        if (budgetVal !== null) setIsBudgetAlertEnabled(budgetVal === "true");
        
        if (userId) {
          const savedImage = await AsyncStorage.getItem(`profile_image_${userId}`);
          if (savedImage) {
            setUserProfile((prev) => ({ ...prev, image: savedImage }));
          }
        }
      } catch (e) {
        console.error("โหลดการตั้งค่าไม่สำเร็จ:", e);
      }
    })();
  }, [userId]);

  const handlePickProfileImage = async () => {
    if (!userId) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('ขออภัย', 'ต้องได้รับสิทธิ์ในการเข้าถึงรูปภาพเพื่อเปลี่ยนรูปโปรไฟล์');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        setUserProfile((prev) => ({ ...prev, image: selectedUri }));
        await AsyncStorage.setItem(`profile_image_${userId}`, selectedUri);
      }
    } catch (error) {
      console.error("Error picking profile image:", error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเปลี่ยนรูปโปรไฟล์ได้');
    }
  };

  const [tempProfile, setTempProfile] = useState({ ...userProfile });
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // --- States ฟิลเตอร์ขั้นสูงสำหรับระบบส่งออกข้อมูล (ใหม่) ---
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [exportFileType, setExportFileType] = useState(null); // "Excel" | "PDF"
  const [startDate, setStartDate] = useState(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState(getCurrentDate());
  const [filterType, setFilterType] = useState("all"); // "all" | "income" | "expense"
  const [activePreset, setActivePreset] = useState("month"); // "today" | "7days" | "30days" | "month" | "custom"

  // States พรีวิวและประมวลผลไฟล์เบื้องต้น
  const [previewSummary, setPreviewSummary] = useState({
    count: 0,
    income: 0,
    expense: 0,
    balance: 0,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // เอฟเฟกต์คอยอัปเดตยอดคำนวณสรุปแบบเรียลไทม์ทุกครั้งเมื่อฟิลเตอร์หรือวันที่ในหน้าจอเปลี่ยนไป
  useEffect(() => {
    if (isExportModalVisible) {
      loadPreviewData();
    }
  }, [startDate, endDate, filterType, isExportModalVisible]);

  const loadPreviewData = async () => {
    try {
      setIsLoadingPreview(true);
      const startStr = `${startDate.year}-${String(startDate.month).padStart(2, "0")}-${String(startDate.day).padStart(2, "0")}`;
      const endStr = `${endDate.year}-${String(endDate.month).padStart(2, "0")}-${String(endDate.day).padStart(2, "0")}`;

      const data = await fetchTransactions({
        startDate: startStr,
        endDate: endStr,
        type: filterType,
      });
      const result = calculatePreviewSummary(data);
      setPreviewSummary(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // แฮนดลอร์ปรับแต่งฟิลเตอร์วันที่อัจฉริยะ (Quick Presets)
  const applyDatePreset = (preset) => {
    setActivePreset(preset);
    const now = new Date();
    let start = new Date();

    if (preset === "today") {
      // วันนี้เท่านั้น
    } else if (preset === "7days") {
      start.setDate(now.getDate() - 7);
    } else if (preset === "30days") {
      start.setDate(now.getDate() - 30);
    } else if (preset === "month") {
      setStartDate(getFirstDayOfMonth());
      setEndDate(getCurrentDate());
      return;
    } else {
      return; // Custom ปล่อยให้เลือกเองอิสระ
    }

    setStartDate({
      day: start.getDate(),
      month: start.getMonth() + 1,
      year: start.getFullYear(),
    });
    setEndDate({
      day: now.getDate(),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });
  };

  const handleOpenExportModal = (fileType) => {
    setExportFileType(fileType);
    applyDatePreset("month"); // เริ่มต้นด้วยช่วงของเดือนนี้ตามระบบเดิม
    setIsExportModalVisible(true);
  };

  // ดำเนินการสร้างไฟล์ระบบจริง และเรียกหน้าต่างส่งแชร์ข้อมูล
  const handleConfirmExport = async () => {
    const start = new Date(startDate.year, startDate.month - 1, startDate.day);
    const end = new Date(endDate.year, endDate.month - 1, endDate.day);

    if (start > end) {
      Alert.alert("ข้อผิดพลาด", "วันที่เริ่มต้นห้ามมากกว่าวันที่สิ้นสุดครับ");
      return;
    }

    const startStr = `${startDate.year}-${String(startDate.month).padStart(2, "0")}-${String(startDate.day).padStart(2, "0")}`;
    const endStr = `${endDate.year}-${String(endDate.month).padStart(2, "0")}-${String(endDate.day).padStart(2, "0")}`;
    const dateText = `${String(startDate.day).padStart(2, "0")} ${MONTH_NAMES_TH[startDate.month - 1]} ${startDate.year + 543} - ${String(endDate.day).padStart(2, "0")} ${MONTH_NAMES_TH[endDate.month - 1]} ${endDate.year + 543}`;

    try {
      setIsExporting(true);
      // 1. ดึงชุดข้อมูลตามเป้าหมายตัวจริง
      const rawTransactions = await fetchTransactions({
        startDate: startStr,
        endDate: endStr,
        type: filterType,
      });

      if (rawTransactions.length === 0) {
        Alert.alert(
          "แจ้งเตือน",
          "ไม่พบข้อมูลรายการธุรกรรมในช่วงเวลาและเงื่อนไขฟิลเตอร์ที่คุณเลือกครับ",
        );
        return;
      }

      // 2. เรียกส่งต่อไปที่ Service ตามไฟล์ประเภทที่กดเลือก
      if (exportFileType === "Excel") {
        await generateExcelReport(rawTransactions, dateText);
      } else {
        await generatePDFReport(rawTransactions, previewSummary, dateText);
      }

      setIsExportModalVisible(false);
    } catch (error) {
      Alert.alert(
        "เกิดข้อผิดพลาดในการสร้างรายงาน",
        error.message || "กรุณาลองใหม่อีกครั้ง",
      );
    } finally {
      setIsExporting(false);
    }
  };

  // --- Handlers จัดการบัญชีเดิม (ไม่มีการแก้ไขคงไว้ครบถ้วน) ---
  const toggleOCRNotify = async () => {
    const next = !isOCRNotifyEnabled;
    setIsOCRNotifyEnabled(next);
    try { await AsyncStorage.setItem(NOTIFY_OCR_KEY, String(next)); }
    catch (e) { console.error("บันทึก OCR notify setting ไม่สำเร็จ:", e); }
  };

  const toggleBudgetAlert = async () => {
    const next = !isBudgetAlertEnabled;
    setIsBudgetAlertEnabled(next);
    try { await AsyncStorage.setItem(NOTIFY_BUDGET_KEY, String(next)); }
    catch (e) { console.error("บันทึก budget alert setting ไม่สำเร็จ:", e); }
  };

  const handleChangePassword = async () => {
    if (!userId) return;
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกข้อมูลรหัสผ่านให้ครบถ้วน");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("ข้อผิดพลาด", "รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("ข้อผิดพลาด", "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    try {
      const success = await changePassword(userId, oldPassword, newPassword);
      if (success) {
        Alert.alert("สำเร็จ", "รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว");
        setIsPasswordModalVisible(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        Alert.alert("ข้อผิดพลาด", "รหัสผ่านเดิมไม่ถูกต้อง");
      }
    } catch (error) {
      Alert.alert("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
    }
  };

  const handleEditProfile = () => {
    setTempProfile({
      name: userProfile.name,
      email: userProfile.email,
      dob: userProfile.dob,
      occupation: userProfile.occupation,
    });
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!userId) return;

    try {
      const nameParts = tempProfile.name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      await updateUser(userId, {
        first_name: firstName,
        last_name: lastName,
        email: tempProfile.email,
        birthdate: tempProfile.dob,
        occupation: tempProfile.occupation,
      });

      setUserProfile({...tempProfile});
      setIsEditModalVisible(false);
      Alert.alert("สำเร็จ", "ข้อมูลส่วนตัวของคุณถูกอัปเดตเรียบร้อยแล้ว");

    } catch (error) {
      Alert.alert("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการอัปเดตข้อมูลส่วนตัว");
    }
  };
  const handleLogout = () => {
    Alert.alert("ออกจากระบบ", "คุณต้องการออกจากระบบจริงๆใช่มั้ย??", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ออกจากระบบ",
        style: "destructive",
        onPress: async () => await logout(),
      },
    ]);
  };
  const handleChangeSlipFolder = async () => {
    const newUri = await askForFolderPermission();
    if (newUri) {
      const displayPath = decodeURIComponent(newUri).split(":").pop();
      setUserProfile((prev) => ({ ...prev, slipPath: displayPath }));
      Alert.alert("สำเร็จ", "เปลี่ยนโฟลเดอร์สลิปเรียบร้อยแล้ว");
    }
  };

  const MenuItem = ({
    icon,
    color,
    title,
    subtitle,
    onPress,
    rightElement,
  }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuLeft}>
        <View style={[styles.iconBox, { backgroundColor: color + "15" }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.menuTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.menuSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightElement ? (
        rightElement
      ) : (
        <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* ─── Modal แก้ไขโปรไฟล์เดิม ─── */}
      <Modal
        animationType="fade"
        transparent
        visible={isEditModalVisible}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>แก้ไขข้อมูลส่วนตัว</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.dark} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {[
                { label: "ชื่อ-นามสกุล", key: "name", keyboard: "default" },
                { label: "อีเมล", key: "email", keyboard: "email-address" },
                {
                  label: "วันเดือนปีเกิด",
                  key: "dob",
                  keyboard: "default",
                  placeholder: "เช่น 01 ม.ค. 1990",
                },
                { label: "อาชีพ", key: "occupation", keyboard: "default" },
              ].map(({ label, key, keyboard, placeholder }) => (
                <View key={key} style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{label}</Text>
                  <TextInput
                    style={styles.textInput}
                    value={tempProfile[key]}
                    keyboardType={keyboard}
                    placeholder={placeholder}
                    onChangeText={(txt) =>
                      setTempProfile({ ...tempProfile, [key]: txt })
                    }
                  />
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveProfile}
            >
              <Text style={styles.saveBtnText}>บันทึกข้อมูล</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── Modal เปลี่ยนรหัสผ่านเดิม ─── */}
      <Modal
        animationType="fade"
        transparent
        visible={isPasswordModalVisible}
        onRequestClose={() => setIsPasswordModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>เปลี่ยนรหัสผ่าน</Text>
              <TouchableOpacity
                onPress={() => setIsPasswordModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.dark} />
              </TouchableOpacity>
            </View>
            {[
              {
                label: "รหัสผ่านเดิม",
                value: oldPassword,
                set: setOldPassword,
              },
              {
                label: "รหัสผ่านใหม่",
                value: newPassword,
                set: setNewPassword,
              },
              {
                label: "ยืนยันรหัสผ่านใหม่",
                value: confirmPassword,
                set: setConfirmPassword,
              },
            ].map(({ label, value, set }) => (
              <View key={label} style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{label}</Text>
                <TextInput
                  style={styles.textInput}
                  secureTextEntry
                  value={value}
                  onChangeText={set}
                />
              </View>
            ))}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleChangePassword}
            >
              <Text style={styles.saveBtnText}>เปลี่ยนรหัสผ่าน</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── อัปเกรดความสามารถโมดอลส่งออกข้อมูลระดับโปร (ใหม่) ─── */}
      <Modal
        animationType="slide"
        transparent
        visible={isExportModalVisible}
        onRequestClose={() => setIsExportModalVisible(false)}
      >
        <View style={exportModalStyles.overlay}>
          <View style={exportModalStyles.sheet}>
            <View style={exportModalStyles.handle} />
            <View style={exportModalStyles.header}>
              <View
                style={[
                  exportModalStyles.headerIconWrap,
                  {
                    backgroundColor:
                      exportFileType === "Excel" ? "#10B981" : "#EF4444",
                  },
                ]}
              >
                <Ionicons
                  name={exportFileType === "Excel" ? "grid" : "document-text"}
                  size={22}
                  color="#fff"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={exportModalStyles.headerTitle}>
                  ส่งออก{" "}
                  {exportFileType === "Excel"
                    ? "Excel (.xlsx)"
                    : "รายงานสรุป PDF"}
                </Text>
                <Text style={exportModalStyles.headerSub}>
                  เลือกกรองช่วงเวลาและข้อมูลประเภทธุรกรรมบัญชี
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsExportModalVisible(false)}
                style={exportModalStyles.closeBtn}
              >
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={exportModalStyles.dividerLine} />

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* แถบตัวเลือกด่วนสำหรับช่วงเวลา */}
              <Text style={exportModalStyles.sectionLabel}>ช่วงเวลาด่วน</Text>
              <View style={exportModalStyles.presetContainer}>
                {[
                  { id: "today", text: "วันนี้" },
                  { id: "7days", text: "7 วันล่าสุด" },
                  { id: "30days", text: "30 วันล่าสุด" },
                  { id: "month", text: "เดือนนี้" },
                  { id: "custom", text: "กำหนดเอง" },
                ].map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      exportModalStyles.presetPill,
                      activePreset === p.id &&
                        exportModalStyles.presetPillActive,
                    ]}
                    onPress={() => applyDatePreset(p.id)}
                  >
                    <Text
                      style={[
                        exportModalStyles.presetPillText,
                        activePreset === p.id &&
                          exportModalStyles.presetPillTextActive,
                      ]}
                    >
                      {p.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* วงล้อตั้งค่าระบุวันที่กรณีเลือกกำหนดเอง */}
              {activePreset === "custom" && (
                <View style={{ marginVertical: 8 }}>
                  <DateSpinner
                    label="วันที่เริ่มต้นข้อมูล"
                    dateObj={startDate}
                    onDateChange={setStartDate}
                  />
                  <View style={exportModalStyles.arrowBetween}>
                    <Ionicons name="arrow-down" size={16} color="#9CA3AF" />
                  </View>
                  <DateSpinner
                    label="วันที่สิ้นสุดข้อมูล"
                    dateObj={endDate}
                    onDateChange={setEndDate}
                  />
                </View>
              )}

              {/* ฟิลเตอร์คัดแยกประเภทรายการเงิน */}
              <Text style={exportModalStyles.sectionLabel}>
                ประเภทรายการเงิน
              </Text>
              <View style={exportModalStyles.filterTabs}>
                {[
                  { id: "all", text: "ทั้งหมด" },
                  { id: "income", text: "เฉพาะรายรับ" },
                  { id: "expense", text: "เฉพาะรายจ่าย" },
                ].map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      exportModalStyles.tabItem,
                      filterType === t.id && exportModalStyles.tabItemActive,
                    ]}
                    onPress={() => setFilterType(t.id)}
                  >
                    <Text
                      style={[
                        exportModalStyles.tabItemText,
                        filterType === t.id &&
                          exportModalStyles.tabItemTextActive,
                      ]}
                    >
                      {t.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* การ์ดคำนวณพรีวิวยอดเงินสดพรีวิวเรียลไทม์ */}
              <Text style={exportModalStyles.sectionLabel}>
                ข้อมูลที่จะส่งออกเบื้องต้น
              </Text>
              {isLoadingPreview ? (
                <View
                  style={[
                    exportModalStyles.summaryBox,
                    { justifyContent: "center", paddingVertical: 20 },
                  ]}
                >
                  <ActivityIndicator color="#6C63FF" />
                </View>
              ) : (
                <View style={exportModalStyles.summaryGrid}>
                  <View style={exportModalStyles.miniCard}>
                    <Text style={exportModalStyles.miniLabel}>
                      รายการทั้งหมด
                    </Text>
                    <Text style={exportModalStyles.miniValue}>
                      {previewSummary.count} แถว
                    </Text>
                  </View>
                  <View style={exportModalStyles.miniCard}>
                    <Text style={exportModalStyles.miniLabel}>
                      ยอดรายรับรวม
                    </Text>
                    <Text
                      style={[
                        exportModalStyles.miniValue,
                        { color: "#10B981" },
                      ]}
                    >
                      ฿{previewSummary.income.toLocaleString()}
                    </Text>
                  </View>
                  <View style={exportModalStyles.miniCard}>
                    <Text style={exportModalStyles.miniLabel}>
                      ยอดรายจ่ายรวม
                    </Text>
                    <Text
                      style={[
                        exportModalStyles.miniValue,
                        { color: "#EF4444" },
                      ]}
                    >
                      ฿{previewSummary.expense.toLocaleString()}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* ปุ่มหลักกดยืนยันการรันสร้างไฟล์แชร์ */}
            <TouchableOpacity
              style={[
                exportModalStyles.confirmBtn,
                isExporting && exportModalStyles.confirmBtnLoading,
              ]}
              onPress={handleConfirmExport}
              activeOpacity={0.85}
              disabled={isExporting}
            >
              {isExporting ? (
                <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
              ) : (
                <Ionicons
                  name="share-outline"
                  size={20}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
              )}
              <Text style={exportModalStyles.confirmBtnText}>
                {isExporting
                  ? "กำลังประมวลผลไฟล์..."
                  : `ส่งออกแชร์ไฟล์ ${exportFileType}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── UI ส่วนหน้าจอหลักเดิมจากโปรเจกต์ ─── */}
      <View
        style={[
          styles.headerGradient,
          { borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
        ]}
      >
        <SafeAreaView>
          <View style={styles.profileContainer}>
            <View style={styles.avatarWrapper}>
              {userProfile.image ? (
                <Image source={{ uri: userProfile.image }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="person" size={40} color="#9CA3AF" />
                </View>
              )}
              <TouchableOpacity
                style={styles.editAvatarBtn}
                onPress={handlePickProfileImage}
              >
                <Ionicons name="camera" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userProfile.name}</Text>
              <Text style={styles.profileEmail}>{userProfile.email}</Text>
              <TouchableOpacity
                style={styles.editProfilePill}
                onPress={handleEditProfile}
              >
                <Text style={styles.editProfileText}>แก้ไขข้อมูลส่วนตัว</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.sectionHeader}>บัญชีและการตั้งค่า</Text>
        <View style={styles.menuGroup}>
          <MenuItem
            icon="folder-open"
            color="#F59E0B"
            title="ที่จัดเก็บสลิป (Auto Scan)"
            subtitle={userProfile.slipPath}
            onPress={handleChangeSlipFolder}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="lock-closed"
            color="#3B82F6"
            title="เปลี่ยนรหัสผ่าน"
            subtitle="อัปเดตรหัสผ่านเพื่อความปลอดภัย"
            onPress={() => setIsPasswordModalVisible(true)}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="notifications"
            color="#8B5CF6"
            title="แจ้งเตือนเมื่อ OCR สำเร็จ"
            rightElement={
              <Switch
                trackColor={{ false: "#E5E7EB", true: COLORS.primary }}
                thumbColor="#fff"
                onValueChange={toggleOCRNotify}
                value={isOCRNotifyEnabled}
              />
            }
          />
          <View style={styles.divider} />
          <MenuItem
            icon="warning"
            color="#F97316"
            title="แจ้งเตือนงบประมาณเกิน"
            subtitle="เตือนเมื่อใช้จ่ายใกล้ถึงงบที่ตั้งไว้"
            rightElement={
              <Switch
                trackColor={{ false: "#E5E7EB", true: COLORS.primary }}
                thumbColor="#fff"
                onValueChange={toggleBudgetAlert}
                value={isBudgetAlertEnabled}
              />
            }
          />
        </View>

        <Text style={styles.sectionHeader}>ข้อมูลและรายงาน</Text>
        <View style={styles.menuGroup}>
          <MenuItem
            icon="grid"
            color="#10B981"
            title="ส่งออก Excel (.xlsx)"
            subtitle="เลือกช่วงข้อมูลและแชร์ไปยังแอปอื่น"
            onPress={() => handleOpenExportModal("Excel")}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="document-text"
            color="#EF4444"
            title="ส่งออกรายงาน PDF"
            subtitle="เลือกช่วงข้อมูลและแชร์รายงานสรุป"
            onPress={() => handleOpenExportModal("PDF")}
          />
        </View>

        <Text style={styles.sectionHeader}>ระบบ</Text>
        <View style={styles.menuGroup}>
          <MenuItem
            icon="log-out-outline"
            color="#EF4444"
            title="ออกจากระบบ"
            subtitle="ออกจากบัญชีผู้ใช้งาน"
            onPress={handleLogout}
          />
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}
