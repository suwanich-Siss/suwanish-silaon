import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../styles/commonStyles";
import { addStyles } from "../styles/addStyles";
import { useAuth } from "../context/AuthContext";

import { useTransaction } from "../hooks/useTransaction";
import { useBudgetToast } from "../hooks/useBudgetToast";
import TransactionScreen  from "./TransactionScreen";
import BudgetScreen       from "./BudgetScreen";
import BudgetToast        from "../components/BudgetToast";

const TABS = [
  { key: "expense", label: "รายจ่าย", activeStyle: "activeExpense" },
  { key: "income",  label: "รายรับ",  activeStyle: "activeIncome"  },
  { key: "budget",  label: "ตั้งงบประมาณ",  activeStyle: "activeBudget"  },
];

export default function AddScreen({ navigation }) {
  const [type, setType] = useState("expense");
  const tx = useTransaction();
  const { user } = useAuth();
  const userId = user?.user_id;


  const { toastMessage, showToast, hideToast } = useBudgetToast();
  // reset form เมื่อเปลี่ยน tab
  const handleTabChange = (newType) => {
    if (type !== "budget" && newType !== "budget") tx.resetForm();
    setType(newType);
  };

  return (
    <SafeAreaView style={styles.container}>
      <BudgetToast
        visible={toastMessage.visible}
        level={toastMessage.level}
        categoryName={toastMessage.categoryName}
        remaining={toastMessage.remaining}
        onHide={hideToast}
      />
      
      {/* Tab Bar */}
      <View style={styles.headerContainer}>
        <View style={styles.toggleWrapper}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.toggleBtn, type === tab.key && styles[tab.activeStyle]]}
              onPress={() => handleTabChange(tab.key)}
            >
              <Text style={[styles.toggleText, type === tab.key && styles.activeText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      {type === "budget" ? (
        <BudgetScreen />
      ) : (
        <TransactionScreen
          type={type}
          userId={userId}
          amount={tx.amount}            setAmount={tx.setAmount}
          date={tx.date}                setDate={tx.setDate}
          time={tx.time}                setTime={tx.setTime}
          note={tx.note}                setNote={tx.setNote}
          selectedCategory={tx.selectedCategory}
          selectedMaslow={tx.selectedMaslow}  setSelectedMaslow={tx.setSelectedMaslow}
          scrollRef={tx.scrollRef}
          handleCategorySelect={tx.handleCategorySelect}
          handleSave={tx.handleSave}
          incomeCategories={tx.incomeCategories}
          expenseCategories={tx.expenseCategories}
          navigation={navigation}
          onBudgetAlert={showToast}
        />
      )}
    </SafeAreaView>
  );
}

const styles = addStyles;