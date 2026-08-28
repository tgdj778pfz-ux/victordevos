/* ============================================================================
   REVIEWFLOW APP — vanilla JS, geen build-stap nodig.
   Werkt door index.html gewoon in een browser te openen of te hosten.
   ============================================================================
   DATAMODEL (klaar voor een backend, nog niet geïmplementeerd)
   FeedbackPayload {
     businessId: string
     rating: number                // 1..5
     feedbackCategories: string[] | null  // enkel relevant bij rating 1-3, ids uit FEEDBACK_CATEGORIES
     feedback: string | null       // optionele toelichting, enkel relevant bij rating 1-3
     language: 'nl' | 'fr' | 'en'
     name: string | null
     email: string | null
     phone: string | null
     timestamp: string             // ISO 8601
   }
   -> submitFeedback() hieronder simuleert de POST /api/feedback call.
      Vervang de inhoud van die functie later door een echte fetch() naar
      jouw backend/database.

   ROADMAP (bewust niet gebouwd, maar dit component is er klaar voor)
   - Ondernemersdashboard: overzicht van ratings/feedback per businessId
   - QR-code generatie per bedrijf (linkt naar bv. jouwsite.be/r/{businessId})
   - Statistieken (gemiddelde rating, trend, response rate)
   - E-mailnotificaties bij lage rating
   - AI-feedbackanalyse (sentiment, thema-detectie op feedback-tekst)
   ============================================================================ */

/* ---------------------------------------------------------------------------
   Kleine inline-SVG iconen (geen externe icon-library nodig)
   --------------------------------------------------------------------------- */
const ICONS = {
  star: (filled) => `<svg viewBox="0 0 24 24" fill="${filled ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><polygon points="12 2 15.09 8.63 22 9.24 16.5 14.14 18.18 21 12 17.27 5.82 21 7.5 14.14 2 9.24 8.91 8.63 12 2"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  arrowLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
  chevronDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/></svg>`,
  checkSmall: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
};

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}

/* ---------------------------------------------------------------------------
   Mock backend-call — simuleert netwerklatentie en een occasionele fout,
   zodat de loading/error/success states echt getest kunnen worden.
   Vervang de body van deze functie later door een echte fetch().
   --------------------------------------------------------------------------- */
function submitFeedback(payload) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log("FeedbackPayload klaar voor opslag:", payload);
      if (Math.random() < 0.08) {
        reject(new Error("network"));
      } else {
        resolve({ ok: true });
      }
    }, 1100);
  });
}

/* ---------------------------------------------------------------------------
   State
   --------------------------------------------------------------------------- */
const state = {
  businessId: CURRENT_BUSINESS_ID,
  language: BUSINESSES[CURRENT_BUSINESS_ID].defaultLanguage,
  step: "rating", // rating | redirecting | feedback | contact | submitting | success | error
  rating: 0,
  hoverRating: 0,
  feedbackCategories: [],
  feedback: "",
  name: "",
  email: "",
  phone: "",
  submitting: false,
  redirectTimer: null,
};

function currentBusiness() {
  return BUSINESSES[state.businessId];
}
function t() {
  return TRANSLATIONS[state.language];
}

/* ---------------------------------------------------------------------------
   Rendering
   --------------------------------------------------------------------------- */
const root = document.getElementById("app-root");

function render() {
  const business = currentBusiness();
  const tr = t();

  document.documentElement.style.setProperty("--accent", business.accent);
  document.documentElement.style.setProperty("--accent-dark", business.accentDark);
  document.title = business.name + " — Review";

  root.innerHTML = `
    <div class="top-bar">
      ${
        SHOW_DEMO_SWITCHER
          ? `
      <div class="demo-select-wrap">
        <p class="demo-select-label">${escapeHtml(tr.demoLabel)}</p>
        <select class="demo-select" id="demo-select">
          ${Object.values(BUSINESSES)
            .map(
              (b) =>
                `<option value="${b.id}" ${b.id === state.businessId ? "selected" : ""}>${escapeHtml(b.name)}</option>`
            )
            .join("")}
        </select>
        ${ICONS.chevronDown.replace("<svg ", '<svg class="demo-select-icon" ')}
      </div>`
          : "<div></div>"
      }

      <div class="lang-switch" role="group" aria-label="Taal">
        ${business.languages
          .map(
            (code) =>
              `<button type="button" class="lang-btn ${code === state.language ? "active" : ""}" data-lang="${code}">${code}</button>`
          )
          .join("")}
      </div>
    </div>

    <div class="brand-block">
      <div class="brand-logo ${business.logoUrl ? "brand-logo--image" : ""}">
        ${business.logoUrl ? `<img src="${escapeHtml(business.logoUrl)}" alt="${escapeHtml(business.name)}">` : escapeHtml(business.initials)}
      </div>
      <h1 class="brand-name ${business.logoUrl ? "sr-only" : ""}">${escapeHtml(business.name)}</h1>
      <div class="brand-divider"></div>
    </div>

    <div class="flow-card">
      <div class="flow-card-inner" id="flow-card-inner">
        ${renderStep()}
      </div>
      <div class="torn-edge" aria-hidden="true">
        <svg viewBox="0 0 400 16" preserveAspectRatio="none">
          <polygon points="0,0 14,14 28,2 42,15 56,3 70,13 84,1 98,14 112,4 126,15 140,2 154,13 168,0 182,15 196,3 210,14 224,1 238,13 252,4 266,15 280,2 294,13 308,0 322,14 336,3 350,15 364,1 378,13 392,2 400,10 400,16 0,16"/>
        </svg>
      </div>
    </div>

    <p class="footer-note">${escapeHtml(business.reviewUrl.replace(/^https?:\/\//, ""))}</p>
  `;

  attachEvents();
}

function starRowHtml(activeValue, disabled) {
  let html = `<div class="star-row" role="radiogroup" aria-label="Sterrenbeoordeling" id="star-row">`;
  for (let n = 1; n <= 5; n++) {
    const filled = n <= activeValue;
    html += `
      <button type="button" role="radio" aria-checked="${state.rating === n}" aria-label="${n} ${n === 1 ? "ster" : "sterren"}"
        class="star-btn ${filled ? "filled" : ""}" data-star="${n}" ${disabled ? "disabled" : ""}>
        ${ICONS.star(filled)}
      </button>`;
  }
  html += `</div>`;
  return html;
}

function miniStarsHtml() {
  let html = `<div class="mini-stars" aria-hidden="true">`;
  for (let n = 1; n <= 5; n++) {
    html += ICONS.star(n <= state.rating);
  }
  html += `</div>`;
  return html;
}

function renderStep() {
  const tr = t();

  if (state.step === "rating") {
    return `
      <div class="pane pane-center">
        <p class="prompt">${escapeHtml(tr.ratingPrompt)}</p>
        ${starRowHtml(state.hoverRating || state.rating, false)}
        <p class="hint">${escapeHtml(tr.ratingHint)}</p>
      </div>`;
  }

  if (state.step === "redirecting") {
    return `
      <div class="pane pane-center">
        ${miniStarsHtml()}
        <div class="spinner" aria-hidden="true"></div>
        <p class="prompt">${escapeHtml(tr.redirecting)}</p>
      </div>`;
  }

  if (state.step === "thankyou") {
    return `
      <div class="pane pane-center">
        <div class="success-icon">${ICONS.check}</div>
        ${miniStarsHtml()}
        <h2 class="step-title">${escapeHtml(tr.thankyouTitle)}</h2>
        <p class="step-subtitle">${escapeHtml(tr.thankyouBody)}</p>

        <div class="feedback-details">
          <textarea class="feedback-textarea" id="feedback-input" rows="3" maxlength="1000"
            placeholder="${escapeHtml(tr.thankyouPlaceholder)}">${escapeHtml(state.feedback)}</textarea>
        </div>

        <button type="button" class="primary-btn" id="thankyou-submit">${escapeHtml(tr.thankyouSubmit)}</button>
        <button type="button" class="back-link back-link--center" id="thankyou-skip">${escapeHtml(tr.thankyouSkip)}</button>
      </div>`;
  }

  if (state.step === "feedback") {
    const hasSelection = state.feedbackCategories.length > 0;
    return `
      <div class="pane">
        <button type="button" class="back-link" id="back-to-rating">${ICONS.arrowLeft} ${escapeHtml(tr.back)}</button>
        ${miniStarsHtml()}
        <h2 class="step-title">${escapeHtml(tr.feedbackTitle)}</h2>
        <p class="step-subtitle">${escapeHtml(tr.feedbackCategoriesHint)}</p>

        <div class="category-list" role="group" aria-label="${escapeHtml(tr.feedbackCategoriesHint)}">
          ${FEEDBACK_CATEGORIES.map((id) => {
            const checked = state.feedbackCategories.includes(id);
            const label = tr.categories[id] || id;
            return `
            <label class="category-item ${checked ? "checked" : ""}">
              <input type="checkbox" class="category-checkbox" data-category="${id}" ${checked ? "checked" : ""}>
              <span class="category-box" aria-hidden="true">${ICONS.checkSmall}</span>
              <span class="category-label">${escapeHtml(label)}</span>
            </label>`;
          }).join("")}
        </div>

        <div class="feedback-details ${hasSelection ? "" : "feedback-details--hidden"}">
          <p class="field-label" style="margin-top:4px;">${escapeHtml(tr.feedbackDetailsLabel)}</p>
          <p class="step-subtitle" style="margin-bottom:12px; text-align:left;">${escapeHtml(tr.feedbackDetailsOptional)}</p>
          <textarea class="feedback-textarea" id="feedback-input" rows="4" maxlength="1000"
            placeholder="${escapeHtml(tr.feedbackDetailsPlaceholder)}">${escapeHtml(state.feedback)}</textarea>
        </div>

        <button type="button" class="primary-btn" id="feedback-next">${escapeHtml(tr.next)}</button>
      </div>`;
  }

  if (state.step === "contact") {
    return `
      <div class="pane">
        <button type="button" class="back-link" id="back-to-feedback">${ICONS.arrowLeft} ${escapeHtml(tr.back)}</button>
        <h2 class="step-title">${escapeHtml(tr.contactTitle)}</h2>
        <p class="step-subtitle">${escapeHtml(tr.contactSubtitle)}</p>

        <div class="field">
          <label class="field-label" for="rf-name">${ICONS.user} ${escapeHtml(tr.nameLabel)}</label>
          <input class="text-input" id="rf-name" type="text" autocomplete="name"
            placeholder="${escapeHtml(tr.namePlaceholder)}" value="${escapeHtml(state.name)}">
        </div>

        <div class="field">
          <label class="field-label" for="rf-email">${ICONS.mail} ${escapeHtml(tr.emailLabel)}</label>
          <input class="text-input" id="rf-email" type="email" autocomplete="email"
            placeholder="${escapeHtml(tr.emailPlaceholder)}" value="${escapeHtml(state.email)}">
        </div>

        <div class="field">
          <label class="field-label" for="rf-phone">${ICONS.phone} ${escapeHtml(tr.phoneLabel)}</label>
          <input class="text-input" id="rf-phone" type="tel" autocomplete="tel"
            placeholder="${escapeHtml(tr.phonePlaceholder)}" value="${escapeHtml(state.phone)}">
        </div>

        <button type="button" class="primary-btn" id="submit-feedback">${escapeHtml(tr.submit)}</button>
      </div>`;
  }

  if (state.step === "submitting") {
    return `
      <div class="pane pane-center">
        <div class="spinner" aria-hidden="true"></div>
        <p class="prompt">${escapeHtml(tr.submitting)}</p>
      </div>`;
  }

  if (state.step === "success") {
    return `
      <div class="pane pane-center">
        <div class="success-icon">${ICONS.check}</div>
        <h2 class="step-title">${escapeHtml(tr.successTitle)}</h2>
        <p class="step-subtitle">${escapeHtml(tr.successBody)}</p>
      </div>`;
  }

  if (state.step === "error") {
    return `
      <div class="pane pane-center">
        <div class="error-icon">${ICONS.alert}</div>
        <h2 class="step-title">${escapeHtml(tr.errorTitle)}</h2>
        <p class="step-subtitle">${escapeHtml(tr.errorBody)}</p>
        <button type="button" class="primary-btn" id="retry-submit">${escapeHtml(tr.retry)}</button>
      </div>`;
  }

  return "";
}

/* ---------------------------------------------------------------------------
   Events
   --------------------------------------------------------------------------- */
function attachEvents() {
  // Demo bedrijvenkiezer
  const demoSelect = document.getElementById("demo-select");
  if (demoSelect) {
    demoSelect.addEventListener("change", (e) => {
      state.businessId = e.target.value;
      state.language = currentBusiness().defaultLanguage;
      resetFlow();
    });
  }

  // Taalkiezer
  document.querySelectorAll("[data-lang]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.language = btn.getAttribute("data-lang");
      render();
    });
  });

  // Sterren (click werkt zowel met muis als touch/tap).
  // BELANGRIJK: hover/focus update alleen classes + fill-attributen van de
  // bestaande knoppen (geen innerHTML-herrender). Zou je hier renderStepOnly()
  // aanroepen, dan verwijdert de browser de knop waar de muis net boven staat,
  // wat meteen een "mouseleave" triggert -> hoverRating valt terug naar 0 ->
  // de sterren lijken te "verdwijnen" zodra je erover hovert.
  const starRow = document.getElementById("star-row");
  if (starRow) {
    starRow.querySelectorAll("[data-star]").forEach((btn) => {
      const n = parseInt(btn.getAttribute("data-star"), 10);
      btn.addEventListener("mouseenter", () => {
        state.hoverRating = n;
        updateStarsDisplay(n);
      });
      btn.addEventListener("focus", () => {
        state.hoverRating = n;
        updateStarsDisplay(n);
      });
      btn.addEventListener("click", () => selectStar(n));
    });
    starRow.addEventListener("mouseleave", () => {
      state.hoverRating = 0;
      updateStarsDisplay(state.rating);
    });
  }

  const thankyouSubmit = document.getElementById("thankyou-submit");
  if (thankyouSubmit) thankyouSubmit.addEventListener("click", doSubmit);

  const thankyouSkip = document.getElementById("thankyou-skip");
  if (thankyouSkip) thankyouSkip.addEventListener("click", resetFlow);

  const backToRating = document.getElementById("back-to-rating");
  if (backToRating) backToRating.addEventListener("click", () => { state.step = "rating"; render(); });

  const backToFeedback = document.getElementById("back-to-feedback");
  if (backToFeedback) backToFeedback.addEventListener("click", () => { state.step = "feedback"; render(); });

  // Feedback-categorieën (lijstvormige selectievragen). Een wijziging kan de
  // optionele toelichtingstextarea tonen/verbergen, dus we herrenderen enkel
  // de stap-inhoud (niet de hele pagina) om de scrollpositie te bewaren.
  document.querySelectorAll("[data-category]").forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      const id = e.target.getAttribute("data-category");
      const isChecked = e.target.checked;
      state.feedbackCategories = isChecked
        ? [...state.feedbackCategories, id]
        : state.feedbackCategories.filter((c) => c !== id);
      renderStepOnly();
    });
  });

  const feedbackInput = document.getElementById("feedback-input");
  if (feedbackInput) {
    feedbackInput.addEventListener("input", (e) => { state.feedback = e.target.value; });
  }

  const feedbackNext = document.getElementById("feedback-next");
  if (feedbackNext) {
    feedbackNext.addEventListener("click", () => {
      // Rating + feedback zijn nu klaargezet voor opslag (nog niet verzonden).
      state.step = "contact";
      render();
    });
  }

  const nameInput = document.getElementById("rf-name");
  if (nameInput) nameInput.addEventListener("input", (e) => { state.name = e.target.value; });
  const emailInput = document.getElementById("rf-email");
  if (emailInput) emailInput.addEventListener("input", (e) => { state.email = e.target.value; });
  const phoneInput = document.getElementById("rf-phone");
  if (phoneInput) phoneInput.addEventListener("input", (e) => { state.phone = e.target.value; });

  const submitBtn = document.getElementById("submit-feedback");
  if (submitBtn) submitBtn.addEventListener("click", doSubmit);

  const retryBtn = document.getElementById("retry-submit");
  if (retryBtn) retryBtn.addEventListener("click", doSubmit);
}

/* Werkt de vulling/kleur van de sterren bij zonder de knoppen te vervangen,
   zodat hover-events stabiel blijven (zie toelichting in attachEvents). */
function updateStarsDisplay(activeValue) {
  const starRow = document.getElementById("star-row");
  if (!starRow) return;
  starRow.querySelectorAll("[data-star]").forEach((btn) => {
    const n = parseInt(btn.getAttribute("data-star"), 10);
    const filled = n <= activeValue;
    btn.classList.toggle("filled", filled);
    btn.setAttribute("aria-checked", String(state.rating === n));
    const svg = btn.querySelector("svg");
    if (svg) svg.setAttribute("fill", filled ? "currentColor" : "none");
  });
}

function selectStar(value) {
  state.rating = value;
  state.hoverRating = 0;

  if (value >= 4) {
    state.step = "redirecting";
    render();
    if (state.redirectTimer) clearTimeout(state.redirectTimer);
    state.redirectTimer = setTimeout(() => {
      window.open(currentBusiness().reviewUrl, "_blank", "noopener,noreferrer");
      // Belangrijk: de site blijft na het doorsturen niet vastzitten op het
      // "wordt doorgestuurd"-scherm. De externe review-pagina opent in een
      // nieuw tabblad; hier tonen we meteen een bedankscherm met de optie
      // om nog iets kwijt te willen, zodat een terugkeer naar dit tabblad
      // nooit een verouderde/vaste toestand toont.
      state.redirectTimer = null;
      state.step = "thankyou";
      render();
    }, 1400);
  } else {
    state.step = "feedback";
    render();
  }
}

function doSubmit() {
  if (state.submitting) return; // voorkomt dubbele verzending
  state.submitting = true;
  state.step = "submitting";
  render();

  const payload = {
    businessId: currentBusiness().id,
    rating: state.rating,
    feedbackCategories: state.feedbackCategories.length ? state.feedbackCategories : null,
    feedback: state.feedback.trim() ? state.feedback.trim() : null,
    language: state.language,
    name: state.name.trim() ? state.name.trim() : null,
    email: state.email.trim() ? state.email.trim() : null,
    phone: state.phone.trim() ? state.phone.trim() : null,
    timestamp: new Date().toISOString(),
  };

  submitFeedback(payload)
    .then(() => {
      state.submitting = false;
      state.step = "success";
      render();
    })
    .catch(() => {
      state.submitting = false;
      state.step = "error";
      render();
    });
}

/* Alleen de stap-inhoud herrenderen (voor hover-updates op de sterren,
   zonder de rest van de kaart te laten "flitsen"). */
function renderStepOnly() {
  const inner = document.getElementById("flow-card-inner");
  if (inner) {
    inner.innerHTML = renderStep();
    attachEvents();
  }
}

function resetFlow() {
  if (state.redirectTimer) clearTimeout(state.redirectTimer);
  state.step = "rating";
  state.rating = 0;
  state.hoverRating = 0;
  state.feedbackCategories = [];
  state.feedback = "";
  state.name = "";
  state.email = "";
  state.phone = "";
  state.submitting = false;
  render();
}

render();
