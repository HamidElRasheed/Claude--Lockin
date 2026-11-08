import type { SFSymbol } from 'expo-symbols';

// What Lockin does with your data, in plain Norwegian. Kept in one place so the short card
// and the full page never say different things. Must match CLAUDE.md §11 and the backend.
export type PrivacyPoint = { icon: SFSymbol; title: string; body: string };

export const privacyPoints: PrivacyPoint[] = [
  {
    icon: 'mic.fill',
    title: 'Lyden lagres aldri',
    body: 'Når du snakker, gjøres opptaket om til tekst og slettes med en gang, både på telefonen og på serveren. Også hvis noe går galt.',
  },
  {
    icon: 'book.closed',
    title: 'Vi lagrer bare tekst',
    body: 'Målene dine, det du sa om hvert mål, dagspoeng og rapportene. Ikke navn, e-post eller posisjon.',
  },
  {
    icon: 'lock',
    title: 'Ingen reklame, ingen sporing',
    body: 'Ingen informasjonskapsler, ingen annonser og ingen sporing. Dataene dine blir aldri solgt eller delt for markedsføring.',
  },
];

export const privacyDetails: { title: string; body: string }[] = [
  {
    title: 'Hvem som behandler det du sier',
    body: 'Opptaket sendes kryptert til ElevenLabs (med Groq som reserve) for å bli til tekst. Teksten sendes til Anthropic (Claude) for å tolke svarene og skrive rapportene. Vi sender bare det som trengs for akkurat den oppgaven.',
  },
  {
    title: 'Hvor dataene ligger',
    body: 'Teksten lagres i Lockins egen database. Det trengs ingen konto eller innlogging.',
  },
  {
    title: 'Hvorfor vi trenger det',
    body: 'For å huske hvorfor ting gikk eller ikke gikk, og gi deg dagsrapporter og en ukesrapport med konkrete forslag. Ingenting brukes til noe annet.',
  },
  {
    title: 'Dette er en prototype',
    body: 'Lockin er laget på Oslo Sprint-hackathonet. Vil du at dataene dine skal slettes, si fra til teamet, så sletter vi dem.',
  },
];
