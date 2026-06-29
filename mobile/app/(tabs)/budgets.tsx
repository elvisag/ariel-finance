import { useState, useMemo, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenLayout from "../../components/ScreenLayout";
import Card from "../../components/Card";
import Input from "../../components/Input";
import Button from "../../components/Button";
import ErrorMessage from "../../components/ErrorMessage";
import PickerModal from "../../components/PickerModal";
import LoadingScreen from "../../components/LoadingScreen";
import { useBudgets, useCreateBudget, useDeleteBudget } from "../../hooks/useBudgets";
import { useCategories } from "../../hooks/useCategories";
import { useTransactions } from "../../hooks/useTransactions";
import type { Budget, Category } from "../../services/finance";

function formatCurrency(n: number) {
  return `$${Math.abs(n).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const end = now.toISOString().split("T")[0];
  return { start, end };
}

const PERIODS = [
  { id: "weekly", label: "Semanal" },
  { id: "monthly", label: "Mensual" },
  { id: "yearly", label: "Anual" },
];

function calcSpent(
  budget: Budget,
  categories: Category[],
  monthTx: { category_id: string | null; amount: number; type: string }[],
) {
  const cat = categories.find((c) => c.id === budget.category_id);
  if (!cat) return 0;

  const now = new Date();
  let start: Date;
  if (budget.period === "weekly") {
    start = new Date(now);
    start.setDate(start.getDate() - 7);
  } else if (budget.period === "yearly") {
    start = new Date(now.getFullYear(), 0, 1);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return monthTx
    .filter((t) => {
      if (t.category_id !== budget.category_id) return false;
      if (t.type !== "expense") return false;
      return true;
    })
    .reduce((s, t) => s + t.amount, 0);
}

export default function BudgetsScreen() {
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const monthRange = useMemo(() => getMonthRange(), []);

  const { data: budgets, isLoading: loadingBudgets, refetch: refetchBudgets } = useBudgets();
  const { data: categories, refetch: refetchCats } = useCategories();
  const { data: monthTx, refetch: refetchTx } = useTransactions({ start_date: monthRange.start, end_date: monthRange.end });
  const createBudget = useCreateBudget();
  const deleteBudget = useDeleteBudget();

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    await deleteBudget.mutateAsync(id);
    setDeleteId(null);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchBudgets(), refetchCats(), refetchTx()]);
    setRefreshing(false);
  }, [refetchBudgets, refetchCats, refetchTx]);

  if (loadingBudgets) return <LoadingScreen />;

  return (
    <ScreenLayout>
      <View className="px-6 pt-16 pb-4 flex-row items-center justify-between">
        <Text className="text-text-primary text-3xl font-bold">Presupuestos</Text>
        <TouchableOpacity
          className="bg-primary-300 p-2 rounded-xl"
          onPress={() => setShowForm(true)}
        >
          <Ionicons name="add" size={24} color="#181818" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#c0c0f8" />}
      >
        {!budgets || budgets.length === 0 ? (
          <Card className="p-8 items-center mt-4">
            <Ionicons name="wallet-outline" size={48} color="#707070" />
            <Text className="text-text-muted mt-3 text-center">No hay presupuestos aún</Text>
            <Button title="Crear presupuesto" onPress={() => setShowForm(true)} className="mt-4" />
          </Card>
        ) : (
          budgets.map((b) => {
            const spent = calcSpent(b, categories || [], monthTx || []);
            const cat = categories?.find((c) => c.id === b.category_id);
            const pct = b.amount > 0 ? Math.min((spent / Number(b.amount)) * 100, 100) : 0;
            const overBudget = spent > Number(b.amount);

            return (
              <BudgetCard
                key={b.id}
                categoryName={cat?.name || "Sin categoría"}
                categoryIcon={cat?.icon || "pricetag-outline"}
                categoryColor={cat?.color || "#c0c0f8"}
                budgeted={Number(b.amount)}
                spent={spent}
                pct={pct}
                overBudget={overBudget}
                period={b.period}
                onDelete={() => handleDelete(b.id)}
                deleting={deleteId === b.id}
              />
            );
          })
        )}
        <View className="h-8" />
      </ScrollView>

      <BudgetForm
        open={showForm}
        onClose={() => setShowForm(false)}
        categories={categories || []}
        onSubmit={async (data) => {
          await createBudget.mutateAsync(data);
          setShowForm(false);
        }}
        loading={createBudget.isPending}
      />
    </ScreenLayout>
  );
}

function BudgetCard({
  categoryName,
  categoryIcon,
  categoryColor,
  budgeted,
  spent,
  pct,
  overBudget,
  period,
  onDelete,
  deleting,
}: {
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  budgeted: number;
  spent: number;
  pct: number;
  overBudget: boolean;
  period: string;
  onDelete: () => void;
  deleting: boolean;
}) {
  const barColor = overBudget ? "#ef4444" : pct > 80 ? "#f59e0b" : "#c0c0f8";
  const periodLabel = { weekly: "Semanal", monthly: "Mensual", yearly: "Anual" }[period] || period;

  return (
    <Card className="mb-3 p-4">
      <View className="flex-row items-center mb-3">
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${categoryColor}20` }}
        >
          <Ionicons name={categoryIcon as any} size={20} color={categoryColor} />
        </View>
        <View className="flex-1">
          <Text className="text-text-primary font-semibold">{categoryName}</Text>
          <Text className="text-text-muted text-xs">{periodLabel}</Text>
        </View>
        <TouchableOpacity onPress={onDelete} disabled={deleting}>
          <Ionicons name={deleting ? "hourglass" : "trash-outline"} size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <View className="h-2 bg-bg rounded-full overflow-hidden mb-2">
        <View
          className="h-full rounded-full"
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }}
        />
      </View>

      <View className="flex-row justify-between">
        <Text className="text-sm" style={{ color: overBudget ? "#ef4444" : "#a0a0a0" }}>
          {formatCurrency(spent)} gastados
        </Text>
        <Text className="text-text-primary text-sm font-medium">
          {formatCurrency(budgeted)}
        </Text>
      </View>
    </Card>
  );
}

function BudgetForm({
  open,
  onClose,
  categories,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  onSubmit: (data: Omit<import("../../services/finance").Budget, "id" | "created_at">) => Promise<void>;
  loading: boolean;
}) {
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("monthly");
  const [error, setError] = useState("");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);

  const expenseCats = categories.filter((c) => c.type === "expense");
  const selectedCat = categories.find((c) => c.id === categoryId);
  const selectedPeriod = PERIODS.find((p) => p.id === period);

  const handleSubmit = async () => {
    try {
      setError("");
      if (!categoryId) { setError("Seleccioná una categoría"); return; }
      const parsed = parseFloat(amount.replace(",", "."));
      if (isNaN(parsed) || parsed <= 0) { setError("Ingresá un monto válido"); return; }

      await onSubmit({
        category_id: categoryId,
        amount: parsed,
        period,
        start_date: new Date().toISOString().split("T")[0],
        end_date: null,
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al crear presupuesto");
    }
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity className="flex-1 bg-black/60 justify-end" activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} className="bg-bg-surface rounded-t-3xl" onPress={() => {}}>
          <View className="flex-row items-center justify-between px-6 pt-6 pb-4 border-b border-border">
            <Text className="text-text-primary text-lg font-bold">Nuevo presupuesto</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#a0a0a0" />
            </TouchableOpacity>
          </View>
          <ScrollView className="px-6 pb-8 pt-4">
            <Text className="text-text-secondary text-sm mb-2 ml-1">Categoría</Text>
            <TouchableOpacity
              className="bg-bg rounded-xl p-4 flex-row items-center justify-between mb-4 border border-border"
              onPress={() => setShowCategoryPicker(true)}
            >
              <View className="flex-row items-center">
                <Ionicons name={(selectedCat?.icon || "pricetag-outline") as any} size={20} color={selectedCat?.color || "#a0a0a0"} />
                <Text className={`ml-3 ${selectedCat ? "text-text-primary" : "text-text-muted"}`}>
                  {selectedCat?.name || "Seleccionar categoría"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#707070" />
            </TouchableOpacity>

            <Input
              label="Monto límite"
              placeholder="$ 0.00"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />

            <Text className="text-text-secondary text-sm mb-2 ml-1">Período</Text>
            <TouchableOpacity
              className="bg-bg rounded-xl p-4 flex-row items-center justify-between mb-4 border border-border"
              onPress={() => setShowPeriodPicker(true)}
            >
              <Text className={`${selectedPeriod ? "text-text-primary" : "text-text-muted"}`}>
                {selectedPeriod?.label || "Seleccionar"}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#707070" />
            </TouchableOpacity>

            <ErrorMessage message={error} className="mb-4" />
            <Button title="Crear presupuesto" onPress={handleSubmit} loading={loading} size="lg" />
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>

      <PickerModal
        open={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        title="Categoría"
        options={expenseCats.map((c) => ({ id: c.id, label: c.name, icon: c.icon, color: c.color }))}
        selectedId={categoryId}
        onSelect={setCategoryId}
      />
      <PickerModal
        open={showPeriodPicker}
        onClose={() => setShowPeriodPicker(false)}
        title="Período"
        options={PERIODS}
        selectedId={period}
        onSelect={setPeriod}
      />
    </Modal>
  );
}
