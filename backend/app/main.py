from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.db import init_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="Lockin API", version="0.1.0", lifespan=lifespan)


# All errors use the shape from docs/API.md: {"error": {"code", "message"}}
@app.exception_handler(HTTPException)
async def http_error(_: Request, exc: HTTPException) -> JSONResponse:
    code = exc.detail if isinstance(exc.detail, str) else "error"
    return JSONResponse(status_code=exc.status_code, content={"error": {"code": code, "message": str(exc.detail)}})


@app.exception_handler(RequestValidationError)
async def validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"error": {"code": "validation_error", "message": str(exc.errors())}},
    )


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


# Routers are added here as they are built, e.g.:
# from app.routers import goals
# app.include_router(goals.router)
