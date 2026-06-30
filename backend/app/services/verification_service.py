verification_codes = {}
from datetime import datetime, timedelta
import random
import string
from fastapi import HTTPException
from backend.app.models.user import User
from sqlalchemy import select


def generate_code() -> str:
    return ''.join(random.choices(string.digits, k=6))


class VerificationService:

    def __init__(self, session):
        self.session = session

    async def send_code(self, email: str):

        result = await self.session.execute(
            select(User).where(User.email == email)
        )
        if result.scalar_one_or_none():
            raise HTTPException(400, "Email уже зарегистрирован")

        code = generate_code()

        verification_codes[email] = {
            "code": code,
            "created_at": datetime.utcnow(),
            "attempts": 0
        }

        print(f"CODE: {code}")

        return {"message": "Код отправлен"}
    
    async def verify_code(self, email: str, code: str):

        if email not in verification_codes:
            raise HTTPException(400, "Код не отправлен или истёк")

        stored = verification_codes[email]

        if stored["attempts"] >= 3:
            del verification_codes[email]
            raise HTTPException(400, "Слишком много попыток")

        if datetime.utcnow() - stored["created_at"] > timedelta(minutes=10):
            del verification_codes[email]
            raise HTTPException(400, "Код истёк")

        if stored["code"] != code:
            stored["attempts"] += 1
            raise HTTPException(400, "Неверный код")

        del verification_codes[email]

        return {"message": "Email подтверждён"}