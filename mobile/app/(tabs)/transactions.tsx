/**
 * Pantalla de Movimientos (lista de transacciones).
 * =================================================
 *
 * Muestra todas las transacciones del usuario con filtros.
 *
 * Pendiente de implementar:
 *   - Lista paginada con FlatList
 *   - Filtros por cuenta, fecha y tipo
 *   - Pull-to-refresh para recargar
 *   - Agrupación por fecha
 *
 * Estado actual:
 *   - Placeholder visual mientras se conecta al API
 */

import { View, Text, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TransactionsScreen() {
  return (
    <View className="flex-1 bg-slate-950">
      {/* ── Header ──────────────────────────────────────────── */}
      <View className="px-6 pt-16 pb-4">
        <Text className="text-white text-3xl font-bold">Movimientos</Text>
      </View>

      {/* ── Lista vacía (placeholder) ───────────────────────── */}
      <ScrollView className="flex-1 px-6">
        <View className="bg-slate-800/50 rounded-2xl p-8 items-center mt-4">
          <Ionicons name="search-outline" size={48} color="#475569" />
          <Text className="text-slate-500 mt-3 text-center">
            Aún no hay movimientos registrados.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
