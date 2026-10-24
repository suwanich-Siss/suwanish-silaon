import React, { useState } from "react";
import {
  Text, FlatList, TouchableOpacity, View,
  Dimensions, StatusBar, ActivityIndicator, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../styles/commonStyles";
import { ScanslipStyle as styles , pendingListStyles } from "../styles/scanStyles";

import { useSlipScanner } from "../hooks/useSlipScanner";
import SlipReviewModal from "../components/SlipReviewModal";

const { width } = Dimensions.get("window");

export default function Scanslip({ navigation }) {
  const {
    status, slips, totalAmount,
    isProcessing, isBulkProcessing, isSaving,
    pendingSlips, isReviewModalVisible,
    handlePickImage, handleBulkProcess, handleCancel,
    handleUpdatePendingSlip, handleToggleSlipSelection,
    handleSelectAll, handleConfirmSave, handleDiscardPending,
    setIsReviewModalVisible,
  } = useSlipScanner();

  const [focusedSlipId, setFocusedSlipId] = useState(null);

  const handleTapPendingSlip = (tempId) => {
    setFocusedSlipId(tempId);
    setIsReviewModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ─── Header ─── */}
      <LinearGradient
        colors={[COLORS.primary, "#4F46E5"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerContainer}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Slip Scanner</Text>
              <Text style={styles.headerSubtitle}>จัดการสลิปอัตโนมัติด้วย OCR.SPACE</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View>
              <Text style={styles.summaryLabel}>ยอดรวมจากสลิป</Text>
              <Text style={styles.summaryValue}>฿ {totalAmount.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryIcon}>
              <MaterialCommunityIcons name="receipt-text-check" size={32} color={COLORS.primary} />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ─── Action Dashboard ─── */}
      <View style={styles.actionContainer}>
        <Text style={styles.sectionTitle}>เลือกวิธีการสแกน</Text>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, isProcessing && styles.btnDisabled]}
            onPress={handlePickImage}
            disabled={isProcessing || isBulkProcessing}
          >
            <LinearGradient colors={["#F59E0B", "#FBBF24"]} style={styles.actionIconBg}>
              <Ionicons name="image" size={28} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionText}>เลือกรูปภาพ</Text>
            <Text style={styles.actionSub}>ทีละ 1 สลิป</Text>
          </TouchableOpacity>

          {!isBulkProcessing ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleBulkProcess}
              disabled={isProcessing}
            >
              <LinearGradient colors={["#10B981", "#34D399"]} style={styles.actionIconBg}>
                <Ionicons name="folder-open" size={28} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionText}>สแกนโฟลเดอร์</Text>
              <Text style={styles.actionSub}>หลายรูปพร้อมกัน</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: COLORS.danger, borderWidth: 1 }]}
              onPress={handleCancel}
            >
              <View style={[styles.actionIconBg, { backgroundColor: "#FEE2E2" }]}>
                <Ionicons name="close" size={28} color={COLORS.danger} />
              </View>
              <Text style={[styles.actionText, { color: COLORS.danger }]}>ยกเลิก</Text>
              <Text style={styles.actionSub}>หยุดการทำงาน</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Status */}
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>สถานะ: {status}</Text>
          {(isProcessing || isBulkProcessing) && (
            <ActivityIndicator size="small" color={COLORS.primary} />
          )}
        </View>
      </View>

      {/* ─── Pending Slips List ─── */}
      <View style={styles.listContainer}>
        <View style={pendingListStyles.listHeader}>
          <Text style={styles.sectionTitle}>
            รายการรอยืนยัน ({pendingSlips.length})
          </Text>
          {pendingSlips.length > 0 && (
            <TouchableOpacity
              onPress={() => { setFocusedSlipId(null); setIsReviewModalVisible(true); }}
              style={pendingListStyles.confirmAllBtn}
            >
              <Ionicons name="checkmark-done-outline" size={15} color="#fff" />
              <Text style={pendingListStyles.confirmAllText}>ยืนยันทั้งหมด</Text>
            </TouchableOpacity>
          )}
        </View>

<FlatList
  data={pendingSlips}
  keyExtractor={(item) => item.tempId}
  showsVerticalScrollIndicator={false}
  contentContainerStyle={{ paddingBottom: 40 }}
  renderItem={({ item }) => (
    <TouchableOpacity
      style={pendingListStyles.card}
      onPress={() => handleTapPendingSlip(item.tempId)}
      activeOpacity={0.75}
    >
      {item.imageUri ? (
        <Image
          source={{ uri: item.imageUri }}
          style={pendingListStyles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={[pendingListStyles.image, pendingListStyles.noImage]}>
          <Ionicons name="image-outline" size={36} color="#D1D5DB" />
        </View>
      )}

      <View style={pendingListStyles.info}>
        <View style={pendingListStyles.amountRow}>
          <Text style={pendingListStyles.amount}>
            {item.amount !== "N/A"
              ? `฿${parseFloat(item.amount.replace(",", "")).toLocaleString()}`
              : "ไม่พบยอดเงิน"}
          </Text>

          <View style={pendingListStyles.pendingBadge}>
            <Text style={pendingListStyles.pendingBadgeText}>รอยืนยัน</Text>
          </View>
        </View>

        <Text style={pendingListStyles.meta}>📅 {item.date}</Text>

        <Text style={pendingListStyles.meta} numberOfLines={1}>
          🔖 REF: {item.ref}
        </Text>

        <Text style={pendingListStyles.tapHint}>
          แตะเพื่อตรวจสอบและยืนยัน →
        </Text>
      </View>
    </TouchableOpacity>
  )}
  initialNumToRender={5}
maxToRenderPerBatch={5}
windowSize={5}
/>
      </View>

      {/* ─── Review Modal ─── */}
      <SlipReviewModal
        visible={isReviewModalVisible}
        pendingSlips={
          focusedSlipId
            ? pendingSlips.filter((s) => s.tempId === focusedSlipId)
            : pendingSlips
        }
        isSaving={isSaving}
        onToggleSelection={handleToggleSlipSelection}
        onSelectAll={handleSelectAll}
        onUpdate={handleUpdatePendingSlip}
        onConfirm={handleConfirmSave}
        onDiscard={() => {
          setFocusedSlipId(null);
          handleDiscardPending();
        }}
        onClose={() => {
          setFocusedSlipId(null);
          setIsReviewModalVisible(false);
        }}
      />
    </View>
  );
}

