# CLAUDE.md — Ariel Finance

## Arquitectura general

Monorepo con dos proyectos independientes: `backend/` (FastAPI) y `mobile/` (Expo).

- **Frontend**: Expo Router (file-based routing) + NativeWind (Tailwind) + Zustand + React Query
- **Backend**: FastAPI async + SQLAlchemy 2.0 async + Pydantic v2
- **Autenticación**: JWT (Bearer token) almacenado en SecureStore
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
```

### Docker

```bash
docker compose up -d           # PostgreSQL + Redis + Backend
```

## Estándares de código

### Backend (Python)

- **Async toda la vida**: Usar `async def` en endpoints, `AsyncSession` para DB, `await` en queries
- **Modelos**: SQLAlchemy 2.0 style (`Mapped`, `mapped_column`), UUID como PK
- **Schemas**: Pydantic v2 con `model_config = {"from_attributes": True}` para responses
- **Endpoints**: Separar por recurso en `api/v1/`, usar `Depends(get_current_user)` para auth
- **Errores**: HTTPException con código apropiado (401, 404, 409, etc.)
- **Naming**: `snake_case` para todo (archivos, funciones, variables)

### Frontend (TypeScript/React Native)

- **Naming**: `camelCase` para variables/funciones, `PascalCase` para componentes/tipos
- **Estilos**: NativeWind (Tailwind) — usar clases `className` en lugar de `StyleSheet.create`
- **Estado**: Zustand para estado global, React Query para datos del servidor
- **Ruteo**: Expo Router (file-based) — las pantallas van en `app/`
- **API**: Axios con interceptors para token JWT, todo tipado en `services/finance.ts`
- **Componentes**: Preferir componentes funcionales, mantenerlos pequeños

## Decisiones de arquitectura

- **Por qué SQLite en desarrollo**: Elimina dependencia de Docker/PostgreSQL para desarrollo local rápido
- **Por qué UUID como PK**: Escalabilidad, seguridad (no exponer IDs secuenciales), soporte multi-base de datos
- **Por qué NativeWind**: Rendimiento (compila a estilo plano), tema claro/oscuro nativo, ecosistema Tailwind
- **Por qué Zustand**: Liviano, TypeScript-first, sin boilerplate comparado con Redux
- **Por qué FastAPI async**: Rendimiento, documentación automática (OpenAPI), validación con Pydantic

## Cosas que evitar

- **NO** usar `sync` en endpoints de FastAPI — siempre `async`
- **NO** usar `npm` para instalar paquetes Expo — usar `npx expo install` (respeta versiones de SDK)
- **NO** hardcodear URLs de API — usar `EXPO_PUBLIC_API_URL` en `.env`
- **NO** almacenar tokens en AsyncStorage — usar `expo-secure-store`
- **NO** crear migraciones manuales — usar Alembic `alembic revision --autogenerate`
- **NO** mezclar estilos inline con NativeWind — elegir uno y mantener consistencia
- **NO** commits directos a `main` sin PR (cuando haya colaboradores)

## Convenciones de git

- Mensajes de commit en español o inglés (mantener consistencia)
- Prefijos sugeridos: `feat:`, `fix:`, `refactor:`, `docs:`, `style:`, `chore:`
- Rama principal: `main`

## Checklist de revisión

- [ ] ¿TypeScript/Python compila sin errores?
- [ ] ¿Los endpoints tienen manejo de errores apropiado?
- [ ] ¿Las migraciones están actualizadas?
- [ ] ¿Los tokens/secretos están en `.env` y no hardcodeados?
- [ ] ¿Las queries SQL están optimizadas (sin N+1)?
- [ ] ¿El estilo sigue NativeWind consistente?
- [ ] ¿La API retorna los códigos HTTP correctos?
- [ ] ¿Los schemas Pydantic validan correctamente?
