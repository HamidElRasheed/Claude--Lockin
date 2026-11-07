# API-avtale: app ↔ backend (v1, gjeldende)

Dette er kilden til sannhet. Backend (`backend/app/schemas.py`) og appen (`mobile/src/lib/types.ts`) skal speile denne filen. **v1 er låst. Bygg mot den.** Ønsker om endringer skrives i `docs/SYNC.md`, og typene oppdateres i samme commit.

- Base-URL: `EXPO_PUBLIC_API_URL`, for eksempel `http://192.168.1.20:8000`
- Alt sendes og mottas som JSON, med unntak av `/transcribe`, som tar imot en lydfil.
- Datoer er på formatet `YYYY-MM-DD`, uker på `YYYY-Www` (ISO-uke, for eksempel `2026-W45`), og tidspunkter på `HH:MM`.
- Hackathon-versjonen har ingen innlogging. Hver telefon identifiseres med headeren `X-User-Id` (se under).
- Feil returneres alltid slik: `{ "error": { "code": "string", "message": "string" } }`

### Bruker: headeren `X-User-Id` (valgfri)
- Appen lager en tilfeldig ID (UUID) første gang den åpnes, lagrer den og sender den som `X-User-Id` med **hver** forespørsel. Hver ID får sine egne mål, logger og rapporter.
- Gyldig: 8–64 tegn, bare `A-Z a-z 0-9 -`. Ugyldig gir `400` med koden `invalid_user_id`.
- Mangler headeren, brukes demobrukeren (den samme som `seed.py` fyller med data).

---

## Typer

```ts
type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type GoalStatus = "done" | "partial" | "missed";

type Goal = {
  id: string;
  title: string;            // "Trene"
  days: Weekday[];          // dagene målet gjelder
  time: string | null;      // "07:00" eller null
  weeklyTarget: number | null; // f.eks. 3 (av dagene), null = hver valgt dag
  active: boolean;
};

type GoalDraft = Omit<Goal, "id" | "active">;

type GoalEntry = {
  goalId: string;
  goalTitle: string;
  status: GoalStatus;
  reason: string | null;    // brukerens grunn, kort
  transcript: string | null; // det brukeren sa (tekst)
};

type DailyLog = {
  date: string;
  entries: GoalEntry[];
  reflection: string | null; // brukerens egen oppsummering
  summary: string;           // AI: 2–3 setninger
  tomorrowTip: string;       // AI: ett konkret punkt
};

type WeeklyReport = {
  week: string;              // "2026-W45"
  wentWell: string[];        // hva som holdt, og hvorfor
  patterns: string[];        // hvorfor ting feilet (mønstre)
  suggestions: Suggestion[]; // 1–3 stk
};

type Suggestion = {
  text: string;              // "Flytt trening fra onsdag til torsdag 07:00"
  goalId: string | null;
  change: { fromDay: Weekday | null; toDay: Weekday | null; time: string | null } | null;
};
```

---

## Endepunkter

### Helse
`GET /health` → `{ "ok": true }`

### Mål
| Metode | Sti | Body | Svar |
|---|---|---|---|
| GET | `/goals` | – | `Goal[]` |
| POST | `/goals` | `GoalDraft` | `Goal` |
| PATCH | `/goals/{id}` | deler av `GoalDraft` og/eller `active` | `Goal` |
| DELETE | `/goals/{id}` | – | `204` |
| POST | `/goals/parse` | `{ "text": string }` | `GoalDraft[]` (forslag, lagres ikke) |

`/goals/parse` gjør fritekst som «trene 3 ganger i uka om morgenen, lese hver kveld» om til forslag til målkort.

### I dag (morgenskjermen)
`GET /today` → `{ "date": string, "goals": Goal[], "reviewDone": boolean }`

### Tale til tekst
`POST /transcribe`, med `multipart/form-data` og feltet `audio` (m4a fra `expo-audio`)
→ `{ "text": string }`
Lyden lagres aldri.

### Kveldsgjennomgang
| Metode | Sti | Body | Svar |
|---|---|---|---|
| POST | `/review/interpret` | `{ "goalId": string, "text": string }` | `{ "status": GoalStatus, "reason": string \| null }` |
| POST | `/review/complete` | `{ "date": string, "entries": GoalEntry[], "reflection": string \| null }` | `DailyLog` |

Flyten i appen:
1. For hvert mål tar appen opp lyd og sender den til `/transcribe`. Teksten sendes så til `/review/interpret`, og brukeren kan rette resultatet manuelt.
2. Til slutt tar appen opp refleksjonen og sender den til `/transcribe`. Deretter sendes alt til `/review/complete`, som lagrer dagen og returnerer `DailyLog` med AI-oppsummeringen.

### Logg
| Metode | Sti | Svar |
|---|---|---|
| GET | `/logs?from=YYYY-MM-DD&to=YYYY-MM-DD` | `DailyLog[]` (nyeste først) |
| GET | `/logs/{date}` | `DailyLog`, eller 404 |

### Ukesrapport
| Metode | Sti | Svar |
|---|---|---|
| GET | `/reports/weekly?week=2026-W45` | `WeeklyReport`, eller 404 hvis den ikke er laget |
| POST | `/reports/weekly/generate` | body `{ "week": string }` → `WeeklyReport` (lages på nytt og lagres) |

### Kalender (Google Kalender-lenker, uten innlogging)
| Metode | Sti | Body | Svar |
|---|---|---|---|
| GET | `/goals/{id}/calendar-link` | – | `{ "url": string }`, eller 404 `goal_not_found` |
| POST | `/suggestions/apply` | `{ "goalId": string, "change": { "fromDay"?, "toDay"?, "time"? } }` | `{ "goal": Goal, "calendarUrl": string }` |

- `url`/`calendarUrl` er en «add event»-lenke til Google Kalender (`calendar.google.com/calendar/render?action=TEMPLATE…`). Appen åpner den, og Google Kalender viser hendelsen ferdig utfylt. Ingenting skrives til kalenderen før brukeren lagrer selv.
- Mål med tidspunkt blir en hendelse på 30 minutter, mål uten tidspunkt en heldagshendelse. Startdato er neste av målets dager (fra og med i dag), og hendelsen gjentas ukentlig på målets dager.
- `/suggestions/apply` er «Ja, gjør det» i ukesrapporten. `fromDay` + `toDay` bytter dagen, bare `toDay` legger til dagen, og `time` setter nytt tidspunkt. 404 `goal_not_found`. 422 `nothing_to_change` hvis verken `toDay` eller `time` er satt.
