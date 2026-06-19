/**
 * Layout de las pantallas principales con navegación por tabs.
 * ===========================================================
 *
 * 5 tabs en la barra inferior:
 *   🏠 Inicio     → Dashboard con balance y resumen
 *   📋 Movimientos → Lista de transacciones
 *   ➕ Añadir     → Formulario para nueva transacción
 *   👛 Presupuestos → Gestión de presupuestos
 *   👤 Perfil     → Configuración y cerrar sesión
 *
 * Los íconos usan @expo/vector-icons (Ionicons).
 * Los colores siguen el tema oscuro (bg-slate-950).
 */

import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // ── Barra de tabs (oscura) ──────────────────────────
        tabBarStyle: {
          backgroundColor: "#0f172a",       // slate-950
          borderTopColor: "#1e293b",        // slate-800
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        // ── Colores de los íconos ──────────────────────────
        tabBarActiveTintColor: "#6366f1",   // indigo-500 (activo)
        tabBarInactiveTintColor: "#64748b", // slate-400 (inactivo)
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Movimientos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Añadir",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: "Presupuestos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
