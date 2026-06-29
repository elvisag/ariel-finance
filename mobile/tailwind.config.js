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
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],

  presets: [require("nativewind/preset")],

  theme: {
    extend: {
      colors: {
        // Fondos oscuros neutros (basado en el diseño de referencia)
        bg: {
          DEFAULT: "#181818",
          surface: "#383838",
          elevated: "#484848",
          hover: "#404040",
        },

        // Texto (blancos cálidos y grises)
        text: {
          primary: "#f8f8f8",
          secondary: "#a0a0a0",
          muted: "#707070",
        },

        // Acento periwinkle (de la imagen de referencia)
        primary: {
          50: "#f0f0ff",
          100: "#e0e0ff",
          200: "#d0d0ff",
          300: "#c0c0f8",  // Color principal (botones, acentos)
          400: "#a0a0d8",
          500: "#8080b8",
          600: "#6868a0",
          700: "#505088",
          800: "#383870",
          900: "#202058",
        },

        border: {
          DEFAULT: "#303030",
          light: "#484848",
        },

        // Colores semánticos para finanzas
        finance: {
          income: "#10b981",
          expense: "#ef4444",
          savings: "#3b82f6",
          investment: "#8b5cf6",
        },
      },
    },
  },

  plugins: [],
};
