import uuid
from unittest.mock import patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.core.database import Base, get_db
from app.core.security import hash_password, create_access_token
from app.main import app
from app.models.user import User

TEST_DATABASE_URL = "sqlite+aiosqlite://"


@pytest_asyncio.fixture
async def db_session():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest_asyncio.fixture
async def async_client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def user_password():
    return "TestPass123!"


@pytest_asyncio.fixture
async def user_data(user_password):
    return {
        "email": "test@example.com",
        "name": "Test User",
        "password": user_password,
    }


@pytest_asyncio.fixture
async def created_user(db_session, user_data):
    user = User(
        email=user_data["email"],
        name=user_data["name"],
        password_hash=hash_password(user_data["password"]),
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def auth_token(created_user):
    return create_access_token({"sub": str(created_user.id)})


@pytest_asyncio.fixture
async def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture
def mock_google_token():
    google_id = "google-12345"
    email = "googleuser@gmail.com"
    name = "Google User"

    with patch("google.oauth2.id_token.verify_oauth2_token") as mock:
        mock.return_value = {
            "sub": google_id,
            "email": email,
            "name": name,
        }
        yield mock, {"id_token": "fake-google-id-token"}, email, name, google_id
