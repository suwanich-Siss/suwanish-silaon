# 📱 คำอธิบายโค้ด: Screens (ส่วนที่ 1)

> ครอบคลุม: WelcomeScreen · LoginScreen · SignupScreen · HomeScreen · AddScreen · TransactionScreen

---

## 🏗️ Screen คืออะไร?

**Screen** คือหน้าจอแต่ละหน้าของแอป เปรียบเหมือน "หน้าเว็บ" แต่ละหน้า
- Screen ทำหน้าที่ **แสดงผล (UI)** เท่านั้น
- **Logic** อยู่ใน `hooks/` แยกต่างหาก ทำให้โค้ดสะอาดและง่ายต่อการแก้ไข

```
Navigation → Screen (UI) → Hook (Logic) → Database
   นำทาง      แสดงผล        จัดการข้อมูล    เก็บข้อมูล
```

---

## 1️⃣ WelcomeScreen.js — หน้าต้อนรับ

### 📌 ทำอะไร?
หน้าแรกที่ผู้ใช้เห็นเมื่อเปิดแอป มีโลโก้ ชื่อแอป และปุ่มเข้าสู่ระบบ/สมัครสมาชิก

```js
import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";        // ไอคอน
import { WelcomeStyle } from "../styles/authStyles";  // styles
import { SafeAreaView } from "react-native-safe-area-context";
// SafeAreaView: ป้องกัน content ไปซ่อนอยู่หลัง notch หรือ status bar
import { StatusBar } from "expo-status-bar";
// StatusBar: แถบบนสุดของมือถือ (แสดงเวลา/สัญญาณ)
```

```js
export default function WelcomeScreen({ navigation }) {
  // { navigation } = props จาก React Navigation
  // navigation.navigate("Login") = ไปหน้า Login
  // navigation.goBack() = กลับหน้าก่อนหน้า
```

```js
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      {/* style="dark" = ตัวอักษรบน status bar เป็นสีดำ (เหมาะกับพื้นหลังสว่าง) */}

      <View style={styles.contentContainer}>

        {/* โลโก้แอป */}
        <View style={styles.logoGlowWrapper}>
          <Image
            source={require("../../assets/Logoapp.png")}
            // require() โหลดรูปภาพจาก local file
            style={styles.logoImage}
            resizeMode="contain"
            // contain = รักษาสัดส่วน ไม่ตัดขอบ ไม่ยืด
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.titleTop}>I&E</Text>
          <Text style={styles.titleBottom}>Tracker</Text>
          <Text style={styles.subtitle}>
            จัดการเรื่องเงินให้เป็นเรื่องง่าย{"\n"}ด้วยพลัง OCR อัจฉริยะ
            {/* "\n" = ขึ้นบรรทัดใหม่ใน string */}
          </Text>
        </View>
      </View>

      <View style={styles.bottomContainer}>

        {/* ปุ่มหลัก: เริ่มต้นใช้งาน → ไปหน้า Login */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate("Login")}
          activeOpacity={0.85}
          // activeOpacity: ความโปร่งใสเมื่อกด (0-1, ยิ่งน้อยยิ่งจาง)
        >
          <Text style={styles.primaryBtnText}>เริ่มต้นใช้งาน</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* ปุ่มรอง: สร้างบัญชีใหม่ → ไปหน้า Signup */}
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate("Signup")}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryBtnText}>สร้างบัญชีใหม่</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>Version 1.5.25</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = WelcomeStyle;
// ย้าย styles มาจาก authStyles แทนการเขียน StyleSheet inline
```

---

## 2️⃣ LoginScreen.js — หน้าเข้าสู่ระบบ

### 📌 ทำอะไร?
ฟอร์มกรอกอีเมล + รหัสผ่าน ตรวจสอบกับ SQLite แล้ว login เข้าแอป

```js
import { loginUser } from "../database/database";
// loginUser = ค้นหาผู้ใช้และเช็ค password hash
import { useAuth } from "../context/AuthContext";
// useAuth ดึง login function สำหรับเก็บ session
```

### State

```js
const { login } = useAuth();
// login(userData) = บันทึก user ลง Context ทำให้ทั้งแอปรู้ว่า login แล้ว

const [identifier, setIdentifier] = useState("");  // อีเมล
const [password,   setPassword]   = useState("");  // รหัสผ่าน
const [isLoading,  setIsLoading]  = useState(false);
```

### handleLogin — ฟังก์ชันเข้าสู่ระบบ

```js
const handleLogin = async () => {
  // Validation ก่อน
  if (!identifier.trim() || !password) {
    Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอกอีเมลและรหัสผ่าน");
    return;
  }

  setIsLoading(true);
  try {
    // เรียก DB ตรวจสอบ email + password
    const userData = await loginUser(identifier, password);
    
    if (!userData) {
      // null = ไม่พบ หรือ password ไม่ตรง
      Alert.alert("เข้าสู่ระบบไม่สำเร็จ", "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }
    
    await login(userData);
    // login() เก็บ userData ใน AuthContext → Navigation จะ redirect ไปหน้าหลักเอง
    
  } catch (e) {
    Alert.alert("เกิดข้อผิดพลาด", e.message);
  } finally {
    setIsLoading(false);
  }
};
```

### Layout

```js
return (
  <SafeAreaView style={styles.container}>
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      // iOS: เลื่อน content ขึ้น | Android: ย่อ content
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
        {/* flexGrow: 1 = ทำให้ ScrollView ขยายเต็มพื้นที่ */}

        {/* ปุ่มกลับ */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#11213D" />
        </TouchableOpacity>

        {/* Title */}
        <View style={{ marginTop: 20, marginBottom: 40 }}>
          <Text style={styles.title}>ยินดีต้อนรับ 👋</Text>
          <Text style={styles.subtitle}>กรอกข้อมูลเพื่อเข้าใช้งาน</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <CustomInput
            icon="mail-outline"
            placeholder="อีเมล"
            value={identifier}
            onChangeText={setIdentifier}
            // CustomInput = component ที่สร้างเองใน UIComponents.js
          />
          <View style={{ height: 16 }} />
          {/* View ว่างๆ ทำหน้าที่เว้นระยะ (Spacer) */}
          
          <CustomInput
            icon="lock-closed-outline"
            placeholder="รหัสผ่าน"
            isPassword      // แสดง/ซ่อนรหัสผ่าน
            showToggle      // ปุ่มตา
            value={password}
            onChangeText={setPassword}
          />

          <View style={{ marginTop: 30 }}>
            <CustomButton
              title="เข้าสู่ระบบ"
              onPress={handleLogin}
            />
          </View>
        </View>

        {/* Footer: ลิงก์ไปสมัครสมาชิก */}
        <View style={styles.footer}>
          <Text style={{ color: COLORS.gray }}>ยังไม่มีบัญชี? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
            <Text style={styles.linkText}>ลงทะเบียน</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
);
```

---

## 3️⃣ SignupScreen.js — หน้าสมัครสมาชิก

### 📌 ทำอะไร?
ฟอร์มสมัครสมาชิก พร้อม PDPA checkbox และ Modal แสดงนโยบาย

### State ทั้งหมด

```js
const [firstName,  setFirstName]  = useState("");
const [lastName,   setLastName]   = useState("");
const [dob,        setDob]        = useState("");   // วันเดือนปีเกิด
const [occupation, setOccupation] = useState("");
const [email,      setEmail]      = useState("");
const [password,   setPassword]   = useState("");
const [confirmPwd, setConfirmPwd] = useState("");
const [isAgreed,   setIsAgreed]   = useState(false); // ยอมรับ PDPA
const [showTerms,  setShowTerms]  = useState(false); // เปิด Modal เงื่อนไข
const [isLoading,  setIsLoading]  = useState(false);
```

### handleRegister — ฟังก์ชันสมัครสมาชิก

```js
const handleRegister = async () => {
  // ── Validation ──
  if (!firstName || !lastName || !email || !password || !dob) {
    Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอกข้อมูลให้ครบทุกช่องครับ");
    return;
  }
  if (password !== confirmPwd) {
    Alert.alert("แจ้งเตือน", "รหัสผ่านไม่ตรงกัน");
    return;
  }
  if (!isAgreed) {
    Alert.alert("แจ้งเตือน", "กรุณายอมรับเงื่อนไขก่อนลงทะเบียน");
    return;
  }

  setIsLoading(true);
  try {
    // สร้าง user ใหม่ใน SQLite
    const result = await createUser({
      firstName, lastName, email, password,
      birthdate: dob, occupation,
    });
    // result.lastInsertRowId = ID ของแถวที่เพิ่งสร้าง

    // บันทึกเวลายอมรับ PDPA
    await acceptPDPA(result.lastInsertRowId);

    // ดึง user ที่เพิ่งสร้างมา login
    const newUser = await getUserByEmail(email.toLowerCase().trim());
    await login(newUser);
    // login() → redirect ไปหน้าหลักเอง
    
  } catch (error) {
    if (error.message?.includes("UNIQUE")) {
      // UNIQUE constraint ใน SQLite = email ซ้ำ
      Alert.alert("อีเมลซ้ำ", "อีเมลนี้ถูกใช้งานแล้ว");
    } else {
      Alert.alert("เกิดข้อผิดพลาด", error.message);
    }
  } finally {
    setIsLoading(false);
  }
};
```

### PDPA Checkbox

```js
<View style={styles.checkboxContainer}>
  <TouchableOpacity onPress={() => setIsAgreed(!isAgreed)}>
    {/* กดแล้ว toggle true/false */}
    <Ionicons
      name={isAgreed ? "checkbox" : "square-outline"}
      // ถ้า true แสดง checkbox เต็ม ถ้า false แสดง outline
      size={24}
      color={isAgreed ? "#206B64" : "#94A3B8"}
    />
  </TouchableOpacity>
  <Text style={styles.checkboxLabel}>
    ฉันยอมรับ{" "}
    {/* {" "} = เว้นวรรค */}
    <Text style={styles.linkText} onPress={() => setShowTerms(true)}>
      เงื่อนไขการให้บริการ และนโยบายความเป็นส่วนตัว (PDPA)
    </Text>
  </Text>
</View>
```

### Modal เงื่อนไขการใช้งาน

```js
<Modal
  visible={showTerms}         // แสดงเมื่อ showTerms = true
  animationType="slide"       // เลื่อนขึ้นมาจากด้านล่าง
  transparent                 // พื้นหลัง overlay โปร่งใส
  onRequestClose={() => setShowTerms(false)}  // ปิดเมื่อกดปุ่ม Back (Android)
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalCard}>
      <Text style={styles.modalTitle}>นโยบายความเป็นส่วนตัว (PDPA)</Text>
      <ScrollView style={{ flex: 1 }}>
        <Text style={styles.modalBody}>...</Text>
      </ScrollView>
      <TouchableOpacity
        style={styles.modalCloseBtn}
        onPress={() => setShowTerms(false)}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>ปิด</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
```

---

## 4️⃣ HomeScreen.js — หน้าหลัก

### 📌 ทำอะไร?
แสดงสรุปรายรับ-รายจ่าย เดือนปัจจุบัน + กราฟ Maslow แบบ Concentric Ring

### การใช้ Hook

```js
const { greeting, summary, maslowStats, monthLabel } = useHome();
// greeting = "อรุณสวัสดิ์ ☀️" / "สวัสดีตอนบ่าย" ฯลฯ
// summary = { income, expense, balance }
// maslowStats = array ของแต่ละระดับพร้อม % และสี

const [isBalanceVisible, setIsBalanceVisible] = useState(true);
// toggle ซ่อน/แสดงยอดเงิน (ปุ่มตา)
```

### แปลง Array → Map สำหรับ Ring Chart

```js
const maslowPercent = Object.fromEntries(
  [1, 2, 3, 4, 5].map((id) => {
    const found = maslowStats.find((m) => m.maslow_id === id);
    // หา item ใน array ที่ maslow_id ตรง
    return [id, found?.percent ?? 0];
    // ถ้าไม่พบ = 0%
  }),
);
// ผล: { 1: 35, 2: 20, 3: 15, 4: 10, 5: 5 }
```

### Summary Card พร้อม toggle ซ่อน/แสดง

```js
<View style={styles.glassCard}>
  <View style={styles.cardHeader}>
    <Text style={styles.cardLabel}>ยอดเงินคงเหลือ ({monthLabel})</Text>
    <TouchableOpacity onPress={() => setIsBalanceVisible(!isBalanceVisible)}>
      <Ionicons
        name={isBalanceVisible ? "eye-outline" : "eye-off-outline"}
        size={20} color={COLORS.gray}
      />
    </TouchableOpacity>
  </View>

  <Text style={styles.mainAmount}>
    {isBalanceVisible
      ? `${summary.balance.toLocaleString("th-TH", {
          minimumFractionDigits: 2,   // แสดงทศนิยมขั้นต่ำ 2 หลัก
          maximumFractionDigits: 2,
        })}`
      : " *******"   // ซ่อนด้วยดอกจัน
    }
  </Text>
</View>
```

### NativeRing Component — วงแหวนแสดง % ของมาสโลว์

```js
const NativeRing = ({ size, color, progress, zIndex }) => {
  const strokeWidth = 8;       // ความหนาของวงแหวน
  
  // ป้องกัน progress = 0 (วงแหวนหายไป → ใช้ 0.015 แทน)
  const displayProgress = progress <= 0 ? 0.015 : progress;
  const clamped = Math.min(Math.max(displayProgress, 0), 1);
  // clamp: ให้ค่าอยู่ระหว่าง 0-1 เสมอ

  // แบ่งวงแหวนเป็นครึ่งขวา + ครึ่งซ้าย (เพราะ CSS ทำ full circle ไม่ได้ใน RN)
  const rightProgress = Math.min(clamped, 0.5);  // 0 - 50%
  const leftProgress  = Math.max(clamped - 0.5, 0);  // 50% - 100%
  const rightAngle    = rightProgress * 360;
  const leftAngle     = leftProgress * 360;

  return (
    <View style={{ position: "absolute", width: size, height: size, zIndex }}>
      {/* พื้นหลังจาง (track) */}
      <View style={{
        position: "absolute", width: size, height: size,
        borderRadius: size / 2,     // ทำให้เป็นวงกลม
        borderWidth: strokeWidth,
        borderColor: color,
        opacity: 0.15,              // จางๆ เป็น background
      }} />

      {/* ครึ่งขวา: ใช้ overflow: "hidden" ตัดครึ่ง แล้วหมุน */}
      <View style={{ position: "absolute", left: size / 2, width: size / 2, height: size, overflow: "hidden" }}>
        <View style={{
          position: "absolute", left: -size / 2,
          width: size, height: size, borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderTopColor: color, borderRightColor: color,
          borderBottomColor: "transparent", borderLeftColor: "transparent",
          transform: [{ rotate: `${rightAngle - 135}deg` }],
          // หมุน border เพื่อแสดง arc
        }} />
      </View>

      {/* ครึ่งซ้าย: แสดงเมื่อ progress > 50% */}
      {clamped > 0.5 && ( ... )}
    </View>
  );
};
```

---

## 5️⃣ AddScreen.js — หน้าเพิ่มรายการ (Tab Container)

### 📌 ทำอะไร?
เป็น "กล่องครอบ" ที่มี 3 Tab: รายจ่าย / รายรับ / ตั้งงบประมาณ แล้วแสดง Screen ที่ถูกต้อง

### แนวคิด: Container + Child Screens

```
AddScreen (Container)
├── Tab: รายจ่าย   → แสดง TransactionScreen (type="expense")
├── Tab: รายรับ    → แสดง TransactionScreen (type="income")
└── Tab: งบประมาณ → แสดง BudgetScreen
```

### Tab Configuration

```js
const TABS = [
  { key: "expense", label: "รายจ่าย",     activeStyle: "activeExpense" },
  { key: "income",  label: "รายรับ",      activeStyle: "activeIncome"  },
  { key: "budget",  label: "ตั้งงบประมาณ", activeStyle: "activeBudget"  },
];
// Array ของ config แทน if-else ซ้ำๆ
```

### State + Hook

```js
const [type, setType] = useState("expense");  // tab ที่เลือก
const tx = useTransaction();
// tx.amount, tx.setAmount, tx.handleSave, tx.resetForm ฯลฯ
// เก็บ hook ไว้ใน object เดียว ส่งต่อ props ได้ง่าย

const { toastMessage, showToast, hideToast } = useBudgetToast();
// Toast แจ้งเตือนงบเกิน
```

### Tab Change Handler

```js
const handleTabChange = (newType) => {
  if (type !== "budget" && newType !== "budget") {
    tx.resetForm();
    // ล้าง form ทุกครั้งที่สลับระหว่าง income/expense
    // ไม่ reset ถ้าเพิ่งกลับมาจาก budget tab
  }
  setType(newType);
};
```

### Tab Bar

```js
<View style={styles.toggleWrapper}>
  {TABS.map((tab) => (
    <TouchableOpacity
      key={tab.key}
      style={[
        styles.toggleBtn,
        type === tab.key && styles[tab.activeStyle]
        // styles["activeExpense"] = เรียก property แบบ bracket notation
        // ทำได้เพราะ tab.activeStyle คือ string ชื่อ style
      ]}
      onPress={() => handleTabChange(tab.key)}
    >
      <Text style={[styles.toggleText, type === tab.key && styles.activeText]}>
        {tab.label}
      </Text>
    </TouchableOpacity>
  ))}
</View>
```

### Content Render

```js
{type === "budget" ? (
  <BudgetScreen />
) : (
  <TransactionScreen
    type={type}
    userId={userId}
    // ส่ง state + setter ทั้งหมดจาก useTransaction ลงไป
    amount={tx.amount}          setAmount={tx.setAmount}
    date={tx.date}              setDate={tx.setDate}
    time={tx.time}              setTime={tx.setTime}
    note={tx.note}              setNote={tx.setNote}
    selectedCategory={tx.selectedCategory}
    selectedMaslow={tx.selectedMaslow}   setSelectedMaslow={tx.setSelectedMaslow}
    scrollRef={tx.scrollRef}
    handleCategorySelect={tx.handleCategorySelect}
    handleSave={tx.handleSave}
    incomeCategories={tx.incomeCategories}
    expenseCategories={tx.expenseCategories}
    navigation={navigation}
    onBudgetAlert={showToast}  // callback เมื่องบเกิน → แสดง Toast
  />
)}
```

---

## 6️⃣ TransactionScreen.js — ฟอร์มกรอกรายการ

### 📌 ทำอะไร?
ฟอร์มกรอกรายละเอียดธุรกรรม: จำนวนเงิน → วันเวลา → Note → เลือก Category → เลือก Maslow (ถ้าเป็นรายจ่าย)

### Props ที่รับมา

```js
export default function TransactionScreen({
  type,               // "expense" | "income"
  userId,             // user_id จาก AuthContext
  amount, setAmount,
  date,   setDate,
  time,   setTime,
  note,   setNote,
  selectedCategory,
  selectedMaslow, setSelectedMaslow,
  scrollRef,           // ref ไปยัง FlatList สำหรับ scroll
  handleCategorySelect,
  handleSave,
  incomeCategories,
  expenseCategories,
  navigation,
  onBudgetAlert,       // callback แจ้งเตือนงบ
}) {
```

### Derived Values

```js
const isExpense   = type === "expense";
const accentColor = isExpense ? "#EF4444" : "#10B981";
// สีแดง = รายจ่าย, สีเขียว = รายรับ

const categories = isExpense ? expenseCategories : incomeCategories;

const canSave =
  !!amount &&                           // มีจำนวนเงิน
  !isNaN(parseFloat(amount)) &&         // แปลงเป็น number ได้
  !!selectedCategory &&                 // เลือก category แล้ว
  (isExpense ? !!selectedMaslow : true); // ถ้าเป็น expense ต้องเลือก maslow ด้วย
// !! = แปลงเป็น boolean (truthy → true, falsy → false)
```

### Date/Time Picker

```js
const [showDatePicker, setShowDatePicker] = useState(false);
const [showTimePicker, setShowTimePicker] = useState(false);

const dateObj = date ? new Date(date + "T00:00:00") : new Date();
// ต่อ T00:00:00 ป้องกัน timezone ทำให้วันเปลี่ยน

const onDateChange = (event, selected) => {
  setShowDatePicker(false);                    // ปิด picker
  if (event.type === "dismissed") return;      // กด Cancel → ออก
  if (selected) {
    const iso = selected.getFullYear() + "-"
      + String(selected.getMonth() + 1).padStart(2, "0") + "-"
      + String(selected.getDate()).padStart(2, "0");
    // แปลง Date object → "YYYY-MM-DD"
    setDate(iso);
  }
};
```

```js
{showDatePicker && (
  <DateTimePicker
    value={dateObj}
    mode="date"
    display={Platform.OS === "ios" ? "spinner" : "calendar"}
    // iOS = spinner wheel, Android = calendar grid
    onChange={onDateChange}
    locale="th"
  />
)}
```

### Format Number

```js
const formatNumber = (num) => {
  if (!num) return "";
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  // Regex: เพิ่ม comma ทุก 3 หลัก 1000 → 1,000
  // \B = ไม่ใช่ word boundary (ไม่ใส่ที่ต้นตัวเลข)
  // (?=(\d{3})+(?!\d)) = มองข้างหน้าว่ามี 3 หลักตามมา
};
```

### Pager: Category / Maslow

```js
<FlatList
  ref={scrollRef}               // ให้ hook จาก AddScreen scroll ได้
  data={isExpense ? [1, 2] : [1]}  // expense = 2 หน้า, income = 1 หน้า
  horizontal                    // scroll แนวนอน
  pagingEnabled                 // snap ทีละหน้าพอดี
  scrollEnabled={false}         // ผู้ใช้ scroll เองไม่ได้ → ต้อง scroll ผ่านโค้ด
  keyExtractor={(item) => item.toString()}
  renderItem={({ index }) => {
    if (index === 0) {
      // หน้าเลือก Category
      return (
        <View style={{ width }}>  {/* width เท่ากับหน้าจอ */}
          {categories.map((item) => {
            const isSelected = selectedCategory?.category_id === item.category_id;
            return (
              <TouchableOpacity
                key={item.category_id.toString()}
                style={[styles.catItemWrapper, isSelected && styles.catItemSelected]}
                onPress={() => handleCategorySelect(item, type)}
                // handleCategorySelect จะ scroll ไปหน้า Maslow อัตโนมัติ
              >
                ...
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    // index === 1: หน้าเลือก Maslow (expense only)
    return (
      <View style={{ width }}>
        {/* ปุ่มกลับ */}
        <TouchableOpacity onPress={() => scrollRef.current?.scrollToIndex({ index: 0, animated: true })}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        
        {MASLOW_LEVELS.map((level) => {
          const isSelected = selectedMaslow?.id === level.id;
          return (
            <TouchableOpacity
              key={level.id}
              style={[styles.maslowCard, isSelected && { borderColor: level.color }]}
              onPress={() => setSelectedMaslow(level)}
            >
              ...
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }}
/>
```

### Floating Save Button

```js
{/* แสดงเมื่อ canSave เท่านั้น */}
{canSave && (
  <View style={styles.floatingButtonContainer}>
    <TouchableOpacity
      style={[styles.saveBtn, { backgroundColor: accentColor }]}
      onPress={() => handleSave({ userId, onBudgetAlert })}
    >
      <Text style={styles.saveBtnText}>ยืนยันรายการ</Text>
      <Ionicons name="checkmark-circle" size={24} color="#fff" />
    </TouchableOpacity>
  </View>
)}
```

---

## 🔑 สรุป Pattern ที่ใช้ใน Part 1

| Pattern | ตัวอย่าง | ประโยชน์ |
|---------|---------|---------|
| **Props drilling** | AddScreen → TransactionScreen | ส่ง state/setter ลงไปหลายชั้น |
| **Conditional rendering** | `{canSave && <Button/>}` | แสดงเฉพาะเมื่อเงื่อนไขตรง |
| **Dynamic style** | `[styles.base, isSelected && styles.active]` | style ตามเงื่อนไข |
| **!! double bang** | `!!amount` | แปลงค่าเป็น boolean |
| **activeOpacity** | `<TouchableOpacity activeOpacity={0.85}>` | feedback เมื่อกด |
| **platform check** | `Platform.OS === "ios" ? "padding" : "height"` | ปรับตาม OS |
| **bracket notation** | `styles[tab.activeStyle]` | เรียก property แบบ dynamic |
| **Pager FlatList** | `scrollEnabled={false}` + `scrollToIndex` | navigate ผ่านโค้ด |
