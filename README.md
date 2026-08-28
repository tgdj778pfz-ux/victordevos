# Vandycke — Reviewflow

Bespoke reviewflow voor **Slagerij - Traiteur Vandycke**, gebouwd op een
herbruikbaar sjabloon. Pure HTML/CSS/JS, geen build-stap of server nodig.
Werkt door `index.html` te openen in een browser, of de map te hosten op
eender welke webserver (Netlify, Vercel, gewone hosting, enz.) — bijvoorbeeld
gelinkt via een QR-code op de kassabon of aan de toonbank.

## Bestandsstructuur

```
vandycke-reviewflow/
├── index.html          ← startpunt, laadt CSS + JS
├── css/
│   └── style.css        ← alle styling, kleuren, typografie, responsive regels
├── js/
│   ├── config.js         ← bedrijfsgegevens: logo, kleuren, review-URL, talen, feedback-categorieën
│   ├── translations.js   ← alle teksten in NL / FR / EN
│   └── app.js             ← state machine + rendering + mock data-opslag
├── images/
│   └── logo-vandycke.png ← logo van de klant, gebruikt in de header + favicon
└── README.md
```

## Merkkleuren

Gehaald uit het logo (zie `logo-vandycke.png`):

| Kleur | Hex | Gebruik |
|---|---|---|
| Primair (petrolblauw) | `#004B66` | knoppen, links, geselecteerde staten, CTA's |
| Primair-donker | `#00344A` | verlopen/schaduw op knoppen, succes-icoon |
| Secundair (koe-grijs, verdonkerd voor contrast) | `#8F97A0` | randen/hover-states van de categorie-kaartjes |
| Secundair-zacht | `#ECEBE7` | achtergrond van de categorie-kaartjes |

Alle tekst/achtergrond-combinaties zijn gecontroleerd op WCAG AA
(minimaal 4.5:1 voor gewone tekst).

## Dit bedrijf aanpassen

Bedrijfsgegevens staan in `js/config.js`, onder `BUSINESSES.vandycke`:
logo, naam, kleuren, `reviewUrl` (momenteel een placeholder — vervang door de
echte Google-reviewlink) en ondersteunde talen.

`SHOW_DEMO_SWITCHER` staat op `false`: dit is een echte, single-bedrijf
deployment, geen demo met meerdere bedrijven.

## Feedback-categorieën (sectorspecifiek)

Bij 1, 2 of 3 sterren toont de flow eerst een lijst met aanvinkbare
categorieën (bv. *kwaliteit van het vlees*, *wachttijd aan de toonbank*,
*vriendelijkheid van de bediening*, …) in plaats van meteen een leeg
tekstvak. Zodra minstens één categorie is aangevinkt, verschijnt er een
optioneel tekstvak om dit kort toe te lichten.

- Categorie-ids: `FEEDBACK_CATEGORIES` in `js/config.js`.
- Labels per taal: `TRANSLATIONS[taal].categories` in `js/translations.js`.

Categorie toevoegen/verwijderen? Pas beide bestanden aan (id moet
overeenkomen).

## Testen

- 4 of 5 sterren → opent na een korte animatie de `reviewUrl` in een nieuw tabblad.
- 1, 2 of 3 sterren → toont eerst de categorie-selectie, dan (optioneel) het
  contactformulier.
- De uiteindelijke `FeedbackPayload` wordt gelogd in de browserconsole
  (F12 → Console) zodat je ziet wat er klaarstaat voor opslag.

## Volgende stap: een echte backend

In `js/app.js` staat de functie `submitFeedback(payload)`. Die simuleert nu
een API-call met `setTimeout`. Vervang de inhoud door een echte `fetch()`:

```js
function submitFeedback(payload) {
  return fetch("https://jouw-backend.be/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then((res) => {
    if (!res.ok) throw new Error("Request failed");
    return res.json();
  });
}
```

## Datamodel

```
FeedbackPayload {
  businessId: string
  rating: number                       // 1..5
  feedbackCategories: string[] | null  // enkel bij rating 1-3, ids uit FEEDBACK_CATEGORIES
  feedback: string | null              // optionele toelichting, enkel bij rating 1-3
  language: 'nl' | 'fr' | 'en'
  name: string | null
  email: string | null
  phone: string | null
  timestamp: string                    // ISO 8601
}
```

## Roadmap (nog niet gebouwd, wel al voorzien)

- Ondernemersdashboard met overzicht van ratings/feedback per `businessId`
- QR-code generatie per bedrijf
- Statistieken (gemiddelde rating, trend, response rate)
- E-mailnotificaties bij lage rating
- AI-feedbackanalyse op de feedback-tekst
