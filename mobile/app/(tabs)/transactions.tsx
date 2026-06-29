import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenLayout from "../../components/ScreenLayout";
import Card from "../../components/Card";
import TransactionRow from "../../components/TransactionRow";
import LoadingScreen from "../../components/LoadingScreen";
import ErrorMessage from "../../components/ErrorMessage";
import PickerModal from "../../components/PickerModal";
import { useTransactions, useDeleteTransaction } from "../../hooks/useTransactions";
import { useAccounts } from "../../hooks/useAccounts";
import type { Transaction, Account } from "../../services/finance";

type FilterType = "all" | "income" | "expense" | "transfer";

const FILTERS: { id: FilterType; label: string; icon: string }[] = [
  { id: "all", label: "Todos", icon: "list" },
  { id: "income", label: "Ingresos", icon: "trending-up" },
  { id: "expense", label: "Gastos", icon: "trending-down" },
  { id: "transfer", label: "Transferencias", icon: "swap-horizontal" },
];

function groupByDate(txs: Transaction[]) {
  const groups: { date: string; transactions: Transaction[] }[] = [];
  for (const tx of txs) {
    const dateLabel = new Date(tx.transaction_date).toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const last = groups[groups.length - 1];
    if (last && last.date === dateLabel) {
      last.transactions.push(tx);
    } else {
      groups.push({ date: dateLabel, transactions: [tx] });
    }
  }
  return groups;
}

export default function TransactionsScreen() {
  const router = useRouter();
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterAccountId, setFilterAccountId] = useState<string | undefined>();
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const { data: accounts } = useAccounts();
  const deleteTx = useDeleteTransaction();

  const params = useMemo(() => {
    const p: { type?: string; account_id?: string; search?: string } = {};
    if (filterType !== "all") p.type = filterType;
    if (filterAccountId) p.account_id = filterAccountId;
    if (debouncedSearch) p.search = debouncedSearch;
    return Object.keys(p).length > 0 ? p : undefined;
  }, [filterType, filterAccountId, debouncedSearch]);

  const { data: transactions, isLoading, isError, error, refetch, isRefetching } = useTransactions(params);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(searchText), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchText]);

  const grouped = useMemo(() => groupByDate(transactions || []), [transactions]);

  const accountMap = useMemo(() => {
    const map: Record<string, Account> = {};
    (accounts || []).forEach((a) => { map[a.id] = a; });
    return map;
  }, [accounts]);

  const handlePress = useCallback((tx: Transaction) => {
    Alert.alert(
      tx.description || "Movimiento",
      `${formatCurrency(tx.amount)} · ${new Date(tx.transaction_date).toLocaleDateString("es-AR")}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Editar",
          onPress: () => router.push({ pathname: "/(tabs)/add", params: { edit: JSON.stringify(tx) } }),
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => confirmDelete(tx),
        },
      ],
    );
  }, [router]);

  const confirmDelete = useCallback((tx: Transaction) => {
    Alert.alert(
      "Eliminar movimiento",
      `¿Estás seguro? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTx.mutateAsync(tx.id);
            } catch (err: any) {
              Alert.alert("Error", err.response?.data?.detail || "No se pudo eliminar el movimiento");
            }
          },
        },
      ],
    );
  }, [deleteTx]);

  const selectedAccountName = filterAccountId ? accountMap[filterAccountId]?.name : null;

  if (isLoading) return <LoadingScreen message="Cargando movimientos..." />;

  return (
    <ScreenLayout>
      <View className="px-6 pt-16 pb-4">
        <Text className="text-text-primary text-3xl font-bold">Movimientos</Text>
      </View>

      <View className="px-6 mb-4">
        <View className="flex-row items-center bg-bg-surface rounded-xl px-4 border border-border">
          <Ionicons name="search" size={18} color="#707070" />
          <TextInput
            className="flex-1 py-3 px-3 text-text-primary"
            placeholder="Buscar por descripción..."
            placeholderTextColor="#707070"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons name="close-circle" size={18} color="#707070" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View className="px-6 mb-4 flex-row gap-2">
        {FILTERS.map((f) => {
          const active = (f.id === "all" && !filterType) || f.id === filterType;
          return (
            <TouchableOpacity
              key={f.id}
              className={`flex-row items-center px-4 py-2 rounded-xl ${active ? "bg-primary-300" : "bg-bg-surface"}`}
              onPress={() => setFilterType(f.id)}
            >
              <Ionicons
                name={f.icon as any}
                size={14}
                color={active ? "#181818" : "#a0a0a0"}
              />
              <Text className={`ml-1.5 text-sm font-medium ${active ? "text-bg" : "text-text-secondary"}`}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View className="px-6 mb-4 flex-row items-center gap-2">
        <TouchableOpacity
          className={`flex-row items-center px-3 py-1.5 rounded-lg ${filterAccountId ? "bg-primary-300" : "bg-bg-surface"}`}
          onPress={() => setShowAccountPicker(true)}
        >
          <Ionicons
            name="wallet-outline"
            size={14}
            color={filterAccountId ? "#181818" : "#a0a0a0"}
          />
          <Text className={`ml-1.5 text-xs font-medium ${filterAccountId ? "text-bg" : "text-text-secondary"}`}>
            {selectedAccountName || "Todas las cuentas"}
          </Text>
          {filterAccountId && (
            <TouchableOpacity
              className="ml-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => setFilterAccountId(undefined)}
            >
              <Ionicons name="close-circle" size={14} color="#181818" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>

      {isError && (
        <View className="px-6 mb-4">
          <ErrorMessage message={(error as any)?.response?.data?.detail || "Error al cargar movimientos"} />
        </View>
      )}

      {deleteTx.isError && (
        <View className="px-6 mb-4">
          <ErrorMessage message="Error al eliminar el movimiento" />
        </View>
      )}

      {!transactions || transactions.length === 0 ? (
        <View className="flex-1 px-6 justify-center">
          <Card className="p-8 items-center">
            <Ionicons name="list-outline" size={48} color="#707070" />
            <Text className="text-text-muted mt-3 text-center">No hay movimientos registrados</Text>
          </Card>
        </View>
      ) : (
        <FlatList
          className="flex-1 px-6"
          data={grouped}
          keyExtractor={(item) => item.date}
          refreshing={isRefetching}
          onRefresh={refetch}
          renderItem={({ item: group }) => (
            <View className="mb-4">
              <Text className="text-text-secondary text-sm font-medium capitalize mb-2">{group.date}</Text>
              {group.transactions.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  tx={tx}
                  showAccount
                  accountName={accountMap[tx.account_id]?.name}
                  onPress={() => handlePress(tx)}
                />
              ))}
            </View>
          )}
          ListFooterComponent={<View className="h-8" />}
        />
      )}

      <PickerModal
        open={showAccountPicker}
        onClose={() => setShowAccountPicker(false)}
        title="Filtrar por cuenta"
        options={[
          { id: "", label: "Todas las cuentas" },
          ...(accounts || []).map((a) => ({
            id: a.id,
            label: a.name,
            subtitle: a.type,
          })),
        ]}
        selectedId={filterAccountId || ""}
        onSelect={(id) => setFilterAccountId(id || undefined)}
      />

      {deleteTx.isPending && (
        <View className="absolute bottom-8 left-6 right-6">
          <Card className="p-4 items-center">
            <Text className="text-text-primary">Eliminando...</Text>
          </Card>
        </View>
      )}
    </ScreenLayout>
  );
}

function formatCurrency(n: number) {
  return `$${Math.abs(n).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
