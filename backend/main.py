from fastapi import FastAPI
from session_router import router as session_router

app = FastAPI(title="hebrai API", version="0.1.0")
app.include_router(session_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
