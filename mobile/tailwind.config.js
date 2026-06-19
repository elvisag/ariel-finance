/**
 * Configuración de Tailwind CSS / NativeWind.
 * ============================================
 *
 * NativeWind es un motor de estilos que compila clases Tailwind
 * en estilos nativos de React Native. No tiene runtime overhead
 * porque los estilos se resuelven en build time.
 *
 * Colores personalizados:
 *   - primary:       Paleta indigo (basada en Tailwind)
 *   - finance.income:    Verde para ingresos
 *   - finance.expense:   Rojo para gastos
 *   - finance.savings:   Azul para ahorros
 *   - finance.investment: Púrpura para inversiones
 *
 * Uso en componentes:
 *   <View className="bg-primary-500 p-4 rounded-xl" />
 *   <Text className="text-finance-income font-bold" />
 *
 * NOTA: content[] debe incluir TODAS las rutas donde se usen
 * clases Tailwind, si no, NativeWind no las compilará.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Rutas donde buscar clases Tailwind
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],

  presets: [require("nativewind/preset")],

  theme: {
    extend: {
      colors: {
        // Paleta primaria de la app (indigo)
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",  // ← Color principal (botones, acentos)
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },

        // Colores semánticos para finanzas
        finance: {
          income: "#10b981",      // Verde esmeralda
          expense: "#ef4444",     // Rojo
          savings: "#3b82f6",     // Azul
          investment: "#8b5cf6",  // Púrpura
        },
      },
    },
  },

  plugins: [],
};
