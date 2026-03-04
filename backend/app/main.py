from backend.app.routes import auth
from backend.app.routes import test_roles
from fastapi import FastAPI

app = FastAPI(title="Code Arena")
app.include_router(auth.router)
app.include_router(test_roles.router)

@app.get("/")
async def root():
    return {"message": "API is running"}