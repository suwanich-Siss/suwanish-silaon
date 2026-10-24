import { useState, useCallback, useEffect } from 'react';
import {
  getCategories,
  addCategory,
  updateCategoryName,
  safeDeleteCategory,
} from '../database/database';
import {
  validateCategoryName,
  validateCategoryType,
  checkDuplicateName,
} from '../utils/categoryValidation';

export const useCategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const incomeCategories = categories.filter(c => c.category_type === 'income');
  const expenseCategories = categories.filter(c => c.category_type === 'expense');

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getCategories();
      setCategories(rows);
    } catch (e) {
      console.error(e);
      setError('โหลดหมวดหมู่ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = useCallback(async ({ categoryName, categoryType }) => {
    const n = validateCategoryName(categoryName);
    if (!n.valid) return { success: false, error: n.error };

    const t = validateCategoryType(categoryType);
    if (!t.valid) return { success: false, error: t.error };

    const d = checkDuplicateName(categoryName, categoryType, categories);
    if (!d.valid) return { success: false, error: d.error };

    try {
      await addCategory({ categoryName, categoryType });
      await loadCategories();
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: false, error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' };
    }
  }, [categories, loadCategories]);

  const editCategory = useCallback(async (categoryId, newName) => {
    const existing = categories.find(c => c.category_id === categoryId);

    const n = validateCategoryName(newName);
    if (!n.valid) return { success: false, error: n.error };

    const d = checkDuplicateName(newName, existing.category_type, categories, categoryId);
    if (!d.valid) return { success: false, error: d.error };

    try {
      await updateCategoryName(categoryId, newName);
      await loadCategories();
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: false, error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' };
    }
  }, [categories, loadCategories]);

  const deleteCategory = useCallback(async (categoryId) => {
    try {
      const result = await safeDeleteCategory(categoryId);
      if (!result.success) {
        return { success: false, error: 'ไม่สามารถลบได้ — หมวดหมู่นี้มีรายการธุรกรรมอยู่' };
      }
      await loadCategories();
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: false, error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' };
    }
  }, [loadCategories]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    categories,
    incomeCategories,
    expenseCategories,
    loading,
    error,
    loadCategories,
    createCategory,
    editCategory,
    deleteCategory,
  };
};
