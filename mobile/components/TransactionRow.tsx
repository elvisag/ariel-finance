import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Card from "./Card";
import type { Transaction } from "../services/finance";

function formatCurrency(n: number) {
  return `$${Math.abs(n).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface TransactionRowProps {
  tx: Transaction;
  onPress?: () => void;
  showAccount?: boolean;
  accountName?: string;
}

export default function TransactionRow({ tx, onPress, showAccount, accountName }: TransactionRowProps) {
  const isIncome = tx.type === "income";
  const isExpense = tx.type === "expense";
  const color = isIncome ? "#10b981" : isExpense ? "#ef4444" : "#c0c0f8";
  const icon = isIncome ? "trending-up" : isExpense ? "trending-down" : "swap-horizontal";
  const sign = isIncome ? "+" : isExpense ? "-" : "~";

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <Card className="flex-row items-center mb-2 p-4">
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${color}20` }}
        >
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <View className="flex-1">
          <Text className="text-text-primary font-medium">{tx.description || "Sin descripción"}</Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-text-muted text-sm">{new Date(tx.transaction_date).toLocaleDateString("es-AR")}</Text>
            {showAccount && accountName && (
              <Text className="text-text-muted text-sm">· {accountName}</Text>
            )}
          </View>
        </View>
        <Text className="font-bold" style={{ color }}>
          {sign}{formatCurrency(tx.amount)}
        </Text>
      </Card>
    </TouchableOpacity>
  );
}
