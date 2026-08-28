/* ============================================================================
   CONFIGURATIE — Slagerij - Traiteur Vandycke
   ============================================================================
   Elk bedrijf heeft:
     id          - unieke code (gebruikt als businessId in de feedbackdata)
     name        - bedrijfsnaam, getoond boven de reviewflow
     initials    - fallback-logo (letters) als er geen logoUrl is
     logoUrl     - URL naar het echte logo
     accent      - hoofdaccentkleur (hex), gehaald uit het logo
     accentDark  - donkerdere variant, gebruikt voor verlopen/schaduw
     reviewUrl   - externe review-URL waarnaar 4-5 sterren doorverwijzen
     languages   - array van taalcodes die dit bedrijf ondersteunt ('nl','fr','en')
     defaultLanguage - taal die standaard geladen wordt
   ============================================================================ */

const BUSINESSES = {
  "vandycke": {
    id: "vandycke",
    name: "Vandycke — Slagerij & Traiteur",
    initials: "V",
    logoUrl: "images/logo-vandycke.png",
    // Primaire kleur: uit het VANDYCKE-wordmark in het logo (#004B66, een diep
    // petrolblauw). Secundaire kleur: het grijs van de koe-illustratie
    // (#8F97A0, een licht getinte/verdonkerde versie van #C6C6C6 zodat hij
    // ook decoratief bruikbaar is met voldoende contrast).
    accent: "#004B66",
    accentDark: "#00344A",
    reviewUrl: "https://search.google.com/local/writereview?placeid=ChIJPZjWHi2mxEcRpbVaLH__m1U",
    languages: ["nl", "fr", "en"],
    defaultLanguage: "nl",
  },
};

/* Welk bedrijf standaard geladen wordt. */
const CURRENT_BUSINESS_ID = "vandycke";

/* Dit is een bespoke, single-bedrijf deployment voor Vandycke — de
   demo-bedrijvenkiezer wordt dus niet getoond. Zet terug op true als je dit
   bestand als uitgangspunt voor een nieuwe demo/klant gebruikt. */
const SHOW_DEMO_SWITCHER = false;

/* ---------------------------------------------------------------------------
   Sectorspecifieke feedback-categorieën — getoond als lijstvormige
   selectievragen wanneer de klant 1, 2 of 3 sterren geeft. De labels per
   taal staan in translations.js onder TRANSLATIONS[taal].categories.
   Voeg of verwijder gerust categorieën; de id moet overeenkomen met een
   sleutel in het categories-object van elke taal.
   --------------------------------------------------------------------------- */
const FEEDBACK_CATEGORIES = [
  "vlees",
  "aanbod",
  "bediening",
  "wachttijd",
  "netheid",
  "prijs",
  "anders",
];
