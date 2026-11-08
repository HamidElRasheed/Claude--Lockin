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


from app.routers import calendar, goals, logs, reports, review, stats, today, transcribe  # noqa: E402

app.include_router(calendar.router)
app.include_router(goals.router)
app.include_router(logs.router)
app.include_router(reports.router)
app.include_router(stats.router)
app.include_router(today.router)
app.include_router(transcribe.router)
app.include_router(review.router)
