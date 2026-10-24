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

export default function EditCategoryModal({ visible, category, onConfirm, onCancel }) {
  const [name, setName]           = useState('');
  const [nameError, setNameError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill name when category changes
  useEffect(() => {
    if (category) {
      setName(category.category_name);
      setNameError('');
    }
  }, [category]);

  // Clear error when modal is dismissed
  useEffect(() => {
    if (!visible) {
      setNameError('');
    }
  }, [visible]);

  const handleConfirm = async () => {
    setNameError('');
    setSubmitting(true);
    const result = await onConfirm(name);
    setSubmitting(false);
    if (!result.success) {
      setNameError(result.error);
      return;
    }
    setNameError('');
    // Parent closes modal by setting visible = false
  };

  const typeLabel = category?.category_type === 'income' ? 'รายรับ' : 'รายจ่าย';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Pressable style={styles.modalOverlay} onPress={onCancel}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>

              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>แก้ไขหมวดหมู่</Text>
                <TouchableOpacity onPress={onCancel}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Type label (read-only) */}
              <Text style={styles.inputLabel}>ประเภท</Text>
              <Text style={styles.typeLabelReadOnly}>{typeLabel}</Text>

              {/* Name input */}
              <Text style={styles.inputLabel}>ชื่อหมวดหมู่</Text>
              <TextInput
                style={[styles.textInput, nameError !== '' && styles.textInputError]}
                value={name}
                onChangeText={setName}
                maxLength={50}
                placeholder="ชื่อหมวดหมู่"
                placeholderTextColor="#9CA3AF"
              />
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
