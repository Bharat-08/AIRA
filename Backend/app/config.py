# backend/app/config.py

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Manages application-wide settings loaded from a .env file.
    """
    model_config = SettingsConfigDict(env_file='.env', env_ignore_empty=True)

    # --- Core Application Settings ---
    APP_ENV: str = "dev"
    APP_BASE_URL: str = "http://localhost:8000"
    FRONTEND_BASE_URL: str = "http://localhost:3000"

    # --- Session Management for OAuth ---
    SESSION_SECRET_KEY: str

    # --- Google OAuth ---
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    OAUTH_REDIRECT_URI: str = "http://localhost:8000/auth/google/callback"
    
    # --- JWT (RS256) Authentication ---
    JWT_PRIVATE_KEY: str
    JWT_PUBLIC_KEY: str
    JWT_ALGORITHM: str = "RS256"
    JWT_EXPIRATION_MINUTES: int = 60 # <<< THIS LINE WAS RENAMED/FIXED
    COOKIE_NAME: str = "access_token"

    # --- Database ---
    DATABASE_URL: str

    # --- External Services ---
    OPENAI_API_KEY: str

    # --- Business Logic Rules ---
    INVITE_ONLY: bool = True
    ALLOW_MULTI_ORG: bool = False

settings = Settings()
