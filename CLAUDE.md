# CLAUDE.md — Ariel Finance

## Arquitectura general

Monorepo con dos proyectos independientes: `backend/` (FastAPI) y `mobile/` (Expo).

- **Frontend**: Expo Router (file-based routing) + NativeWind (Tailwind) + Zustand + React Query
- **Backend**: FastAPI async + SQLAlchemy 2.0 async + Pydantic v2
- **Autenticación**: JWT (Bearer token) almacenado en SecureStore, Google OAuth con expo-auth-session
- **Auth guard**: Root layout llama `checkAuth()` al montar, entry point redirige según estado
- **Google OAuth flow**: `useGoogleAuth` hook → `expo-auth-session` → id_token → POST `/auth/google` → JWT propio
- **Paleta de colores**: Fondos neutros oscuros (#181818 bg, #383838 surface), acento periwinkle (#c0c0f8)
- **Base de datos**: PostgreSQL en producción, SQLite para desarrollo local

## Comandos

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000   # Desarrollo
pytest                                    # Tests
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

## Componentes creados (mobile/components/)

| Componente | Props | Uso |
|---|---|---|
| `Button` | variant (primary/secondary/danger/ghost), size, loading, icon | Botones reutilizables con variantes y loading |
| `Input` | label, error, + TextInputProps | Input con label y mensaje de error |
| `Card` | children, className | Contenedor con bg-surface y rounded-2xl |
| `ScreenLayout` | children, safeArea | SafeAreaView + bg-bg + flex-1 |
| `LoadingScreen` | message | Pantalla completa con spinner |
| `ErrorMessage` | message | Banner de error con ícono |
| `PickerModal` | open, options, selectedId, onSelect, title | Modal bottom-sheet para seleccionar de una lista |

## Hooks creados (mobile/hooks/)

| Hook | Query/Mutation | Descripción |
|---|---|---|
| `useGoogleAuth` | — | Google OAuth con expo-auth-session |
| `useAccounts` | query | Listar cuentas |
| `useCreateAccount` | mutation | Crear cuenta + invalida accounts |
| `useUpdateAccount` | mutation | Actualizar cuenta + invalida accounts |
| `useDeleteAccount` | mutation | Eliminar cuenta + invalida accounts |
| `useCategories` | query | Listar categorías |
| `useTransactions` | query | Listar transacciones con filtros |
| `useCreateTransaction` | mutation | Crear transacción + invalida transactions y accounts |
| `useBudgets` | query | Listar presupuestos |
| `useCreateBudget` | mutation | Crear presupuesto + invalida budgets |
| `useDeleteBudget` | mutation | Eliminar presupuesto + invalida budgets |

## Pantallas implementadas

| Ruta | Pantalla | Estado |
|---|---|---|
| `/auth/login` | Login | Completo (email + Google) |
| `/auth/register` | Registro | Completo (email + Google) |
| `/(tabs)/index` | Dashboard | Completo (balance real, resumen mensual, últimos 5 movs) |
| `/(tabs)/add` | Añadir transacción | Completo (conectado al API, selectores cuenta/categoría) |
| `/(tabs)/transactions` | Movimientos | Placeholder |
| `/(tabs)/budgets` | Presupuestos | Completo (lista con progreso, creación, eliminación) |
| `/(tabs)/profile` | Perfil | Completo (ver perfil, logout, navegación a cuentas) |
| `/accounts/index` | Listado cuentas | Completo (lista, editar, eliminar) |
| `/accounts/form` | Formulario cuenta | Completo (crear/editar con tipo, moneda, saldo) |

## Estándares de código

### Backend (Python)
- **Async toda la vida**: Usar `async def` en endpoints, `AsyncSession` para DB, `await` en queries
- **Modelos**: SQLAlchemy 2.0 style (`Mapped`, `mapped_column`), UUID como PK
- **Schemas**: Pydantic v2 con `model_config = {"from_attributes": True}` para responses
- **Endpoints**: Separar por recurso en `api/v1/`, usar `Depends(get_current_user)` para auth
- **PUT/PATCH**: Usar `exclude_unset=True` en `model_dump()` para solo actualizar campos enviados
- **Errores**: HTTPException con código apropiado (401, 404, 409, etc.)
- **Naming**: `snake_case` para todo (archivos, funciones, variables)

### Frontend (TypeScript/React Native)
- **Naming**: `camelCase` para variables/funciones, `PascalCase` para componentes/tipos
- **Estilos**: NativeWind (Tailwind) — usar colores personalizados (`bg-bg`, `bg-bg-surface`, `text-text-primary`, `text-text-secondary`, `text-primary-300`, `border-border`)
- **Iconos**: Ionicons, castear `name` con `as any` cuando el nombre venga de una variable
- **Estado**: Zustand para estado global (solo auth), React Query para datos del servidor
- **Ruteo**: Expo Router (file-based) — las pantallas van en `app/`
- **API**: Axios con interceptors para token JWT, todo tipado en `services/finance.ts`
- **Componentes**: Preferir componentes funcionales, mantenerlos pequeños
- **Auth guard**: Entry point (`app/index.tsx`) maneja loading spinner y redirección según `isAuthenticated`
- **Auto-redirect**: Pantallas auth redirigen a `(tabs)` via `useEffect` que escucha `isAuthenticated`
- **Google OAuth**: Hook `useGoogleAuth` encapsula `expo-auth-session`, se reusa en login y register
- **Hooks de datos**: Usar `useQuery` / `useMutation` con invalidation de queries relacionadas
- **Tests**: Jest con mocks de SecureStore, expo-web-browser, expo-auth-session, y Zustand

## Decisiones de arquitectura

- **Por qué SQLite en desarrollo**: Elimina dependencia de Docker/PostgreSQL para desarrollo local rápido
- **Por qué UUID como PK**: Escalabilidad, seguridad (no exponer IDs secuenciales), soporte multi-base de datos
- **Por qué NativeWind**: Rendimiento (compila a estilo plano), tema claro/oscuro nativo, ecosistema Tailwind
- **Por qué Zustand + React Query**: Zustand para estado cliente (auth), React Query para estado servidor (accounts, transactions, etc.)
- **Por qué FastAPI async**: Rendimiento, documentación automática (OpenAPI), validación con Pydantic

## Cosas que evitar

- **NO** usar `sync` en endpoints de FastAPI — siempre `async`
- **NO** usar `npm` para instalar paquetes Expo — usar `npx expo install` (respeta versiones de SDK)
- **NO** hardcodear URLs de API — usar `EXPO_PUBLIC_API_URL` en `.env`
- **NO** almacenar tokens en AsyncStorage — usar `expo-secure-store`
- **NO** crear migraciones manuales — usar Alembic `alembic revision --autogenerate`
- **NO** mezclar estilos inline con NativeWind — elegir uno y mantener consistencia
- **NO** commits directos a `main` sin PR (cuando haya colaboradores)
- **NO** olvidar redirigir después de Google OAuth — el hook guarda el token y llama `checkAuth()`, la redirección la maneja el `useEffect` en la pantalla
- **NO** renderizar el Stack de Expo Router condicionalmente — el loading se maneja en `app/index.tsx` (no en el layout)
- **NO** olvidar invalidar queries relacionadas en `onSuccess` de mutations (ej: crear transacción invalida transactions + accounts)

## Convenciones de git

- Mensajes de commit en español
- Prefijos: `feat:`, `fix:`, `refactor:`, `docs:`, `style:`, `chore:`
- Rama principal: `main`

## Checklist de revisión

- [ ] ¿TypeScript/Python compila sin errores?
- [ ] ¿Los endpoints tienen manejo de errores apropiado?
- [ ] ¿Las migraciones están actualizadas?
- [ ] ¿Los tokens/secretos están en `.env` y no hardcodeados?
- [ ] ¿Las queries SQL están optimizadas (sin N+1)?
- [ ] ¿El estilo sigue NativeWind consistente con la paleta?
- [ ] ¿La API retorna los códigos HTTP correctos?
- [ ] ¿Los schemas Pydantic validan correctamente?
- [ ] ¿El auth guard redirige correctamente según `isAuthenticated`?
- [ ] ¿Google OAuth funciona en ambos login y register?
- [ ] ¿`checkAuth()` se llama en el layout raíz al montar?
- [ ] ¿Las mutations invalidan las queries correctas?

## Sesión — Estado del proyecto

### Completado ✅
- Auth: email + Google OAuth (backend y frontend)
- Auth guard con checkAuth y redirección
- Dashboard con balance real, resumen mensual, últimos movs
- Añadir transacción conectado al API con selectores
- CRUD de cuentas (backend PUT/DELETE, frontend listado + formulario)
- Presupuestos con progreso, creación y eliminación
- Paleta de colores personalizada (basada en diseño de referencia)
- 7 componentes reutilizables
- 11 hooks con React Query
- Tests: auth store, API services, Google hook, finance services

### Pendiente 🔶
- Pantalla de movimientos (transactions list) con FlatList y filtros
- Editar/eliminar transacciones desde la lista
- Transferencias entre cuentas (backend + frontend)
- Gastos recurrentes (backend scheduler)
- Gráficos / reportes (analytics endpoints + charts)
- Migraciones Alembic (actualmente usa create_all)
- Capa de servicios en backend (app/services/ vacío)
- Offline support / React Query persist
- E2E tests
- CI/CD, linting, formateo
- Pantalla de categorías (CRUD completa)
- Editar transacción
- Pull-to-refresh en listas
- Dark/Light theme toggle
- Notificaciones y alertas de presupuestos