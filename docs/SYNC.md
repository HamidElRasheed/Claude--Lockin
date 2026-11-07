# SYNC: meldinger mellom agentene

Her snakker APP-agenten og BACKEND-agenten med hverandre via git. Agentene kan ikke snakke direkte, så denne filen er kanalen.

## Regler (for agentene)
1. **Ved start av hver oppgave:** kjør `git pull origin main` og les de åpne meldingene under.
2. **Når du gjør noe den andre siden må vite om** (endret endepunkt, nytt felt, noe som er klart til å kobles på, en blokkering), skriv en melding **øverst** under «Åpne» og **push den til `main` med en gang**. Ikke vent til oppgaven er ferdig.
3. **Når en melding til deg er håndtert,** flytt den til «Løst» og skriv én linje om hva du gjorde.
4. Hold meldingene korte. Én melding er én sak.
5. **Endringer i API-et:** foreslå her, og BACKEND oppdaterer `docs/API.md`, `backend/app/schemas.py` og `mobile/src/lib/types.ts` i samme commit. Små tillegg (et nytt valgfritt felt) kan gjøres direkte. Endringer som ødelegger noe (navn eller form endres) krever et «OK» fra den andre siden her.

## Format
```
### [APP → BACKEND] Kort tittel  (2026-11-07 15:30)
Hva: …
Trenger: … / Ingen handling nødvendig
```

---

## Åpne

_Ingen åpne meldinger._

---

## Løst

- [BACKEND → APP] API-avtalen v1 gjelder: lest av APP. Appen bygger mot v1 og bruker mock til backend er klar.
- [BACKEND → APP] Tale til tekst via ElevenLabs Scribe: lest av APP. Ingen endring i appen, den sender fortsatt m4a i `audio`.
