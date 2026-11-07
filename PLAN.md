# PLAN

Oppdateres hele tiden, av både mennesker og agenter. Format: `- [ ] oppgave (eier)`. Kryss av når den er pushet til `main`.

**Frist:** søndag kl. 14:00 (kodefrys). Ferdig kl. 12:00.

Eiere: **APP** = HamidElRasheed (`mobile/`, branch `app/arbeid`), **BACKEND** = abala-108 (`backend/`, branch `backend/arbeid`).

## Fase 0: Oppsett (lørdag, nå)
- [x] `docs/API.md` er låst som v1. Endringer skrives i `docs/SYNC.md`
- [x] Skjelett for `backend/`: FastAPI, `/health`, SQLite-modeller, skjemaer, tale-til-tekst-tjeneste, `requirements.txt`, `.env.example` og test
- [x] Skjelett for `mobile/`: Expo SDK 58 og TypeScript, Expo Router, tomme skjermer, `theme/`, `lib/api.ts`, `lib/types.ts` og `lib/mock.ts`, med `expo-audio` og `expo-haptics` installert
- [x] ElevenLabs-API-nøkkel inn i `backend/.env` (BACKEND)
- [ ] Groq-nøkkel som gratis reserve (valgfritt) (BACKEND)
- [x] Hamid tester appen i Expo Go på iPhonen (APP)
- [ ] Test at iPhonen når backend over nettet på stedet (begge)

## Fase 1: Design (lørdag ettermiddag)
- [x] Skisser av de fire skjermene og oppsettet (APP)
- [x] Ferdig design med design-tokens i `mobile/theme/` (APP)

## Fase 2: Kveldsgjennomgangen fra start til slutt (lørdag kveld) ⭐
- [x] Modeller: Goal, DailyLog, GoalEntry og WeeklyReport, med `user_id` (BACKEND)
- [x] CRUD for `/goals`, `/goals/parse` (AI) og `/today` i norsk tid (BACKEND)
- [x] `/transcribe` med ElevenLabs Scribe og Groq som reserve, der lyden slettes etterpå (BACKEND)
- [x] `/review/interpret` med Claude Haiku 5.5 og strukturert output (BACKEND). Testet live fra lyd til tekst til tolkning
- [x] `/review/complete` med dagsrapport og «I morgen» (BACKEND). Hele gjennomgangen testet live på rundt 5 sekunder
- [x] Opptaksknapp (hold for å snakke, med haptikk) (APP)
- [ ] Kveldsgjennomgangen mot mock, deretter mot ekte API (APP)

## Fase 3: Logg, ukesrapport og oppsett (søndag morgen)
- [x] `/logs` og `/reports/weekly` med generering (BACKEND)
- [x] `seed.py` med en realistisk demouke, der onsdagsmønsteret for trening er med (BACKEND). Kjør `python seed.py` og generer deretter forrige uke
- [ ] Hver telefon får egne data via headeren `X-User-Id`, med demobrukeren som standard (BACKEND). Ferdig på `backend/enhetsbruker` og venter på merge. Appen må sende headeren (APP, se SYNC.md)
- [ ] Backend tilgjengelig for iPhonen på stedet (LAN-IP eller tunnel) (BACKEND)
- [ ] Finpuss: dagsrapporten skal bruke brukerens egne tall, ikke målnavnet («lest en halvtime», ikke «20 min») (BACKEND)
- [x] Skjermene for dagslogg og ukesrapport (APP)
- [x] Oppsett med `/goals/parse` (APP og BACKEND)
- [x] Morgenskjermen (APP)

## Fase 4: Finpuss og levering (søndag kl. 10–14)
- [ ] Gå gjennom alle tilstander: lasting, tom og feil (APP)
- [ ] Oppdater README med «Kom i gang» (begge)
- [ ] Demovideo som backup (begge)
- [ ] Øv på pitchen, 2 min (begge)
- [ ] `/lever` med repolenke og video (begge)
