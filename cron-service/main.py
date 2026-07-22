from datetime import datetime
from typing import Optional

from croniter import croniter
from cron_descriptor import get_description
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Cron Playground", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class CronRequest(BaseModel):
    expression: str


class CronResponse(BaseModel):
    expression: str
    valid: bool
    human_readable: Optional[str] = None
    next_executions: list[str] = []
    frequency: Optional[str] = None
    fields: Optional[dict[str, str]] = None
    error: Optional[str] = None


FIELD_NAMES = ["minute", "hour", "day_of_month", "month", "day_of_week"]


def calculate_frequency(expression: str) -> str:
    """Estimate how often the cron runs."""
    now = datetime.now()
    cron = croniter(expression, now)
    # Count executions in 7 days
    count = 0
    end = datetime(now.year, now.month, now.day + 7 if now.day < 25 else now.day, now.hour, now.minute)
    try:
        while True:
            next_run = cron.get_next(datetime)
            if next_run > end:
                break
            count += 1
            if count > 10000:
                break
    except Exception:
        pass

    per_day = count / 7
    if per_day >= 60:
        return f"{int(per_day)} times per day"
    elif per_day >= 1:
        return f"{int(per_day)} times per day"
    elif count >= 1:
        per_week = count
        return f"{per_week} times per week"
    return "rarely"


@app.post("/cron/parse", response_model=CronResponse)
def parse_cron(request: CronRequest):
    expression = request.expression.strip()

    # Validate
    if not croniter.is_valid(expression):
        return CronResponse(
            expression=expression,
            valid=False,
            error=f"Invalid cron expression: '{expression}'"
        )

    # Human-readable description
    try:
        human = get_description(expression)
    except Exception:
        human = "Could not generate description"

    # Next 10 executions
    cron = croniter(expression, datetime.now())
    next_runs = []
    for _ in range(10):
        next_time = cron.get_next(datetime)
        next_runs.append(next_time.strftime("%Y-%m-%d %H:%M:%S (%a)"))

    # Parse fields
    parts = expression.split()
    fields = {}
    for i, name in enumerate(FIELD_NAMES):
        if i < len(parts):
            fields[name] = parts[i]

    # Frequency
    frequency = calculate_frequency(expression)

    return CronResponse(
        expression=expression,
        valid=True,
        human_readable=human,
        next_executions=next_runs,
        frequency=frequency,
        fields=fields,
    )


@app.get("/health")
def health():
    return {"status": "ok"}
