// ─────────────────────────────────────────────
// screens/CategoryScreen.js
// Main category management screen.
// Owns useCategoryManager, controls modal state, and renders the full category list.
// ─────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { categoryStyles as styles } from '../styles/categoryStyles';
import { useCategoryManager } from '../hooks/useCategoryManager';
import { useCategoryUpdate } from '../hooks/useCategoryUpdate';
import { isSystemCategory } from '../database/database';
import AddCategoryModal from './AddCategoryModal';
import EditCategoryModal from './EditCategoryModal';

// ── CategoryRow ───────────────────────────────────────────────────────────────
// isSystem: ถ้า true → ซ่อนปุ่ม Edit ชื่อ และปุ่ม Delete
function CategoryRow({ item, onEdit, onDelete, showDivider }) {
  const isSystem = isSystemCategory(item.category_id);
  return (
    <>
      <View style={styles.categoryRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.categoryName}>{item.category_name}</Text>
          {isSystem && (
            <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>
              หมวดหมู่ระบบ
            </Text>
          )}
        </View>
        <View style={styles.rowActions}>
          {/* ✅ Edit: แสดงเฉพาะ user-created (id >= 1000) */}
          {!isSystem && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(item)}>
              <Ionicons name="create-outline" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
          {/* ✅ Delete: แสดงเฉพาะ user-created (id >= 1000) */}
          {!isSystem && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete(item)}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
          {/* ✅ System categories: แสดง lock icon แทน */}
          {isSystem && (
            <Ionicons name="lock-closed-outline" size={18} color="#D1D5DB" style={{ marginRight: 4 }} />
          )}
        </View>
      </View>
      {showDivider && <View style={styles.categoryRowDivider} />}
    </>
  );
}

// ── CategorySection ───────────────────────────────────────────────────────────
function CategorySection({ title, data, onEdit, onDelete, onAdd }) {
  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 20 }}>
        <Text style={styles.sectionHeader}>{title}</Text>
        <TouchableOpacity onPress={onAdd} style={{ padding: 4 }}>
          <Ionicons name="add-circle-outline" size={22} color="#6B7280" />
        </TouchableOpacity>
      </View>
      <View style={styles.sectionContent}>
        {data.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>ยังไม่มีหมวดหมู่</Text>
          </View>
        ) : (
          data.map((item, index) => (
            <CategoryRow
              key={item.category_id.toString()}
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
              showDivider={index < data.length - 1}
            />
          ))
        )}
      </View>
    </>
  );
}

// ── CategoryScreen ────────────────────────────────────────────────────────────
export default function CategoryScreen({ navigation }) {
  const {
    incomeCategories,
    expenseCategories,
    loading,
    error,
    loadCategories,
    createCategory,
    editCategory,
    deleteCategory,
  } = useCategoryManager();

  // Manual sync — เรียกเมื่อผู้ใช้กดปุ่ม "ตรวจสอบอัปเดต"
  const { checkForCategoryUpdates, isCheckingRef } = useCategoryUpdate(loadCategories);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncPress = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    await checkForCategoryUpdates();
    setIsSyncing(false);
  };

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addModalType, setAddModalType]       = useState('income');
  const [editTarget, setEditTarget]           = useState(null);

  // Auto-clear error banner after 3 seconds
  const errorTimerRef = useRef(null);
  useEffect(() => {
    if (error) {
      errorTimerRef.current = setTimeout(() => {
        // The hook owns the error state — we just let it fade visually;
        // there is no external setter here, so the banner disappears when
        // the hook clears its own error on the next successful operation.
        // Nothing to do — the banner will hide once error becomes null.
      }, 3000);
    }
    return () => {
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
      }
    };
  }, [error]);

  // Delete confirmation — block system categories
  const handleDelete = (item) => {
    if (isSystemCategory(item.category_id)) {
      Alert.alert('ไม่สามารถลบได้', 'หมวดหมู่ระบบไม่สามารถลบได้');
      return;
    }
    Alert.alert(
      'ลบหมวดหมู่',
      `ต้องการลบ "${item.category_name}" ใช่หรือไม่?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteCategory(item.category_id);
            if (!result.success) {
              Alert.alert('ไม่สามารถลบได้', result.error);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>จัดการหมวดหมู่</Text>
        {/* ปุ่ม Manual Sync */}
        <TouchableOpacity
          onPress={handleSyncPress}
          disabled={isSyncing}
          style={{ padding: 4 }}
        >
          {isSyncing
            ? <ActivityIndicator size="small" color="#6B7280" />
            : <Ionicons name="cloud-download-outline" size={22} color="#6B7280" />
          }
        </TouchableOpacity>
      </View>

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {/* Loading state */}
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}>
          <CategorySection
            title="หมวดหมู่รายรับ"
            data={incomeCategories}
            onEdit={(item) => setEditTarget(item)}
            onDelete={handleDelete}
            onAdd={() => { setAddModalType('income'); setAddModalVisible(true); }}
          />
          <CategorySection
            title="หมวดหมู่รายจ่าย"
            data={expenseCategories}
            onEdit={(item) => setEditTarget(item)}
            onDelete={handleDelete}
            onAdd={() => { setAddModalType('expense'); setAddModalVisible(true); }}
          />
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => { setAddModalType('income'); setAddModalVisible(true); }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modals */}
      <AddCategoryModal
        visible={addModalVisible}
        initialType={addModalType}
        onConfirm={async (data) => {
          const result = await createCategory(data);
          if (result.success) setAddModalVisible(false);
          return result;
        }}
        onCancel={() => setAddModalVisible(false)}
      />
      <EditCategoryModal
        visible={!!editTarget}
        category={editTarget}
        onConfirm={async (newName) => {
          const result = await editCategory(editTarget.category_id, newName);
          if (result.success) setEditTarget(null);
          return result;
        }}
        onCancel={() => setEditTarget(null)}
      />
    </SafeAreaView>
  );
}
