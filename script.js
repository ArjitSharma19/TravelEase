const CHAT_SYSTEM_PROMPT = "You are a travel assistant for Indian passport holders. Answer questions about visas, currency, SIMs, transport and travel essentials. Be concise.";

document.addEventListener("DOMContentLoaded", () => {
  renderHomePage();
  renderDestinationPage();
  setupChatWidget();
  setupSidebarWidgets();
  setupHomepageTipToasts();
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

const SERVICE_LINKS = {
  BookMyForex: "https://www.bookmyforex.com",
  Wise: "https://wise.com",
  "Wise Card": "https://wise.com",
  "Niyo Global": "https://www.goniyo.com",
  "Niyo Card": "https://www.goniyo.com",
  Revolut: "https://www.revolut.com",
  "Airalo eSIM": "https://www.airalo.com",
  "Holafly eSIM": "https://esim.holafly.com",
  Uber: "https://www.uber.com",
  Grab: "https://www.grab.com",
  Careem: "https://www.careem.com",
  Lyft: "https://www.lyft.com",
  Gojek: "https://www.gojek.com"
};

const CAB_APP_META = {
  Uber: { icon: "🚗", url: SERVICE_LINKS.Uber },
  Grab: { icon: "🟢", url: SERVICE_LINKS.Grab },
  Careem: { icon: "🚕", url: SERVICE_LINKS.Careem },
  Lyft: { icon: "🚘", url: SERVICE_LINKS.Lyft },
  Gojek: { icon: "🛵", url: SERVICE_LINKS.Gojek }
};

const countryImages = {
  UAE: [
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1400",
    "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1400",
    "https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=1400",
    "https://images.unsplash.com/photo-1547234935-80c7145ec969?w=1400",
    "https://images.unsplash.com/photo-1526495124232-a04e1849168c?w=1400",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400"
  ],
  USA: [
    "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=1400",
    "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1400",
    "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1400",
    "https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?w=1400",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400",
    "https://images.unsplash.com/photo-1490077476659-095159692ab5?w=1400"
  ],
  UK: [
    "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1400",
    "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=1400",
    "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1400",
    "https://images.unsplash.com/photo-1520986606214-8b456906c813?w=1400",
    "https://images.unsplash.com/photo-1543832923-44667a44c804?w=1400",
    "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=1400"
  ],
  Thailand: [
    "https://images.unsplash.com/photo-1528181304800-259b08848526?w=1400",
    "https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=1400",
    "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1400",
    "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=1400",
    "https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=1400",
    "https://images.unsplash.com/photo-1562602833-0f4ab2fc46e3?w=1400"
  ],
  Singapore: [
    "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1400",
    "https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=1400",
    "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=1400",
    "https://images.unsplash.com/photo-1570789210967-2cac24afeb00?w=1400",
    "https://images.unsplash.com/photo-1548391350-968f58dedaed?w=1400",
    "https://images.unsplash.com/photo-1559628233-100c798642fd?w=1400"
  ],
  Japan: [
    "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1400",
    "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1400",
    "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=1400",
    "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=1400",
    "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=1400",
    "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1400"
  ],
  Canada: [
    "https://images.unsplash.com/photo-1517935706615-2717063c2225?w=1400",
    "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=1400",
    "https://images.unsplash.com/photo-1444044205806-38f3ed106c10?w=1400",
    "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=1400",
    "https://images.unsplash.com/photo-1559521783-1d1599583485?w=1400",
    "https://images.unsplash.com/photo-1507629221898-500b1d27653d?w=1400"
  ],
  Australia: [
    "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=1400",
    "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1400",
    "https://images.unsplash.com/photo-1529108190281-9a4f620bc2d8?w=1400",
    "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=1400",
    "https://images.unsplash.com/photo-1528072164453-f4e8ef0d475a?w=1400",
    "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1400"
  ]
};

let currentSlide = 0;
let slideInterval;

function initSlideshow(country) {
  const images = countryImages[country];
  if (!images) return;
  const container = document.getElementById('slides-container');
  const dotsContainer = document.getElementById('slide-dots');
  if (!container || !dotsContainer) return;
  
  container.innerHTML = '';
  dotsContainer.innerHTML = '';
  currentSlide = 0;
  
  images.forEach((src, i) => {
    const img = document.createElement('img');
    img.src = src;
    img.className = 'slide' + (i === 0 ? ' active' : '');
    container.appendChild(img);
    const dot = document.createElement('div');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.onclick = () => goToSlide(i);
    dotsContainer.appendChild(dot);
  });
  
  if (slideInterval) clearInterval(slideInterval);
  slideInterval = setInterval(() => changeSlide(1), 4000);
  
  const slideshow = document.querySelector('.hero-slideshow');
  if (slideshow) {
    slideshow.onmouseenter = () => clearInterval(slideInterval);
    slideshow.onmouseleave = () => {
      clearInterval(slideInterval);
      slideInterval = setInterval(() => changeSlide(1), 4000);
    };
  }
}

function changeSlide(direction) {
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  if (slides.length === 0) return;
  slides[currentSlide].classList.remove('active');
  dots[currentSlide].classList.remove('active');
  currentSlide = (currentSlide + direction + slides.length) % slides.length;
  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
}

function goToSlide(index) {
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  if (slides.length === 0) return;
  slides[currentSlide].classList.remove('active');
  dots[currentSlide].classList.remove('active');
  currentSlide = index;
  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
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
  
  const destFlag = document.getElementById("dest-flag");
  const destName = document.getElementById("dest-name");
  const destDesc = document.getElementById("dest-description");
  
  if (destFlag) destFlag.textContent = destination.flag;
  if (destName) destName.textContent = destination.name;
  if (destDesc) destDesc.textContent = destination.summary;

  initSlideshow(activeCode);

  renderQuickSummary(destination);
  setupShareGuide();

  const buttons = Array.from(document.querySelectorAll(".tab-button"));
  const renderTab = (tabName) => {
    buttons.forEach((button) => {
      const isActive = button.dataset.tab === tabName;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });
    tabContent.classList.remove("is-visible");
    tabContent.innerHTML = getTabMarkup(tabName, destination);
    requestAnimationFrame(() => tabContent.classList.add("is-visible"));
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => renderTab(button.dataset.tab));
  });

  renderTab("visa");
  setupCommentsSection(activeCode);
  setupDestinationTipToasts(activeCode);
}

function renderQuickSummary(destination) {
  const grid = document.getElementById("quickSummaryGrid");
  if (!grid) return;

  const facts = [
    { icon: "fa-passport", label: "Visa type", value: destination.visa.type },
    { icon: "fa-money-bill-wave", label: "Currency", value: destination.currency.code || destination.currency.rate },
    { icon: "fa-language", label: "Language", value: destination.language },
    { icon: "fa-sun", label: "Best time", value: destination.bestTime || destination.essentials.bestTime }
  ];

  grid.innerHTML = facts.map((fact) => `
    <article class="summary-card">
      <i class="fa-solid ${fact.icon}" aria-hidden="true"></i>
      <span>${fact.label}</span>
      <strong>${fact.value}</strong>
    </article>
  `).join("");
}

function setupShareGuide() {
  const button = document.getElementById("shareGuideBtn");
  if (!button || button.dataset.ready) return;
  button.dataset.ready = "true";
  button.addEventListener("click", async () => {
    const original = button.innerHTML;
    try {
      await navigator.clipboard.writeText(window.location.href);
      button.innerHTML = `<i class="fa-solid fa-check" aria-hidden="true"></i> Link copied`;
    } catch (error) {
      button.innerHTML = `<i class="fa-solid fa-link" aria-hidden="true"></i> Copy failed`;
    }
    window.setTimeout(() => {
      button.innerHTML = original;
    }, 1800);
  });
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
        <div class="mini-stat"><i class="fa-regular fa-clock" aria-hidden="true"></i><span>Processing time</span><strong>${destination.visa.processingTime}</strong></div>
        <div class="mini-stat"><i class="fa-solid fa-indian-rupee-sign" aria-hidden="true"></i><span>Cost in INR</span><strong>${destination.visa.cost}</strong></div>
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
        <article class="info-card warning-card">
          <h3><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> Important warnings</h3>
          <p>Common reasons Indian travellers face delays or rejections:</p>
          <ul>${listItems(destination.visa.warnings || ["Incomplete documents", "Unclear travel purpose", "Insufficient proof of funds"])}</ul>
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
      <article class="exchange-card">
        <span>Approximate INR exchange rate</span>
        <strong>${destination.currency.rate}</strong>
        <p>${destination.currency.tip}</p>
      </article>
      <div class="info-grid">
        <article class="info-card">
          <h3>Cash vs card</h3>
          <p>${destination.currency.cashCard || destination.currency.tip}</p>
        </article>
        <article class="info-card">
          <h3>ATM availability</h3>
          <p>${destination.currency.atm || "ATMs are available in major cities and airports; check card fees before withdrawing."}</p>
        </article>
        <article class="info-card">
          <h3>UPI abroad tip</h3>
          <p>${destination.upiAccepted ? "UPI may work at select tourist merchants, but keep cards and cash as your primary payment options." : "UPI is not a dependable payment option here. Use an international card and local currency."}</p>
        </article>
        <article class="info-card">
          <h3>Forex and travel card services</h3>
          <div class="service-grid">${serviceCards(["BookMyForex", "Wise Card", "Niyo Card", "Revolut"], "Visit")}</div>
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
          <h3>Local SIM options</h3>
          <ul>${listItems(destination.sim.carriers || [destination.sim.local])}</ul>
        </article>
        <article class="info-card">
          <h3>eSIM options</h3>
          <div class="service-grid">${serviceCards(["Airalo eSIM", "Holafly eSIM"], "Buy Now")}</div>
        </article>
        <article class="info-card">
          <h3>Data plan advice</h3>
          <p>${destination.sim.advice}</p>
        </article>
        <article class="info-card">
          <h3>Airport vs city</h3>
          <p>${destination.sim.airportTip || "Airport SIMs are convenient on arrival; city stores can be cheaper for longer stays."}</p>
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
          <div class="app-pills">${transportPills(destination.transport.apps || destination.transport.cabs)}</div>
        </article>
        <article class="info-card">
          <h3>Airport transfers</h3>
          <p><strong>${destination.transport.airportCost || "Costs vary by airport and city."}</strong></p>
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
        <div class="mini-stat emergency-stat"><span>Emergency number</span><strong>${destination.essentials.emergency}</strong></div>
        <div class="mini-stat"><span>${destination.essentials.embassyName || "Indian embassy"}</span><strong>${destination.essentials.embassy}</strong><a class="text-link" href="tel:${destination.essentials.embassy.replace(/[^+\d]/g, "")}">Call embassy</a></div>
      </div>
      <div class="info-grid">
        <article class="info-card success-card">
          <h3>Cultural do's</h3>
          <ul>${listItems(destination.essentials.dos || destination.essentials.tips)}</ul>
        </article>
        <article class="info-card danger-card">
          <h3>Cultural don'ts</h3>
          <ul>${listItems(destination.essentials.donts || [])}</ul>
        </article>
        <article class="info-card">
          <h3>Weather and best time</h3>
          <p><strong>${destination.bestTime || destination.essentials.bestTime}</strong></p>
          <p>${destination.weather || ""}</p>
        </article>
        <article class="info-card">
          <h3>Medical care</h3>
          <p>${destination.hospitalTip}</p>
        </article>
        <article class="info-card">
          <h3>Electricity plug</h3>
          <p>${destination.plugType}</p>
        </article>
        <article class="info-card">
          <h3>Tipping culture</h3>
          <p>${destination.tipping}</p>
        </article>
      </div>
    `
  };

  return templates[tabName]();
}

function listItems(items) {
  return items.map((item) => `<li>${item}</li>`).join("");
}

function serviceCards(names, buttonLabel) {
  return names.map((name) => `
    <article class="service-card">
      <div class="service-logo" aria-hidden="true">${name.charAt(0)}</div>
      <strong>${name}</strong>
      <a href="${SERVICE_LINKS[name]}" target="_blank" rel="noopener">${buttonLabel}</a>
    </article>
  `).join("");
}

function transportPills(apps) {
  return apps.map((app) => {
    const meta = CAB_APP_META[app] || { icon: "🚕", url: "https://www.uber.com" };
    return `<a class="app-pill" href="${meta.url}" target="_blank" rel="noopener"><span aria-hidden="true">${meta.icon}</span>${app}</a>`;
  }).join("");
}

const homepageTipToasts = [
  {
    key: "home-visa",
    icon: "✈️",
    title: "First-Time Tip",
    message: "First time abroad? Start by checking visa requirements for your destination"
  },
  {
    key: "home-forex",
    icon: "💳",
    title: "Money Tip",
    message: "Tip: Carry a Niyo or Wise card to avoid forex charges abroad"
  },
  {
    key: "home-esim",
    icon: "📱",
    title: "Connectivity Tip",
    message: "Buy an eSIM before you travel - works in 190+ countries"
  }
];

const countryTips = {
  USA: [
    "⚠️ US visa takes 45-60 days - apply well in advance",
    "💳 Cards accepted everywhere - carry minimal cash"
  ],
  UAE: [
    "✅ Indians get visa on arrival - no pre-apply needed",
    "🚕 Use Careem app - cheaper than regular taxis"
  ],
  UK: [
    "⚠️ UK visa rejection rate is high - prepare strong bank statements",
    "🚇 Buy Oyster card for cheap tube travel"
  ],
  Thailand: [
    "✅ No visa needed for Indians - just show return ticket",
    "🚕 Always use Grab app - avoid tuk tuk overcharging"
  ],
  Singapore: [
    "✅ Visa free for Indians - very easy entry",
    "🚇 Buy EZ-Link card - cheapest way to get around"
  ],
  Japan: [
    "⚠️ Japan visa takes 5-7 working days - apply early",
    "💴 Japan is still very cash-heavy - carry Yen"
  ],
  Canada: [
    "⚠️ Canada visa takes 8-10 weeks - apply very early",
    "🌨️ Check weather before packing - varies greatly by season"
  ],
  Australia: [
    "📋 Apply for ETA visa online - takes 1-3 days",
    "🦘 Declare all food items at customs - strict rules"
  ]
};

let activeTipToast = null;
let activeTipTimer = null;

function setupHomepageTipToasts() {
  if (!document.getElementById("destinationGrid")) return;
  const shownCount = Number(sessionStorage.getItem("traveleaseHomeToastCount") || "0");
  if (shownCount >= 3) return;

  const pendingToasts = homepageTipToasts.filter((toast) => !sessionStorage.getItem(`traveleaseToastDismissed:${toast.key}`));
  if (!pendingToasts.length) return;

  window.setTimeout(() => {
    playTipToastQueue(pendingToasts.slice(0, 3 - shownCount), "traveleaseHomeToastCount");
  }, 3000);
}

function setupDestinationTipToasts(countryCode) {
  const tips = countryTips[countryCode];
  if (!tips || !tips.length) return;

  tips.slice(0, 2).forEach((tip, index) => {
    const key = `destination-${countryCode}-${index}`;
    if (sessionStorage.getItem(`traveleaseToastDismissed:${key}`)) return;
    window.setTimeout(() => {
      showTravelTipToast({
        key,
        icon: tip.slice(0, 2).trim(),
        title: `${countryCode} Travel Tip`,
        message: tip.replace(/^(\S+)\s*/, "")
      });
    }, index === 0 ? 2000 : 8000);
  });
}

function playTipToastQueue(toasts, countKey) {
  const [nextToast, ...remainingToasts] = toasts;
  if (!nextToast) return;

  showTravelTipToast(nextToast, () => {
    if (countKey) {
      const nextCount = Math.min(3, Number(sessionStorage.getItem(countKey) || "0") + 1);
      sessionStorage.setItem(countKey, String(nextCount));
      if (nextCount >= 3) return;
    }
    if (remainingToasts.length) {
      window.setTimeout(() => playTipToastQueue(remainingToasts, countKey), 600);
    }
  });
}

function showTravelTipToast({ key, icon, title, message }, onDismiss) {
  dismissToast(false);

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.id = "toast";
  toast.dataset.toastKey = key;
  toast.innerHTML = `
    <div class="toast-icon">${escapeHTML(icon)}</div>
    <div class="toast-content">
      <p class="toast-title">${escapeHTML(title)}</p>
      <p class="toast-message">${escapeHTML(message)}</p>
    </div>
    <button class="toast-close" type="button" onclick="dismissToast()" aria-label="Close notification">✕</button>
  `;

  document.body.appendChild(toast);
  activeTipToast = toast;
  toast.querySelector(".toast-close").addEventListener("click", () => dismissToast(true));
  requestAnimationFrame(() => toast.classList.add("show"));

  activeTipTimer = window.setTimeout(() => dismissToast(true), 5000);
  toast.addEventListener("toast-dismissed", () => {
    if (typeof onDismiss === "function") onDismiss();
  }, { once: true });
}

function dismissToast(markSession = true) {
  const toast = activeTipToast || document.getElementById("toast");
  if (!toast) return;

  if (activeTipTimer) {
    window.clearTimeout(activeTipTimer);
    activeTipTimer = null;
  }

  if (markSession && toast.dataset.toastKey) {
    sessionStorage.setItem(`traveleaseToastDismissed:${toast.dataset.toastKey}`, "1");
  }

  toast.classList.remove("show");
  window.setTimeout(() => {
    if (toast.parentElement) toast.remove();
    if (activeTipToast === toast) activeTipToast = null;
    toast.dispatchEvent(new CustomEvent("toast-dismissed"));
  }, 420);
}

window.dismissToast = dismissToast;

function setupChatWidget() {
  const root = document.getElementById("chatRoot");
  if (!root) return;

  const isEmbedded = root.classList.contains("chat-widget");

  if (isEmbedded) {
    root.innerHTML = `
      <div class="widget-header">
        <i class="fa-solid fa-robot" aria-hidden="true"></i>
        <h3>AI Travel Assistant</h3>
      </div>
      <div class="sidebar-chat-box">
        <div class="chat-log" id="chatLog">
          <div class="chat-message">Hi! Ask me any travel questions for Indian passport holders.</div>
        </div>
        <form class="chat-form" id="chatForm">
          <label class="sr-only" for="chatInput">Ask a travel question</label>
          <input id="chatInput" type="text" placeholder="Ask visa, SIM, money..." autocomplete="off">
          <button type="submit">Send</button>
        </form>
      </div>
    `;
  } else {
    root.innerHTML = `
      <button class="chat-toggle" type="button" aria-label="Open travel assistant">Ask AI ✈️</button>
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

    toggle.addEventListener("click", () => panel.classList.toggle("open"));
    close.addEventListener("click", () => panel.classList.remove("open"));
  }

  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");
  const log = document.getElementById("chatLog");

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

let currentComments = [];

async function setupCommentsSection(countryCode) {
  const commentForm = document.getElementById("commentForm");
  const commentsList = document.getElementById("commentsList");
  const filterChips = document.querySelectorAll(".filter-chip");

  if (!commentForm || !commentsList) return;

  // Load comments from backend
  await loadComments(countryCode);

  // Set up Filter Chips listeners
  filterChips.forEach(chip => {
    chip.addEventListener("click", () => {
      filterChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      const filter = chip.dataset.filter;
      renderComments(filter);
    });
  });

  // Set up Comment Form Submission listener
  commentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const userName = document.getElementById("commentName").value.trim();
    const tripPeriod = document.getElementById("commentPeriod").value.trim();
    const category = document.getElementById("commentCategory").value;
    const text = document.getElementById("commentText").value.trim();

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          countryCode,
          userName,
          category,
          text,
          tripPeriod
        })
      });

      if (!response.ok) {
        throw new Error("Failed to post comment.");
      }

      // Reset form fields
      document.getElementById("commentPeriod").value = "";
      document.getElementById("commentText").value = "";

      // Reload comments and reset filter to all
      await loadComments(countryCode);
      const allChip = Array.from(filterChips).find(c => c.dataset.filter === 'all');
      if (allChip) allChip.click();

      showToast("Your travel tip has been posted successfully!", "success");

    } catch (error) {
      console.error("Error submitting comment:", error);
      showToast("Could not post your comment right now. Please try again.", "error");
    }
  });

  // Set up Like/Upvote Click Delegation
  commentsList.addEventListener("click", async (event) => {
    const likeBtn = event.target.closest(".like-btn");
    if (!likeBtn) return;

    const commentId = likeBtn.dataset.id;
    const likedComments = JSON.parse(localStorage.getItem("likedComments") || "[]");
    if (likedComments.includes(commentId)) {
      showToast("You have already voted this tip as helpful!", "info");
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Failed to like comment.");
      }

      const updatedComment = await response.json();

      // Update local array and save to localStorage
      const commentIdx = currentComments.findIndex(c => c._id === commentId);
      if (commentIdx !== -1) {
        currentComments[commentIdx].likes = updatedComment.likes;
      }

      likedComments.push(commentId);
      localStorage.setItem("likedComments", JSON.stringify(likedComments));

      // Update UI elements on button
      likeBtn.classList.add("liked");
      likeBtn.setAttribute("disabled", "true");

      const icon = likeBtn.querySelector("i");
      if (icon) {
        icon.className = "fa-solid fa-thumbs-up";
      }

      const countSpan = likeBtn.querySelector(".like-count");
      if (countSpan) {
        countSpan.textContent = updatedComment.likes;
      }

      showToast("Voted as helpful!", "success");

    } catch (error) {
      console.error("Error upvoting comment:", error);
      showToast("Failed to vote. Please try again.", "error");
    }
  });
}

async function loadComments(countryCode) {
  const commentsList = document.getElementById("commentsList");
  try {
    const response = await fetch(`/api/comments/${countryCode}`);
    if (!response.ok) {
      throw new Error("Failed to fetch comments.");
    }
    currentComments = await response.json();
    renderComments("all");
  } catch (error) {
    console.error("Error loading comments:", error);
    commentsList.innerHTML = `<p class="no-comments">Could not load community tips right now.</p>`;
  }
}

function renderComments(filter) {
  const commentsList = document.getElementById("commentsList");
  if (!commentsList) return;

  const filtered = filter === "all"
    ? currentComments
    : currentComments.filter(c => c.category === filter);

  if (filtered.length === 0) {
    commentsList.innerHTML = `<p class="no-comments">No tips shared in this category yet. Be the first to share one!</p>`;
    return;
  }

  const categoryNames = {
    general: "General",
    visa: "Visa Update",
    currency: "Money & Forex",
    sim: "SIM & Data",
    transport: "Taxis & Transit"
  };

  const likedComments = JSON.parse(localStorage.getItem("likedComments") || "[]");

  commentsList.innerHTML = filtered.map(comment => {
    const dateStr = new Date(comment.createdAt).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });

    const countryKey = Object.keys(DESTINATIONS).find(k => k.toLowerCase() === comment.countryCode.toLowerCase());
    const dest = DESTINATIONS[countryKey];
    const destName = dest ? `${dest.flag} ${dest.name}` : comment.countryCode;

    const isLiked = likedComments.includes(comment._id);
    const likeClass = isLiked ? "like-btn liked" : "like-btn";
    const thumbsIcon = isLiked ? "fa-solid fa-thumbs-up" : "fa-regular fa-thumbs-up";

    return `
      <article class="comment-card">
        <header class="comment-card-header">
          <div class="comment-author-info">
            <strong>${escapeHTML(comment.userName)}</strong>
            <span>Visited ${escapeHTML(comment.tripPeriod)} &bull; For <strong>${escapeHTML(destName)}</strong> &bull; Posted on ${dateStr}</span>
          </div>
          <span class="comment-category-badge ${comment.category}">${categoryNames[comment.category] || "General"}</span>
        </header>
        <div class="comment-card-body">${escapeHTML(comment.text)}</div>
        <footer class="comment-card-footer">
          <button class="${likeClass}" type="button" data-id="${comment._id}" aria-label="Upvote this tip" ${isLiked ? "disabled" : ""}>
            <i class="${thumbsIcon}" aria-hidden="true"></i> Helpful (<span class="like-count">${comment.likes}</span>)
          </button>
        </footer>
      </article>
    `;
  }).join("");
}

function escapeHTML(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setupSidebarWidgets() {
  sidebarChecklistController();
  sidebarConverterController();
  setupSidebarLayout();
  setupAuthHandlers();
  renderAuthUI();
  calculatePersonalizedAlerts();
}

/* --- Collapsible Sidebar Layout Setup --- */
function sidebarChecklistController() {
  const checklistWidget = document.getElementById("checklistWidget");
  if (!checklistWidget) return;

  const checkboxes = checklistWidget.querySelectorAll("input[type='checkbox']");
  const progress = document.getElementById("checklistProgress");
  const completedSpan = document.getElementById("checklistCompleted");
  const totalSpan = document.getElementById("checklistTotal");

  const savedStates = JSON.parse(localStorage.getItem("flyerChecklist") || "{}");

  const updateProgress = () => {
    let completedCount = 0;
    checkboxes.forEach(cb => {
      const index = cb.dataset.index;
      if (savedStates[index]) {
        cb.checked = true;
        completedCount++;
      } else {
        cb.checked = false;
      }
    });

    const percentage = checkboxes.length ? (completedCount / checkboxes.length) * 100 : 0;
    progress.style.width = `${percentage}%`;
    completedSpan.textContent = completedCount;
    totalSpan.textContent = checkboxes.length;
  };

  checkboxes.forEach(cb => {
    cb.addEventListener("change", () => {
      const index = cb.dataset.index;
      savedStates[index] = cb.checked;
      localStorage.setItem("flyerChecklist", JSON.stringify(savedStates));
      updateProgress();
    });
  });

  updateProgress();
}

function sidebarConverterController() {
  const converterWidget = document.getElementById("converterWidget");
  if (!converterWidget) return;

  const amountInput = document.getElementById("converterAmount");
  const targetSelect = document.getElementById("converterTarget");
  const resultStrong = document.getElementById("conversionResult");
  const calculationP = document.getElementById("conversionCalculation");

  const rates = {
    AED: 0.044,
    USD: 0.012,
    THB: 0.44,
    JPY: 1.88,
    SGD: 0.016
  };

  const symbols = {
    AED: "AED",
    USD: "$",
    THB: "฿",
    JPY: "¥",
    SGD: "S$"
  };

  const calculate = () => {
    const amount = parseFloat(amountInput.value);
    const target = targetSelect.value;

    if (isNaN(amount) || amount <= 0) {
      resultStrong.textContent = "--";
      calculationP.textContent = "Enter a valid amount";
      return;
    }

    const rate = rates[target];
    const converted = (amount * rate).toFixed(2);
    const symbol = symbols[target];

    calculationP.textContent = `₹${amount.toLocaleString("en-IN")} =`;
    resultStrong.textContent = `${symbol} ${parseFloat(converted).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  amountInput.addEventListener("input", calculate);
  targetSelect.addEventListener("change", calculate);

  calculate();
}

function setupSidebarLayout() {
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");
  const navBtns = document.querySelectorAll(".nav-icon-btn");
  const panels = document.querySelectorAll(".sidebar-panel");

  if (!sidebar || !toggleBtn) return;

  const updateSidebarState = (isExpanded) => {
    if (isExpanded) {
      sidebar.classList.add("expanded");
      document.body.classList.add("sidebar-expanded");
    } else {
      sidebar.classList.remove("expanded");
      document.body.classList.remove("sidebar-expanded");
    }

    // Toggle icon direction
    const icon = toggleBtn.querySelector("i");
    if (icon) {
      if (isExpanded) {
        icon.className = "fa-solid fa-chevron-left";
      } else {
        icon.className = "fa-solid fa-chevron-right";
      }
    }
  };

  toggleBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const isExpanded = sidebar.classList.contains("expanded");
    updateSidebarState(!isExpanded);
  });

  navBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const target = btn.dataset.target;
      const isExpanded = sidebar.classList.contains("expanded");
      const isActive = btn.classList.contains("active");

      // Switch active class on nav buttons
      navBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      // Switch active class on panels
      panels.forEach(p => {
        p.classList.toggle("active", p.id === `panel-${target}`);
      });

      if (!isExpanded) {
        // Expand if collapsed
        updateSidebarState(true);
      } else if (isActive) {
        // Collapse if clicking active tab while already expanded
        updateSidebarState(false);
      }
    });
  });
}

function getToken() {
  return localStorage.getItem("travelease_token");
}

function setToken(token) {
  if (token) {
    localStorage.setItem("travelease_token", token);
  } else {
    localStorage.removeItem("travelease_token");
  }
}

function getCurrentUser() {
  const user = localStorage.getItem("travelease_user");
  return user ? JSON.parse(user) : null;
}

function setCurrentUser(user) {
  if (user) {
    localStorage.setItem("travelease_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("travelease_user");
  }
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("open");
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("open");
}

function setupAuthHandlers() {
  const loginModal = document.getElementById("loginModal");
  const signupModal = document.getElementById("signupModal");
  const profileModal = document.getElementById("profileModal");

  const headerAuthArea = document.getElementById("headerAuthArea");
  const sidebarLoginBtn = document.getElementById("sidebarLoginBtn");
  const sidebarSignupBtn = document.getElementById("sidebarSignupBtn");

  const loginCloseBtn = document.getElementById("loginCloseBtn");
  const signupCloseBtn = document.getElementById("signupCloseBtn");
  const profileCloseBtn = document.getElementById("profileCloseBtn");

  const switchToSignup = document.getElementById("switchToSignupBtn");
  const switchToLogin = document.getElementById("switchToLoginBtn");

  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const profileForm = document.getElementById("profileForm");

  if (sidebarLoginBtn) sidebarLoginBtn.addEventListener("click", () => openModal("loginModal"));
  if (sidebarSignupBtn) sidebarSignupBtn.addEventListener("click", () => openModal("signupModal"));

  if (headerAuthArea) {
    headerAuthArea.addEventListener("click", (e) => {
      const loginBtn = e.target.closest("#headerLoginBtn");
      const profileBtn = e.target.closest("#headerProfileBtn");
      if (loginBtn) {
        openModal("loginModal");
      } else if (profileBtn) {
        const profileNavBtn = document.querySelector(".nav-icon-btn[data-target='profile']");
        if (profileNavBtn) profileNavBtn.click();
      }
    });
  }

  if (loginCloseBtn) loginCloseBtn.addEventListener("click", () => closeModal("loginModal"));
  if (signupCloseBtn) signupCloseBtn.addEventListener("click", () => closeModal("signupModal"));
  if (profileCloseBtn) profileCloseBtn.addEventListener("click", () => closeModal("profileModal"));

  if (switchToSignup) {
    switchToSignup.addEventListener("click", () => {
      closeModal("loginModal");
      openModal("signupModal");
    });
  }
  if (switchToLogin) {
    switchToLogin.addEventListener("click", () => {
      closeModal("signupModal");
      openModal("loginModal");
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;
      const errorDiv = document.getElementById("loginError");
      errorDiv.textContent = "";

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Login failed.");
        }

        setToken(data.token);
        setCurrentUser(data.user);
        closeModal("loginModal");
        loginForm.reset();

        renderAuthUI();
        calculatePersonalizedAlerts();
        showToast(`Welcome back, ${data.user.name.split(' ')[0]}!`, "success");
      } catch (error) {
        errorDiv.textContent = error.message;
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("signupName").value.trim();
      const email = document.getElementById("signupEmail").value.trim();
      const password = document.getElementById("signupPassword").value;
      const passportExpiry = document.getElementById("signupPassportExpiry").value;
      const destination = document.getElementById("signupDestination").value;
      const travelDateFrom = document.getElementById("signupTravelDateFrom").value;
      const travelDateTo = document.getElementById("signupTravelDateTo").value;
      const tripPurpose = document.getElementById("signupTripPurpose").value;
      const budgetRange = "mid-range";
      const isFirstTimeAbroad = document.getElementById("signupFirstTime").checked;
      const errorDiv = document.getElementById("signupError");
      errorDiv.textContent = "";

      try {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name, email, password, passportExpiry, destination,
            travelDateFrom, travelDateTo, tripPurpose, budgetRange, isFirstTimeAbroad
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Signup failed.");
        }

        setToken(data.token);
        setCurrentUser(data.user);
        closeModal("signupModal");
        signupForm.reset();

        renderAuthUI();
        calculatePersonalizedAlerts();
        showToast("Account created successfully! Welcome to TravelEase.", "success");
      } catch (error) {
        errorDiv.textContent = error.message;
      }
    });
  }

  if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("profileName").value.trim();
      const passportExpiry = document.getElementById("profilePassportExpiry").value;
      const destination = document.getElementById("profileDestination").value;
      const travelDateFrom = document.getElementById("profileTravelDateFrom").value;
      const travelDateTo = document.getElementById("profileTravelDateTo").value;
      const tripPurpose = document.getElementById("profileTripPurpose").value;
      const budgetRange = "mid-range";
      const isFirstTimeAbroad = document.getElementById("profileFirstTime").checked;
      const errorDiv = document.getElementById("profileError");
      errorDiv.textContent = "";

      try {
        const token = getToken();
        const response = await fetch("/api/auth/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            name, passportExpiry, destination,
            travelDateFrom, travelDateTo, tripPurpose, budgetRange, isFirstTimeAbroad
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Profile update failed.");
        }

        setCurrentUser(data);
        closeModal("profileModal");

        renderAuthUI();
        calculatePersonalizedAlerts();
        showToast("Travel details and preferences updated successfully!", "success");
      } catch (error) {
        errorDiv.textContent = error.message;
      }
    });
  }
}

function renderAuthUI() {
  const headerAuthArea = document.getElementById("headerAuthArea");
  const profileWidget = document.getElementById("profileWidget");
  const user = getCurrentUser();

  if (headerAuthArea) {
    if (user) {
      headerAuthArea.innerHTML = `
        <button class="header-auth-btn" id="headerProfileBtn">
          <i class="fa-solid fa-user-astronaut"></i> Hi, ${escapeHTML(user.name.split(' ')[0])}
        </button>
      `;
    } else {
      headerAuthArea.innerHTML = `
        <button class="header-auth-btn" id="headerLoginBtn">
          <i class="fa-solid fa-circle-user"></i> Log In
        </button>
      `;
    }
  }

  if (profileWidget) {
    if (user) {
      let countdownHTML = "";
      if (user.travelDateFrom) {
        const daysLeft = Math.ceil((new Date(user.travelDateFrom) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysLeft > 0) {
          countdownHTML = `<div class="trip-countdown">✈️ ${daysLeft} days until departure!</div>`;
        } else if (daysLeft === 0) {
          countdownHTML = `<div class="trip-countdown">✈️ Departure is today! Bon Voyage!</div>`;
        } else {
          countdownHTML = `<div class="trip-countdown">Hope you had a safe trip!</div>`;
        }
      }

      const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
      const fromDateStr = user.travelDateFrom ? new Date(user.travelDateFrom).toLocaleDateString("en-IN", dateOptions) : "Not set";
      const expiryDateStr = user.passportExpiry ? new Date(user.passportExpiry).toLocaleDateString("en-IN", dateOptions) : "Not set";

      const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : "TR";

      profileWidget.innerHTML = `
        <div class="user-profile-dashboard">
          <div class="user-avatar-badge">${initials}</div>
          <div class="profile-info">
            <div class="profile-name">${escapeHTML(user.name)}</div>
            <div class="profile-email">${escapeHTML(user.email)}</div>
          </div>
          
          <div class="trip-summary-box">
            <div><strong>Destination:</strong> ${escapeHTML(user.destination || "Not set")}</div>
            <div><strong>Departure:</strong> ${fromDateStr}</div>
            <div><strong>Passport Expiry:</strong> ${expiryDateStr}</div>
            <div><strong>First-Time Abroad:</strong> ${user.isFirstTimeAbroad ? "Yes" : "No"}</div>
          </div>

          ${countdownHTML}

          <div class="profile-action-buttons">
            <button class="primary-button" id="editProfileBtn">Edit Details</button>
            <button class="secondary-button" id="logoutBtn">Log Out</button>
          </div>
        </div>
      `;

      document.getElementById("editProfileBtn").addEventListener("click", () => {
        document.getElementById("profileName").value = user.name || "";
        document.getElementById("profilePassportExpiry").value = user.passportExpiry ? user.passportExpiry.substring(0, 10) : "";
        document.getElementById("profileDestination").value = user.destination || "";
        document.getElementById("profileTravelDateFrom").value = user.travelDateFrom ? user.travelDateFrom.substring(0, 10) : "";
        document.getElementById("profileTravelDateTo").value = user.travelDateTo ? user.travelDateTo.substring(0, 10) : "";
        document.getElementById("profileTripPurpose").value = user.tripPurpose || "tourism";
        document.getElementById("profileFirstTime").checked = !!user.isFirstTimeAbroad;

        openModal("profileModal");
      });

      document.getElementById("logoutBtn").addEventListener("click", () => {
        setToken(null);
        setCurrentUser(null);
        renderAuthUI();
        calculatePersonalizedAlerts();
      });

    } else {
      profileWidget.innerHTML = `
        <div class="guest-profile">
          <i class="fa-solid fa-circle-user guest-avatar"></i>
          <h3>Welcome, Guest</h3>
          <p>Sign in to unlock personalized travel alerts and save your trip details.</p>
          <div class="auth-buttons">
            <button class="primary-button" id="sidebarLoginBtn">Log In</button>
            <button class="secondary-button" id="sidebarSignupBtn">Register</button>
          </div>
        </div>
      `;
      document.getElementById("sidebarLoginBtn").addEventListener("click", () => openModal("loginModal"));
      document.getElementById("sidebarSignupBtn").addEventListener("click", () => openModal("signupModal"));
    }
  }
}

function calculatePersonalizedAlerts() {
  const container = document.getElementById("alertsContainer");
  if (!container) return;

  const user = getCurrentUser();
  if (!user) {
    container.innerHTML = "";
    return;
  }

  const alerts = [];
  const today = new Date();
  const departureDate = user.travelDateFrom ? new Date(user.travelDateFrom) : null;
  const passportExpiry = user.passportExpiry ? new Date(user.passportExpiry) : null;

  if (departureDate && passportExpiry) {
    const timeDiff = passportExpiry - departureDate;
    const monthsDiff = timeDiff / (1000 * 60 * 60 * 24 * 30.4375);

    if (monthsDiff < 6) {
      alerts.push({
        type: "danger",
        icon: "fa-solid fa-triangle-exclamation",
        title: "Critical Passport Expiry Risk",
        desc: `Your passport expires on ${passportExpiry.toLocaleDateString("en-IN", { year: 'numeric', month: 'short', day: 'numeric' })}, which is less than 6 months from your travel date (${departureDate.toLocaleDateString("en-IN", { year: 'numeric', month: 'short', day: 'numeric' })}). Most countries enforce a strict 6-month validity rule. You must renew your passport before flying.`
      });
    }
  }

  if (departureDate && user.destination) {
    const destCode = user.destination.toUpperCase();
    const destination = DESTINATIONS[destCode];

    if (destination) {
      const daysToTrip = Math.ceil((departureDate - today) / (1000 * 60 * 60 * 24));

      let minDaysRequired = 5;
      let details = "";

      if (destCode === "UAE") {
        minDaysRequired = 7;
        details = "ICP e-visa processing averages 3 to 5 working days.";
      } else if (destCode === "USA" || destCode === "UK" || destCode === "CANADA") {
        minDaysRequired = 45;
        details = "Sticker visas take several weeks to schedule and process.";
      } else if (destCode === "SINGAPORE" || destCode === "JAPAN") {
        minDaysRequired = 10;
        details = "Processing averages 3 to 7 working days.";
      } else if (destCode === "THAILAND") {
        minDaysRequired = 2;
        details = "Clearance is done upon arrival, but documentation is required beforehand.";
      } else if (destCode === "AUSTRALIA") {
        minDaysRequired = 28;
        details = "Visitor e-visas can take 2 to 4 weeks.";
      }

      if (daysToTrip >= 0 && daysToTrip < minDaysRequired) {
        alerts.push({
          type: "warning",
          icon: "fa-solid fa-hourglass-half",
          title: "Visa Application Lead-Time Risk",
          desc: `Your trip to ${destination.name} starts in ${daysToTrip} days, but standard visa prep/processing typically requires at least ${minDaysRequired} days. ${details} Please submit your application immediately.`
        });
      }
    }
  }

  if (user.isFirstTimeAbroad) {
    alerts.push({
      type: "info",
      icon: "fa-solid fa-circle-info",
      title: "First-Time Flyer Essential Tip",
      desc: "Ensure you keep physical printouts of your visa confirmation, hotel vouchers, confirmed return flight tickets, and travel insurance. Indian immigration and foreign airport authorities frequently request these documents before granting entry clearance."
    });
  }

  if (user.budgetRange) {
    if (user.budgetRange === "budget") {
      alerts.push({
        type: "success",
        icon: "fa-solid fa-wallet",
        title: "Smart Budget Forex Tip",
        desc: "Save on currency markups: avoid exchanging money at airport counters. We recommend getting a zero-forex card (e.g. Niyo Global, Wise) and swiping locally. Carry only a tiny amount of local cash (₹3,000 - ₹5,000 equivalent) for backup."
      });
    } else if (user.budgetRange === "luxury") {
      alerts.push({
        type: "success",
        icon: "fa-solid fa-star",
        title: "Premium Traveler Advice",
        desc: "Make your transit smooth: pre-book private airport transfers (via cab apps or hotel shuttle) and pre-purchase airport lounge access to bypass lines and rest between flights."
      });
    } else {
      alerts.push({
        type: "success",
        icon: "fa-solid fa-money-bill-transfer",
        title: "Forex & Cab Suggestion",
        desc: "We recommend a 70/30 split: load 70% of your funds onto a multi-currency forex card for swiping, and keep 30% in local physical currency for street markets and cab applications."
      });
    }
  }

  if (alerts.length === 0) {
    container.innerHTML = `
      <div class="alerts-banner-container">
        <div class="alert-banner-card alert-success">
          <i class="fa-solid fa-circle-check"></i>
          <div class="alert-banner-content">
            <h4>Itinerary Safe & Verified!</h4>
            <p>Your passport validity is sufficient, and your travel timeline looks good. Enjoy preparing for your trip!</p>
          </div>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="alerts-banner-container">
        ${alerts.map(a => `
          <div class="alert-banner-card alert-${a.type}">
            <i class="${a.icon}"></i>
            <div class="alert-banner-content">
              <h4>${escapeHTML(a.title)}</h4>
              <p>${escapeHTML(a.desc)}</p>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }
}

function showToast(message, type = 'info') {
  const existing = document.querySelector(".app-toast");
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast app-toast toast-${type}`;

  let iconClass = 'fa-solid fa-circle-info';
  if (type === 'success') iconClass = 'fa-solid fa-circle-check';
  if (type === 'error' || type === 'danger') iconClass = 'fa-solid fa-triangle-exclamation';
  if (type === 'warning') iconClass = 'fa-solid fa-hourglass-half';

  toast.innerHTML = `
    <div class="toast-icon"><i class="${iconClass}" aria-hidden="true"></i></div>
    <div class="toast-content">
      <p class="toast-title">TravelEase</p>
      <p class="toast-message">${escapeHTML(message)}</p>
    </div>
    <button class="toast-close" type="button" aria-label="Close notification">&times;</button>
  `;

  const removeToast = () => {
    toast.classList.remove("show");
    window.setTimeout(() => toast.remove(), 420);
  };

  toast.querySelector('.toast-close').addEventListener('click', () => {
    removeToast();
  });

  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));

  setTimeout(() => {
    if (toast.parentElement) {
      removeToast();
    }
  }, 5000);
}
