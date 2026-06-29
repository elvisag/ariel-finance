# Ariel Finance

Aplicación móvil de finanzas personales multi-usuario. Permite gestionar ingresos, gastos, cuentas, categorías, presupuestos y más.

## Stack

| Capa | Tecnología |
|------|-----------|
| **Frontend** | Expo (React Native) + TypeScript + NativeWind + Zustand + React Query |
| **Backend** | FastAPI (Python 3.12) + SQLAlchemy async + Pydantic v2 |
| **Base de datos** | PostgreSQL (producción) / SQLite (desarrollo) |
| **Autenticación** | JWT (python-jose + bcrypt) + Google OAuth (expo-auth-session) |
| **Migraciones** | Alembic (autogenerate) |
| **Testing** | pytest backend (49 tests) + Jest frontend (4 test files) |

## Estructura del proyecto

```
ariel-finance/
├── backend/                  # API REST (FastAPI)
│   ├── app/
│   │   ├── api/v1/          # Endpoints: auth, users, accounts, transactions, categories, budgets, analytics
│   │   ├── core/            # Config, seguridad, base de datos, scheduler
│   │   ├── models/          # SQLAlchemy: User, Account, Transaction, Category, Budget
│   │   ├── schemas/         # Pydantic (validación y serialización)
│   │   └── services/        # 7 módulos de lógica de negocio
│   ├── alembic/             # Migraciones (migration inicial limpia)
│   └── tests/               # 7 test files, 49 tests
├── mobile/                  # App móvil (Expo Router)
│   ├── app/                 # 19 pantallas (file-based routing)
│   │   ├── auth/            # Login / Registro (email + Google OAuth)
│   │   ├── accounts/        # CRUD de cuentas
│   │   ├── categories/      # CRUD de categorías
│   │   └── (tabs)/          # Inicio, Movimientos, Añadir, Presupuestos, Perfil
│   ├── components/          # 9 componentes reutilizables
│   ├── hooks/               # 6 hooks con React Query
│   ├── services/            # Cliente API (Axios + SecureStore)
│   ├── store/               # Estado global: auth + theme (Zustand + persist)
│   └── tests/               # 4 test files
├── docker-compose.yml
└── .gitignore
```

## Requisitos

- Node.js >= 20
- Python 3.12
- Docker (opcional, para PostgreSQL + Redis)
- Expo Go (en tu celular) o simulador iOS/Android

## Inicio rápido

### 1. Backend (desarrollo con SQLite)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Iniciar servidor
uvicorn app.main:app --reload --port 8000
```

API disponible en `http://localhost:8000`. Documentación interactiva en `http://localhost:8000/docs`.

### 2. Backend (producción con Docker)

```bash
docker compose up -d
```

### 3. Frontend

```bash
cd mobile
npm install
npx expo start
```

Escanea el código QR con Expo Go en tu celular (misma red WiFi).

## Variables de entorno

### Backend (`backend/.env`)
```
DATABASE_URL=sqlite+aiosqlite:///./ariel_finance.db
SECRET_KEY=super-secret-key-change-in-production
GOOGLE_CLIENT_ID=<tu-google-client-id>
```

### Frontend (`mobile/.env`)
```
EXPO_PUBLIC_API_URL=http://<tu-ip>:8000/api/v1
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=<ios-client-id>
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=<android-client-id>
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<web-client-id>
```

## API Endpoints

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Registrar usuario (email + contraseña) |
| POST | `/api/v1/auth/login` | Iniciar sesión (email + contraseña) |
| POST | `/api/v1/auth/google` | Iniciar sesión o registrarse con Google OAuth |

### Users
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/users/me` | Perfil del usuario autenticado |

### Accounts
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/accounts/` | Listar cuentas del usuario |
| POST | `/api/v1/accounts/` | Crear cuenta |
| GET | `/api/v1/accounts/{id}` | Obtener cuenta por ID |
| PUT | `/api/v1/accounts/{id}` | Actualizar cuenta |
| DELETE | `/api/v1/accounts/{id}` | Eliminar cuenta |

### Transactions
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/transactions/` | Listar (filtros: account_id, start_date, end_date, type, is_recurring, search) |
| POST | `/api/v1/transactions/` | Crear (auto-actualiza balance) |
| POST | `/api/v1/transactions/transfer` | Transferir entre cuentas |
| PUT | `/api/v1/transactions/{id}` | Actualizar (recalcula balance) |
| DELETE | `/api/v1/transactions/{id}` | Eliminar (revierte balance) |

### Categories
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/categories/` | Listar (globales + propias) |
| POST | `/api/v1/categories/` | Crear personalizada |
| PUT | `/api/v1/categories/{id}` | Actualizar propia |
| DELETE | `/api/v1/categories/{id}` | Eliminar propia |

### Budgets
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/budgets/` | Listar presupuestos |
| POST | `/api/v1/budgets/` | Crear |
| PUT | `/api/v1/budgets/{id}` | Actualizar |
| DELETE | `/api/v1/budgets/{id}` | Eliminar |

### Analytics
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/analytics/monthly-summary` | Resumen del mes (ingresos, gastos, balance) |
| GET | `/api/v1/analytics/monthly-trend` | Tendencia últimos N meses |
| GET | `/api/v1/analytics/spending-by-category` | Gastos agrupados por categoría |

## Modelos de datos

- **User** — id (UUID), email (unique), name, password_hash (nullable), google_id (nullable, unique)
- **Account** — user_id (FK), name, type (checking/savings/credit/investment/cash), balance, currency
- **Transaction** — account_id (FK), category_id (FK nullable), amount, type (income/expense/transfer), description, date, is_recurring, recurrence_frequency, recurrence_interval, recurrence_end_date, recurrence_last_date
- **Category** — user_id (FK nullable = global), name, icon, color, type (income/expense)
- **Budget** — user_id (FK), category_id (FK), amount, period (weekly/monthly/yearly), start_date, end_date

## Licencia

MIT
