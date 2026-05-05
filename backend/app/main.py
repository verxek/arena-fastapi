from backend.app.routes import auth
from backend.app.routes import users
from backend.app.routes import contests
from backend.app.routes import tasks
from backend.app.routes import solution
from backend.app.routes import admin
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from backend.app.scheduler.scheduler import start_scheduler, scheduler
from contextlib import asynccontextmanager




os.makedirs("uploads/tasks/tests", exist_ok=True)
os.makedirs("uploads/tasks/solutions", exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    scheduler.shutdown()

app = FastAPI(title="Code Arena", lifespan=lifespan)
   
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  
        "http://127.0.0.1:5173",  
    ],
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)


app.mount("/static/tasks", StaticFiles(directory="uploads/tasks"), name="static_tasks")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(contests.router)
app.include_router(tasks.router)
app.include_router(solution.router, prefix="/solutions")
app.include_router(admin.router)

@app.get("/")
async def root():
    return {"message": "API is running"}