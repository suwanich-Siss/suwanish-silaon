/**
 * Pure validation utilities for category management.
 * No React Native imports, no database imports — fully unit-testable in isolation.
 */

/**
 * Validate a category name string.
 * - Rejects empty or whitespace-only strings.
 * - Rejects names whose trimmed length exceeds 50 characters.
 *
 * @param {string} name - The proposed category name.
 * @returns {{ valid: boolean, error?: string }}
 */
export const validateCategoryName = (name) => {
  if (!name || name.trim().length === 0)
    return { valid: false, error: 'กรุณากรอกชื่อหมวดหมู่' };
  if (name.trim().length > 50)
    return { valid: false, error: 'ชื่อหมวดหมู่ต้องไม่เกิน 50 ตัวอักษร' };
  return { valid: true };
};

/**
 * Validate a category type string.
 * Only the exact values 'income' and 'expense' are accepted (case-sensitive).
 *
 * @param {string} type - The proposed category type.
 * @returns {{ valid: boolean, error?: string }}
 */
export const validateCategoryType = (type) => {
  if (type === 'income' || type === 'expense') return { valid: true };
  return { valid: false, error: 'ประเภทหมวดหมู่ไม่ถูกต้อง' };
};

/**
 * Case-insensitive duplicate name check within an existing category list.
 * Optionally excludes a specific category_id (used during edit to allow
 * keeping the same name).
 *
 * @param {string} name - The proposed category name.
 * @param {string} type - 'income' | 'expense'
 * @param {Array<{ category_id: number, category_name: string, category_type: string }>} existingCategories
 * @param {number|null} excludeId - category_id to exclude from the duplicate check (edit use case).
 * @returns {{ valid: boolean, error?: string }}
 */
export const checkDuplicateName = (name, type, existingCategories, excludeId = null) => {
  const normalized = name.trim().toLowerCase();
  const isDuplicate = existingCategories.some(
    (c) =>
      c.category_type === type &&
      c.category_name.trim().toLowerCase() === normalized &&
      c.category_id !== excludeId
  );
  if (isDuplicate)
    return { valid: false, error: 'ชื่อหมวดหมู่นี้มีอยู่แล้วในประเภทนี้' };
  return { valid: true };
};
