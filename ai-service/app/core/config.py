from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    GOOGLE_API_KEY: str = ""
    HUGGINGFACEHUB_API_TOKEN: str = ""
    QDRANT_URL: str = ""
    QDRANT_API_KEY: str = ""
    NODE_BACKEND_URL: str = "http://localhost:8000"

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
