import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function BudgetToast({ visible, level, categoryName, remaining, onHide }) {
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(translateY, {
                toValue: insets.top > 0 ? insets.top + 10 : 40,
                useNativeDriver: true,
                speed: 14,
                bounciness: 8,
            }).start();

            const timer = setTimeout(() => {
                hide();  // ← เรียก hide() ที่นิยามไว้ในไฟล์เดียวกัน ไม่ใช่ hideToast
            }, 4000);
            return () => clearTimeout(timer);
        } else {
            hide();
        }
    }, [visible]);

    const hide = () => {
    // แอนิเมชันเลื่อนกลับขึ้นไป
    Animated.timing(translateY, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onHide && visible) onHide();
    });
  };

  // ฟังก์ชันนี้จะเรียกเมื่อแอนิเมชันเลื่อนขึ้นเสร็จสิ้น
  if (!visible && translateY._value === -150) return null;

  const isOver = level === 'over';
  const bgColor = isOver ? '#F87171' : '#34D399'; // สีแดงสำหรับ over, สีเขียวสำหรับ under
  const iconColor = isOver ? '#EF4444' : '#F59E0B';
  const iconName = isOver ? 'alert-circle' : 'warning-circle';
  const textColor = isOver ? '#991B1B' : '#92400E';

  const formatNumber = (num) => Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
        <View style={[styles.toastContent, { backgroundColor: bgColor, borderColor: iconColor }]}>
            <Ionicons name={iconName} size={28} color={iconColor} style={styles.icon} />
            <View style={styles.textContainer}>
                <Text style={[styles.title, { color: textColor }]}>
                    {isOver ? 'เกินงบประมาณแล้ว!' : 'ใกล้เกินงบประมาณ!'}
                </Text>
                <Text style={[styles.message, { color: textColor }]}>
                    หมวดหมู่ "{categoryName}" {isOver ? 'เกินงบไปแล้ว' : 'เหลือเงิน'} ฿{formatNumber(remaining)}
                </Text>
            </View>
        </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999, // ให้อยู่บนสุดเสมอ
    alignItems: 'center',
    elevation: 10,
  },
  toastContent: {
    flexDirection: 'row',
    width: width * 0.9,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
  },
});