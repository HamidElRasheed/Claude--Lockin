"""Demo data: `python seed.py` wipes the demo user's data and creates goals plus logs for
the previous ISO week and the days of this week before today. Safe to run again."""

from datetime import date, timedelta

from sqlalchemy import delete, select

from app import models
from app.config import settings
from app.db import SessionLocal, init_db
from app.services import clock

ALL_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

# key: (title, days, time, weekly_target)
GOALS = {
    "trene": ("Trene", ["mon", "wed", "fri"], "07:00", 3),
    "lese": ("Lese 20 min", ALL_DAYS, "21:00", None),
    "mobil": ("Ingen mobil etter 23", ["sun", "mon", "tue", "wed", "thu"], "23:00", None),
    "vann": ("Drikke vann", ALL_DAYS, None, None),
}

# Per goal: (status, reason, transcript). Goals not listed for a day they apply to count as done.
# Each day also has (reflection, summary, tomorrow_tip). Patterns built in on purpose:
# training missed on Wednesdays (worked late), reading partial when tired, phone rule mostly held.
PREVIOUS_WEEK = {
    "mon": (
        {},
        "Grei start på uka. Fikk trent før jobb, og det ga meg energi resten av dagen.",
        "Alle fire målene holdt i dag. Treningen før jobb ga deg energi resten av dagen.",
        "Legg fram treningstøyet tirsdag kveld, så er onsdagsøkta lettere å komme i gang med.",
    ),
    "tue": (
        {"lese": ("partial", "var trøtt", "Leste litt, men var så trøtt at jeg ga meg etter fem minutter.")},
        "Lang dag på jobb. Var helt tom da jeg kom hjem.",
        "Lesingen ble kort fordi du var trøtt etter en lang arbeidsdag. Mobilregelen og vannet holdt.",
        "Prøv å lese ti minutter rett etter middag, før trøttheten tar over.",
    ),
    "wed": (
        {
            "trene": ("missed", "jobbet sent", "Nei, ble ikke noe trening. Jobbet sent og hadde ikke overskudd."),
            "vann": ("partial", "glemte flaska på jobb", "Delvis. Glemte flaska på jobb, så det ble lite."),
        },
        "Onsdager er alltid lange. Møter hele ettermiddagen, og jeg jobbet til halv ni.",
        "Treningen falt bort fordi du jobbet sent. Du fikk likevel lest og holdt mobilregelen.",
        "Legg vannflaska i sekken i kveld, så blir den med på jobb i morgen.",
    ),
    "thu": (
        {},
        "Roligere dag. Gikk en tur i lunsjen.",
        "En rolig dag der alt holdt. Turen i lunsjen ga en fin pause.",
        "Treningen i morgen er klokka sju. Legg deg før 23, så blir det lettere å komme opp.",
    ),
    "fri": (
        {"lese": ("partial", "var trøtt", "Leste kanskje ti minutter. Var trøtt etter uka.")},
        "Bra økt i morges. Sliten nå, men fornøyd med uka.",
        "Morgenøkta ble gjennomført. Lesingen ble kortere enn planlagt fordi du var trøtt.",
        "Les i morgen formiddag, når du har mer overskudd.",
    ),
    "sat": (
        {"vann": ("partial", "var ute hele dagen", "Drakk litt, men var ute hele dagen og glemte det.")},
        "Fin lørdag. Leste etter frokost og var ute med venner resten av dagen.",
        "Lesingen gikk fint da du tok den om formiddagen. Vannet ble glemt mens du var ute.",
        "Ta med en flaske vann når du skal ut.",
    ),
    "sun": (
        {"mobil": ("missed", "så på serie", "Nei, satt med mobilen til halv tolv og så på en serie.")},
        "Rolig søndag. Ble sittende med en serie på mobilen for lenge.",
        "Lesingen og vannet holdt. Mobilen ble liggende fremme etter 23 på grunn av en serie.",
        "Sett mobilen til lading utenfor soverommet før 23 i morgen kveld.",
    ),
}

CURRENT_WEEK = {
    "mon": (
        {},
        "Kom meg opp og trente. Godt å starte uka sånn.",
        "Alle målene holdt. Morgenøkta satte en god tone for uka.",
        "Onsdag blir lang på jobb. Tenk gjennom om treningen passer bedre en annen morgen.",
    ),
    "tue": (
        {"lese": ("partial", "var trøtt", "Leste noen sider, men var for trøtt til å fortsette.")},
        "Mye på jobb i dag. Trøtt i kveld.",
        "Lesingen ble kort igjen fordi du var trøtt. Mobilregelen og vannet holdt.",
        "Les rett etter middag i morgen, før du setter deg med noe annet.",
    ),
    "wed": (
        {"trene": ("missed", "jobbet sent", "Nei, jobbet sent igjen. Rakk det ikke.")},
        "Samme som forrige onsdag. Jobbet sent og fikk ikke trent.",
        "Treningen falt bort fordi du jobbet sent, akkurat som forrige onsdag. Resten holdt.",
        "Ta en kort økt torsdag morgen hvis du har overskudd.",
    ),
    "thu": (
        {},
        "Grei dag. Fikk lest en god stund før jeg la meg.",
        "Alt holdt i dag, og du leste mer enn 20 minutter.",
        "Treningen i morgen er klokka sju. Legg fram tøyet i kveld.",
    ),
    "fri": (
        {"lese": ("partial", "sovnet", "Sovnet med boka etter noen minutter.")},
        "Trente i morges. Fredagstrøtt nå.",
        "Morgenøkta ble gjennomført. Lesingen ble kort fordi du sovnet.",
        "Les om formiddagen i morgen, når du er mer våken.",
    ),
    "sat": (
        {},
        "Rolig dag hjemme. Leste ute på balkongen.",
        "Lesingen og vannet holdt. En rolig lørdag.",
        "Mobilregelen gjelder igjen i morgen kveld. Legg fra deg telefonen før 23.",
    ),
}


def wipe(db, user_id: str) -> None:
    log_ids = select(models.DailyLog.id).where(models.DailyLog.user_id == user_id)
    goal_ids = select(models.Goal.id).where(models.Goal.user_id == user_id)
    db.execute(delete(models.GoalEntry).where(models.GoalEntry.log_id.in_(log_ids)))
    db.execute(delete(models.GoalEntry).where(models.GoalEntry.goal_id.in_(goal_ids)))
    db.execute(delete(models.DailyLog).where(models.DailyLog.user_id == user_id))
    db.execute(delete(models.WeeklyReport).where(models.WeeklyReport.user_id == user_id))
    db.execute(delete(models.Goal).where(models.Goal.user_id == user_id))


def seed_days(today: date) -> list[tuple[date, tuple]]:
    """(date, day plan) for every day of the previous ISO week and this week before today."""
    this_monday = today - timedelta(days=today.weekday())
    prev_monday = this_monday - timedelta(days=7)
    days = [(prev_monday + timedelta(days=i), PREVIOUS_WEEK[ALL_DAYS[i]]) for i in range(7)]
    days += [
        (this_monday + timedelta(days=i), CURRENT_WEEK[ALL_DAYS[i]]) for i in range(today.weekday())
    ]
    return days


def run(user_id: str | None = None) -> dict[str, int]:
    user_id = user_id or settings.demo_user_id
    init_db()
    with SessionLocal() as db:
        wipe(db, user_id)

        goals: dict[str, models.Goal] = {}
        for key, (title, days, time, target) in GOALS.items():
            goals[key] = models.Goal(
                user_id=user_id, title=title, days=days, time=time, weekly_target=target, active=True
            )
            db.add(goals[key])
        db.flush()

        n_logs = n_entries = 0
        for day, (overrides, reflection, summary, tip) in seed_days(clock.today()):
            weekday = clock.weekday(day)
            log = models.DailyLog(
                user_id=user_id, date=day, reflection=reflection, summary=summary, tomorrow_tip=tip
            )
            for key, goal in goals.items():
                if weekday not in goal.days:
                    continue
                status, reason, transcript = overrides.get(key, ("done", None, None))
                log.entries.append(
                    models.GoalEntry(
                        goal_id=goal.id,
                        goal_title=goal.title,
                        status=status,
                        reason=reason,
                        transcript=transcript,
                    )
                )
                n_entries += 1
            db.add(log)
            n_logs += 1
        db.commit()
    return {"goals": len(goals), "logs": n_logs, "entries": n_entries}


def main() -> None:
    today = clock.today()
    counts = run()
    days = seed_days(today)
    print(f"Seeded demo user '{settings.demo_user_id}' (today {today.isoformat()}):")
    print(f"  {counts['goals']} goals: " + ", ".join(g[0] for g in GOALS.values()))
    print(f"  {counts['logs']} daily logs, {counts['entries']} goal entries")
    print(f"  from {days[0][0].isoformat()} to {days[-1][0].isoformat()}")
    prev_year, prev_week, _ = (today - timedelta(days=7)).isocalendar()
    print(f"  try: POST /reports/weekly/generate {{\"week\": \"{prev_year}-W{prev_week:02d}\"}}")


if __name__ == "__main__":
    main()
