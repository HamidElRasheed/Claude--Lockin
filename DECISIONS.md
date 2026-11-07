# DECISIONS

Kort logg over beslutninger. Nyeste nederst. Format: **Beslutning**, hvorfor, og eventuelle alternativer.

1. **Mobilapp med Expo (React Native) og TypeScript, ikke nettside.** Produktet skal føles ordentlig og ikke som AI-slop. Expo fordi vi bruker Windows (Swift krever Mac) og ønsker én app for iPhone og Android.
2. **Egen backend, ingen Supabase eller Firebase.** Vi vil eie arkitekturen og skalere uten å være låst til en leverandør. (Anbefalt av en ekspert.)
3. **Backend i Python med FastAPI.** Det er språket teamet kan best, det er sterkt på AI og tale, og det lager OpenAPI-dokumentasjon automatisk. Alternativene var Node/TypeScript (samme språk som appen) og Java/Spring (tregere oppsett).
4. **SQLite med SQLAlchemy under hackathonet, PostgreSQL senere.** Det gir raskere oppsett nå, og byttet krever bare en ny `DATABASE_URL`.
5. **Ingen stemme fra AI-en.** AI-en vises som tekst, og bare brukeren snakker. Det er enklere og tydeligere, og det fungerer også når man ikke kan prate høyt.
6. **Opptak i appen og transkribering i backend (OpenAI).** Uten betalt Apple-utviklerkonto må vi bruke Expo Go, og der fungerer ikke native talegjenkjenning. Talegjenkjenningen ligger bak et eget grensesnitt, slik at vi kan bytte til NB-Whisper (bedre på norsk, kan kjøres i Norge).
7. **Bare tekst lagres, aldri lyd.** Hensyn til personvern og dataminimering.
8. **Ingen innlogging i hackathon-versjonen.** Vi bruker én demobruker, men `user_id` finnes i datamodellen. E-post og Google-innlogging kommer senere.
9. **Ingen ekte Google Kalender-kobling i hackathon-versjonen.** Forslagene vises i ukesrapporten. Innlogging med Google på mobil tar for lang tid nå.
10. **AI-modellen for tolking og rapporter er ikke valgt ennå.** Den ligger bak `services/ai.py`.
11. **RevenueCat for betaling, senere.** Ikke en del av hackathonet.
12. **Tale til tekst: ElevenLabs Scribe, med Groq Whisper som reserve** (erstatter OpenAI i punkt 6). Gratis kreditter fra hackathonet, sterk norsk og mulighet for ElevenLabs-premien. Groq har en gratisversjon. AI-en har fortsatt ingen stemme.
14. **AI-modell: Claude Haiku 5.5 (`claude-haiku-5-5`) via Anthropic-API-et, med strukturert output.** Den er nesten gratis ($5 i kreditt holder for hele hackathonet), god på norsk, og den strukturerte outputen gir alltid gyldig JSON. Modellen kan byttes med `AI_MODEL` i `.env`. Gratisalternativer som Groq og Gemini var vurdert, men har svakere norsk eller usikre vilkår for personlige data.
13. **API v1 er låst, og agentene kommuniserer via `docs/SYNC.md`.** Agentene på de to PC-ene kan ikke snakke direkte, og vi vil unngå møter for hver lille endring.
15. **Designretningen er «Pust».** Appen snakker i store serif-setninger, en lyskule som puster lytter når brukeren snakker, og kvelden har en egen mørk skumringsstemning. Den bryter de første designreglene på tre punkter: to skrifter (systemets serif og systemfonten), én myk glød rundt kulen, og en mørk kveldsskjerm som er fast, ikke en mørk modus. Grunnen er at appen skal føles som et trygt sted som samtidig gir energi. De tre første utkastene ble forkastet som for generiske.
