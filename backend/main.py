from fastapi import FastAPI
from session_router import router as session_router
from stats_router import router as stats_router
from settings_router import router as settings_router

app = FastAPI(title="hebrai API", version="0.1.0")
app.include_router(session_router)
app.include_router(stats_router)
app.include_router(settings_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
