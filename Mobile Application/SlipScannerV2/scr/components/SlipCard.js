import React from "react";
import { View, Text, Image } from "react-native";
import { styles } from "../styles/commonStyles";

export default function SlipCard({ slip }) {
  return (
    <View style={styles.slipCard}>
      <Image source={{ uri: slip.imageUri }} style={styles.slipImage} />
      <View style={styles.slipDetails}>
        <Text style={styles.slipText}>
          ยอด: <Text style={styles.slipData}>{slip.amount} บาท</Text>
        </Text>
        <Text style={styles.slipText}>
          วันที่: <Text style={styles.slipData}>{slip.date}</Text>
        </Text>
        <Text style={styles.slipText}>
          อ้างอิง: <Text style={styles.slipData}>{slip.ref}</Text>
        </Text>
      </View>
    </View>
  );
}