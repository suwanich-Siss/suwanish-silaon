// ─────────────────────────────────────────────
// screens/AddCategoryModal.js
// Presentation component — no hook imports, no DB imports.
// All mutations happen via onConfirm callback.
// ─────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { categoryStyles as styles } from '../styles/categoryStyles';

/**
 * AddCategoryModal
 *
 * Props:
 *   visible      {boolean}        — controls Modal visibility
 *   initialType  {string}         — 'income' | 'expense', pre-sets the type selector
 *   onConfirm    {async function} — called with { categoryName, categoryType };
 *                                   returns { success: boolean, error?: string }
 *   onCancel     {function}       — called when the user cancels
 */
export default function AddCategoryModal({ visible, initialType, onConfirm, onCancel }) {
  const [name, setName]           = useState('');
  const [type, setType]           = useState(initialType ?? 'income');
  const [nameError, setNameError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Re-sync type when initialType changes
  useEffect(() => {
    setType(initialType ?? 'income');
  }, [initialType]);

  // Reset name and nameError when modal closes
  useEffect(() => {
    if (!visible) {
      setName('');
      setNameError('');
    }
  }, [visible]);

  const handleConfirm = async () => {
    setNameError('');
    setSubmitting(true);
    const result = await onConfirm({ categoryName: name, categoryType: type });
    setSubmitting(false);
    if (!result.success) {
      setNameError(result.error);
      return;
    }
    // Success — reset local state (parent closes modal by setting visible=false)
    setName('');
    setNameError('');
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Tap-outside overlay — pressing it cancels the modal */}
        <Pressable style={styles.modalOverlay} onPress={onCancel}>
          {/* Inner content — stop tap propagation so tapping inside doesn't cancel */}
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>

              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>เพิ่มหมวดหมู่</Text>
                <TouchableOpacity onPress={onCancel} style={{ padding: 4 }}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Type label */}
              <Text style={styles.inputLabel}>ประเภท</Text>

              {/* Type selector */}
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[styles.typeBtn, type === 'income' && styles.typeBtnActive]}
                  onPress={() => setType('income')}
                >
                  <Text style={[styles.typeBtnText, type === 'income' && styles.typeBtnTextActive]}>
                    รายรับ
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeBtn, type === 'expense' && styles.typeBtnActive]}
                  onPress={() => setType('expense')}
                >
                  <Text style={[styles.typeBtnText, type === 'expense' && styles.typeBtnTextActive]}>
                    รายจ่าย
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Name label */}
              <Text style={styles.inputLabel}>ชื่อหมวดหมู่</Text>

              {/* Name input */}
              <TextInput
                style={[styles.textInput, nameError !== '' && styles.textInputError]}
                placeholder="กรอกชื่อหมวดหมู่"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                maxLength={50}
              />

              {/* Inline validation error */}
              {nameError !== '' && (
                <Text style={styles.inlineError}>{nameError}</Text>
              )}

              {/* Confirm button */}
              <TouchableOpacity
                style={[styles.confirmBtn, submitting && styles.confirmBtnDisabled]}
                onPress={handleConfirm}
                disabled={submitting}
              >
                <Text style={styles.confirmBtnText}>ยืนยัน</Text>
              </TouchableOpacity>

              {/* Cancel button */}
              <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                <Text style={styles.cancelBtnText}>ยกเลิก</Text>
              </TouchableOpacity>

            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
