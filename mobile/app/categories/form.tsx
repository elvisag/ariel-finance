import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenLayout from "../../components/ScreenLayout";
import Input from "../../components/Input";
import Button from "../../components/Button";
import ErrorMessage from "../../components/ErrorMessage";
import PickerModal, { type PickerOption } from "../../components/PickerModal";
import { useCreateCategory, useUpdateCategory } from "../../hooks/useCategories";

const CATEGORY_TYPES: PickerOption[] = [
  { id: "expense", label: "Gasto", icon: "arrow-down-outline" },
  { id: "income", label: "Ingreso", icon: "arrow-up-outline" },
];

const ICON_OPTIONS: PickerOption[] = [
  { id: "cart-outline", label: "Carrito", icon: "cart-outline" },
  { id: "fast-food-outline", label: "Comida", icon: "fast-food-outline" },
  { id: "car-outline", label: "Transporte", icon: "car-outline" },
  { id: "home-outline", label: "Hogar", icon: "home-outline" },
  { id: "fitness-outline", label: "Salud", icon: "fitness-outline" },
  { id: "school-outline", label: "Educación", icon: "school-outline" },
  { id: "game-controller-outline", label: "Ocio", icon: "game-controller-outline" },
  { id: "shirt-outline", label: "Ropa", icon: "shirt-outline" },
  { id: "airplane-outline", label: "Viajes", icon: "airplane-outline" },
  { id: "gift-outline", label: "Regalos", icon: "gift-outline" },
  { id: "wallet-outline", label: "Billetera", icon: "wallet-outline" },
  { id: "cash-outline", label: "Efectivo", icon: "cash-outline" },
  { id: "business-outline", label: "Trabajo", icon: "business-outline" },
  { id: "phone-portrait-outline", label: "Tecnología", icon: "phone-portrait-outline" },
  { id: "pricetags-outline", label: "Otros", icon: "pricetags-outline" },
];

const COLOR_OPTIONS = [
  "#c0c0f8",
  "#f87171",
  "#fb923c",
  "#fbbf24",
  "#a3e635",
  "#34d399",
  "#22d3ee",
  "#60a5fa",
  "#a78bfa",
  "#f472b6",
];

export default function CategoryFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    icon?: string;
    color?: string;
    type?: string;
  }>();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const isEditing = !!params.id;

  const [name, setName] = useState(params.name ?? "");
  const [type, setType] = useState(params.type ?? "expense");
  const [icon, setIcon] = useState(params.icon ?? "pricetags-outline");
  const [color, setColor] = useState(params.color ?? "#c0c0f8");
  const [error, setError] = useState("");
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const handleSubmit = async () => {
    try {
      setError("");

      if (!name.trim()) {
        setError("El nombre es obligatorio");
        return;
      }

      if (isEditing) {
        await updateCategory.mutateAsync({
          id: params.id!,
          data: { name: name.trim(), type, icon, color },
        });
      } else {
        await createCategory.mutateAsync({
          name: name.trim(),
          type,
          icon,
          color,
        });
      }

      router.back();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Error al guardar la categoría";
      setError(msg);
    }
  };

  const selectedType = CATEGORY_TYPES.find((t) => t.id === type);
  const selectedIcon = ICON_OPTIONS.find((i) => i.id === icon);

  return (
    <ScreenLayout>
      <ScrollView className="flex-1">
        <View className="px-6 pt-16 pb-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="close" size={24} color="#f8f8f8" />
          </TouchableOpacity>
          <Text className="text-text-primary text-2xl font-bold">{isEditing ? "Editar categoría" : "Nueva categoría"}</Text>
        </View>

        <View className="px-6">
          <Input
            label="Nombre"
            placeholder="Ej: Supermercado"
            value={name}
            onChangeText={setName}
          />

          <Text className="text-text-secondary text-sm mb-2 ml-1">Tipo</Text>
          <TouchableOpacity
            className="bg-bg-surface rounded-xl p-4 flex-row items-center justify-between mb-4 border border-border"
            onPress={() => setShowTypePicker(true)}
          >
            <View className="flex-row items-center">
              <Ionicons name={(selectedType?.icon || "pricetags-outline") as any} size={20} color="#c0c0f8" />
              <Text className="text-text-primary ml-3">{selectedType?.label || "Seleccionar"}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#707070" />
          </TouchableOpacity>

          <Text className="text-text-secondary text-sm mb-2 ml-1">Icono</Text>
          <TouchableOpacity
            className="bg-bg-surface rounded-xl p-4 flex-row items-center justify-between mb-4 border border-border"
            onPress={() => setShowIconPicker(true)}
          >
            <View className="flex-row items-center">
              <Ionicons name={(selectedIcon?.id || "pricetags-outline") as any} size={20} color="#c0c0f8" />
              <Text className="text-text-primary ml-3">{selectedIcon?.label || "Seleccionar"}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#707070" />
          </TouchableOpacity>

          <Text className="text-text-secondary text-sm mb-2 ml-1">Color</Text>
          <View className="flex-row flex-wrap gap-3 mb-6">
            {COLOR_OPTIONS.map((c) => (
              <TouchableOpacity
                key={c}
                className={`w-10 h-10 rounded-full items-center justify-center ${color === c ? "ring-2 ring-white" : ""}`}
                style={{ backgroundColor: c }}
                onPress={() => setColor(c)}
              >
                {color === c && <Ionicons name="checkmark" size={20} color="#181818" />}
              </TouchableOpacity>
            ))}
          </View>

          <ErrorMessage message={error} className="mb-4" />

          <Button
            title={isEditing ? "Guardar cambios" : "Crear categoría"}
            onPress={handleSubmit}
            size="lg"
            loading={createCategory.isPending || updateCategory.isPending}
          />
        </View>
      </ScrollView>

      <PickerModal
        open={showTypePicker}
        onClose={() => setShowTypePicker(false)}
        title="Tipo de categoría"
        options={CATEGORY_TYPES}
        selectedId={type}
        onSelect={setType}
      />

      <PickerModal
        open={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        title="Icono"
        options={ICON_OPTIONS}
        selectedId={icon}
        onSelect={setIcon}
      />
    </ScreenLayout>
  );
}
