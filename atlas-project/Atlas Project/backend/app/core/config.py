from functools import lru_cache

from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    jwt_secret: str = Field(default="change-me", env="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, env="JWT_ACCESS_EXPIRES")
    refresh_token_expire_minutes: int = Field(default=60 * 24 * 7, env="JWT_REFRESH_EXPIRES")
    cors_origins: str = Field(default="*", env="CORS_ORIGINS")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
