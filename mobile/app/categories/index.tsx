import { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenLayout from "../../components/ScreenLayout";
import Card from "../../components/Card";
import LoadingScreen from "../../components/LoadingScreen";
import { useCategories, useDeleteCategory } from "../../hooks/useCategories";
import type { Category } from "../../services/finance";

const typeLabels: Record<string, string> = {
  income: "Ingreso",
  expense: "Gasto",
};

export default function CategoriesScreen() {
  const router = useRouter();
  const { data: categories, isLoading, refetch } = useCategories();
  const deleteCategory = useDeleteCategory();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteCategory.mutateAsync(id);
    setDeletingId(null);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) return <LoadingScreen />;

  const userCategories = categories?.filter((c) => c.color) ?? [];
  const globalCategories = categories?.filter((c) => !c.color) ?? [];

  return (
    <ScreenLayout>
      <View className="px-6 pt-16 pb-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#f8f8f8" />
          </TouchableOpacity>
          <Text className="text-text-primary text-2xl font-bold">Categorías</Text>
        </View>
        <TouchableOpacity
          className="bg-primary-300 p-2 rounded-xl"
          onPress={() => router.push("/categories/form")}
        >
          <Ionicons name="add" size={24} color="#181818" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#c0c0f8" />}
      >
        {userCategories.length > 0 && (
          <>
            <Text className="text-text-secondary text-sm font-semibold uppercase mb-2 ml-1">Tus categorías</Text>
            {userCategories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                deletable
                onDelete={() => handleDelete(cat.id)}
                deleting={deletingId === cat.id}
              />
            ))}
          </>
        )}

        <Text className="text-text-secondary text-sm font-semibold uppercase mb-2 mt-4 ml-1">Globales</Text>
        {globalCategories.length === 0 && userCategories.length === 0 ? (
          <Card className="p-8 items-center mt-4">
            <Ionicons name="pricetags-outline" size={48} color="#707070" />
            <Text className="text-text-muted mt-3 text-center">No hay categorías</Text>
            <TouchableOpacity
              className="mt-4 bg-primary-300 py-3 px-6 rounded-xl"
              onPress={() => router.push("/categories/form")}
            >
              <Text className="text-bg font-semibold">Crear categoría</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          globalCategories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))
        )}
        <View className="h-8" />
      </ScrollView>
    </ScreenLayout>
  );
}

function CategoryCard({
  category,
  deletable,
  onDelete,
  deleting,
}: {
  category: Category;
  deletable?: boolean;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  const color = category.color || "#c0c0f8";

  return (
    <Card className="flex-row items-center mb-3 p-4">
      <View
        className="w-12 h-12 rounded-full items-center justify-center mr-4"
        style={{ backgroundColor: `${color}20` }}
      >
        <Ionicons
          name={(category.icon || "pricetags-outline") as any}
          size={20}
          color={color}
        />
      </View>
      <View className="flex-1">
        <Text className="text-text-primary font-semibold text-base">{category.name}</Text>
        <Text className="text-text-muted text-sm">{typeLabels[category.type] || category.type}</Text>
      </View>
      {deletable && (
        <TouchableOpacity className="p-2" onPress={onDelete} disabled={deleting}>
          {deleting ? (
            <Ionicons name="hourglass" size={18} color="#ef4444" />
          ) : (
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          )}
        </TouchableOpacity>
      )}
    </Card>
  );
}
