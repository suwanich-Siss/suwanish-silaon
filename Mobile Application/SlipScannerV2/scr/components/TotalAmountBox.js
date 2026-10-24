import React from "react";
import { View, Text } from "react-native";
import { styles } from "../styles/commonStyles";

export default function TotalAmountBox({ total }) {
  return (
    <View style={styles.totalContainer}>
      <Text style={styles.totalLabel}>ยอดรวมทั้งหมด:</Text>
      <Text style={styles.totalAmount}>
        {total.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{" "}
        บาท
      </Text>
    </View>
  );
}