# recruiter-platform/backend/app/main.py

from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
# --- MODIFICATION: Ensure the new 'search' router is imported ---
from .routers import auth, health, me, orgs, superadmin, favorites, upload, roles, search

app = FastAPI(
    title="Recruiter Platform API",
    description="API for the multi-tenant recruiter platform.",
    version="0.1.0",
)

# --- CORS Middleware Configuration ---
origins = [
    settings.FRONTEND_BASE_URL,
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    # --- THIS IS THE FIX ---
    # This line is essential. It tells the browser that it is safe
    # to send the HttpOnly authentication cookie with requests.
    allow_credentials=True,
    # --- END OF FIX ---
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SessionMiddleware Re-enabled (Preserved from your original file) ---
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET_KEY,
)

# --- API Routers ---
# Routers are now included directly on the app without the /api/v1 prefix
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(me.router)
app.include_router(upload.router)
app.include_router(orgs.router)
app.include_router(superadmin.router, prefix="/superadmin", tags=["Super Admin"])
app.include_router(favorites.router, tags=["Favorites"])
app.include_router(roles.router, prefix="/roles", tags=["Roles"])
# --- MODIFICATION: Ensure the new search router is included ---
app.include_router(search.router, prefix="/search", tags=["Search"])


@app.get("/", tags=["Health Check"])
def read_root():
    """A simple health check endpoint to confirm the API is running."""
    return {"status": "ok"}
