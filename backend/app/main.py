from backend.app.routes import auth
from backend.app.routes import users
from backend.app.routes import test_roles
from backend.app.routes import contests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Code Arena")

# благодаря этому React сможет обращаться к API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(test_roles.router)
app.include_router(users.router)
app.include_router(contests.router)

@app.get("/")
async def root():
    return {"message": "API is running"}