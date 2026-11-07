# PLAN

Oppdateres hele tiden, av både mennesker og agenter. Format: `- [ ] oppgave (eier)`. Kryss av når den er pushet til `main`.

**Frist:** søndag kl. 14:00 (kodefrys). Ferdig kl. 12:00.

Eiere: **APP** = den som tar `mobile/`, **BACKEND** = den som tar `backend/`. *(Skriv inn navn.)*

## Fase 0: Oppsett (lørdag, nå)
- [ ] Bli enige om `docs/API.md` (begge)
- [ ] Lag skjelettet for `backend/`: FastAPI, `/health`, SQLite, `requirements.txt` og `.env.example` (BACKEND)
- [ ] Lag skjelettet for `mobile/`: Expo og TypeScript, Expo Router, tomme skjermer, `theme/` og `lib/mock.ts` (APP)
- [ ] Første commits fra begge pushet til `main`

## Fase 1: Design (lørdag ettermiddag)
- [ ] Skisser av de fire skjermene og oppsettet (APP)
- [ ] Ferdig design med design-tokens i `mobile/theme/` (APP)

## Fase 2: Kveldsgjennomgangen fra start til slutt (lørdag kveld) ⭐
- [ ] Modeller og migrering: Goal, DailyLog og GoalEntry, med `user_id` (BACKEND)
- [ ] CRUD for `/goals` og `/today` (BACKEND)
- [ ] `/transcribe` med OpenAI, der lyden slettes etterpå (BACKEND)
- [ ] `/review/interpret` og `/review/complete` med prompter (BACKEND)
- [ ] Opptaksknapp (hold for å snakke, med haptikk) (APP)
- [ ] Kveldsgjennomgangen mot mock, deretter mot ekte API (APP)

## Fase 3: Logg, ukesrapport og oppsett (søndag morgen)
- [ ] `/logs` og `/reports/weekly` (BACKEND)
- [ ] `seed.py` med en realistisk demouke, der onsdagsmønsteret for trening er med (BACKEND)
- [ ] Skjermene for dagslogg og ukesrapport (APP)
- [ ] Oppsett med `/goals/parse` (APP og BACKEND)
- [ ] Morgenskjermen (APP)

## Fase 4: Finpuss og levering (søndag kl. 10–14)
- [ ] Gå gjennom alle tilstander: lasting, tom og feil (APP)
- [ ] Oppdater README med «Kom i gang» (begge)
- [ ] Demovideo som backup (begge)
- [ ] Øv på pitchen, 2 min (begge)
- [ ] `/lever` med repolenke og video (begge)
