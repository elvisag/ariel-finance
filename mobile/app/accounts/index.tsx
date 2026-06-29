import { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenLayout from "../../components/ScreenLayout";
import Card from "../../components/Card";
import LoadingScreen from "../../components/LoadingScreen";
import { useAccounts, useDeleteAccount } from "../../hooks/useAccounts";
import type { Account } from "../../services/finance";

const typeIcons: Record<string, string> = {
  checking: "card-outline",
  savings: "piggy-bank-outline",
  credit: "card-outline",
  investment: "trending-up-outline",
  cash: "cash-outline",
};

const typeLabels: Record<string, string> = {
  checking: "Cuenta corriente",
  savings: "Caja de ahorro",
  credit: "Tarjeta de crédito",
  investment: "Inversiones",
  cash: "Efectivo",
};

function formatCurrency(n: number) {
  return `$${Math.abs(n).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AccountsScreen() {
  const router = useRouter();
  const { data: accounts, isLoading, refetch } = useAccounts();
  const deleteAccount = useDeleteAccount();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteAccount.mutateAsync(id);
    setDeletingId(null);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) return <LoadingScreen />;

  return (
    <ScreenLayout>
      <View className="px-6 pt-16 pb-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#f8f8f8" />
          </TouchableOpacity>
          <Text className="text-text-primary text-2xl font-bold">Cuentas</Text>
        </View>
        <TouchableOpacity
          className="bg-primary-300 p-2 rounded-xl"
          onPress={() => router.push("/accounts/form")}
        >
          <Ionicons name="add" size={24} color="#181818" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#c0c0f8" />}
      >
        {!accounts || accounts.length === 0 ? (
          <Card className="p-8 items-center mt-8">
            <Ionicons name="wallet-outline" size={48} color="#707070" />
            <Text className="text-text-muted mt-3 text-center">No tenés cuentas aún</Text>
            <TouchableOpacity
              className="mt-4 bg-primary-300 py-3 px-6 rounded-xl"
              onPress={() => router.push("/accounts/form")}
            >
              <Text className="text-bg font-semibold">Crear cuenta</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          accounts.map((acc) => (
            <AccountCard
              key={acc.id}
              account={acc}
              onEdit={() => router.push(`/accounts/form?id=${acc.id}`)}
              onDelete={() => handleDelete(acc.id)}
              deleting={deletingId === acc.id}
            />
          ))
        )}
        <View className="h-8" />
      </ScrollView>
    </ScreenLayout>
  );
}

function AccountCard({
  account,
  onEdit,
  onDelete,
  deleting,
}: {
  account: Account;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <Card className="flex-row items-center mb-3 p-4">
      <View className="w-12 h-12 bg-primary-300/20 rounded-full items-center justify-center mr-4">
        <Ionicons name={(typeIcons[account.type] || "wallet-outline") as any} size={22} color="#c0c0f8" />
      </View>
      <View className="flex-1">
        <Text className="text-text-primary font-semibold text-base">{account.name}</Text>
        <Text className="text-text-muted text-sm">{typeLabels[account.type] || account.type}</Text>
      </View>
      <View className="items-end">
        <Text className="text-text-primary font-bold">{formatCurrency(account.balance)}</Text>
        <Text className="text-text-muted text-xs">{account.currency}</Text>
      </View>
      <TouchableOpacity className="ml-3 p-2" onPress={onEdit}>
        <Ionicons name="create-outline" size={18} color="#a0a0a0" />
      </TouchableOpacity>
      <TouchableOpacity className="p-2" onPress={onDelete} disabled={deleting}>
        {deleting ? (
          <Ionicons name="hourglass" size={18} color="#ef4444" />
        ) : (
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        )}
      </TouchableOpacity>
    </Card>
  );
}
