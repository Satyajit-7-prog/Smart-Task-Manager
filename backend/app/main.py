from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routes import auth_routes, task_routes, category_routes, analytics_routes

# Initialize DB tables (SQLite database will be created automatically)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Task Manager API",
    description="AI-Powered Productivity and Task Management Backend Service",
    version="1.0.0"
)

# CORS configurations
# Allow standard localhost development ports for Vite React
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|.*\.vercel\.app)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes under the standard '/api' prefix
app.include_router(auth_routes.router, prefix="/api")
app.include_router(task_routes.router, prefix="/api")
app.include_router(category_routes.router, prefix="/api")
app.include_router(analytics_routes.router, prefix="/api")

@app.get("/")
def get_root():
    return {
        "status": "online",
        "message": "Welcome to the Smart Task Manager AI-Powered API!",
        "docs": "/docs"
    }
