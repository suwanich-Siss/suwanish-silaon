import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, baseStyles } from "../styles/commonStyles";
import { homeStyles } from "../styles/homeStyles";
import { useHome } from "../hooks/useHome";

export default function HomeScreen({ navigation }) {
  const { greeting, summary, maslowStats, monthLabel } = useHome();
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  // maslowStats จาก hook เป็น array → แปลงเป็น map { maslow_id: percent }
  const maslowPercent = Object.fromEntries(
    [1, 2, 3, 4, 5].map((id) => {
      const found = maslowStats.find((m) => m.maslow_id === id);
      return [id, found?.percent ?? 0];
    }),
  );

  return (
    <SafeAreaView style={baseStyles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* A. Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingTitle}>{greeting}</Text>
          </View>
          <TouchableOpacity style={styles.profileContainer}>
            <View style={styles.avatar}>
              <Text style={{ fontSize: 20 }}>S</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* B. Summary Card */}
        <View style={styles.glassCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>ยอดเงินคงเหลือ ({monthLabel})</Text>
            <TouchableOpacity
              onPress={() => setIsBalanceVisible(!isBalanceVisible)}
            >
              <Ionicons
                name={isBalanceVisible ? "eye-outline" : "eye-off-outline"}
                size={20}
                color={COLORS.gray}
              />
            </TouchableOpacity>
          </View>

          {/* 1. แก้ไขยอดเงินคงเหลือ */}
          <Text style={styles.mainAmount}>
            {isBalanceVisible
              ? `${summary.balance.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : " *******"}
          </Text>
          <View style={styles.divider} />

          <View style={styles.statsRow}>
            {/* รายรับ */}
            <View style={styles.statItem}>
              <View style={[styles.iconBox, { backgroundColor: "#D1FAE5" }]}>
                <Ionicons name="arrow-down" size={18} color="#059669" />
              </View>
              <View>
                <Text style={styles.statLabel}>รายรับ </Text>
                {/* 2. แก้ไขรายรับ */}
                <Text style={[styles.statValue, { color: "#059669" }]}>
                  {isBalanceVisible
                    ? `+ ${summary.income.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "***"}
                </Text>
              </View>
            </View>

            <View style={styles.verticalLine} />

            {/* รายจ่าย */}
            <View style={styles.statItem}>
              <View style={[styles.iconBox, { backgroundColor: "#FEE2E2" }]}>
                <Ionicons name="arrow-up" size={18} color="#DC2626" />
              </View>
              <View>
                <Text style={styles.statLabel}>รายจ่าย </Text>
                {/* 3. แก้ไขรายจ่าย */}
                <Text style={[styles.statValue, { color: "#DC2626" }]}>
                  {isBalanceVisible
                    ? `- ${summary.expense.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "***"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* C. Maslow Analysis */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              {"ลำดับขั้นความต้องการของมาสโลว์"}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Analysis")}>
              <Text style={styles.seeAllText}>รายละเอียด</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.maslowCard}>
            <View style={styles.chartRow}>
              <View style={styles.donutContainer}>
                <NativeRing
                  size={160}
                  color="#F59E0B"
                  progress={maslowPercent[1] / 100}
                  zIndex={1}
                />
                <NativeRing
                  size={130}
                  color="#3B82F6"
                  progress={maslowPercent[2] / 100}
                  zIndex={2}
                />
                <NativeRing
                  size={100}
                  color="#EC4899"
                  progress={maslowPercent[3] / 100}
                  zIndex={3}
                />
                <NativeRing
                  size={70}
                  color="#8B5CF6"
                  progress={maslowPercent[4] / 100}
                  zIndex={4}
                />
                <NativeRing
                  size={40}
                  color="#10B981"
                  progress={maslowPercent[5] / 100}
                  zIndex={5}
                />
                <View style={styles.chartCenterText}>
                  <Ionicons name="prism" size={16} color={COLORS.dark} />
                </View>
              </View>

              <View style={styles.legendContainer}>
                <LegendItem
                  color="#F59E0B"
                  label="ร่างกาย/พื้นฐาน"
                  percent={maslowPercent[1]}
                />
                <LegendItem
                  color="#3B82F6"
                  label="ความปลอดภัย"
                  percent={maslowPercent[2]}
                />
                <LegendItem
                  color="#EC4899"
                  label="ความรัก/สังคม"
                  percent={maslowPercent[3]}
                />
                <LegendItem
                  color="#8B5CF6"
                  label="การยอมรับ"
                  percent={maslowPercent[4]}
                />
                <LegendItem
                  color="#10B981"
                  label="เติมเต็มชีวิต"
                  percent={maslowPercent[5]}
                  isComplete={maslowPercent[5] >= 100}
                />
              </View>
            </View>

            <View style={styles.tipBox}>
              <Ionicons
                name="sparkles"
                size={16}
                color="#8B5CF6"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.tipText}>
                Tip: ให้รางวัลตัวเองบ้าง เพื่อเพิ่มระดับ "การยอมรับ"!
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── NativeRing Component ───────────────────────────────────────────────────────
const NativeRing = ({ size, color, progress, zIndex }) => {
  const strokeWidth = 8;
  const displayProgress = progress <= 0 ? 0.015 : progress;
  const clamped = Math.min(Math.max(displayProgress, 0), 1);
  const rightProgress = Math.min(clamped, 0.5);
  const leftProgress = Math.max(clamped - 0.5, 0);
  const rightAngle = rightProgress * 360;
  const leftAngle = leftProgress * 360;

  return (
    <View style={{ position: "absolute", width: size, height: size, zIndex }}>
      {/* พื้นหลังจาง */}
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: color,
          opacity: 0.15,
        }}
      />

      {/* ครึ่งขวา */}
      <View
        style={{
          position: "absolute",
          left: size / 2,
          width: size / 2,
          height: size,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            position: "absolute",
            left: -size / 2,
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderTopColor: color,
            borderRightColor: color,
            borderBottomColor: "transparent",
            borderLeftColor: "transparent",
            transform: [{ rotate: `${rightAngle - 135}deg` }],
          }}
        />
      </View>

      {/* ครึ่งซ้าย */}
      {clamped > 0.5 && (
        <View
          style={{
            position: "absolute",
            left: 0,
            width: size / 2,
            height: size,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              position: "absolute",
              left: 0,
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderTopColor: "transparent",
              borderRightColor: "transparent",
              borderBottomColor: color,
              borderLeftColor: color,
              transform: [{ rotate: `${leftAngle - 135}deg` }],
            }}
          />
        </View>
      )}
    </View>
  );
};

// ── LegendItem Component ──────────────────────────────────────────────────────
const LegendItem = ({ color, label, percent, isComplete }) => (
  <View style={[styles.legendItem, isComplete && styles.completeLegend]}>
    <View style={[styles.dot, { backgroundColor: color }]} />
    <View style={{ flex: 1 }}>
      <Text style={styles.legendLabel}>{label}</Text>
      <Text style={[styles.legendPercent, { color }]}>
        {percent}% {isComplete ? "🎉" : ""}
      </Text>
    </View>
  </View>
);

const styles = homeStyles;
