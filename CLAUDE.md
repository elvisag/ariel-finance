# CLAUDE.md — Ariel Finance

## Arquitectura general

Monorepo con dos proyectos independientes: `backend/` (FastAPI) y `mobile/` (Expo).

- **Frontend**: Expo Router (file-based routing) + NativeWind (Tailwind) + Zustand + React Query
- **Backend**: FastAPI async + SQLAlchemy 2.0 async + Pydantic v2
- **Autenticación**: JWT (Bearer token) almacenado en SecureStore, Google OAuth con expo-auth-session
- **Auth guard**: Root layout llama `checkAuth()` al montar, entry point redirige según estado
- **Google OAuth flow**: `useGoogleAuth` hook → `expo-auth-session` → id_token → POST `/auth/google` → JWT propio
- **Paleta de colores**: Fondos neutros oscuros (#181818 bg, #383838 surface), acento periwinkle (#c0c0f8)
- **Tema**: CSS variables con NativeWind, 3 opciones (Claro/Oscuro/Sistema), persistido con Zustand + AsyncStorage
- **Base de datos**: PostgreSQL en producción, SQLite para desarrollo local
- **Migraciones**: Alembic con migration inicial `create_table`-only

## Comandos

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000   # Desarrollo
pytest                                    # Tests (49 tests, 7 test files)
alembic upgrade head                      # Migraciones
alembic revision --autogenerate -m "msg"  # Nueva migración
```

### Frontend
```bash
cd mobile
npm install
npx expo start                            # Desarrollo
npx expo start --tunnel                   # Desarrollo con tunnel (ngrok)
npx expo export --platform web            # Build web
npx tsc --noEmit                          # TypeScript check
```

### Docker
```bash
docker compose up -d           # PostgreSQL + Redis + Backend
```

## Componentes (mobile/components/)

| Componente | Props clave | Uso |
|---|---|---|
| `Button` | variant, size, loading, icon | Botones reutilizables |
| `Input` | label, error, + TextInputProps | Input con label y error |
| `Card` | children, className | Contenedor con bg-surface |
| `ScreenLayout` | children, safeArea | SafeAreaView + bg-bg |
| `LoadingScreen` | message | Pantalla de carga con spinner |
| `ErrorMessage` | message | Banner de error |
| `PickerModal` | open, options, selectedId, onSelect | Bottom-sheet selector |
| `TransactionRow` | tx, showAccount, accountName, onPress | Fila de movimiento (con badge recurrente) |
| `ThemeToggle` | — | Selector Claro/Oscuro/Sistema |

## Hooks (mobile/hooks/)

| Hook | Tipo | Descripción |
|---|---|---|
| `useGoogleAuth` | — | Google OAuth con expo-auth-session |
| `useAccounts` | query | Listar cuentas |
| `useCreateAccount` | mutation | + invalida accounts |
| `useUpdateAccount` | mutation | + invalida accounts |
| `useDeleteAccount` | mutation | + invalida accounts |
| `useTransactions` | query | Listar con filtros (account_id, type, is_recurring, search) |
| `useCreateTransaction` | mutation | + invalida transactions + accounts |
| `useUpdateTransaction` | mutation | + invalida transactions + accounts |
| `useDeleteTransaction` | mutation | + invalida transactions + accounts |
| `useTransferMoney` | mutation | + invalida transactions + accounts |
| `useCategories` | query | Listar categorías |
| `useCreateCategory` | mutation | + invalida categories |
| `useUpdateCategory` | mutation | + invalida categories |
| `useDeleteCategory` | mutation | + invalida categories |
| `useBudgets` | query | Listar presupuestos |
| `useCreateBudget` | mutation | + invalida budgets |
| `useUpdateBudget` | mutation | + invalida budgets |
| `useDeleteBudget` | mutation | + invalida budgets |
| `useAnalytics` | query | MonthlySummary + MonthlyTrend + SpendingByCategory |

## Pantallas implementadas

| Ruta | Pantalla | Funcionalidad |
|---|---|---|
| `/auth/login` | Login | Email + Google OAuth |
| `/auth/register` | Registro | Email + Google OAuth |
| `/(tabs)/index` | Dashboard | Balance real, resumen mensual, últimos 5 movs, botón a reportes |
| `/(tabs)/add` | Añadir | Crear/editar transacción, toggle recurrente, pickers cuenta/categoría |
| `/(tabs)/transactions` | Movimientos | FlatList agrupado por fecha, filtros tipo/cuenta, buscador por descripción, pull-to-refresh, editar/eliminar |
| `/(tabs)/budgets` | Presupuestos | Lista con barra de progreso, crear/editar/eliminar |
| `/(tabs)/profile` | Perfil | Info usuario, logout, theme toggle, enlaces a cuentas/categorías/recurrentes |
| `/accounts/index` | Cuentas | Lista con balance, editar, eliminar |
| `/accounts/form` | Cuenta | Crear/editar con tipo, moneda, saldo |
| `/categories/index` | Categorías | Lista (globales + propias), editar, eliminar |
| `/categories/form` | Categoría | Crear/editar con nombre, tipo, icono, color |
| `/reports` | Reportes | Resumen mensual, bar chart, donut chart, breakdown por categoría |
| `/recurring` | Recurrentes | Lista de gastos recurrentes, próxima fecha, editar/eliminar |

## Estándares de código

### Backend (Python)
- **Async toda la vida**: `async def` en endpoints, `AsyncSession` para DB
- **Modelos**: SQLAlchemy 2.0 style (`Mapped`, `mapped_column`), UUID como PK
- **Schemas**: Pydantic v2 con `model_config = {"from_attributes": True}`
- **Endpoints**: Separar por recurso en `api/v1/`, delegar en services
- **Services**: Lógica de negocio en `app/services/*.py`, routes son thin controllers
- **PUT/PATCH**: Usar `exclude_unset=True` en `model_dump()`
- **Errores**: HTTPException con código apropiado
- **Naming**: `snake_case`
- **Recurrencia**: `selectinload(Transaction.account)` para evitar MissingGreenlet en async

### Frontend (TypeScript/React Native)
- **Naming**: `camelCase` variables/funciones, `PascalCase` componentes/tipos
- **Estilos**: NativeWind — colores `bg-bg`, `bg-bg-surface`, `text-text-primary`, `text-text-secondary`, `text-primary-300`, `border-border`
- **Iconos**: Ionicons, castear `name` con `as any`
- **Estado**: Zustand para auth + theme global, React Query para datos del servidor
- **Ruteo**: Expo Router (file-based)
- **API**: Axios con interceptors para token JWT, tipado en `services/finance.ts`
- **Theme**: CSS variables via `react-native-css-interop`, persistencia con Zustand + AsyncStorage
- **Auth guard**: Entry point maneja loading + redirección según `isAuthenticated`
- **Hooks de datos**: `useQuery`/`useMutation` con invalidation de queries relacionadas

## Decisiones de arquitectura

- **SQLite en desarrollo**: Elimina dependencia de Docker para desarrollo local rápido
- **UUID como PK**: Escalabilidad, seguridad, soporte multi-DB
- **NativeWind**: Rendimiento, tema dinámico vía CSS variables
- **Zustand + React Query**: Zustand para estado cliente (auth, theme), React Query para estado servidor
- **FastAPI async**: Rendimiento, OpenAPI auto, validación Pydantic
- **Capa de servicios**: Routes delgadas (~5-10 líneas), toda la lógica en services
- **Recurrencia en Transaction**: Campos `recurrence_*` nullable en lugar de tabla separada
- **Scheduler manual**: `calendar.monthrange` en lugar de python-dateutil
- **Gráficos caseros**: Views en lugar de librería externa (evita problemas WSL)
- **Reports y Recurring fuera de tabs**: Rutas planas (`/reports`, `/recurring`) para mantener 5 tabs

## Cosas que evitar

- **NO** usar `sync` en endpoints FastAPI
- **NO** usar `npm install` en Expo — usar `npx expo install`
- **NO** hardcodear URLs — usar `EXPO_PUBLIC_API_URL`
- **NO** guardar tokens en AsyncStorage — usar `expo-secure-store`
- **NO** mezclar estilos inline con NativeWind
- **NO** olvidar invalidar queries relacionadas en mutations
- **NO** usar `create_all` para migraciones — usar Alembic
- **NO** renderizar Stack condicionalmente — loading en `app/index.tsx`

## Convenciones de git

- Mensajes en español con prefijos: `feat:`, `fix:`, `refactor:`, `docs:`, `style:`, `chore:`
- Rama principal: `main`

## Estado del proyecto

### Completado ✅
- Auth: email + Google OAuth (backend y frontend)
- Auth guard con checkAuth y redirección
- Dashboard con balance, resumen, últimos movs
- CRUD completo de transacciones (crear, editar, eliminar)
- CRUD completo de cuentas (backend + frontend)
- Transferencias entre cuentas (2 transacciones, ambos balances)
- Gastos recurrentes (backend: modelo + scheduler; frontend: toggle + pantalla dedicada)
- CRUD completo de categorías (backend + frontend, editar incluido)
- Presupuestos con progreso, crear/editar/eliminar
- Gráficos / Reportes (3 endpoints analytics, 3 hooks, pantalla dedicada)
- Buscador de movimientos por descripción (debounce 300ms)
- Pull-to-refresh en todas las listas
- Dark/Light theme toggle (CSS variables, Zustand persist, 3 opciones)
- Capa de servicios backend (7 módulos)
- Migraciones Alembic (migration inicial limpia)
- 9 componentes reutilizables
- 18 hooks con React Query
- 49 tests backend (pytest), 4 test files frontend (Jest)
- Tema de colores con CSS variables (sin dark: class per-component)

### Pendiente 🔶
- Editar presupuesto desde frontend (PUT ya existe en backend)
- Exportar datos (CSV/PDF)
- Paginación en transacciones
- Frontend tests adicionales (Jest + RNTL)
- Offline support / React Query persist
- E2E tests
- CI/CD, linting, formateo
- Notificaciones y alertas de presupuestos
