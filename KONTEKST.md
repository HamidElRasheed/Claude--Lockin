# Kontekst: vaneappen (Oslo Sprint)

Kort oppsummering av det vi har diskutert så langt, for at din Claude skal ha samme bilde. Dette er **ikke** prosjektets CLAUDE.md. Den lager vi når stacken er valgt.

## Hackathonet
- Oslo Sprint, 6.–8. november 2026.
- **Frist og kodefrys: søndag 8. nov kl. 14:00.** Mål: ferdig rundt kl. 12.
- Ett GitHub-repo per lag. Lenken leveres med `/lever` i #general (team, repo, demo-lenke eller video, beskrivelse). Sjekk med `/min-innlevering`.
- Juryen leser commit-historikken: **commit og push ofte, begge bør committe.** Ingen kode fra før kickoff.
- Ta opp en demovideo som backup.

## Idéen
En **mobilapp for daglige mål og vaner** der du **prater deg gjennom dagen på to minutter** hver kveld. Den husker *hvorfor* du feilet, og foreslår endringer i kalenderen.

Idéen kommer fra et eget problem: andre produktivitetsapper er for mye arbeid, og belønningssystemene fungerer ikke. I dag brukes en notatbok med kort daglig refleksjon.

**Det som skiller appen ut:** andre apper registrerer *om* du gjorde noe. Denne lagrer *hvorfor ikke*. Det gjør ukesrapporten og kalenderforslagene mulige.

## Prinsipper
1. Under 2 minutter om dagen.
2. Én ting per skjerm, ingen dashbord.
3. AI-en sier lite: korte spørsmål, den lytter.
4. Ingen streaks og ingen straff. Det er rom for å feile.
5. Null oppsett: første mål lagt inn på 10 sekunder.
6. **Det skal ikke bli AI-slop.** Gjennomføringen og kvaliteten er hele poenget, og det skal synes både i produktet og i pitchen.

## Oppsett (første gang, under 2 min)
1. Innlogging: e-post først, Google-konto senere (trengs for Google Kalender).
2. «Hva vil du få til?» Du sier eller skriver fritt, og AI-en lager målkort.
3. Bekreft målkortene (navn, dager, tidspunkt). Smarte standardvalg, trykk for å endre.
4. Kalender: «Legge inn i kalenderen?» med forslag rundt eksisterende avtaler. [Ja] [Juster] [Hopp over]
5. Kveldstid for gjennomgang (standard 21:30) og varsler.

Bare steg 2 er obligatorisk. Mål skal også kunne endres senere i kveldsgjennomgangen («legg til meditasjon»).

## Daglig bruk: fire skjermer
1. **Morgen:** ren side med dagens mål og tidspunkter, koblet til Google Kalender. Det skal være veldig enkelt å lage en kalenderplan («trening 3 ganger i uka, om morgenen», og appen foreslår tider).
2. **Kveldsgjennomgang** ⭐ (hjertet og hoveddemoen): AI-en går mål for mål. Du svarer muntlig, og den tolker svaret (ja → ✅, litt → 🟡, nei → ❌). Du gir en kort grunn når du ikke gjorde noe, og avslutter med en fri oppsummering av dagen. Det skal også gå an å gjøre det manuelt.
3. **Dagslogg:** per dato, hvilke mål du gjorde, en kort daglig rapport på 2–3 linjer og en liten boks «I morgen» med ett forbedringspunkt.
4. **Ukesrapport** (viktigst): mønstre, hvorfor du bommet og hvorfor noe fungerte, og forslag. For eksempel: «Du dropper trening på onsdager fordi du jobber sent. Flytte til torsdag 07:00?» [Ja] [Nei]. Ukemålene regnes ut som summen av dagsmålene.

## Teknologi: dette er bestemt
- **Mobilapp med Expo (React Native).** Ikke nettside eller web-app. Kanskje en PC-app senere.
- **Ingen Supabase** eller lignende ferdige backend-tjenester. Vi lager egen backend.
- **Backend: Python + FastAPI** (bestemt). Appen skrives i TypeScript.
- **Ingen stemme fra AI-en.** Gjennomgangen vises visuelt som tekst, og brukeren snakker.
- **Tale:** opptak med `expo-audio` i appen, deretter transkribering i backend (OpenAI for hackathonet, NB-Whisper senere). Den må forstå norsk. **Bare tekst lagres**, ikke lyd.
- Begge har iPhone og Windows-PC. Uten betalt Apple-utviklerkonto må vi bruke **Expo Go**, så det blir ingen native talepakker.
- Akkurat nå optimaliserer vi for hackathonet: en ren design, en backend og en logg som virker. Ikke heng dere opp i små detaljer.

## Åpne spørsmål
- Hvilken AI-modell som tolker svarene og lager rapportene.
- Hvem gjør hva i teamet.
- Den nøyaktige demoplanen. Forslag: oppsett på 30 sekunder, så en live kveldsgjennomgang, så ukesrapport og ett kalenderforslag basert på en uke med ferdig utfylte data.

## Konkurrenter
Reflct (kveldsdagbok på 2 minutter, ingen streaks), Daily Voice Journal, Nudgly og Daily Check-In Coach (begge med streaks). Ingen av dem kombinerer mål, stemmegjennomgang, «hvorfor» og kalenderforslag.

## Rekkefølge
1. Skisser av skjermene, deretter ordentlig design.
2. Repo og oppsett av Expo-prosjektet.
3. Kveldsgjennomgangen fra start til slutt først, så morgen, logg og ukesrapport. Kalenderen til slutt (Google-innlogging på mobil tar tid, så start tidlig).
4. Flere agenter parallelt først når designet og strukturen er låst.
