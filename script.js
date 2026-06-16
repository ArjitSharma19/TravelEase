const CHAT_SYSTEM_PROMPT = "You are a travel assistant for Indian passport holders. Answer questions about visas, currency, SIMs, transport and travel essentials. Be concise.";

document.addEventListener("DOMContentLoaded", () => {
  renderHomePage();
  renderDestinationPage();
  setupChatWidget();
});

function renderHomePage() {
  const grid = document.getElementById("destinationGrid");
  if (!grid) return;

  grid.innerHTML = POPULAR_COUNTRIES.map((code) => {
    const destination = DESTINATIONS[code];
    return `
      <a class="destination-card" href="destination.html?country=${encodeURIComponent(code)}" aria-label="Open ${destination.name} guide">
        <span class="flag" aria-hidden="true">${destination.flag}</span>
        <span>
          <strong>${code}</strong>
          <p>${destination.summary}</p>
        </span>
      </a>
    `;
  }).join("");

  setupSearch();
}

function setupSearch() {
  const form = document.getElementById("searchForm");
  const input = document.getElementById("countrySearch");
  const suggestions = document.getElementById("suggestions");
  if (!form || !input || !suggestions) return;

  const findMatches = (value) => {
    const query = value.trim().toLowerCase();
    if (!query) return POPULAR_COUNTRIES;
    return POPULAR_COUNTRIES.filter((code) => {
      const destination = DESTINATIONS[code];
      return code.toLowerCase().includes(query) || destination.name.toLowerCase().includes(query);
    });
  };

  const showSuggestions = () => {
    const matches = findMatches(input.value).slice(0, 6);
    suggestions.classList.toggle("show", matches.length > 0);
    suggestions.innerHTML = matches.map((code) => {
      const destination = DESTINATIONS[code];
      return `
        <button class="suggestion-item" type="button" data-country="${code}">
          <span>${destination.flag}</span>
          <strong>${destination.name}</strong>
        </button>
      `;
    }).join("");
  };

  input.addEventListener("input", showSuggestions);
  input.addEventListener("focus", showSuggestions);

  suggestions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-country]");
    if (!button) return;
    goToCountry(button.dataset.country);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const match = findMatches(input.value)[0];
    if (match) goToCountry(match);
  });

  document.addEventListener("click", (event) => {
    if (!form.contains(event.target)) suggestions.classList.remove("show");
  });
}

function goToCountry(countryCode) {
  window.location.href = `destination.html?country=${encodeURIComponent(countryCode)}`;
}

function renderDestinationPage() {
  const tabContent = document.getElementById("tabContent");
  if (!tabContent) return;

  const params = new URLSearchParams(window.location.search);
  const requestedCountry = (params.get("country") || "UAE").trim();
  const countryCode = Object.keys(DESTINATIONS).find((code) => code.toLowerCase() === requestedCountry.toLowerCase());
  const destination = DESTINATIONS[countryCode] || DESTINATIONS.UAE;
  const activeCode = countryCode || "UAE";

  document.title = `${destination.name} Guide | TravelEase`;
  document.getElementById("countryTitle").textContent = `${destination.flag} ${destination.name}`;
  document.getElementById("countrySummary").textContent = destination.summary;
  document.getElementById("countryFlag").textContent = destination.flag;
  document.getElementById("countryShort").textContent = activeCode;

  const buttons = Array.from(document.querySelectorAll(".tab-button"));
  const renderTab = (tabName) => {
    buttons.forEach((button) => {
      const isActive = button.dataset.tab === tabName;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });
    tabContent.innerHTML = getTabMarkup(tabName, destination);
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => renderTab(button.dataset.tab));
  });

  renderTab("visa");
}

function getTabMarkup(tabName, destination) {
  const templates = {
    visa: () => `
      <div class="tab-header">
        <div>
          <p class="eyebrow">Visa</p>
          <h2>Entry requirements for Indian passport holders</h2>
        </div>
        <span class="badge ${destination.visa.badge}">${destination.visa.type}</span>
      </div>
      <div class="key-value">
        <div class="mini-stat"><span>Processing time</span><strong>${destination.visa.processingTime}</strong></div>
        <div class="mini-stat"><span>Cost in INR</span><strong>${destination.visa.cost}</strong></div>
      </div>
      <div class="info-grid">
        <article class="info-card">
          <h3>Documents checklist</h3>
          <ul class="checklist">${listItems(destination.visa.documents)}</ul>
        </article>
        <article class="info-card">
          <h3>Application</h3>
          <p>Check the latest rules before applying because visa policies and appointment availability can change.</p>
          <a class="primary-button" href="${destination.visa.applyUrl}" target="_blank" rel="noopener">Apply Now</a>
        </article>
      </div>
    `,
    currency: () => `
      <div class="tab-header">
        <div>
          <p class="eyebrow">Currency</p>
          <h2>Money plan before you fly</h2>
        </div>
      </div>
      <div class="info-grid">
        <article class="info-card">
          <h3>Exchange rate</h3>
          <p><strong>${destination.currency.rate}</strong></p>
          <p>${destination.currency.tip}</p>
        </article>
        <article class="info-card">
          <h3>Recommended services</h3>
          <ul>${listItems(destination.currency.services)}</ul>
        </article>
      </div>
    `,
    sim: () => `
      <div class="tab-header">
        <div>
          <p class="eyebrow">SIM</p>
          <h2>Stay connected from day one</h2>
        </div>
      </div>
      <div class="info-grid">
        <article class="info-card">
          <h3>Local SIM</h3>
          <p>${destination.sim.local}</p>
        </article>
        <article class="info-card">
          <h3>eSIM option</h3>
          <p>${destination.sim.esim}</p>
        </article>
        <article class="info-card">
          <h3>Data plan advice</h3>
          <p>${destination.sim.advice}</p>
        </article>
      </div>
    `,
    transport: () => `
      <div class="tab-header">
        <div>
          <p class="eyebrow">Transport</p>
          <h2>Getting around after arrival</h2>
        </div>
      </div>
      <div class="info-grid">
        <article class="info-card">
          <h3>Local cab apps</h3>
          <ul>${listItems(destination.transport.cabs)}</ul>
        </article>
        <article class="info-card">
          <h3>Airport transfer tip</h3>
          <p>${destination.transport.airportTip}</p>
        </article>
        <article class="info-card">
          <h3>Public transport note</h3>
          <p>${destination.transport.publicNote}</p>
        </article>
      </div>
    `,
    essentials: () => `
      <div class="tab-header">
        <div>
          <p class="eyebrow">Essentials</p>
          <h2>Important numbers and local notes</h2>
        </div>
      </div>
      <div class="key-value">
        <div class="mini-stat"><span>Emergency number</span><strong>${destination.essentials.emergency}</strong></div>
        <div class="mini-stat"><span>Indian embassy</span><strong>${destination.essentials.embassy}</strong></div>
      </div>
      <div class="info-grid">
        <article class="info-card">
          <h3>Cultural tips</h3>
          <ul>${listItems(destination.essentials.tips)}</ul>
        </article>
        <article class="info-card">
          <h3>Best time to visit</h3>
          <p>${destination.essentials.bestTime}</p>
        </article>
      </div>
    `
  };

  return templates[tabName]();
}

function listItems(items) {
  return items.map((item) => `<li>${item}</li>`).join("");
}

function setupChatWidget() {
  const root = document.getElementById("chatRoot");
  if (!root) return;

  root.innerHTML = `
    <button class="chat-toggle" type="button" aria-label="Open travel assistant">AI</button>
    <section class="chat-panel" aria-label="Travel assistant chat">
      <div class="chat-header">
        <div>
          <strong>TravelEase Assistant</strong>
          <span>Visa, currency, SIM and transport help</span>
        </div>
        <button class="chat-close" type="button" aria-label="Close chat">&times;</button>
      </div>
      <div class="chat-log" id="chatLog">
        <div class="chat-message">Hi! Ask me a travel question for Indian passport holders.</div>
      </div>
      <form class="chat-form" id="chatForm">
        <label class="sr-only" for="chatInput">Ask a travel question</label>
        <input id="chatInput" type="text" placeholder="Ask about visa, SIM, money..." autocomplete="off">
        <button type="submit">Send</button>
      </form>
    </section>
  `;

  const toggle = root.querySelector(".chat-toggle");
  const panel = root.querySelector(".chat-panel");
  const close = root.querySelector(".chat-close");
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");
  const log = document.getElementById("chatLog");

  toggle.addEventListener("click", () => panel.classList.toggle("open"));
  close.addEventListener("click", () => panel.classList.remove("open"));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const userMessage = input.value.trim();
    if (!userMessage) return;

    appendMessage(log, userMessage, "user");
    input.value = "";

    const waitingMessage = appendMessage(log, "Checking that for you...", "assistant");

    try {
      const answer = await askClaude(userMessage);
      waitingMessage.textContent = answer;
    } catch (error) {
      waitingMessage.textContent = error.message || "Sorry, I could not reach the travel assistant right now. Please try again in a moment.";
    }
  });
}

function appendMessage(log, message, sender) {
  const bubble = document.createElement("div");
  bubble.className = `chat-message ${sender === "user" ? "user" : ""}`;
  bubble.textContent = message;
  log.appendChild(bubble);
  log.scrollTop = log.scrollHeight;
  return bubble;
}

async function askClaude(userMessage) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      system: CHAT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  const data = await response.json();
  return data.text;
}
