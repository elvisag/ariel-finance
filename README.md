# Ariel Finance

Aplicación móvil de finanzas personales multi-usuario. Permite gestionar ingresos, gastos, cuentas, categorías y presupuestos de forma colaborativa.

## Stack

| Capa | Tecnología |
|------|-----------|
| **Frontend** | Expo (React Native) + TypeScript + NativeWind |
| **Backend** | FastAPI (Python 3.12) + SQLAlchemy async |
| **Base de datos** | PostgreSQL (producción) / SQLite (desarrollo) |
| **Autenticación** | JWT (python-jose + bcrypt) + Google OAuth (expo-auth-session) |
| **Cache** | Redis |
| **Testing** | Jest (frontend) + pytest (backend) |
| **Infraestructura** | Docker Compose |

## Estructura del proyecto

```
ariel-finance/
├── backend/                  # API REST (FastAPI)
│   ├── app/
│   │   ├── api/v1/          # Endpoints: auth, users, accounts, transactions, categories, budgets
│   │   ├── core/            # Config, seguridad, base de datos
│   │   ├── models/          # SQLAlchemy: User, Account, Transaction, Category, Budget
│   │   ├── schemas/         # Pydantic (validación y serialización)
│   │   └── services/        # Lógica de negocio
│   ├── alembic/             # Migraciones
│   └── tests/
├── mobile/                  # App móvil (Expo Router)
│   ├── app/                 # Pantallas (file-based routing)
│   │   ├── auth/            # Login / Registro (email + Google OAuth)
│   │   └── (tabs)/          # Inicio, Movimientos, Añadir, Presupuestos, Perfil
│   ├── components/          # UI reutilizable
│   ├── hooks/               # Hooks personalizados (useGoogleAuth)
│   ├── services/            # Cliente API (Axios + SecureStore)
│   ├── store/               # Estado global (Zustand)
│   ├── __mocks__/           # Mocks para tests
│   └── tests/               # Tests unitarios
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

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Registrar usuario (email + contraseña) |
| POST | `/api/v1/auth/login` | Iniciar sesión (email + contraseña) |
| POST | `/api/v1/auth/google` | Iniciar sesión o registrarse con Google OAuth |
| GET | `/api/v1/users/me` | Perfil del usuario |
| GET | `/api/v1/accounts/` | Listar cuentas |
| POST | `/api/v1/accounts/` | Crear cuenta |
| GET | `/api/v1/transactions/` | Listar transacciones (con filtros) |
| POST | `/api/v1/transactions/` | Crear transacción |
| DELETE | `/api/v1/transactions/{id}` | Eliminar transacción |
| GET | `/api/v1/categories/` | Listar categorías |
| POST | `/api/v1/categories/` | Crear categoría |
| GET | `/api/v1/budgets/` | Listar presupuestos |
| POST | `/api/v1/budgets/` | Crear presupuesto |

## Base de datos

Modelos principales:

- **User** — id, email, name, password_hash (nullable si usa Google), google_id (nullable si usa email)
- **Account** — user_id, name, type (checking/savings/credit), balance, currency
- **Transaction** — account_id, category_id, amount, type (income/expense), description, date
- **Category** — user_id, name, icon, color, type (income/expense)
- **Budget** — user_id, category_id, amount, period (weekly/monthly/yearly)

## Licencia

MIT
