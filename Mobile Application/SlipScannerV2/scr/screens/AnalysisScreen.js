// ─────────────────────────────────────────────
// screens/AnalysisScreen.js
// UI วิเคราะห์การเงิน — logic อยู่ใน useAnalysis
// ─────────────────────────────────────────────

import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../styles/commonStyles";
import { analysisStyles as S } from "../styles/analysisStyles";
import { useAnalysis } from "../hooks/useAnalysis";
import MonthPickerModal, { MonthSelectorButton } from "../components/MonthPickerModal";

const BAR_COLORS = ["#F59E0B", "#3B82F6", "#EC4899", "#6366F1", "#10B981", "#8B5CF6"];

export default function AnalysisScreen() {
  const {
    isLoading,
    summary,
    healthScore,
    momGrowth,
    maslowStats,
    categoryStats,
    selectedMonthIndex, setSelectedMonthIndex,
    selectedYear,       setSelectedYear,
  } = useAnalysis();

  const [isMonthModalVisible, setIsMonthModalVisible] = useState(false);

  // ── Maslow stacked bar ────────────────────────────────────────────────────
  const renderMaslowBar = () => {
    if (maslowStats.length === 0) return null;
    return (
      <View style={S.maslowBarContainer}>
        {maslowStats.map((item, index) => (
          <View
            key={item.maslow_id}
            style={{
              width:           `${item.percent}%`,
              backgroundColor: item.color,
              height:          "100%",
              borderTopLeftRadius:     index === 0                      ? 10 : 0,
              borderBottomLeftRadius:  index === 0                      ? 10 : 0,
              borderTopRightRadius:    index === maslowStats.length - 1 ? 10 : 0,
              borderBottomRightRadius: index === maslowStats.length - 1 ? 10 : 0,
            }}
          />
        ))}
      </View>
    );
  };

  // ── Empty state ───────────────────────────────────────────────────────────
  const renderEmpty = (message = "ยังไม่มีข้อมูลในเดือนนี้") => (
    <View style={S.emptyBox}>
      <Ionicons name="bar-chart-outline" size={40} color={COLORS.gray} />
      <Text style={S.emptyText}>{message}</Text>
    </View>
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.gray, marginTop: 12 }}>กำลังวิเคราะห์ข้อมูล...</Text>
      </View>
    );
  }

  return (
    <View style={S.container}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <View style={[S.headerBackground, {
        backgroundColor: COLORS.primary,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
      }]}>
        <SafeAreaView>
          <View style={S.headerRow}>
            <Text style={S.headerTitle}>วิเคราะห์การเงิน</Text>
            <MonthSelectorButton
              selectedMonthIndex={selectedMonthIndex}
              selectedYear={selectedYear}
              onPress={() => setIsMonthModalVisible(true)}
            />
          </View>

          {/* Health Score */}
          {/* {healthScore ? (
            <View style={S.healthScoreContainer}>
              <View>
                <Text style={S.scoreLabel}>Health Score</Text>
                <Text style={S.scoreValue}>{healthScore.grade}</Text>
              </View>
              <View style={S.scoreMessage}>
                <Text style={S.scoreTitle}>{healthScore.label}</Text>
                <Text style={S.scoreSub}>{healthScore.sub}</Text>
              </View>
              <View style={S.circularScore}>
                <Text style={{ color: COLORS.primary, fontWeight: "bold", fontSize: 16 }}>
                  {healthScore.score}
                </Text>
              </View>
            </View>
          ) : (
            <View style={[S.healthScoreContainer, { justifyContent: "center" }]}>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
                ยังไม่มีข้อมูลเดือนนี้
              </Text>
            </View>
          )} */}
        </SafeAreaView>
      </View>

      <ScrollView
        contentContainerStyle={S.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── 1. Overview Cards ────────────────────────────────────────────── */}
        <View style={S.summaryRow}>
          <View style={[S.summaryCard, { backgroundColor: "#D1FAE5" }]}>
            <View style={S.summaryIconBg}>
              <Ionicons name="arrow-down" size={18} color="#059669" />
            </View>
            <Text style={S.summaryLabel}>รายรับ</Text>
            <Text style={[S.summaryValue, { color: "#059669" }]}>
               {(summary?.income ?? 0).toLocaleString()}
            </Text>
          </View>

          <View style={[S.summaryCard, { backgroundColor: "#FEE2E2" }]}>
            <View style={[S.summaryIconBg, { backgroundColor: "rgba(239,68,68,0.2)" }]}>
              <Ionicons name="arrow-up" size={18} color="#DC2626" />
            </View>
            <Text style={S.summaryLabel}>รายจ่าย</Text>
            <Text style={[S.summaryValue, { color: "#DC2626" }]}>
              {(summary?.expense ?? 0).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* ── Savings Card ─────────────────────────────────────────────────── */}
        <View style={S.savingsCard}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={S.cardTitle}>เงินคงเหลือ (Savings)</Text>
            <View style={[S.trendTag, { backgroundColor: momGrowth >= 0 ? "#D1FAE5" : "#FEE2E2" }]}>
              <Ionicons
                name={momGrowth >= 0 ? "trending-up" : "trending-down"}
                size={14}
                color={momGrowth >= 0 ? "#059669" : "#DC2626"}
              />
              <Text style={[S.trendText, { color: momGrowth >= 0 ? "#059669" : "#DC2626" }]}>
                {momGrowth >= 0 ? "+" : ""}{momGrowth.toFixed(1)}%
              </Text>
            </View>
          </View>

          <Text style={[S.bigSavings, { color: (summary?.savings ?? 0) >= 0 ? "#111827" : "#DC2626" }]}>
            {(summary?.savings ?? 0).toLocaleString()}
          </Text>

          <Text style={S.burnRateText}>
            อัตราการใช้เงินเฉลี่ยวันละ {Math.round(summary?.burnRateDaily ?? 0).toLocaleString()} บาท
          </Text>
        </View>

        {/* ── 2. Maslow's Impact Breakdown ─────────────────────────────────── */}
        <View style={S.sectionContainer}>
          <Text style={S.sectionTitle}>{"Maslow's Impact Breakdown"}</Text>
          <Text style={S.sectionSubtitle}>วิเคราะห์การใช้จ่ายตามความจำเป็นทางจิตวิทยา</Text>

          {maslowStats.length === 0 ? renderEmpty("ยังไม่มีข้อมูล Maslow เดือนนี้") : (
            <>
              {renderMaslowBar()}

              <View style={S.maslowList}>
                {maslowStats.map((item) => (
                  <View key={item.maslow_id} style={S.maslowItem}>
                    <View style={[S.iconBox, { backgroundColor: item.color + "20" }]}>
                      <Ionicons name={item.icon} size={20} color={item.color} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={S.maslowName}>{item.label}</Text>
                      <Text style={S.maslowDesc}>{item.desc}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={S.maslowAmount}> {item.total.toLocaleString()}</Text>
                      <Text style={[S.maslowPercent, { color: item.color }]}>
                        {item.percent.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Dynamic insight */}
              {(() => {
                const highest = [...maslowStats].sort((a, b) => b.total - a.total)[0];
                if (!highest) return null;
                const isHighPhysical = highest.maslow_id === 1 && highest.percent > 40;
                return (
                  <View style={S.insightBox}>
                    <Ionicons name="bulb" size={20} color="#F59E0B" />
                    <Text style={S.insightText}>
                      <Text style={{ fontWeight: "bold" }}>Analyst Tip: </Text>
                      {isHighPhysical
                        ? `"${highest.label}" คิดเป็น ${highest.percent.toFixed(0)}% ของรายจ่ายทั้งหมด ลองลดค่าอาหารนอกบ้านดูนะ`
                        : `หมวดที่ใช้มากสุดคือ "${highest.label}" (${highest.percent.toFixed(0)}%) คอยดูแลให้สมดุลด้วยนะ`}
                    </Text>
                  </View>
                );
              })()}
            </>
          )}
        </View>

        {/* ── 3. Top Categories ────────────────────────────────────────────── */}
        <View style={S.sectionContainer}>
          <Text style={S.sectionTitle}>Top Categories</Text>

          {categoryStats.length === 0 ? renderEmpty("ยังไม่มีข้อมูลหมวดหมู่เดือนนี้") : (
            categoryStats.map((cat, index) => (
              <View key={cat.category_id ?? index} style={S.catRow}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
                  <Text style={S.catName}>{cat.category_name}</Text>
                  <Text style={S.catAmount}>
                     {cat.total.toLocaleString()} ({cat.percent.toFixed(0)}%)
                  </Text>
                </View>
                <View style={S.catBarBg}>
                  <View style={[S.catBarFill, {
                    width:           `${Math.min(cat.percent, 100)}%`,
                    backgroundColor: BAR_COLORS[index % BAR_COLORS.length],
                  }]} />
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <MonthPickerModal
        visible={isMonthModalVisible}
        onClose={() => setIsMonthModalVisible(false)}
        selectedMonthIndex={selectedMonthIndex}
        selectedYear={selectedYear}
        onSelectMonth={(index) => setSelectedMonthIndex(index)}
        onSelectYear={(year) => setSelectedYear(year)}
      />

    </View>
  );
}