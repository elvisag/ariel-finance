from app.models.user import User


async def get_current_user_profile(user: User) -> User:
    return user
