const CHAT_SYSTEM_PROMPT = "You are a travel assistant for Indian passport holders. Answer questions about visas, currency, SIMs, transport and travel essentials. Be concise.";
const API_BASE_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ? ""
  : (window.TRAVELEASE_API_BASE_URL || "https://travelease-xva8.onrender.com");

function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

window.apiUrl = apiUrl;

function getCountryCode2(code) {
  const mapping = {
    UAE: 'ae',
    USA: 'us',
    UK: 'gb',
    Thailand: 'th',
    Singapore: 'sg',
    Japan: 'jp',
    Canada: 'ca',
    Australia: 'au'
  };
  return mapping[code] || 'in';
}
window.getCountryCode2 = getCountryCode2;

function getOptimizedImageUrl(url) {
  if (!url || !url.includes('unsplash.com')) return url;

  const isSlowConnection = navigator.connection &&
    (navigator.connection.effectiveType === '2g' || navigator.connection.effectiveType === 'slow-2g');

  if (isSlowConnection) {
    if (url.includes('w=')) {
      return url.replace(/w=\d+/, 'w=400');
    }
    return url + (url.includes('?') ? '&' : '?') + 'w=400';
  }

  if (window.innerWidth < 768) {
    if (url.includes('w=')) {
      return url.replace(/w=\d+/, 'w=800');
    }
    return url + (url.includes('?') ? '&' : '?') + 'w=800';
  }

  return url;
}
window.getOptimizedImageUrl = getOptimizedImageUrl;

function optimizePageImages() {
  document.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src');
    if (src && src.includes('unsplash.com')) {
      img.src = getOptimizedImageUrl(src);
    }
  });

  document.querySelectorAll('[style*="background-image"]').forEach(el => {
    const bg = el.style.backgroundImage;
    if (bg && bg.includes('unsplash.com')) {
      const urlMatch = bg.match(/url\(['"]?([^'"]+)['"]?\)/);
      if (urlMatch && urlMatch[1]) {
        el.style.backgroundImage = `url('${getOptimizedImageUrl(urlMatch[1])}')`;
      }
    }
  });
}
window.optimizePageImages = optimizePageImages;

let allCountriesList = [];

document.addEventListener("DOMContentLoaded", () => {
  // Mobile performance detection
  if (navigator.connection && (navigator.connection.effectiveType === '2g' || navigator.connection.effectiveType === 'slow-2g')) {
    document.documentElement.classList.add('low-end-connection');
  }
  optimizePageImages();

  // Hamburger Menu Controller
  const hamburgerBtn = document.getElementById("hamburgerMenuBtn");
  const topNav = document.querySelector(".top-nav");
  if (hamburgerBtn && topNav) {
    hamburgerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      topNav.classList.toggle("open");
    });

    // Clicking outside navigation to close
    document.addEventListener("click", (e) => {
      if (!topNav.contains(e.target) && e.target !== hamburgerBtn) {
        topNav.classList.remove("open");
      }
    });
  }
  // Fetch full countries list as early as possible
  fetch(apiUrl("/api/countries-list"))
    .then((res) => {
      if (res.ok) return res.json();
      throw new Error("Failed to load countries list");
    })
    .then((data) => {
      allCountriesList = data;
    })
    .catch((err) => {
      console.warn("Autocomplete list fetch failed, falling back to static popular list", err);
      // Hardcoded fallback list in the frontend as a safety net
      allCountriesList = [
        { name: "United Arab Emirates", officialName: "United Arab Emirates", cca2: "AE", flag: "🇦🇪", region: "Asia" },
        { name: "United States", officialName: "United States of America", cca2: "US", flag: "🇺🇸", region: "Americas" },
        { name: "United Kingdom", officialName: "United Kingdom of Great Britain and Northern Ireland", cca2: "GB", flag: "🇬🇧", region: "Europe" },
        { name: "Thailand", officialName: "Kingdom of Thailand", cca2: "TH", flag: "🇹🇭", region: "Asia" },
        { name: "Singapore", officialName: "Republic of Singapore", cca2: "SG", flag: "🇸🇬", region: "Asia" },
        { name: "Japan", officialName: "Japan", cca2: "JP", flag: "🇯🇵", region: "Asia" },
        { name: "Canada", officialName: "Canada", cca2: "CA", flag: "🇨🇦", region: "Americas" },
        { name: "Australia", officialName: "Commonwealth of Australia", cca2: "AU", flag: "🇦🇺", region: "Oceania" },
        { name: "Germany", officialName: "Federal Republic of Germany", cca2: "DE", flag: "🇩🇪", region: "Europe" },
        { name: "France", officialName: "French Republic", cca2: "FR", flag: "🇫🇷", region: "Europe" },
        { name: "Italy", officialName: "Italian Republic", cca2: "IT", flag: "🇮🇹", region: "Europe" },
        { name: "Spain", officialName: "Kingdom of Spain", cca2: "ES", flag: "🇪🇸", region: "Europe" },
        { name: "Switzerland", officialName: "Swiss Confederation", cca2: "CH", flag: "🇨🇭", region: "Europe" },
        { name: "South Africa", officialName: "Republic of South Africa", cca2: "ZA", flag: "🇿🇦", region: "Africa" },
        { name: "India", officialName: "Republic of India", cca2: "IN", flag: "🇮🇳", region: "Asia" }
      ];
    });

  renderHomePage();
  renderDestinationPage();
  setupChatWidget();
  setupSidebarWidgets();
  setupHomepageTipToasts();
  setupFooter();
  initTipsCarousel();

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('login') === 'true') {
    setTimeout(() => {
      openModal('loginModal');
      if (urlParams.get('reset') === 'success') {
        showToast("Password reset successfully. Please log in.", "success");
      } else {
        showToast("Please log in to view your trip details.", "warning");
      }
    }, 300);
  }
  if (urlParams.get('verify') === 'success') {
    setTimeout(() => {
      openModal('loginModal');
      showToast("Email verified successfully, you can now log in", "success");
    }, 300);
  }
  if (urlParams.get('verify') === 'expired') {
    const email = urlParams.get('email') || "";
    setTimeout(() => {
      openModal('loginModal');
      const errorDiv = document.getElementById("loginError");
      if (errorDiv) {
        errorDiv.style.color = "var(--red)";
        errorDiv.innerHTML = `
          <div style="font-weight: 700;">Verification link expired, resend below</div>
          <button type="button" class="primary-button" id="resendVerificationBtn" style="margin-top: 10px; width: 100%; padding: 8px; font-weight: 700; border-radius: 6px; cursor: pointer;">Resend Verification Email</button>
        `;

        const resendBtn = document.getElementById("resendVerificationBtn");
        resendBtn.addEventListener("click", async () => {
          resendBtn.disabled = true;
          resendBtn.textContent = "Sending...";
          try {
            const res = await fetch(apiUrl("/api/auth/resend-verification"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to resend");

            showToast("Verification email sent, please check your inbox", "success");
            errorDiv.textContent = "Verification email sent, please check your inbox";
            errorDiv.style.color = "var(--green)";
          } catch (err) {
            errorDiv.textContent = err.message;
            errorDiv.style.color = "var(--red)";
            resendBtn.disabled = false;
            resendBtn.textContent = "Resend Verification Email";
          }
        });
      }
    }, 300);
  }
  if (urlParams.get('verify') === 'invalid') {
    setTimeout(() => {
      openModal('loginModal');
      showToast("Invalid verification link.", "error");
      const errorDiv = document.getElementById("loginError");
      if (errorDiv) {
        errorDiv.style.color = "var(--red)";
        errorDiv.textContent = "Invalid verification link.";
      }
    }, 300);
  }
  if (urlParams.get('action') === 'searchFlights') {
    setTimeout(() => {
      const sidebar = document.getElementById("sidebar");
      if (sidebar) {
        sidebar.classList.add("expanded");
        document.body.classList.add("sidebar-expanded");
        const toggleIcon = document.getElementById("toggleIcon");
        if (toggleIcon) toggleIcon.className = "fa-solid fa-chevron-left";
        const flightBtn = document.querySelector('.nav-icon-btn[data-target="flight"]');
        if (flightBtn) flightBtn.click();
      }
    }, 300);
  }
  setupPasswordToggles();
});

function setupPasswordToggles() {
  document.querySelectorAll('.password-toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const container = btn.closest('.password-wrapper');
      if (!container) return;
      const input = container.querySelector('input');
      if (!input) return;
      const icon = btn.querySelector('i');
      if (!icon) return;

      if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fa-solid fa-eye-slash';
      } else {
        input.type = 'password';
        icon.className = 'fa-solid fa-eye';
      }
    });
  });
}

function renderHomePage() {
  const grid = document.getElementById("destinationGrid");
  if (!grid) return;

  grid.innerHTML = POPULAR_COUNTRIES.map((code) => {
    const destination = DESTINATIONS[code];
    return `
      <a class="destination-card" href="destination.html?country=${encodeURIComponent(code)}" aria-label="Open ${destination.name} guide">
        <div class="destination-card-image-container shimmer-loading">
          <img class="destination-card-img" src="${getOptimizedImageUrl(destination.heroImage)}" alt="${destination.name}" loading="lazy" decoding="async" onload="this.style.opacity='1'; this.parentNode.classList.remove('shimmer-loading');" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'; this.parentNode.classList.remove('shimmer-loading');">
          <div class="destination-card-placeholder" style="display: none;">
            <i class="fa-solid fa-earth-americas" aria-hidden="true"></i>
          </div>
        </div>
        <span class="flag" aria-hidden="true">
          <img src="https://flagcdn.com/h40/${getCountryCode2(code)}.png" alt="" style="width: 24px; height: auto; border-radius: 2px;" loading="lazy" decoding="async">
        </span>
        <span>
          <strong>${code}</strong>
          <p>${destination.summary}</p>
        </span>
      </a>
    `;
  }).join("");

  // Handle already-cached image onload race conditions
  grid.querySelectorAll('.destination-card-img').forEach(img => {
    if (img.complete) {
      img.style.opacity = '1';
      if (img.parentNode) {
        img.parentNode.classList.remove('shimmer-loading');
      }
    }
  });

  setupSearch();
}

function setupSearch() {
  const form = document.getElementById("searchForm");
  const input = document.getElementById("countrySearch");
  const suggestions = document.getElementById("suggestions");
  if (!form || !input || !suggestions) return;

  // Create inline error message element if not already present
  let searchError = document.getElementById("searchError");
  if (!searchError) {
    searchError = document.createElement("div");
    searchError.id = "searchError";
    searchError.className = "search-error-msg";
    searchError.style.display = "none";
    form.parentNode.insertBefore(searchError, form.nextSibling);
  }

  let highlightedIndex = -1;
  let currentMatches = [];

  const findMatches = (value) => {
    const query = value.trim().toLowerCase();
    if (query.length < 2) return [];
    return allCountriesList.filter((country) => {
      const nameMatch = (country.name || "").toLowerCase().includes(query);
      const officialMatch = (country.officialName || "").toLowerCase().includes(query);
      return nameMatch || officialMatch;
    });
  };

  const showSuggestions = () => {
    // Hide error when user modifies search
    searchError.style.display = "none";

    currentMatches = findMatches(input.value).slice(0, 8);
    highlightedIndex = -1;

    if (currentMatches.length === 0) {
      suggestions.classList.remove("show");
      suggestions.innerHTML = "";
      return;
    }

    suggestions.innerHTML = currentMatches.map((country) => {
      const regionLabel = country.region || 'World';
      const flagUrl = country.cca2 ? `https://flagcdn.com/w40/${country.cca2.toLowerCase()}.png` : '';
      return `
        <button class="suggestion-item" type="button" data-country-name="${country.name}" style="display: flex; align-items: center; width: 100%;">
          ${flagUrl ? `<img src="${flagUrl}" alt="${country.name} flag" style="width: 20px; height: 14px; object-fit: cover; margin-right: 12px; border-radius: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.15); vertical-align: middle;">` : `<span style="font-size: 1.2rem; vertical-align: middle; margin-right: 12px;">🌍</span>`}
          <strong class="suggestion-name" style="vertical-align: middle;">${country.name}</strong>
          <span class="suggestion-region" style="font-size: 0.8rem; color: #888; margin-left: auto; padding-left: 12px; font-weight: normal; vertical-align: middle;">${regionLabel}</span>
        </button>
      `;
    }).join("");
    suggestions.classList.add("show");
  };

  const updateHighlight = () => {
    const items = suggestions.querySelectorAll(".suggestion-item");
    items.forEach((item, idx) => {
      if (idx === highlightedIndex) {
        item.classList.add("highlighted");
        item.scrollIntoView({ block: "nearest" });
      } else {
        item.classList.remove("highlighted");
      }
    });
  };

  const selectSuggestion = (name) => {
    input.value = name;
    suggestions.classList.remove("show");
    suggestions.innerHTML = "";
    highlightedIndex = -1;
    performSearch(name);
  };

  const performSearch = (queryVal) => {
    const query = queryVal.trim();
    if (!query) return;

    // Check case-insensitive match against allCountriesList
    const matchedCountry = allCountriesList.find(
      (c) => c.name.toLowerCase() === query.toLowerCase() || c.officialName.toLowerCase() === query.toLowerCase()
    );

    if (!matchedCountry) {
      searchError.textContent = "Country not found — please select from suggestions";
      searchError.style.display = "block";
      return;
    }

    searchError.style.display = "none";

    // Curated countries map to standard curated codes
    const nameToCuratedCode = {
      "united arab emirates": "UAE",
      "united states": "USA",
      "united states of america": "USA",
      "united kingdom": "UK",
      "thailand": "Thailand",
      "singapore": "Singapore",
      "japan": "Japan",
      "canada": "Canada",
      "australia": "Australia",
      "uae": "UAE",
      "usa": "USA",
      "uk": "UK"
    };

    const matchedCurated = nameToCuratedCode[matchedCountry.name.toLowerCase()] ||
      nameToCuratedCode[query.toLowerCase()];

    if (matchedCurated) {
      window.location.href = `destination.html?country=${encodeURIComponent(matchedCurated)}`;
    } else {
      window.location.href = `explore.html?country=${encodeURIComponent(matchedCountry.name)}`;
    }
  };

  input.addEventListener("input", showSuggestions);
  input.addEventListener("focus", showSuggestions);

  // Keyboard navigation
  input.addEventListener("keydown", (event) => {
    if (!suggestions.classList.contains("show")) return;

    const items = suggestions.querySelectorAll(".suggestion-item");
    if (items.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      highlightedIndex = (highlightedIndex + 1) % items.length;
      updateHighlight();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      highlightedIndex = (highlightedIndex - 1 + items.length) % items.length;
      updateHighlight();
    } else if (event.key === "Enter") {
      if (highlightedIndex >= 0) {
        event.preventDefault();
        const selectedName = items[highlightedIndex].dataset.countryName;
        selectSuggestion(selectedName);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      suggestions.classList.remove("show");
      suggestions.innerHTML = "";
      highlightedIndex = -1;
    }
  });

  // Clicking outside to close
  document.addEventListener("click", (event) => {
    if (!form.contains(event.target)) {
      suggestions.classList.remove("show");
      highlightedIndex = -1;
    }
  });

  // Click handler on suggestions container
  suggestions.addEventListener("click", (event) => {
    const button = event.target.closest(".suggestion-item");
    if (!button) return;
    selectSuggestion(button.dataset.countryName);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = input.value.trim();
    if (!query) {
      form.classList.add("shake-error", "red-border");
      input.placeholder = "Please enter a destination";
      setTimeout(() => {
        form.classList.remove("shake-error", "red-border");
      }, 500);
      return;
    }
    performSearch(query);
  });

  input.addEventListener("focus", () => {
    input.placeholder = "Where are you travelling to?";
    showSuggestions();
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
  Gojek: "https://www.gojek.com",
  Ola: "https://www.olacabs.com",
  DiDi: "https://www.didiglobal.com",
  Bolt: "https://www.bolt.eu",
  MyTaxi: "https://www.free-now.com"
};

const CAB_APP_META = {
  Uber: { icon: "🚗", url: SERVICE_LINKS.Uber },
  Grab: { icon: "🟢", url: SERVICE_LINKS.Grab },
  Careem: { icon: "🚕", url: SERVICE_LINKS.Careem },
  Lyft: { icon: "🚘", url: SERVICE_LINKS.Lyft },
  Gojek: { icon: "🛵", url: SERVICE_LINKS.Gojek },
  Ola: { icon: "🚖", url: SERVICE_LINKS.Ola },
  DiDi: { icon: "🚙", url: SERVICE_LINKS.DiDi },
  Bolt: { icon: "⚡", url: SERVICE_LINKS.Bolt },
  MyTaxi: { icon: "🚕", url: SERVICE_LINKS.MyTaxi }
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
    "https://images.unsplash.com/photo-1574227492706-f65b24c3688a?w=1400"
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
    "https://images.unsplash.com/photo-1559521783-1d1599583485?w=1400"
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
    img.src = getOptimizedImageUrl(src);
    img.className = 'slide' + (i === 0 ? ' active' : '');
    img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');
    img.onerror = () => {
      img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      img.style.background = 'linear-gradient(135deg, var(--blue-soft), var(--blue))';
    };
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

  if (!countryCode) {
    loadExplorePage(requestedCountry);
    return;
  }

  const destination = DESTINATIONS[countryCode];
  const activeCode = countryCode;
  document.title = `${destination.name} Guide | TravelEase`;

  const destFlag = document.getElementById("dest-flag");
  const destName = document.getElementById("dest-name");
  const destDesc = document.getElementById("dest-description");

  if (destFlag) {
    destFlag.innerHTML = `<img src="https://flagcdn.com/h60/${getCountryCode2(activeCode)}.png" alt="" style="height: 38px; width: auto; vertical-align: middle; border-radius: 3px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">`;
  }
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
    if (tabName === "visa") {
      highlightVisaType(destination.visa.type);
    } else if (tabName === "currency") {
      updateCurrencyDisplay(destination.currency.code);
    }
    requestAnimationFrame(() => tabContent.classList.add("is-visible"));
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => renderTab(button.dataset.tab));
  });

  const urlParams = new URLSearchParams(window.location.search);
  const activeTab = urlParams.get("tab") || "visa";
  renderTab(activeTab);
  setupCommentsSection(activeCode);
  setupDestinationTipToasts(activeCode);
  prefillFlightDestination();
}

function getShortBestTime(str) {
  if (!str || typeof str !== "string") return "Varies by region";
  // Remove content inside parentheses e.g. (dry season...)
  let clean = str.replace(/\s*\([^)]*\)/g, "").trim();
  // Remove descriptive text after dash/colon
  clean = clean.replace(/\s*[-–—:]\s*(dry|wet|peak|best|hot|cold|rainy|summer|winter|season|weather|check|varies).*/i, "").trim();
  // Standard month abbreviations
  const monthsMap = {
    "January": "Jan", "February": "Feb", "March": "Mar", "April": "Apr",
    "May": "May", "June": "Jun", "July": "Jul", "August": "Aug",
    "September": "Sep", "October": "Oct", "November": "Nov", "December": "Dec"
  };
  Object.keys(monthsMap).forEach(m => {
    const reg = new RegExp("\\b" + m + "\\b", "gi");
    clean = clean.replace(reg, monthsMap[m]);
  });
  // Clean connectors
  clean = clean.replace(/\s+or\s+/gi, " & ").replace(/\s+and\s+/gi, " & ");
  clean = clean.replace(/\s*;\s*.*/, ""); // strip anything after semicolon
  if (clean.length > 32) {
    clean = clean.substring(0, 30) + "..";
  }
  return clean || "Varies by region";
}

function renderQuickSummary(destination) {
  const grid = document.getElementById("quickSummaryGrid");
  if (!grid) return;

  const rawBestTime = destination.bestTime || (destination.essentials && destination.essentials.bestTime);
  const facts = [
    { icon: "fa-passport", label: "Visa type", value: destination.visa.type },
    { icon: "fa-money-bill-wave", label: "Currency", value: destination.currency.code || destination.currency.rate },
    { icon: "fa-language", label: "Language", value: destination.language },
    { icon: "fa-sun", label: "Best time", value: getShortBestTime(rawBestTime) }
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
      <div class="visa-education">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <h3 style="margin: 0;">📘 New to visas? Here's what you need to know</h3>
          <button class="secondary-button" id="toggle-visa-edu-btn" onclick="toggleVisaEducation()" style="min-height: 32px; padding: 0 14px; font-size: 12px; height: auto;">Show Less</button>
        </div>
        <p class="subtitle">Different countries and trip purposes require different visa types. Here's a simple breakdown:</p>
        
        <div class="visa-types-grid" id="visa-types-grid">
          
          <div class="visa-type-card">
            <span class="visa-icon">🆓</span>
            <h4>Visa Free</h4>
            <p>No visa needed at all. Just show your passport and return ticket at immigration. Easiest option.</p>
          </div>
          
          <div class="visa-type-card">
            <span class="visa-icon">🛂</span>
            <h4>Visa on Arrival</h4>
            <p>You get your visa stamped at the airport when you land. Pay the fee there, no pre-application needed.</p>
          </div>
          
          <div class="visa-type-card">
            <span class="visa-icon">💻</span>
            <h4>e-Visa</h4>
            <p>Apply online before you travel. You get an approval email/PDF — no need to visit an embassy. Usually takes a few days.</p>
          </div>
          
          <div class="visa-type-card">
            <span class="visa-icon">📋</span>
            <h4>Sticker Visa</h4>
            <p>A physical visa sticker pasted in your passport. Requires visiting the embassy or VFS center in person, submitting documents and biometrics. Takes weeks.</p>
          </div>
          
          <div class="visa-type-card">
            <span class="visa-icon">🎓</span>
            <h4>Student Visa</h4>
            <p>For studying abroad. Needs admission letter from university, proof of funds, and is usually valid for the full course duration.</p>
          </div>
          
          <div class="visa-type-card">
            <span class="visa-icon">💼</span>
            <h4>Work Visa</h4>
            <p>For employment abroad. Requires a job offer letter and sponsorship from the employer in that country.</p>
          </div>
          
          <div class="visa-type-card">
            <span class="visa-icon">✈️</span>
            <h4>Tourist Visa</h4>
            <p>For vacation or visiting purposes only. Cannot work or study on this visa. Most common type for first-time travellers.</p>
          </div>
          
          <div class="visa-type-card">
            <span class="visa-icon">🔁</span>
            <h4>Transit Visa</h4>
            <p>Needed only if your flight has a layover in a country and you plan to leave the airport during that layover.</p>
          </div>
          
        </div>
        
        <div class="visa-tip-box">
          <strong>💡 Which one applies to you?</strong>
          <p>For this destination, you'll need a <span id="highlighted-visa-type"></span> — see the full details below.</p>
        </div>
      </div>

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
      <div class="currency-card">
        <h3>Live Exchange Rate</h3>
        <p class="rate-display">
          1 ${destination.currency.code} = <span id="live-rate">Loading...</span>
        </p>
        <p class="rate-updated">Last updated: <span id="rate-timestamp"></span></p>
      </div>
      <article class="exchange-card" style="background: linear-gradient(135deg, #10b981, #1e3a8a); padding: 15px 20px; box-shadow: none;">
        <span style="font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; color: rgba(255, 255, 255, 0.9);">Money Tip</span>
        <p style="margin-top: 6px; font-size: 13px; line-height: 1.5; color: rgba(255, 255, 255, 0.95);">${destination.currency.tip}</p>
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
    return `<a class="app-pill" data-app="${app}" href="#" target="_blank" rel="noopener"><span aria-hidden="true">${meta.icon}</span>${app}</a>`;
  }).join("");
}

// Global click delegator for cab app pills
document.addEventListener("click", (e) => {
  const pill = e.target.closest(".app-pill");
  if (pill) {
    e.preventDefault();
    const appName = pill.getAttribute("data-app");
    if (appName) {
      const meta = CAB_APP_META[appName] || { url: "https://www.uber.com" };
      window.open(meta.url, "_blank");
    }
  }
});

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
  const response = await fetch(apiUrl("/api/chat"), {
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
      searchTips();
    });
  });

  // Set up Search Input listener with debounce
  const searchInput = document.getElementById("tips-search-input");
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(searchTips, 400);
    });
  }

  // Set up Comment Form Submission listener
  commentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const userName = document.getElementById("commentName").value.trim();
    const tripPeriod = document.getElementById("commentPeriod").value.trim();
    const category = document.getElementById("commentCategory").value;
    const text = document.getElementById("commentText").value.trim();

    try {
      const response = await fetch(apiUrl("/api/comments"), {
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
      const response = await fetch(apiUrl(`/api/comments/${commentId}/like`), {
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
    const response = await fetch(apiUrl(`/api/comments/${countryCode}`));
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

function renderCommentsList(commentsArray) {
  const commentsList = document.getElementById("commentsList");
  if (!commentsList) return;

  if (commentsArray.length === 0) {
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

  commentsList.innerHTML = commentsArray.map(comment => {
    const dateStr = new Date(comment.createdAt).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });

    const countryKey = Object.keys(DESTINATIONS).find(k => k.toLowerCase() === comment.countryCode.toLowerCase());
    const dest = DESTINATIONS[countryKey];
    let destHTML = "";
    if (dest) {
      destHTML = `<img src="https://flagcdn.com/h20/${getCountryCode2(countryKey)}.png" alt="" style="height: 14px; width: auto; vertical-align: middle; margin-right: 4px; border-radius: 1px;"> ${escapeHTML(dest.name)}`;
    } else {
      destHTML = escapeHTML(comment.countryCode);
    }

    const isLiked = likedComments.includes(comment._id);
    const likeClass = isLiked ? "like-btn liked" : "like-btn";
    const thumbsIcon = isLiked ? "fa-solid fa-thumbs-up" : "fa-regular fa-thumbs-up";

    return `
      <article class="comment-card">
        <header class="comment-card-header">
          <div class="comment-author-info">
            <strong>${escapeHTML(comment.userName)}</strong>
            <span>Visited ${escapeHTML(comment.tripPeriod)} &bull; ${destHTML}</span>
            <span style="display: block; margin-top: 2px;">Posted on ${dateStr}</span>
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

function getGeneralTips(allComments) {
  // Pick top 4 comments with highest likes (Helpful count)
  return [...allComments]
    .sort((a, b) => (b.likes || 0) - (a.likes || 0))
    .slice(0, 4);
}

function renderDefaultView() {
  const generalTips = getGeneralTips(currentComments);
  renderCommentsList(generalTips);
  const labelElement = document.getElementById('tips-section-label');
  if (labelElement) {
    labelElement.textContent = 'Most Helpful Tips';
  }
}

function getCategoryName(category) {
  const categoryNames = {
    general: "General",
    visa: "Visa",
    currency: "Money",
    sim: "SIMs",
    transport: "Transport"
  };
  return categoryNames[category] || "General";
}

window.searchTips = function () {
  const searchInput = document.getElementById('tips-search-input');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const activeChip = document.querySelector(".filter-chip.active");
  const activeCategory = activeChip ? activeChip.dataset.filter : "all";

  // Filter first by category, if category is not "all"
  const categoryComments = activeCategory === "all"
    ? currentComments
    : currentComments.filter(c => c.category === activeCategory);

  if (!query) {
    if (activeCategory === "all") {
      renderDefaultView();
    } else {
      renderCommentsList(categoryComments);
      const labelElement = document.getElementById('tips-section-label');
      if (labelElement) {
        labelElement.textContent = `${getCategoryName(activeCategory)} Tips`;
      }
    }
    return;
  }

  const labelElement = document.getElementById('tips-section-label');
  if (labelElement) {
    labelElement.textContent = `Showing results for "${query}"`;
  }

  // simple keyword matching — score each comment by relevance
  const queryWords = query.split(' ').filter(w => w.length > 2);
  if (queryWords.length === 0 && query.length > 0) {
    queryWords.push(query);
  }

  const scoredComments = categoryComments.map(comment => {
    const contentText = ((comment.text || '') + ' ' + (comment.category || '')).toLowerCase();
    let score = 0;
    queryWords.forEach(word => {
      if (contentText.includes(word)) score++;
    });
    return { ...comment, relevanceScore: score };
  });

  const relevantComments = scoredComments
    .filter(c => c.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  if (relevantComments.length === 0) {
    showNoResultsMessage(query);
  } else {
    renderCommentsList(relevantComments);
  }
}

window.showNoResultsMessage = function (query) {
  const commentsList = document.getElementById('commentsList');
  if (!commentsList) return;
  commentsList.innerHTML = `
    <div class="no-results">
      <p>No traveler tips found for "${escapeHTML(query)}" yet.</p>
      <p class="no-results-sub">Be the first to share your experience on this topic, or browse general tips below.</p>
      <button onclick="clearSearch()">Show All Tips</button>
    </div>
  `;
}

window.clearSearch = function () {
  const searchInput = document.getElementById('tips-search-input');
  if (searchInput) searchInput.value = '';

  const allChip = Array.from(document.querySelectorAll(".filter-chip")).find(c => c.dataset.filter === 'all');
  if (allChip) {
    document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
    allChip.classList.add("active");
  }

  renderDefaultView();
}

window.renderComments = function (filter) {
  const filterChips = document.querySelectorAll(".filter-chip");
  if (filterChips.length > 0) {
    filterChips.forEach(c => {
      if (c.dataset.filter === filter) {
        c.classList.add("active");
      } else {
        c.classList.remove("active");
      }
    });
  }

  if (filter === 'all') {
    const searchInput = document.getElementById('tips-search-input');
    if (searchInput) searchInput.value = '';
  }

  searchTips();
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
  sidebarBudgetController();
  setupSidebarLayout();
  setupAuthHandlers();
  renderAuthUI();
  calculatePersonalizedAlerts();
  setupPlacesWidget();
}

/* --- Collapsible Sidebar Layout Setup --- */
function sidebarChecklistController() {
  // Initial check on load
  window.loadChecklist();
}

window.generateChecklist = function (country, purpose) {
  const normalizedPurpose = purpose ? purpose.toLowerCase() : 'tourist';
  const baseItems = checklistTemplates[normalizedPurpose] || checklistTemplates.tourist;
  const extraItems = extraChecklistItems[country] || [];
  const allItems = [...baseItems, ...extraItems];

  return allItems.map((item, index) => ({
    id: `${country}-${index}`,
    text: item,
    completed: false
  }));
};

window.loadChecklist = function () {
  const tripDetails = JSON.parse(localStorage.getItem('tripDetails'));
  const user = getCurrentUser();

  let destination = null;
  let purpose = null;

  if (tripDetails && tripDetails.destination) {
    destination = tripDetails.destination;
    purpose = tripDetails.purpose;
  } else if (user && user.destination) {
    destination = user.destination;
    purpose = user.tripPurpose;
  }

  if (!destination) {
    window.showEmptyChecklistState();
    return;
  }

  let checklist = window.generateChecklist(destination, purpose);

  if (user && user.email) {
    window.fetchChecklistFromServer(user.email).then(savedChecklist => {
      if (savedChecklist && savedChecklist.length > 0) {
        const matchesCurrent = savedChecklist.every(item => item.id && item.id.startsWith(destination));
        if (matchesCurrent) {
          checklist = savedChecklist;
        } else {
          window.saveChecklistToServer(user.email, checklist);
        }
      } else {
        window.saveChecklistToServer(user.email, checklist);
      }
      localStorage.setItem('currentChecklist', JSON.stringify(checklist));
      window.renderChecklist(checklist);
    });
  } else {
    const savedLocal = JSON.parse(localStorage.getItem('currentChecklist'));
    if (savedLocal && savedLocal.length > 0 && savedLocal.every(item => item.id && item.id.startsWith(destination))) {
      checklist = savedLocal;
    } else {
      localStorage.setItem('currentChecklist', JSON.stringify(checklist));
    }
    window.renderChecklist(checklist);
  }
};

window.renderChecklist = function (checklist) {
  const container = document.getElementById('checklist-items');
  if (!container) return;

  const completedCount = checklist.filter(item => item.completed).length;

  const completedSpan = document.getElementById('checklistCompleted');
  const totalSpan = document.getElementById('checklistTotal');
  if (completedSpan && totalSpan) {
    completedSpan.textContent = completedCount;
    totalSpan.textContent = checklist.length;
  }

  const progress = document.getElementById('checklistProgress');
  if (progress) {
    const percentage = checklist.length ? (completedCount / checklist.length) * 100 : 0;
    progress.style.width = `${percentage}%`;
  }

  container.innerHTML = checklist.map(item => `
    <li>
      <label class="checkbox-container">
        <input type="checkbox" 
               id="${item.id}" 
               ${item.completed ? 'checked' : ''} 
               onchange="toggleChecklistItem('${item.id}')">
        <span class="checkmark"></span>
        ${escapeHTML(item.text)}
      </label>
    </li>
  `).join('');
};

window.toggleChecklistItem = function (itemId) {
  let checklist = JSON.parse(localStorage.getItem('currentChecklist')) || [];
  const item = checklist.find(i => i.id === itemId);
  if (item) {
    item.completed = !item.completed;
  }

  localStorage.setItem('currentChecklist', JSON.stringify(checklist));
  window.renderChecklist(checklist);

  const user = getCurrentUser();
  if (user && user.email) {
    window.saveChecklistToServer(user.email, checklist);
  }
};

window.showEmptyChecklistState = function () {
  const container = document.getElementById('checklist-items');
  if (!container) return;

  container.innerHTML = `
    <p class="empty-state" style="font-size: 0.86rem; color: var(--muted); text-align: center; padding: 20px 0;">
      Plan a trip first to see your personalized checklist
    </p>
  `;

  const completedSpan = document.getElementById('checklistCompleted');
  const totalSpan = document.getElementById('checklistTotal');
  if (completedSpan && totalSpan) {
    completedSpan.textContent = '0';
    totalSpan.textContent = '0';
  }
  const progress = document.getElementById('checklistProgress');
  if (progress) {
    progress.style.width = '0%';
  }
};

window.fetchChecklistFromServer = async function (email) {
  try {
    const res = await fetch(apiUrl(`/api/checklist/${encodeURIComponent(email)}`));
    const data = await res.json();
    return data.checklist;
  } catch (error) {
    console.error('Failed to fetch checklist:', error);
    return null;
  }
};

window.saveChecklistToServer = async function (email, checklist) {
  try {
    await fetch(apiUrl(`/api/checklist/${encodeURIComponent(email)}`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checklist })
    });
  } catch (error) {
    console.error('Failed to save checklist:', error);
  }
};

// Live Currency Exchange Rate integration
let exchangeRatesCache = null;

const fallbackCurrencies = {
  "AED": "United Arab Emirates Dirham (AED)",
  "AUD": "Australian Dollar (AUD)",
  "AZN": "Azerbaijani Manat (AZN)",
  "CAD": "Canadian Dollar (CAD)",
  "CHF": "Swiss Franc (CHF)",
  "CNY": "Chinese Yuan (CNY)",
  "EUR": "Euro (EUR)",
  "GBP": "British Pound (GBP)",
  "HKD": "Hong Kong Dollar (HKD)",
  "INR": "Indian Rupee (INR)",
  "JPY": "Japanese Yen (JPY)",
  "KRW": "South Korean Won (KRW)",
  "MYR": "Malaysian Ringgit (MYR)",
  "NZD": "New Zealand Dollar (NZD)",
  "SGD": "Singapore Dollar (SGD)",
  "THB": "Thai Baht (THB)",
  "USD": "US Dollar (USD)",
  "ZAR": "South African Rand (ZAR)"
};

const currencyNames = {
  "AED": "UAE Dirham",
  "AFN": "Afghan Afghani",
  "ALL": "Albanian Lek",
  "AMD": "Armenian Dram",
  "ANG": "Netherlands Antillean Guilder",
  "AOA": "Angolan Kwanza",
  "ARS": "Argentine Peso",
  "AUD": "Australian Dollar",
  "AWG": "Aruban Florin",
  "AZN": "Azerbaijani Manat",
  "BAM": "Bosnia-Herzegovina Mark",
  "BBD": "Barbadian Dollar",
  "BDT": "Bangladeshi Taka",
  "BGN": "Bulgarian Lev",
  "BHD": "Bahraini Dinar",
  "BIF": "Burundian Franc",
  "BMD": "Bermudian Dollar",
  "BND": "Brunei Dollar",
  "BOB": "Bolivian Boliviano",
  "BRL": "Brazilian Real",
  "BSD": "Bahamian Dollar",
  "BTN": "Bhutanese Ngultrum",
  "BWP": "Botswanan Pula",
  "BYN": "Belarusian Ruble",
  "BZD": "Belize Dollar",
  "CAD": "Canadian Dollar",
  "CDF": "Congolese Franc",
  "CHF": "Swiss Franc",
  "CLP": "Chilean Peso",
  "CNY": "Chinese Yuan",
  "COP": "Colombian Peso",
  "CRC": "Costa Rican Colón",
  "CUP": "Cuban Peso",
  "CVE": "Cape Verdean Escudo",
  "CZK": "Czech Koruna",
  "DJF": "Djiboutian Franc",
  "DKK": "Danish Krone",
  "DOP": "Dominican Peso",
  "DZD": "Algerian Dinar",
  "EGP": "Egyptian Pound",
  "ERN": "Eritrean Nakfa",
  "ETB": "Ethiopian Birr",
  "EUR": "Euro",
  "FJD": "Fijian Dollar",
  "FKP": "Falkland Islands Pound",
  "FOK": "Faroese Króna",
  "GBP": "British Pound",
  "GEL": "Georgian Lari",
  "GGP": "Guernsey Pound",
  "GHS": "Ghanaian Cedi",
  "GIP": "Gibraltar Pound",
  "GMD": "Gambian Dalasi",
  "GNF": "Guinean Franc",
  "GTQ": "Guatemalan Quetzal",
  "GYD": "Guyanese Dollar",
  "HKD": "Hong Kong Dollar",
  "HNL": "Honduran Lempira",
  "HRK": "Croatian Kuna",
  "HTG": "Haitian Gourde",
  "HUF": "Hungarian Forint",
  "IDR": "Indonesian Rupiah",
  "ILS": "Israeli New Shekel",
  "IMP": "Manx Pound",
  "INR": "Indian Rupee",
  "IQD": "Iraqi Dinar",
  "IRR": "Iranian Rial",
  "ISK": "Icelandic Króna",
  "JEP": "Jersey Pound",
  "JMD": "Jamaican Dollar",
  "JOD": "Jordanian Dinar",
  "JPY": "Japanese Yen",
  "KES": "Kenyan Shilling",
  "KGS": "Kyrgystani Som",
  "KHR": "Cambodian Riel",
  "KID": "Kiribati Dollar",
  "KMF": "Comorian Franc",
  "KPW": "North Korean Won",
  "KRW": "South Korean Won",
  "KWD": "Kuwaiti Dinar",
  "KYD": "Cayman Islands Dollar",
  "KZT": "Kazakhstani Tenge",
  "LAK": "Laotian Kip",
  "LBP": "Lebanese Pound",
  "LKR": "Sri Lankan Rupee",
  "LRD": "Liberian Dollar",
  "LSL": "Lesotho Loti",
  "LYD": "Libyan Dinar",
  "MAD": "Moroccan Dirham",
  "MDL": "Moldovan Leu",
  "MGA": "Malagasy Ariary",
  "MKD": "Macedonian Denar",
  "MMK": "Myanmar Kyat",
  "MNT": "Mongolian Tughrik",
  "MOP": "Macanese Pataca",
  "MRU": "Mauritanian Ouguiya",
  "MUR": "Mauritian Rupee",
  "MVR": "Maldivian Rufiyaa",
  "MWK": "Malawian Kwacha",
  "MXN": "Mexican Peso",
  "MYR": "Malaysian Ringgit",
  "MZN": "Mozambican Metical",
  "NAD": "Namibian Dollar",
  "NGN": "Nigerian Naira",
  "NIO": "Nicaraguan Córdoba",
  "NOK": "Norwegian Krone",
  "NPR": "Nepalese Rupee",
  "NZD": "New Zealand Dollar",
  "OMR": "Omani Rial",
  "PAB": "Panamanian Balboa",
  "PEN": "Peruvian Sol",
  "PGK": "Papua New Guinean Kina",
  "PHP": "Philippine Peso",
  "PKR": "Pakistani Rupee",
  "PLN": "Polish Złoty",
  "PYG": "Paraguayan Guaraní",
  "QAR": "Qatari Riyal",
  "RON": "Romanian Leu",
  "RSD": "Serbian Dinar",
  "RUB": "Russian Ruble",
  "RWF": "Rwandan Franc",
  "SAR": "Saudi Riyal",
  "SBD": "Solomon Islands Dollar",
  "SCR": "Seychellois Rupee",
  "SDG": "Sudanese Pound",
  "SEK": "Swedish Krona",
  "SGD": "Singapore Dollar",
  "SHP": "St. Helena Pound",
  "SLE": "Sierra Leonean Leone",
  "SLL": "Sierra Leonean Leone",
  "SOS": "Somali Shilling",
  "SRD": "Surinamese Dollar",
  "SSP": "South Sudanese Pound",
  "STN": "São Tomé and Príncipe Dobra",
  "SYP": "Syrian Pound",
  "SZL": "Swazi Lilangeni",
  "THB": "Thai Baht",
  "TJS": "Tajikistani Somoni",
  "TMT": "Turkmenistani Manat",
  "TND": "Tunisian Dinar",
  "TOP": "Tongan Paʻanga",
  "TRY": "Turkish Lira",
  "TTD": "Trinidad and Tobago Dollar",
  "TVD": "Tuvaluan Dollar",
  "TWD": "New Taiwan Dollar",
  "TZS": "Tanzanian Shilling",
  "UAH": "Ukrainian Hryvnia",
  "UGX": "Ugandan Shilling",
  "USD": "US Dollar",
  "UYU": "Uruguayan Peso",
  "UZS": "Uzbekistani Som",
  "VES": "Venezuelan Bolívar Soberano",
  "VND": "Vietnamese Đồng",
  "VUV": "Vanuatu Vatu",
  "WST": "Samoan Tālā",
  "XAF": "Central African CFA Franc",
  "XCD": "East Caribbean Dollar",
  "XDR": "Special Drawing Rights",
  "XOF": "West African CFA Franc",
  "XPF": "CFP Franc",
  "YER": "Yemeni Rial",
  "ZAR": "South African Rand",
  "ZMW": "Zambian Kwacha",
  "ZWL": "Zimbabwean Dollar"
};

async function fetchAllExchangeRates() {
  if (exchangeRatesCache) return exchangeRatesCache;
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/INR');
    if (response.ok) {
      const data = await response.json();
      if (data && data.result === 'success' && data.rates) {
        exchangeRatesCache = data.rates;
        return exchangeRatesCache;
      }
    }
  } catch (error) {
    console.warn('Primary exchange rate fetch failed, trying fallback:', error);
  }
  return null;
}

async function getLiveExchangeRate(targetCurrency) {
  if (!targetCurrency) return null;
  const uppercaseCurrency = targetCurrency.toUpperCase();

  // Check cache first
  if (exchangeRatesCache && exchangeRatesCache[uppercaseCurrency]) {
    return exchangeRatesCache[uppercaseCurrency];
  }

  // Fetch and cache all rates
  const rates = await fetchAllExchangeRates();
  if (rates && rates[uppercaseCurrency]) {
    return rates[uppercaseCurrency];
  }

  // Fallback API: Frankfurter API (only supports 31 major currencies, lacks AED, AZN)
  try {
    const response = await fetch(`https://api.frankfurter.dev/v1/latest?from=INR&to=${uppercaseCurrency}`);
    if (response.ok) {
      const data = await response.json();
      if (data && data.rates && data.rates[uppercaseCurrency]) {
        return data.rates[uppercaseCurrency];
      }
    }
  } catch (error) {
    console.error('Secondary Frankfurter API failed:', error);
  }

  // Final Fail-safe: Hardcoded exchange rates for common travel destinations
  const localFallbacks = {
    'USD': 0.012,
    'EUR': 0.011,
    'GBP': 0.0094,
    'SGD': 0.016,
    'THB': 0.42,
    'JPY': 1.88,
    'AED': 0.044,
    'AZN': 0.020
  };
  return localFallbacks[uppercaseCurrency] || null;
}

async function setupCustomCurrencySelect() {
  const selectElement = document.getElementById("converter-currency");
  if (!selectElement) return;

  // 1. Create a container wrapper
  const wrapper = document.createElement("div");
  wrapper.className = "custom-select-wrapper";

  // 2. Create the visible search input
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.id = "converter-currency-search";
  searchInput.className = "custom-select-search";
  searchInput.placeholder = "Type to search currency...";
  searchInput.autocomplete = "off";

  // 3. Create the hidden input to store the value
  const hiddenInput = document.createElement("input");
  hiddenInput.type = "hidden";
  hiddenInput.id = "converter-currency";
  hiddenInput.value = selectElement.value || "USD";

  // 4. Create the custom dropdown items list container
  const listContainer = document.createElement("div");
  listContainer.className = "custom-select-list";
  listContainer.id = "currencySuggestions";
  listContainer.style.display = "none";

  // Build the DOM
  wrapper.appendChild(searchInput);
  wrapper.appendChild(hiddenInput);
  wrapper.appendChild(listContainer);

  // Replace selectElement with our searchable wrapper
  selectElement.parentNode.replaceChild(wrapper, selectElement);

  // Pre-load all rates and fill allCurrencyList
  const rates = await fetchAllExchangeRates();
  let codes = [];
  if (rates) {
    codes = Object.keys(rates);
  } else {
    codes = Object.keys(fallbackCurrencies);
  }
  codes = codes.filter(code => code !== "INR");
  codes.sort();

  const allCurrencyList = codes.map(code => {
    const name = currencyNames[code] || code;
    return {
      code,
      name,
      displayName: `${name} (${code})`
    };
  });

  // Set initial visible search input value
  const initialCode = hiddenInput.value;
  const initialCurrency = allCurrencyList.find(c => c.code === initialCode);
  if (initialCurrency) {
    searchInput.value = initialCurrency.displayName;
  } else {
    searchInput.value = `US Dollar (USD)`;
  }

  // Render options helper
  const renderOptions = (filterQuery = "") => {
    const query = filterQuery.toLowerCase().trim();
    const filtered = allCurrencyList.filter(c =>
      c.code.toLowerCase().includes(query) ||
      c.name.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
      listContainer.innerHTML = `<div class="custom-select-no-results">No currencies found</div>`;
      return;
    }

    listContainer.innerHTML = filtered.map(c => `
      <button class="custom-select-item" type="button" data-value="${c.code}">
        ${c.displayName}
      </button>
    `).join("");
  };

  // Event: Input focus -> show suggestions
  searchInput.addEventListener("focus", () => {
    // Select all text on focus for easier typing
    searchInput.select();
    renderOptions(searchInput.value === (initialCurrency ? initialCurrency.displayName : "") ? "" : searchInput.value);
    listContainer.style.display = "block";
  });

  // Event: Input keyup -> filter suggestions
  searchInput.addEventListener("input", () => {
    renderOptions(searchInput.value);
    listContainer.style.display = "block";
  });

  // Event: Click suggestion item
  listContainer.addEventListener("mousedown", (e) => {
    const button = e.target.closest(".custom-select-item");
    if (!button) return;

    const value = button.getAttribute("data-value");
    const currency = allCurrencyList.find(c => c.code === value);
    if (currency) {
      hiddenInput.value = value;
      searchInput.value = currency.displayName;
      listContainer.style.display = "none";

      // Trigger change event on hidden input to fire convertCurrency
      hiddenInput.dispatchEvent(new Event("change"));
    }
  });

  // Event: Blur input -> reset if empty
  searchInput.addEventListener("blur", () => {
    // Timeout to let mousedown on list item resolve first
    setTimeout(() => {
      listContainer.style.display = "none";
      const currentCode = hiddenInput.value;
      const currentCurrency = allCurrencyList.find(c => c.code === currentCode);
      if (currentCurrency) {
        searchInput.value = currentCurrency.displayName;
      }
    }, 150);
  });
}

async function updateCurrencyDisplay(currencyCode) {
  const rateElement = document.getElementById('live-rate');
  const timestampElement = document.getElementById('rate-timestamp');
  if (!rateElement || !timestampElement) return;

  const rate = await getLiveExchangeRate(currencyCode);

  if (rate && rate > 0) {
    const inrValue = (1 / rate).toFixed(2);
    rateElement.textContent = `₹${parseFloat(inrValue).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    timestampElement.textContent = new Date().toLocaleString();
  } else {
    rateElement.textContent = 'Rate unavailable';
    timestampElement.textContent = '';
  }
}

async function convertCurrency() {
  const amountElement = document.getElementById('converter-amount');
  const currencyElement = document.getElementById('converter-currency');
  const resultElement = document.getElementById('converter-result');
  const calculationElement = document.getElementById('conversionCalculation');

  if (!amountElement || !currencyElement || !resultElement) return;

  const amount = amountElement.value;
  const targetCurrency = currencyElement.value;

  if (calculationElement) {
    const parsedAmount = parseFloat(amount);
    if (!isNaN(parsedAmount) && parsedAmount > 0) {
      calculationElement.textContent = `₹${parsedAmount.toLocaleString("en-IN")} =`;
    } else {
      calculationElement.textContent = "Enter a valid amount";
      resultElement.textContent = "--";
      return;
    }
  }

  const rate = await getLiveExchangeRate(targetCurrency);

  if (rate) {
    const result = (amount * rate).toFixed(2);

    const symbols = {
      AED: "AED",
      USD: "$",
      THB: "฿",
      JPY: "¥",
      SGD: "S$",
      EUR: "€",
      GBP: "£",
      AUD: "A$",
      CAD: "C$",
      CHF: "CHF",
      CNY: "¥",
      HKD: "HK$",
      NZD: "NZ$"
    };
    const symbol = symbols[targetCurrency] || targetCurrency;

    resultElement.textContent = `${symbol} ${parseFloat(result).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else {
    resultElement.textContent = 'Unable to fetch rate';
  }
}

async function sidebarConverterController() {
  const converterWidget = document.getElementById("converterWidget");
  if (!converterWidget) return;

  const amountInput = document.getElementById("converter-amount");

  // Set up searchable currency selector
  await setupCustomCurrencySelect();

  const targetSelect = document.getElementById("converter-currency"); // This finds the hidden input

  if (!amountInput || !targetSelect) return;

  amountInput.addEventListener("input", convertCurrency);
  targetSelect.addEventListener("change", convertCurrency);

  convertCurrency();
}

/* ==========================================================================
   Trip Budget & Expense Planner Controller
   ========================================================================== */

const BUDGET_PRESETS = {
  'Thailand': {
    currency: 'THB',
    symbol: '฿',
    budget: { stay: 1200, food: 700, transport: 350, activities: 500, shopping: 400, emergency: 2500 },
    'mid-range': { stay: 3500, food: 1500, transport: 700, activities: 1200, shopping: 1000, emergency: 4000 },
    luxury: { stay: 10000, food: 3500, transport: 2000, activities: 3500, shopping: 3000, emergency: 8000 }
  },
  'UAE': {
    currency: 'AED',
    symbol: 'AED',
    budget: { stay: 3000, food: 1500, transport: 800, activities: 1200, shopping: 1000, emergency: 5000 },
    'mid-range': { stay: 7000, food: 3000, transport: 1500, activities: 3000, shopping: 2500, emergency: 8000 },
    luxury: { stay: 20000, food: 7500, transport: 4000, activities: 8000, shopping: 7000, emergency: 15000 }
  },
  'Singapore': {
    currency: 'SGD',
    symbol: 'S$',
    budget: { stay: 3500, food: 1600, transport: 600, activities: 1500, shopping: 1200, emergency: 5000 },
    'mid-range': { stay: 8000, food: 3200, transport: 1400, activities: 3500, shopping: 3000, emergency: 8000 },
    luxury: { stay: 22000, food: 8000, transport: 3500, activities: 9000, shopping: 8000, emergency: 15000 }
  },
  'USA': {
    currency: 'USD',
    symbol: '$',
    budget: { stay: 5000, food: 2200, transport: 1200, activities: 1800, shopping: 1500, emergency: 6000 },
    'mid-range': { stay: 12000, food: 4500, transport: 2500, activities: 4000, shopping: 3500, emergency: 10000 },
    luxury: { stay: 30000, food: 10000, transport: 6000, activities: 10000, shopping: 10000, emergency: 20000 }
  },
  'UK': {
    currency: 'GBP',
    symbol: '£',
    budget: { stay: 4500, food: 2000, transport: 1100, activities: 1600, shopping: 1400, emergency: 6000 },
    'mid-range': { stay: 11000, food: 4200, transport: 2200, activities: 3800, shopping: 3200, emergency: 10000 },
    luxury: { stay: 28000, food: 9500, transport: 5500, activities: 9500, shopping: 9000, emergency: 20000 }
  },
  'Japan': {
    currency: 'JPY',
    symbol: '¥',
    budget: { stay: 3200, food: 1600, transport: 900, activities: 1400, shopping: 1200, emergency: 5000 },
    'mid-range': { stay: 7500, food: 3500, transport: 1800, activities: 3200, shopping: 2800, emergency: 8000 },
    luxury: { stay: 20000, food: 8500, transport: 4500, activities: 8500, shopping: 8000, emergency: 16000 }
  },
  'Europe': {
    currency: 'EUR',
    symbol: '€',
    budget: { stay: 4000, food: 1800, transport: 1000, activities: 1500, shopping: 1200, emergency: 5500 },
    'mid-range': { stay: 10000, food: 3800, transport: 2000, activities: 3500, shopping: 3000, emergency: 9000 },
    luxury: { stay: 25000, food: 8500, transport: 5000, activities: 8500, shopping: 8000, emergency: 18000 }
  },
  'Australia': {
    currency: 'AUD',
    symbol: 'A$',
    budget: { stay: 4000, food: 1900, transport: 1000, activities: 1600, shopping: 1300, emergency: 5500 },
    'mid-range': { stay: 9500, food: 4000, transport: 2200, activities: 3600, shopping: 3200, emergency: 9500 },
    luxury: { stay: 24000, food: 9000, transport: 5000, activities: 9000, shopping: 8500, emergency: 18000 }
  },
  'Canada': {
    currency: 'CAD',
    symbol: 'C$',
    budget: { stay: 4200, food: 1850, transport: 1050, activities: 1550, shopping: 1250, emergency: 5500 },
    'mid-range': { stay: 9800, food: 3900, transport: 2100, activities: 3500, shopping: 3100, emergency: 9500 },
    luxury: { stay: 24500, food: 8800, transport: 4800, activities: 8800, shopping: 8200, emergency: 18000 }
  }
};

async function sidebarBudgetController() {
  const budgetWidget = document.getElementById('budgetWidget');
  if (!budgetWidget) return;

  const destSelect = document.getElementById('budget-destination');
  const purposeSelect = document.getElementById('budget-purpose');
  const daysInput = document.getElementById('budget-days');
  const travelersInput = document.getElementById('budget-travelers');
  const styleSelect = document.getElementById('budget-style');

  const catStay = document.getElementById('catStayINR');
  const catFood = document.getElementById('catFoodINR');
  const catTransport = document.getElementById('catTransportINR');
  const catActivities = document.getElementById('catActivitiesINR');
  const catShopping = document.getElementById('catShoppingINR');
  const catEmergency = document.getElementById('catEmergencyINR');

  const saveBtn = document.getElementById('saveBudgetBtn');

  if (!destSelect || !purposeSelect || !daysInput || !travelersInput || !styleSelect) return;

  // Auto-fill from user profile if available
  const user = getCurrentUser();
  if (user) {
    if (user.destination && [...destSelect.options].some(o => o.value === user.destination)) {
      destSelect.value = user.destination;
    }
    if (user.tripPurpose) {
      purposeSelect.value = user.tripPurpose;
    }
    if (user.travelersCount) {
      travelersInput.value = user.travelersCount;
    }
    if (user.budgetRange && [...styleSelect.options].some(o => o.value === user.budgetRange)) {
      styleSelect.value = user.budgetRange;
    }
  }

  function populatePresets() {
    const dest = destSelect.value || 'Thailand';
    const style = styleSelect.value || 'mid-range';
    const purpose = purposeSelect.value || 'tourism';

    const preset = BUDGET_PRESETS[dest] || BUDGET_PRESETS['Thailand'];
    const rates = preset[style] || preset['mid-range'];

    let stayMult = 1, foodMult = 1, transportMult = 1, actMult = 1, shopMult = 1;
    if (purpose === 'business') {
      stayMult = 1.25; foodMult = 1.2; actMult = 0.5;
    } else if (purpose === 'education') {
      stayMult = 0.65; foodMult = 0.6; transportMult = 0.5; shopMult = 0.4;
    } else if (purpose === 'other') {
      stayMult = 0.4;
    }

    if (catStay) catStay.value = Math.round(rates.stay * stayMult);
    if (catFood) catFood.value = Math.round(rates.food * foodMult);
    if (catTransport) catTransport.value = Math.round(rates.transport * transportMult);
    if (catActivities) catActivities.value = Math.round(rates.activities * actMult);
    if (catShopping) catShopping.value = Math.round(rates.shopping * shopMult);
    if (catEmergency) catEmergency.value = rates.emergency;

    recalculateTotal();
  }

  async function recalculateTotal() {
    const dest = destSelect.value || 'Thailand';
    const days = Math.max(1, parseInt(daysInput.value) || 1);
    const travelers = Math.max(1, parseInt(travelersInput.value) || 1);

    const preset = BUDGET_PRESETS[dest] || BUDGET_PRESETS['Thailand'];
    const targetCurrency = preset.currency;
    const symbol = preset.symbol;

    const stayVal = Math.max(0, parseFloat(catStay ? catStay.value : 0) || 0);
    const foodVal = Math.max(0, parseFloat(catFood ? catFood.value : 0) || 0);
    const transportVal = Math.max(0, parseFloat(catTransport ? catTransport.value : 0) || 0);
    const activitiesVal = Math.max(0, parseFloat(catActivities ? catActivities.value : 0) || 0);
    const shoppingVal = Math.max(0, parseFloat(catShopping ? catShopping.value : 0) || 0);
    const emergencyVal = Math.max(0, parseFloat(catEmergency ? catEmergency.value : 0) || 0);

    const stayTotal = stayVal * days * travelers;
    const foodTotal = foodVal * days * travelers;
    const transportTotal = transportVal * days * travelers;
    const activitiesTotal = activitiesVal * days * travelers;
    const shoppingTotal = shoppingVal * days * travelers;
    const emergencyTotal = emergencyVal;

    const grandTotalINR = stayTotal + foodTotal + transportTotal + activitiesTotal + shoppingTotal + emergencyTotal;
    const dailyPerPersonINR = Math.round(grandTotalINR / (days * travelers));

    const totalINRElement = document.getElementById('budgetTotalINR');
    const dailyElement = document.getElementById('budgetDailyPerPerson');
    if (totalINRElement) totalINRElement.textContent = `₹${Math.round(grandTotalINR).toLocaleString('en-IN')}`;
    if (dailyElement) dailyElement.textContent = `₹${dailyPerPersonINR.toLocaleString('en-IN')}`;

    const totalFXElement = document.getElementById('budgetTotalFX');
    const rate = await getLiveExchangeRate(targetCurrency);
    if (rate && totalFXElement) {
      const converted = (grandTotalINR * rate).toFixed(2);
      totalFXElement.textContent = `(${symbol} ${parseFloat(converted).toLocaleString('en-US')})`;
    } else if (totalFXElement) {
      totalFXElement.textContent = `(${targetCurrency})`;
    }

    const barStay = document.getElementById('barStay');
    const barFood = document.getElementById('barFood');
    const barTransport = document.getElementById('barTransport');
    const barActivities = document.getElementById('barActivities');
    const barEmergency = document.getElementById('barEmergency');

    if (grandTotalINR > 0) {
      const stayPct = ((stayTotal / grandTotalINR) * 100).toFixed(1);
      const foodPct = ((foodTotal / grandTotalINR) * 100).toFixed(1);
      const transPct = ((transportTotal / grandTotalINR) * 100).toFixed(1);
      const actPct = ((activitiesTotal / grandTotalINR) * 100).toFixed(1);
      const emergPct = ((emergencyTotal / grandTotalINR) * 100).toFixed(1);

      if (barStay) { barStay.style.width = `${stayPct}%`; barStay.title = `Stay (${stayPct}%)`; }
      if (barFood) { barFood.style.width = `${foodPct}%`; barFood.title = `Food (${foodPct}%)`; }
      if (barTransport) { barTransport.style.width = `${transPct}%`; barTransport.title = `Transport (${transPct}%)`; }
      if (barActivities) { barActivities.style.width = `${actPct}%`; barActivities.title = `Activities (${actPct}%)`; }
      if (barEmergency) { barEmergency.style.width = `${emergPct}%`; barEmergency.title = `Emergency (${emergPct}%)`; }
    }
  }

  destSelect.addEventListener('change', populatePresets);
  purposeSelect.addEventListener('change', populatePresets);
  styleSelect.addEventListener('change', populatePresets);

  daysInput.addEventListener('input', recalculateTotal);
  travelersInput.addEventListener('input', recalculateTotal);

  [catStay, catFood, catTransport, catActivities, catShopping, catEmergency].forEach(input => {
    if (input) input.addEventListener('input', recalculateTotal);
  });

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const dest = destSelect.value;
      const preset = BUDGET_PRESETS[dest] || BUDGET_PRESETS['Thailand'];
      const days = parseInt(daysInput.value) || 5;
      const travelers = parseInt(travelersInput.value) || 1;

      const stayVal = parseFloat(catStay ? catStay.value : 0) || 0;
      const foodVal = parseFloat(catFood ? catFood.value : 0) || 0;
      const transportVal = parseFloat(catTransport ? catTransport.value : 0) || 0;
      const activitiesVal = parseFloat(catActivities ? catActivities.value : 0) || 0;
      const shoppingVal = parseFloat(catShopping ? catShopping.value : 0) || 0;
      const emergencyVal = parseFloat(catEmergency ? catEmergency.value : 0) || 0;

      const grandTotalINR = (stayVal * days * travelers) + (foodVal * days * travelers) + (transportVal * days * travelers) + (activitiesVal * days * travelers) + (shoppingVal * days * travelers) + emergencyVal;

      const budgetData = {
        destination: dest,
        currency: preset.currency,
        symbol: preset.symbol,
        purpose: purposeSelect.value,
        style: styleSelect.value,
        days,
        travelers,
        stayPerDay: stayVal,
        foodPerDay: foodVal,
        transportPerDay: transportVal,
        activitiesPerDay: activitiesVal,
        shoppingPerDay: shoppingVal,
        emergency: emergencyVal,
        totalINR: grandTotalINR,
        savedAt: new Date().toISOString()
      };

      localStorage.setItem('travelease_saved_budget', JSON.stringify(budgetData));
      showToast(`Budget of ₹${Math.round(grandTotalINR).toLocaleString('en-IN')} saved to My Trip!`, "success");

      if (window.loadSavedBudgetDisplay) {
        window.loadSavedBudgetDisplay();
      }
    });
  }

  populatePresets();
}


function setupSidebarLayout() {
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");
  const navBtns = document.querySelectorAll(".nav-icon-btn");
  const panels = document.querySelectorAll(".sidebar-panel");

  if (!sidebar || !toggleBtn) return;

  // Create mobile elements dynamically
  let backdrop = document.getElementById("sidebarBackdrop");
  let fab = document.getElementById("mobileToolsFab");

  if (window.innerWidth <= 768) {
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.className = "sidebar-backdrop";
      backdrop.id = "sidebarBackdrop";
      document.body.appendChild(backdrop);
    }
    if (!fab) {
      fab = document.createElement("button");
      fab.className = "mobile-tools-fab";
      fab.id = "mobileToolsFab";
      fab.innerHTML = `<i class="fa-solid fa-toolbox"></i> Tools`;
      fab.setAttribute("aria-label", "Open Checklist and Tools");
      document.body.appendChild(fab);
    }
  }

  const updateSidebarState = (isExpanded) => {
    if (isExpanded) {
      sidebar.classList.add("expanded");
      document.body.classList.add("sidebar-expanded");
      if (backdrop) backdrop.classList.add("show");
    } else {
      sidebar.classList.remove("expanded");
      document.body.classList.remove("sidebar-expanded");
      if (backdrop) backdrop.classList.remove("show");
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

  if (fab) {
    fab.addEventListener("click", (e) => {
      e.preventDefault();
      const isExpanded = sidebar.classList.contains("expanded");
      updateSidebarState(!isExpanded);
    });
  }

  if (backdrop) {
    backdrop.addEventListener("click", (e) => {
      e.preventDefault();
      updateSidebarState(false);
    });
  }

  const closeBtnMobile = document.getElementById("sidebarCloseBtnMobile");
  if (closeBtnMobile) {
    closeBtnMobile.addEventListener("click", (e) => {
      e.preventDefault();
      updateSidebarState(false);
    });
  }

  navBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const target = btn.dataset.target;
      if (target === 'places') {
        window.location.href = 'places.html';
        return;
      }
      const isExpanded = sidebar.classList.contains("expanded");
      const isActive = btn.classList.contains("active");

      // Switch active class on nav buttons
      navBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      // Switch active class on panels
      panels.forEach(p => {
        p.classList.toggle("active", p.id === `panel-${target}`);
      });

      if (target === 'checklist') {
        window.loadChecklist();
      }

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
  const token = localStorage.getItem("travelease_token") || localStorage.getItem("token") || localStorage.getItem("travelease_jwt");
  if (!token || token === "null" || token === "undefined") return null;
  return token;
}

function setToken(token) {
  if (token) {
    localStorage.setItem("travelease_token", token);
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("travelease_token");
    localStorage.removeItem("token");
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
  if (modal) {
    modal.classList.add("open");
    document.body.classList.add("modal-open");
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("open");
    const openModals = document.querySelectorAll(".modal-overlay.open");
    if (openModals.length === 0) {
      document.body.classList.remove("modal-open");
    }
  }
}

window.handleGoogleLogin = async function (response) {
  try {
    const res = await fetch(apiUrl('/api/auth/google'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: response.credential })
    });

    const data = await res.json();

    if (data.success) {
      setToken(data.token);
      setCurrentUser(data.user);
      closeModal("signupModal");
      closeModal("loginModal");

      renderAuthUI();
      calculatePersonalizedAlerts();
      showToast(`Welcome, ${data.user.name.split(' ')[0]}!`, "success");

      // Open Plan Your Trip modal after a short delay for smooth transition
      setTimeout(() => {
        openTripModal();
      }, 300);
    } else {
      alert(data.message || 'Google sign-in failed. Please try again.');
    }
  } catch (error) {
    console.error(error);
    alert('Something went wrong. Please try again.');
  }
};
window.highlightVisaType = function (visaType) {
  const highlightSpan = document.getElementById('highlighted-visa-type');
  const tipBox = document.querySelector('.visa-tip-box');
  const user = getCurrentUser();

  // Reset all highlights
  const cards = document.querySelectorAll('.visa-type-card');
  cards.forEach(card => card.classList.remove('highlighted'));

  // Default highlight for the country's standard visa type
  cards.forEach(card => {
    const cardTitle = card.querySelector('h4').textContent;
    if (visaType.toLowerCase().includes(cardTitle.toLowerCase()) || cardTitle.toLowerCase().includes(visaType.toLowerCase())) {
      card.classList.add('highlighted');
    }
  });

  if (highlightSpan) highlightSpan.textContent = visaType;

  // Personalize based on logged-in user's trip purpose
  if (user && user.tripPurpose === 'education') {
    // Highlight the Student Visa card too
    cards.forEach(card => {
      const cardTitle = card.querySelector('h4').textContent;
      if (cardTitle.toLowerCase() === 'student visa') {
        card.classList.add('highlighted');
      }
    });

    if (tipBox) {
      tipBox.innerHTML = `
        <strong>🎓 Studying Abroad?</strong>
        <p>While this destination generally requires a <span id="highlighted-visa-type" style="font-weight: 700; color: #1a73e8;">${escapeHTML(visaType)}</span> for tourist visits, you will need a formal <strong>Student Visa</strong> for academic courses. Student visas require an official university admission letter (e.g. CAS for UK, I-20 for USA), proof of academic qualifications, and proof of sufficient funds to cover your tuition and living expenses.</p>
      `;
    }
  } else if (user && user.tripPurpose === 'business') {
    // Highlight the Work Visa card too
    cards.forEach(card => {
      const cardTitle = card.querySelector('h4').textContent;
      if (cardTitle.toLowerCase() === 'work visa') {
        card.classList.add('highlighted');
      }
    });

    if (tipBox) {
      tipBox.innerHTML = `
        <strong>💼 Travelling for Business?</strong>
        <p>For temporary business trips (meetings, conferences, or negotiations), a standard <span id="highlighted-visa-type" style="font-weight: 700; color: #1a73e8;">${escapeHTML(visaType)}</span> or business visitor visa is usually sufficient. However, if you are taking up employment or long-term contract work in the country, you must apply for a sponsored <strong>Work Visa</strong>.</p>
      `;
    }
  } else {
    // Default Tourism / Guest message
    if (tipBox) {
      tipBox.innerHTML = `
        <strong>💡 Which one applies to you?</strong>
        <p>For this destination, you'll need a <span id="highlighted-visa-type" style="font-weight: 700; color: #1a73e8;">${escapeHTML(visaType)}</span> — see the full entry checklist and requirements below.</p>
      `;
    }
  }
};

window.toggleVisaEducation = function () {
  const grid = document.getElementById('visa-types-grid');
  const subtitle = document.querySelector('.visa-education .subtitle');
  const btn = document.getElementById('toggle-visa-edu-btn');
  if (!grid || !btn) return;

  if (grid.style.display === 'none') {
    grid.style.display = 'grid';
    if (subtitle) subtitle.style.display = 'block';
    btn.textContent = 'Show Less';
  } else {
    grid.style.display = 'none';
    if (subtitle) subtitle.style.display = 'none';
    btn.textContent = 'Show More';
  }
};

window.searchFlights = async function () {
  const from = document.getElementById('flight-from').value;
  const to = document.getElementById('flight-to').value;
  const departure = document.getElementById('flight-departure').value;
  const returnDate = document.getElementById('flight-return').value;
  const travellers = document.getElementById('flight-travellers').value;

  if (!departure) {
    alert('Please select a departure date');
    return;
  }

  const searchBtn = document.querySelector('.flight-search-btn');
  const originalText = searchBtn.textContent;
  searchBtn.disabled = true;
  searchBtn.textContent = 'Searching...';

  try {
    const res = await fetch(apiUrl(`/api/flights/search?origin=${from}&destination=${to}&departure=${departure}&returnDate=${returnDate || ''}&adults=${travellers}`));
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to search flights');
    }

    window.allFlights = data.data;
    window.currentSort = 'cheapest';

    // Reset filters
    const radioAll = document.querySelector('input[name="stopsFilter"][value="all"]');
    if (radioAll) radioAll.checked = true;

    const priceRange = document.getElementById('priceRangeFilter');
    if (priceRange) {
      const maxPrice = window.allFlights.length > 0 ? Math.max(...window.allFlights.map(f => f.price)) : 150000;
      priceRange.max = Math.max(maxPrice, 50000);
      priceRange.value = priceRange.max;
      document.getElementById('priceLimitVal').textContent = `₹${priceRange.max}`;
    }

    // Populate airline filter options dynamically
    const airlines = [...new Set(window.allFlights.map(f => f.airline))];
    const airlineContainer = document.getElementById('airlineFilterContainer');
    if (airlineContainer) {
      airlineContainer.innerHTML = airlines.map(airline => `
        <label class="checkbox-container">
          <input type="checkbox" name="airlineFilter" value="${escapeHTML(airline)}" checked onchange="filterFlights()">
          <span class="checkmark"></span> ${escapeHTML(airline)}
        </label>
      `).join('');
    }

    // Set header summary details
    const searchSummary = document.getElementById('flightSearchSummary');
    if (searchSummary) {
      const fromLabel = document.getElementById('flight-from').options[document.getElementById('flight-from').selectedIndex].text.split('(')[0].trim();
      const toLabel = document.getElementById('flight-to').options[document.getElementById('flight-to').selectedIndex].text.split('(')[0].trim();
      searchSummary.textContent = `${fromLabel} (${from}) to ${toLabel} (${to}) | ${new Date(departure).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })} | ${travellers} Traveller${travellers > 1 ? 's' : ''}`;
    }

    openModal('flightResultsModal');
    window.renderFlightResults();

  } catch (error) {
    alert(error.message);
  } finally {
    searchBtn.disabled = false;
    searchBtn.textContent = originalText;
  }
};

window.updatePriceLimitLabel = function () {
  const val = document.getElementById('priceRangeFilter').value;
  document.getElementById('priceLimitVal').textContent = `₹${val}`;
};

window.filterFlights = function () {
  window.renderFlightResults();
};

window.sortFlights = function (type) {
  window.currentSort = type;
  document.getElementById('sortCheapestBtn').classList.toggle('active', type === 'cheapest');
  document.getElementById('sortFastestBtn').classList.toggle('active', type === 'fastest');
  window.renderFlightResults();
};

window.renderFlightResults = function () {
  const container = document.getElementById('flightResultsList');
  if (!container) return;

  if (!window.allFlights || window.allFlights.length === 0) {
    container.innerHTML = `
      <div class="no-flights-msg">
        <i class="fa-solid fa-plane-slash"></i>
        <p>No flights found matching your search parameters.</p>
      </div>
    `;
    return;
  }

  const stopsVal = document.querySelector('input[name="stopsFilter"]:checked').value;
  const priceVal = parseFloat(document.getElementById('priceRangeFilter').value);

  const airlineCheckboxes = document.querySelectorAll('input[name="airlineFilter"]:checked');
  const allowedAirlines = Array.from(airlineCheckboxes).map(cb => cb.value);

  let filtered = window.allFlights.filter(flight => {
    if (stopsVal !== 'all') {
      if (flight.stops !== parseInt(stopsVal)) return false;
    }
    if (flight.price > priceVal) return false;
    if (allowedAirlines.length > 0 && !allowedAirlines.includes(flight.airline)) return false;
    return true;
  });

  const durationToMinutes = (durStr) => {
    if (!durStr) return 0;
    const matches = durStr.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/);
    if (!matches) return 9999;
    const h = matches[1] ? parseInt(matches[1]) : 0;
    const m = matches[2] ? parseInt(matches[2]) : 0;
    return (h * 60) + m;
  };

  if (window.currentSort === 'cheapest') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (window.currentSort === 'fastest') {
    filtered.sort((a, b) => {
      const durA = durationToMinutes(a.itineraries[0]?.duration);
      const durB = durationToMinutes(b.itineraries[0]?.duration);
      return durA - durB;
    });
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="no-flights-msg">
        <i class="fa-solid fa-filter"></i>
        <p>No flights match your filter criteria. Try expanding your search options.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(flight => {
    const outbound = flight.itineraries[0] || {};
    const inbound = flight.itineraries[1];
    const carrierCodeOut = flight.flightNumber ? flight.flightNumber.substring(0, 2) : 'FL';

    let inboundHTML = "";
    if (inbound) {
      const carrierCodeIn = inbound.flightNumber ? inbound.flightNumber.substring(0, 2) : carrierCodeOut;
      inboundHTML = `
        <div class="flight-card-summary" style="margin-top: 15px; border-top: 1px dashed #eee; padding-top: 15px;">
          <div class="flight-airline-info">
            <img class="flight-logo" src="${inbound.airlineLogo || flight.airlineLogo}" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="flight-logo-fallback" style="display: none; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; background: #eef4ff; color: #1a73e8; font-weight: 700; font-size: 12px; flex-shrink: 0;">
              ${carrierCodeIn}
            </div>
            <div>
              <div class="airline-name">${escapeHTML(inbound.airline || flight.airline)}</div>
              <div class="flight-number">${escapeHTML(inbound.flightNumber || flight.flightNumber)}</div>
            </div>
          </div>
          <div class="flight-time-info">
            <div class="time-block">
              <h4>${inbound.departure.time}</h4>
              <p>${inbound.departure.iata}</p>
            </div>
            <div class="route-visualizer">
              <span class="duration-text">${inbound.duration}</span>
              <div class="route-line"></div>
              <span class="stops-label ${inbound.stops === 0 ? 'direct' : ''}">
                ${inbound.stops === 0 ? 'Direct' : `${inbound.stops} Stop${inbound.stops > 1 ? 's' : ''} (${inbound.layovers.join(', ')})`}
              </span>
            </div>
            <div class="time-block">
              <h4>${inbound.arrival.time}</h4>
              <p>${inbound.arrival.iata}</p>
            </div>
          </div>
          <div class="flight-price-action" style="visibility: hidden;"></div>
        </div>
      `;
    }

    const fromCode = document.getElementById('flight-from')?.value || 'DEL';
    const toCode = document.getElementById('flight-to')?.value || 'DXB';
    const depDate = document.getElementById('flight-departure')?.value || '';
    const retDate = document.getElementById('flight-return')?.value || '';
    const numAdults = document.getElementById('flight-travellers')?.value || '1';

    const buildKiwiLink = (f, t, d, r, a) => {
      let p = `${(f||'del').toLowerCase()}-${(t||'dxb').toLowerCase()}/${d}`;
      if (r) p += `/${r}`;
      return `https://www.kiwi.com/en/search/results/${p}?adults=${a || 1}&affilid=travelease`;
    };

    const buildSkyscannerLink = (f, t, d, r, a) => {
      const depF = d ? d.replace(/-/g, '').slice(2) : '';
      const retF = r ? r.replace(/-/g, '').slice(2) : '';
      let p = `${(f||'del').toLowerCase()}/${(t||'dxb').toLowerCase()}/${depF}`;
      if (retF) p += `/${retF}`;
      return `https://www.skyscanner.co.in/transport/flights/${p}/?adults=${a || 1}&tag=travelease`;
    };

    const kiwiUrl = flight.kiwiUrl || buildKiwiLink(fromCode, toCode, depDate, retDate, numAdults);
    const skyscannerUrl = flight.skyscannerUrl || buildSkyscannerLink(fromCode, toCode, depDate, retDate, numAdults);

    return `
      <div class="flight-card">
        <div class="flight-card-summary">
          <div class="flight-airline-info">
            <img class="flight-logo" src="${flight.airlineLogo}" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="flight-logo-fallback" style="display: none; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; background: #eef4ff; color: #1a73e8; font-weight: 700; font-size: 12px; flex-shrink: 0;">
              ${carrierCodeOut}
            </div>
            <div>
              <div class="airline-name">${escapeHTML(flight.airline)}</div>
              <div class="flight-number">${escapeHTML(flight.flightNumber)}</div>
            </div>
          </div>
          <div class="flight-time-info">
            <div class="time-block">
              <h4>${outbound.departure.time}</h4>
              <p>${outbound.departure.iata}</p>
            </div>
            <div class="route-visualizer">
              <span class="duration-text">${outbound.duration}</span>
              <div class="route-line"></div>
              <span class="stops-label ${flight.stops === 0 ? 'direct' : ''}">
                ${flight.stops === 0 ? 'Direct' : `${flight.stops} Stop${flight.stops > 1 ? 's' : ''} (${outbound.layovers.join(', ')})`}
              </span>
            </div>
            <div class="time-block">
              <h4>${outbound.arrival.time}</h4>
              <p>${outbound.arrival.iata}</p>
            </div>
          </div>
          <div class="flight-price-action">
            <div class="price-text">₹${flight.price}</div>
            <div class="flight-affiliate-btns" style="display: flex; flex-direction: column; gap: 6px; margin-top: 6px; width: 100%;">
              <a href="${kiwiUrl}" target="_blank" rel="noopener sponsored" class="book-btn kiwi-btn" style="background: #00a698; color: white; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 14px; border-radius: 6px; font-weight: 700; font-size: 0.85rem; transition: background 0.2s;">
                Book on Kiwi.com ✈️
              </a>
              <a href="${skyscannerUrl}" target="_blank" rel="noopener sponsored" class="book-btn skyscanner-btn" style="background: #0770e3; color: white; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 0.8rem; transition: background 0.2s;">
                Compare on Skyscanner
              </a>
            </div>
          </div>
        </div>
        ${inboundHTML}
      </div>
    `;
  }).join('');
};

window.openBookingFlow = function (flightId) {
  const flight = window.allFlights.find(f => f.id === flightId);
  if (!flight) return;

  window.selectedFlight = flight;

  const fromCode = document.getElementById('flight-from')?.value || 'DEL';
  const toCode = document.getElementById('flight-to')?.value || 'DXB';
  const depDate = document.getElementById('flight-departure')?.value || '';
  const retDate = document.getElementById('flight-return')?.value || '';
  const numAdults = document.getElementById('flight-travellers')?.value || '1';

  const kiwiUrl = flight.kiwiUrl || `https://www.kiwi.com/en/search/results/${fromCode.toLowerCase()}-${toCode.toLowerCase()}/${depDate}${retDate ? '/' + retDate : ''}?adults=${numAdults}&affilid=travelease`;
  const skyscannerUrl = flight.skyscannerUrl || `https://www.skyscanner.co.in/transport/flights/${fromCode.toLowerCase()}/${toCode.toLowerCase()}/${depDate ? depDate.replace(/-/g, '').slice(2) : ''}/?adults=${numAdults}&tag=travelease`;

  const detailsContainer = document.getElementById('bookingFlightDetails');
  if (detailsContainer) {
    const outbound = flight.itineraries[0] || {};
    const inbound = flight.itineraries[1];

    let summaryText = `
      <div style="font-weight: 700; color: #1a73e8; font-size: 1.1rem; margin-bottom: 8px;">
        ${escapeHTML(flight.airline)} (${escapeHTML(flight.flightNumber)})
      </div>
      <div style="font-size: 0.9rem; line-height: 1.5; color: #444;">
        <div><strong>Outbound:</strong> ${escapeHTML(outbound.departure.iata)} ➔ ${escapeHTML(outbound.arrival.iata)} (${outbound.departure.time} - ${outbound.arrival.time}) on ${outbound.departure.date}</div>
    `;

    if (inbound) {
      summaryText += `
        <div style="margin-top: 5px;"><strong>Inbound:</strong> ${escapeHTML(inbound.departure.iata)} ➔ ${escapeHTML(inbound.arrival.iata)} (${inbound.departure.time} - ${inbound.arrival.time}) on ${inbound.departure.date}</div>
      `;
    }

    summaryText += `
        <div style="margin-top: 10px; font-weight: 700; font-size: 1.1rem; color: #111;">Estimated Fare: ₹${flight.price}</div>
      </div>

      <div style="margin-top: 18px; padding: 12px 14px; background: #eef9f8; border: 1px solid #b2e8e3; border-radius: 8px; font-size: 0.85rem; color: #005c53; line-height: 1.4;">
        <i class="fa-solid fa-shield-halved" style="margin-right: 6px; color: #00a698;"></i>
        <strong>Official Booking Partner:</strong> You will be redirected securely to Kiwi.com or Skyscanner to complete your ticket booking with zero hidden platform fees.
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
        <a href="${kiwiUrl}" target="_blank" rel="noopener sponsored" class="primary-button" style="background: #00a698; color: white; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; font-weight: 700; font-size: 1rem; border-radius: 8px; text-align: center;">
          <i class="fa-solid fa-plane-departure"></i> Continue to Kiwi.com &rarr;
        </a>
        <a href="${skyscannerUrl}" target="_blank" rel="noopener sponsored" class="secondary-button" style="background: #0770e3; color: white; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; font-weight: 600; font-size: 0.95rem; border-radius: 8px; text-align: center;">
          Compare options on Skyscanner &rarr;
        </a>
      </div>
    `;

    detailsContainer.innerHTML = summaryText;
  }

  const bookingFormSide = document.getElementById('bookingFormSide');
  if (bookingFormSide) {
    // Hide standard form elements inside modal since we redirect directly via affiliate partners
    const formFields = bookingFormSide.querySelector('.booking-fields');
    if (formFields) formFields.style.display = 'none';
  }

  closeModal('flightResultsModal');
  openModal('flightBookingModal');
};

window.confirmFlightBooking = async function () {
  const passengerName = document.getElementById('bookingPassengerName').value.trim();
  const seatPref = document.getElementById('bookingSeatPref').value;
  const errorDiv = document.getElementById('bookingError');

  if (!passengerName) {
    errorDiv.textContent = 'Please enter passenger full name';
    return;
  }

  const flight = window.selectedFlight;
  if (!flight) return;

  const confirmBtn = document.querySelector('.booking-confirm-btn');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Booking...';

  try {
    const token = getToken();
    let bookingData;

    const outbound = flight.itineraries[0] || {};
    const inbound = flight.itineraries[1];

    if (token) {
      const res = await fetch(apiUrl('/api/flights/book'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          airline: flight.airline,
          flightNumber: flight.flightNumber,
          origin: outbound.departure.iata,
          destination: outbound.arrival.iata,
          departureTime: outbound.departure.rawDateTime || `${outbound.departure.date}T${outbound.departure.time}:00`,
          arrivalTime: outbound.arrival.rawDateTime || `${outbound.arrival.date}T${outbound.arrival.time}:00`,
          price: flight.price,
          currency: flight.currency,
          seat: seatPref,
          passengerName
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to confirm booking');
      }

      bookingData = data.booking;
      setCurrentUser(data.user);
      renderAuthUI();
      showToast("Flight booked and ticket issued!", "success");
    } else {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let pnr = '';
      for (let i = 0; i < 6; i++) {
        pnr += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      bookingData = {
        airline: flight.airline,
        flightNumber: flight.flightNumber,
        origin: outbound.departure.iata,
        destination: outbound.arrival.iata,
        departureTime: new Date(`${outbound.departure.date}T${outbound.departure.time}:00`),
        price: flight.price,
        seat: seatPref,
        pnr,
        passengerName
      };

      showToast("Flight booked successfully (Guest Checkout)!", "success");
    }

    document.getElementById('passPNR').textContent = bookingData.pnr;
    document.getElementById('passOrigin').textContent = bookingData.origin;
    document.getElementById('passDest').textContent = bookingData.destination;
    document.getElementById('passFlightNo').textContent = bookingData.flightNumber;
    document.getElementById('passPassengerName').textContent = bookingData.passengerName;
    document.getElementById('passSeat').textContent = bookingData.seat.split(' ')[0];

    const depDate = new Date(bookingData.departureTime);
    document.getElementById('passDate').textContent = depDate.toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' });
    document.getElementById('passTime').textContent = depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    document.getElementById('bookingFormSide').style.display = 'none';
    document.getElementById('bookingSuccessPanel').style.display = 'block';

  } catch (error) {
    errorDiv.textContent = error.message;
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Confirm & Book Flight';
  }
};

window.prefillFlightDestination = function () {
  const urlParams = new URLSearchParams(window.location.search);
  const country = urlParams.get('country') || urlParams.get('code');

  const countryToAirport = {
    UAE: 'DXB',
    USA: 'JFK',
    UK: 'LHR',
    Thailand: 'BKK',
    Singapore: 'SIN',
    Japan: 'NRT',
    Canada: 'YYZ',
    Australia: 'SYD'
  };

  if (country) {
    const matchedKey = Object.keys(countryToAirport).find(k => k.toLowerCase() === country.toLowerCase());
    if (matchedKey) {
      const select = document.getElementById('flight-to');
      if (select) {
        select.value = countryToAirport[matchedKey];
      }
    }
  }
};

window.showPanel = function (target) {
  const btn = document.querySelector(`.nav-icon-btn[data-target="${target}"]`);
  if (btn) btn.click();
};

window.openTripModal = function () {
  openModal("tripModal");
};

window.closeTripModal = function () {
  closeModal("tripModal");
};

window.skipTripDetails = function () {
  closeModal("tripModal");
};

window.saveTripDetails = async function () {
  const destination = document.getElementById("trip-destination").value;
  const tripPurpose = document.getElementById("trip-purpose").value;
  const passportExpiry = document.getElementById("trip-passport-expiry").value;
  const travelDateFrom = document.getElementById("trip-departure").value;
  const travelDateTo = document.getElementById("trip-return").value;
  const isFirstTimeAbroad = document.getElementById("trip-first-time").checked;
  const errorDiv = document.getElementById("tripError");
  if (errorDiv) errorDiv.textContent = "";

  try {
    const token = getToken();
    if (!token) {
      throw new Error("No authorization token found. Please log in.");
    }

    const response = await fetch(apiUrl("/api/auth/profile"), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        destination,
        tripPurpose,
        passportExpiry: passportExpiry || undefined,
        travelDateFrom: travelDateFrom || undefined,
        travelDateTo: travelDateTo || undefined,
        isFirstTimeAbroad
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to save trip details.");
    }

    // Save to localStorage for compatibility/backup
    const tripData = {
      destination,
      purpose: tripPurpose,
      passportExpiry,
      departure: travelDateFrom,
      returnDate: travelDateTo,
      firstTime: isFirstTimeAbroad
    };
    localStorage.setItem("tripDetails", JSON.stringify(tripData));

    setCurrentUser(data);
    closeModal("tripModal");

    renderAuthUI();
    calculatePersonalizedAlerts();
    showToast("Trip details saved successfully!", "success");

    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (error) {
    if (errorDiv) {
      errorDiv.textContent = error.message;
    } else {
      alert(error.message);
    }
  }
};

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
  const forgotPasswordModal = document.getElementById("forgotPasswordModal");
  const forgotPasswordCloseBtn = document.getElementById("forgotPasswordCloseBtn");
  const forgotPasswordForm = document.getElementById("forgotPasswordForm");
  const switchToLoginFromForgot = document.getElementById("switchToLoginFromForgotBtn");

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

  const forgotPasswordTriggers = document.querySelectorAll(".forgot-password-trigger");
  forgotPasswordTriggers.forEach(trigger => {
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      closeModal("loginModal");
      resetForgotOtpModal();
      openModal("forgotPasswordModal");
    });
  });

  if (forgotPasswordCloseBtn) {
    forgotPasswordCloseBtn.addEventListener("click", () => {
      closeModal("forgotPasswordModal");
      resetForgotOtpModal();
    });
  }

  if (switchToLoginFromForgot) {
    switchToLoginFromForgot.addEventListener("click", () => {
      closeModal("forgotPasswordModal");
      openModal("loginModal");
      resetForgotOtpModal();
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
        const response = await fetch(apiUrl("/api/auth/login"), {
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

  // OTP state variables
  let otpEmail = "";
  let otpTimerInterval = null;

  const resetForgotOtpModal = () => {
    const f1 = document.getElementById("otpForm1");
    const f2 = document.getElementById("otpForm2");
    const f3 = document.getElementById("otpForm3");
    if (f1) f1.reset();
    if (f2) f2.reset();
    if (f3) f3.reset();

    const err1 = document.getElementById("otpError1");
    const err2 = document.getElementById("otpError2");
    const err3 = document.getElementById("otpError3");
    if (err1) err1.textContent = "";
    if (err2) err2.textContent = "";
    if (err3) err3.textContent = "";

    const confirmErr = document.getElementById("confirmPasswordError");
    if (confirmErr) confirmErr.style.display = "none";

    const bar = document.getElementById("strengthBar");
    const text = document.getElementById("strengthText");
    if (bar) {
      bar.style.width = "0%";
      bar.style.backgroundColor = "var(--red)";
    }
    if (text) text.textContent = "Too Weak";

    const step1 = document.getElementById("otpStep1");
    const step2 = document.getElementById("otpStep2");
    const step3 = document.getElementById("otpStep3");
    if (step1) step1.style.display = "block";
    if (step2) step2.style.display = "none";
    if (step3) step3.style.display = "none";

    if (otpTimerInterval) {
      clearInterval(otpTimerInterval);
      otpTimerInterval = null;
    }
    const timerElem = document.getElementById("otpTimer");
    if (timerElem) {
      timerElem.textContent = "OTP expires in 10:00";
      timerElem.style.color = "var(--muted)";
    }

    const verifyBtn = f2 ? f2.querySelector(".modal-submit-btn") : null;
    if (verifyBtn) verifyBtn.disabled = false;

    // Reset OTP input digit borders
    const digits = document.querySelectorAll(".otp-digit");
    digits.forEach(input => {
      input.classList.remove("error-border");
      input.value = "";
    });
  };

  const startOtpTimer = () => {
    if (otpTimerInterval) {
      clearInterval(otpTimerInterval);
    }
    let duration = 600; // 10 minutes
    const timerElem = document.getElementById("otpTimer");
    const verifyBtn = document.querySelector("#otpForm2 .modal-submit-btn");
    const resendBtn = document.getElementById("resendOtpBtn");

    if (verifyBtn) verifyBtn.disabled = false;
    if (timerElem) timerElem.style.color = "var(--muted)";

    otpTimerInterval = setInterval(() => {
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      const formattedMin = minutes < 10 ? "0" + minutes : minutes;
      const formattedSec = seconds < 10 ? "0" + seconds : seconds;

      if (timerElem) {
        timerElem.textContent = `OTP expires in ${formattedMin}:${formattedSec}`;
      }

      if (--duration < 0) {
        clearInterval(otpTimerInterval);
        otpTimerInterval = null;
        if (timerElem) {
          timerElem.textContent = "OTP expired";
          timerElem.style.color = "var(--red)";
        }
        if (verifyBtn) verifyBtn.disabled = true;

        const errDiv = document.getElementById("otpError2");
        if (errDiv) {
          errDiv.textContent = "OTP expired — request a new one";
          errDiv.style.color = "var(--red)";
        }
        if (resendBtn) {
          resendBtn.style.color = "var(--blue)";
          resendBtn.style.transform = "scale(1.05)";
          resendBtn.style.transition = "transform 0.2s, color 0.2s";
        }
      }
    }, 1000);
  };

  // OTP digit inputs autofocusses & backspaces
  const otpDigits = document.querySelectorAll(".otp-digit");
  otpDigits.forEach((digitInput, index) => {
    digitInput.addEventListener("input", (e) => {
      digitInput.classList.remove("error-border");
      if (digitInput.value.length === 1) {
        if (index < otpDigits.length - 1) {
          otpDigits[index + 1].focus();
        }
      }
    });

    digitInput.addEventListener("keydown", (e) => {
      if (e.key === "Backspace") {
        digitInput.value = "";
        digitInput.classList.remove("error-border");
        if (index > 0) {
          otpDigits[index - 1].focus();
        }
      }
    });
  });

  // Step 1 Form: Request OTP
  const otpForm1 = document.getElementById("otpForm1");
  if (otpForm1) {
    otpForm1.addEventListener("submit", async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById("otpEmail");
      const errDiv = document.getElementById("otpError1");
      const submitBtn = otpForm1.querySelector(".modal-submit-btn");

      otpEmail = emailInput.value.trim();
      errDiv.textContent = "";
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending OTP...";

      try {
        const response = await fetch(apiUrl("/api/auth/forgot-password"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: otpEmail })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to send OTP.");
        }

        showToast("OTP sent to your email", "success");

        // Go to step 2
        document.getElementById("otpStep1").style.display = "none";
        document.getElementById("otpStep2").style.display = "block";
        startOtpTimer();

        // Focus first OTP digit
        if (otpDigits.length > 0) {
          setTimeout(() => otpDigits[0].focus(), 100);
        }
      } catch (error) {
        errDiv.textContent = error.message;
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send OTP";
      }
    });
  }

  // Resend OTP Link Action
  const resendOtpBtn = document.getElementById("resendOtpBtn");
  if (resendOtpBtn) {
    resendOtpBtn.addEventListener("click", async () => {
      const errDiv2 = document.getElementById("otpError2");
      errDiv2.textContent = "";
      resendOtpBtn.disabled = true;
      resendOtpBtn.textContent = "Sending...";

      try {
        const response = await fetch(apiUrl("/api/auth/forgot-password"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: otpEmail })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to resend OTP.");
        }

        showToast("A new OTP has been sent to your email.", "success");

        // Reset inputs
        otpDigits.forEach(input => {
          input.value = "";
          input.classList.remove("error-border");
        });

        // Restart timer
        startOtpTimer();

        // Focus first
        if (otpDigits.length > 0) otpDigits[0].focus();
      } catch (error) {
        errDiv2.textContent = error.message;
      } finally {
        resendOtpBtn.disabled = false;
        resendOtpBtn.textContent = "Resend OTP";
        resendOtpBtn.style.transform = "none";
        resendOtpBtn.style.color = "";
      }
    });
  }

  // Step 2 Form: Verify OTP
  const otpForm2 = document.getElementById("otpForm2");
  if (otpForm2) {
    otpForm2.addEventListener("submit", async (e) => {
      e.preventDefault();
      const errDiv = document.getElementById("otpError2");
      const submitBtn = otpForm2.querySelector(".modal-submit-btn");

      // Concatenate OTP inputs
      let otp = "";
      otpDigits.forEach(input => otp += input.value.trim());

      if (otp.length < 6) {
        errDiv.textContent = "Please enter the full 6-digit OTP.";
        return;
      }

      errDiv.textContent = "";
      submitBtn.disabled = true;
      submitBtn.textContent = "Verifying...";

      try {
        const response = await fetch(apiUrl("/api/auth/verify-otp"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: otpEmail, otp })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Verification failed.");
        }

        showToast("OTP verified successfully.", "success");

        // Save verification OTP in state to pass to step 3
        otpForm2.dataset.verifiedOtp = otp;

        // Go to step 3
        document.getElementById("otpStep2").style.display = "none";
        document.getElementById("otpStep3").style.display = "block";

        // Focus password input
        const newPasswordInput = document.getElementById("otpNewPassword");
        if (newPasswordInput) setTimeout(() => newPasswordInput.focus(), 100);
      } catch (error) {
        errDiv.textContent = error.message;

        // Trigger shake and red border
        otpDigits.forEach(input => input.classList.add("error-border"));
        const inputContainer = document.querySelector(".otp-input-container");
        if (inputContainer) {
          inputContainer.classList.add("shake");
          setTimeout(() => {
            inputContainer.classList.remove("shake");
          }, 400);
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Verify OTP";
      }
    });
  }

  // Password Strength & Confirm Matching Checker
  const newPasswordInput = document.getElementById("otpNewPassword");
  const confirmPasswordInput = document.getElementById("otpConfirmPassword");
  const strengthBar = document.getElementById("strengthBar");
  const strengthText = document.getElementById("strengthText");
  const confirmPasswordError = document.getElementById("confirmPasswordError");

  const checkPasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: "Too Weak", color: "var(--red)", percent: "0%" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^a-zA-Z0-9]/.test(pass)) score++;

    switch (score) {
      case 0:
      case 1:
        return { score, text: "Too Weak", color: "var(--red)", percent: "25%" };
      case 2:
        return { score, text: "Weak", color: "var(--orange)", percent: "50%" };
      case 3:
        return { score, text: "Medium", color: "var(--yellow)", percent: "75%" };
      case 4:
        return { score, text: "Strong", color: "var(--green)", percent: "100%" };
      default:
        return { score, text: "Too Weak", color: "var(--red)", percent: "0%" };
    }
  };

  if (newPasswordInput) {
    newPasswordInput.addEventListener("input", () => {
      const pass = newPasswordInput.value;
      const strength = checkPasswordStrength(pass);
      if (strengthBar) {
        strengthBar.style.width = strength.percent;
        strengthBar.style.backgroundColor = strength.color;
      }
      if (strengthText) {
        strengthText.textContent = strength.text;
        strengthText.style.color = strength.color;
      }
    });
  }

  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener("input", () => {
      if (newPasswordInput && confirmPasswordInput.value !== newPasswordInput.value) {
        confirmPasswordError.style.display = "block";
      } else {
        confirmPasswordError.style.display = "none";
      }
    });
  }

  // Step 3 Form: Reset Password Submit
  const otpForm3 = document.getElementById("otpForm3");
  if (otpForm3) {
    otpForm3.addEventListener("submit", async (e) => {
      e.preventDefault();
      const errDiv = document.getElementById("otpError3");
      const submitBtn = otpForm3.querySelector(".modal-submit-btn");

      const newPass = newPasswordInput.value;
      const confirmPass = confirmPasswordInput.value;

      if (newPass !== confirmPass) {
        confirmPasswordError.style.display = "block";
        return;
      }

      // Check strength requirement: minimum 8 characters and score >= 2
      const strength = checkPasswordStrength(newPass);
      if (newPass.length < 8 || strength.score < 2) {
        errDiv.textContent = "Password is too weak. Please use combinations of uppercase, lowercase, numbers, and symbols.";
        return;
      }

      errDiv.textContent = "";
      submitBtn.disabled = true;
      submitBtn.textContent = "Resetting...";

      const verifiedOtp = otpForm2.dataset.verifiedOtp;

      try {
        const response = await fetch(apiUrl("/api/auth/reset-password"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: otpEmail, otp: verifiedOtp, password: newPass })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Password reset failed.");
        }

        // Success: Close modal, show toast, and open login modal
        closeModal("forgotPasswordModal");
        resetForgotOtpModal();

        showToast("Password reset successfully — please log in", "success");
        setTimeout(() => openModal("loginModal"), 500);

      } catch (error) {
        errDiv.textContent = error.message;
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Reset Password";
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("signup-name").value.trim();
      const email = document.getElementById("signup-email").value.trim();
      const password = document.getElementById("signup-password").value;
      const errorDiv = document.getElementById("signupError");
      errorDiv.textContent = "";
      errorDiv.style.color = "var(--red)";

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
      const emailErrorDiv = document.getElementById("signupEmailError");
      if (emailErrorDiv) {
        emailErrorDiv.style.display = "none";
        emailErrorDiv.textContent = "";
      }

      if (!emailRegex.test(email)) {
        if (emailErrorDiv) {
          emailErrorDiv.style.display = "block";
          emailErrorDiv.textContent = "Please enter a valid email address";
        }
        return;
      }

      try {
        const response = await fetch(apiUrl("/api/auth/signup"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name, email, password
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Signup failed.");
        }

        // Reset form inputs
        signupForm.reset();
        errorDiv.style.color = "var(--green)";
        errorDiv.textContent = data.message || "Account created successfully!";

        if (data.token && data.user) {
          localStorage.setItem("travelease_token", data.token);
          localStorage.setItem("travelease_user", JSON.stringify(data.user));
          checkAuthState();
          showToast(`Account created! Welcome, ${data.user.name || "Traveler"}`, "success");
          setTimeout(() => {
            closeModal("signupModal");
            errorDiv.style.color = "var(--red)";
            errorDiv.textContent = "";
          }, 1200);
        } else {
          showToast(data.message || "Account created successfully! You can now log in.", "success");
          setTimeout(() => {
            closeModal("signupModal");
            openModal("loginModal");
            errorDiv.style.color = "var(--red)";
            errorDiv.textContent = "";
          }, 1500);
        }
      } catch (error) {
        errorDiv.style.color = "var(--red)";
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
        const response = await fetch(apiUrl("/api/auth/profile"), {
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

  // Escape key global listener for modal and sidebar closing accessibility
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal("loginModal");
      closeModal("signupModal");
      closeModal("profileModal");
      closeModal("tripModal");
      closeModal("forgotPasswordModal");

      const sidebar = document.getElementById("sidebar");
      if (sidebar && sidebar.classList.contains("expanded")) {
        const toggleBtn = document.getElementById("sidebarToggle");
        if (toggleBtn) {
          toggleBtn.click();
        }
      }
    }
  });
}

function renderAuthUI() {
  const headerAuthArea = document.getElementById("headerAuthArea");
  const profileWidget = document.getElementById("profileWidget");
  const user = getCurrentUser();

  const navMyTrip = document.getElementById("navMyTrip");
  if (navMyTrip) {
    navMyTrip.style.display = user ? "inline-block" : "none";
  }

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

      let bookedFlightsHTML = "";
      if (user.bookedFlights && user.bookedFlights.length > 0) {
        bookedFlightsHTML = `
          <div class="booked-flights-summary" style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 12px; text-align: left;">
            <h4 style="font-size: 13px; color: #333; margin-bottom: 8px; font-weight: 700;">✈️ My Booked Flights:</h4>
            ${user.bookedFlights.map(flight => `
              <div class="booked-flight-item" style="background: #f8f9fb; padding: 10px; border-radius: 6px; border: 1px solid #eee; margin-bottom: 8px; font-size: 12px; color: #555;">
                <div style="font-weight: 700; color: #1a73e8;">${escapeHTML(flight.airline)} (${escapeHTML(flight.flightNumber)})</div>
                <div><strong>Route:</strong> ${escapeHTML(flight.origin)} ➔ ${escapeHTML(flight.destination)}</div>
                <div><strong>Departure:</strong> ${new Date(flight.departureTime).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })} at ${new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
                <div><strong>PNR:</strong> <span style="font-weight: 700; color: #333;">${escapeHTML(flight.pnr)}</span> | <strong>Seat:</strong> ${escapeHTML(flight.seat)}</div>
              </div>
            `).join("")}
          </div>
        `;
      }

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
          ${bookedFlightsHTML}

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
    // Case-insensitive lookup of destination from DESTINATIONS keys
    const destKey = Object.keys(DESTINATIONS).find(k => k.toUpperCase() === destCode);
    const destination = destKey ? DESTINATIONS[destKey] : null;

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
async function loadExplorePage(countryName) {
  const tabContent = document.getElementById("tabContent");
  const destFlag = document.getElementById("dest-flag");
  const destName = document.getElementById("dest-name");
  const destDesc = document.getElementById("dest-description");
  const quickSummaryGrid = document.getElementById("quickSummaryGrid");
  const slideshowContainer = document.getElementById("slides-container");
  const slideshowDots = document.getElementById("slide-dots");

  document.title = `${countryName} Guide | TravelEase`;
  if (destName) destName.textContent = countryName;
  if (destDesc) destDesc.textContent = "Loading travel guidelines...";
  if (destFlag) destFlag.textContent = "🌍";

  // Render a clean loading spinner inside tabContent
  tabContent.innerHTML = `
    <div id="exploreLoading" style="text-align: center; padding: 100px 20px;">
      <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 3.5rem; color: var(--blue); margin-bottom: 20px;"></i>
      <h2>Compiling Travel Guide for ${escapeHTML(countryName)}...</h2>
      <p style="color: var(--muted); margin-top: 10px;">Fetching country profiles and generating AI travel guidelines for Indian passport holders.</p>
    </div>
  `;
  tabContent.classList.add("is-visible");

  // Show a nice generic image in slideshow
  if (slideshowContainer) {
    slideshowContainer.innerHTML = `
      <img src="${getOptimizedImageUrl('https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1400')}" class="slide active" alt="${escapeHTML(countryName)} background" style="opacity: 1; filter: brightness(0.65); width: 100%; height: 100%; object-fit: cover;" decoding="async" loading="lazy">
    `;
  }
  if (slideshowDots) slideshowDots.innerHTML = "";

  const cacheKey = `travelease_explore_${countryName.toLowerCase()}`;
  const cached = localStorage.getItem(cacheKey);

  let destinationData;
  if (cached) {
    try {
      destinationData = JSON.parse(cached);
      // Invalidate old bad cache from previous runs if name or capital is N/A or Country Not Found
      if (destinationData && (destinationData.name === "Country Not Found" || destinationData.capital === "N/A")) {
        destinationData = null;
        localStorage.removeItem(cacheKey);
      }
    } catch (e) {
      console.error("Failed to parse cached explore guide", e);
    }
  }

  if (!destinationData) {
    try {
      // 1. Fetch REST Countries API (with graceful fallback on failure/deprecation)
      let restData = null;
      try {
        const restRes = await fetch(apiUrl(`/api/countries/${encodeURIComponent(countryName)}`));
        if (restRes.ok) {
          const restList = await restRes.json();
          // Ensure it's not the deprecation error JSON (which doesn't have cca2)
          if (restList && Array.isArray(restList) && restList[0] && restList[0].cca2) {
            restData = restList[0];
          }
        }
      } catch (e) {
        console.warn("Proxy REST Countries API failed, falling back to Gemini database", e);
      }

      // 2. Fetch Gemini backend API
      const systemPrompt = `You are a travel assistant for Indian passport holders. You MUST return ONLY a raw JSON object (no markdown code blocks, no backticks, just raw JSON text) with the exact structure below. Do not wrap the JSON in backticks or markdown formatting.
      If the requested country is invalid, not a real country, or misspelled beyond recognition, you MUST return a JSON containing only: { "error": true }.
      {
        "officialName": "Official full name of the country (e.g. 'French Republic')",
        "capital": "Capital city (e.g. 'Paris')",
        "region": "Continent/Region (e.g. 'Europe')",
        "cca2": "2-letter country code (ISO 3166-1 alpha-2, e.g., 'FR' for France, 'DE' for Germany)",
        "languages": "Main spoken languages (comma-separated list, e.g. 'French')",
        "currencyCode": "3-letter currency code (e.g. 'EUR')",
        "currencyName": "Currency name (e.g. 'Euro')",
        "currencySymbol": "Currency symbol (e.g. '€')",
        "bestTime": "Short concise best months to visit (e.g. 'Nov to Mar' or 'May to Sep'). MUST be maximum 3-5 words, no long descriptions or brackets.",
        "visaType": "e-Visa / Visa on Arrival / Visa Required / Visa Free",
        "visaCostINR": "Estimated cost in INR or 'Free'",
        "processingTime": "Typical processing time (e.g. '3-5 business days')",
        "requiredDocuments": ["Passport valid for 6+ months", "Return ticket", "Hotel booking"],
        "simOptions": "Brief local SIM details (e.g., 'OperatorA and OperatorB are top carriers. eSIMs available.')",
        "transportApps": "Local taxi/ride-sharing apps (e.g., 'Uber, TaxiApp')",
        "emergencyNumber": "Local emergency contact number (e.g. '112')"
      }`;

      // Use the actual target country name if we fetched it, otherwise countryName
      const searchName = restData ? restData.name.common : countryName;
      const userPrompt = `Generate travel visa and local guidelines for Indian passport holders visiting ${searchName}.`;

      const chatRes = await fetch(apiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }]
        })
      });

      if (!chatRes.ok) {
        throw new Error(`Gemini API returned status ${chatRes.status}`);
      }

      const chatData = await chatRes.json();

      // Resilient JSON parsing
      let cleanText = chatData.text.trim();
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.substring(7);
      } else if (cleanText.startsWith("```")) {
        cleanText = cleanText.substring(3);
      }
      if (cleanText.endsWith("```")) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
      }
      cleanText = cleanText.trim();

      const geminiData = JSON.parse(cleanText);
      if (geminiData.error) {
        throw new Error("Invalid country name requested");
      }

      // 3. Fetch Unsplash images for the slideshow
      let imageList = [];
      try {
        const imgRes = await fetch(apiUrl(`/api/images/${encodeURIComponent(searchName)}`));
        if (imgRes.ok) {
          imageList = await imgRes.json();
        }
      } catch (err) {
        console.warn("Failed to fetch Unsplash images:", err);
      }

      // Build the destination structure
      destinationData = buildExploreDestination(restData, geminiData, countryName, imageList);

      // Cache the result
      localStorage.setItem(cacheKey, JSON.stringify(destinationData));
    } catch (error) {
      console.error("Explore guide compilation failed:", error);
      showExploreError(countryName);
      return;
    }
  }

  // Render the explore page with loaded data!
  renderExploreGuide(destinationData);
}

function buildExploreDestination(restData, geminiData, countryName, imageList = []) {
  const commonName = restData ? restData.name.common : countryName;
  const officialName = restData ? restData.name.official : (geminiData.officialName || countryName);
  const capital = restData ? (restData.capital ? restData.capital[0] : "N/A") : (geminiData.capital || "N/A");
  const region = restData ? restData.region : (geminiData.region || "N/A");
  const cca2 = restData ? restData.cca2 : (geminiData.cca2 || "us");

  // Extract currency details
  let currencyCode = "USD", currencySymbol = "$", currencyName = "US Dollar";
  if (restData) {
    const currencies = restData.currencies || {};
    const curKey = Object.keys(currencies)[0] || "";
    if (curKey) {
      currencyCode = curKey;
      currencySymbol = currencies[curKey].symbol || "";
      currencyName = currencies[curKey].name || curKey;
    }
  } else {
    currencyCode = geminiData.currencyCode || "USD";
    currencySymbol = geminiData.currencySymbol || "$";
    currencyName = geminiData.currencyName || "US Dollar";
  }

  // Extract languages
  const languageList = restData
    ? (Object.values(restData.languages || {}).join(", ") || "English")
    : (geminiData.languages || "English");

  const shortBestTime = getShortBestTime(geminiData.bestTime || geminiData.bestTimeToVisit || "Varies by region");

  // Build the unified structure
  return {
    name: commonName,
    isAI: true, // Tag it as AI-generated
    cca2: cca2,
    flag: restData ? (restData.flag || "🌍") : "🌍",
    summary: `${commonName} is a beautiful destination in ${region}. Official Name: ${officialName}. Capital: ${capital}.`,
    hero: `Explore ${commonName}`,
    heroImage: imageList[0] || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1400",
    images: imageList.length > 0 ? imageList : ["https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1400"],
    language: languageList,
    bestTime: shortBestTime,
    plugType: "Standard plug types.",
    upiAccepted: false,
    tipping: "Standard local customs apply.",
    hospitalTip: "Comprehensive travel insurance is strongly recommended for medical emergencies.",
    weather: `Typical regional weather for ${region}.`,
    visa: {
      type: geminiData.visaType || "Visa Required",
      badge: (geminiData.visaType || "").toLowerCase().includes("free") ? "green" : "blue",
      documents: geminiData.requiredDocuments || ["Passport valid for 6+ months", "Return ticket", "Hotel booking"],
      processingTime: geminiData.processingTime || "N/A",
      cost: geminiData.visaCostINR || "N/A",
      applyUrl: "https://www.google.com/search?q=" + encodeURIComponent(`${commonName} official visa application portal`),
      warnings: ["Always check official government sources for sudden visa policy changes.", "Ensure your passport has at least 2 blank pages."]
    },
    currency: {
      code: currencyCode,
      rate: `1 ${currencyCode} = (Calculated live)`,
      tip: `The local currency is ${currencyName} (${currencyCode} - ${currencySymbol}). Cards are accepted in cities, but cash is recommended for local markets.`,
      cashCard: `Carry some local currency cash for small purchases; credit cards work in major establishments.`,
      atm: `ATMs are widely available in the capital, ${capital}, and major tourist hubs.`,
      services: ["BookMyForex", "Wise Card", "Niyo Card"]
    },
    sim: {
      local: geminiData.simOptions || "Local SIM cards are available at airports and city centers.",
      carriers: (geminiData.simOptions || "").split(/[.,;]/).slice(0, 3).map(s => s.trim()).filter(Boolean),
      esim: "Airalo eSIM, Holafly eSIM",
      advice: "Buy a local tourist SIM or an international eSIM before departure for seamless connectivity.",
      airportTip: "SIM counters are located in international arrival terminals; passport registration is required."
    },
    transport: {
      cabs: (geminiData.transportApps || "").split(/[.,;]/).slice(0, 3).map(s => s.trim()).filter(Boolean),
      apps: (geminiData.transportApps || "").split(/[.,;]/).slice(0, 3).map(s => s.trim()).filter(Boolean),
      airportTip: `Pre-paid taxis and public transit link airport terminals to central ${capital}.`,
      airportCost: "Varies depending on transport method chosen.",
      publicNote: `Local transport options include ride-sharing (${geminiData.transportApps || "taxi apps"}) and public transit.`
    },
    essentials: {
      emergency: geminiData.emergencyNumber || "112",
      embassy: "Check online for the nearest Embassy of India.",
      embassyName: `Embassy of India in ${commonName} / nearby region`,
      dos: ["Respect local cultural norms, dress codes, and religious sites.", "Keep digital and printed copies of your passport and visa."],
      donts: ["Do not violate local customs or laws.", "Avoid carrying excessive cash in crowded areas."],
      tips: ["Be mindful of local laws and customs.", "Register with MADAD (Ministry of External Affairs portal) before travelling."],
      bestTime: shortBestTime
    }
  };
}

function renderExploreGuide(destination) {
  const tabContent = document.getElementById("tabContent");
  const destFlag = document.getElementById("dest-flag");
  const destName = document.getElementById("dest-name");
  const destDesc = document.getElementById("dest-description");

  if (destName) destName.textContent = destination.name;
  if (destDesc) destDesc.textContent = destination.summary;
  if (destFlag) {
    const cca2 = (destination.cca2 || "us").toLowerCase();
    destFlag.innerHTML = `<img src="https://flagcdn.com/h60/${cca2}.png" alt="" style="height: 38px; width: auto; vertical-align: middle; border-radius: 3px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">`;
  }

  // Register dynamic images and initialize the slideshow
  if (destination.images) {
    countryImages[destination.name] = destination.images;
    initSlideshow(destination.name);
  }

  renderQuickSummary(destination);
  setupShareGuide();

  // Overriding tab buttons click listeners for explore guide
  const buttons = Array.from(document.querySelectorAll(".tab-button"));
  const renderExploreTab = (tabName) => {
    const currentButtons = Array.from(document.querySelectorAll(".tab-button"));
    currentButtons.forEach((button) => {
      const isActive = button.dataset.tab === tabName;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });
    tabContent.classList.remove("is-visible");

    // Construct tab markup and append disclaimer banner
    const disclaimer = `
      <div class="ai-disclaimer-banner" style="background: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 12px 18px; border-radius: 6px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; font-size: 0.9rem;">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 1.1rem; color: #b58105;"></i>
        <span><strong>AI-Generated Guide:</strong> This travel information is dynamically compiled using artificial intelligence and the REST Countries API. Always verify entry conditions and fees on official embassy websites before booking your travel.</span>
      </div>
    `;

    tabContent.innerHTML = disclaimer + getTabMarkup(tabName, destination);

    if (tabName === "visa") {
      highlightVisaType(destination.visa.type);
    } else if (tabName === "currency") {
      updateCurrencyDisplay(destination.currency.code);
    }
    requestAnimationFrame(() => tabContent.classList.add("is-visible"));
  };

  // Re-bind listeners for explore mode tabs
  buttons.forEach((button) => {
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    newButton.addEventListener("click", () => renderExploreTab(newButton.dataset.tab));
  });

  const urlParams = new URLSearchParams(window.location.search);
  const activeTab = urlParams.get("tab") || "visa";
  // Enable community comments section for explore guide destinations
  setupCommentsSection(destination.name);
}

function showExploreError(countryName) {
  const tabContent = document.getElementById("tabContent");
  const destFlag = document.getElementById("dest-flag");
  const destName = document.getElementById("dest-name");
  const destDesc = document.getElementById("dest-description");
  const quickSummaryGrid = document.getElementById("quickSummaryGrid");
  const commentsSection = document.getElementById("communitySection");

  if (destName) destName.textContent = countryName;
  if (destDesc) destDesc.textContent = "Compilation failed.";
  if (destFlag) destFlag.innerHTML = "🌍";
  if (quickSummaryGrid) quickSummaryGrid.innerHTML = "";
  if (commentsSection) commentsSection.style.display = "none";

  if (tabContent) {
    tabContent.innerHTML = `
      <div class="error-card" style="padding: 50px 20px; text-align: center; border: 1px solid var(--line); border-radius: 8px; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.05); max-width: 500px; margin: 40px auto;">
        <i class="fa-solid fa-circle-exclamation" style="font-size: 3.5rem; color: var(--red); margin-bottom: 20px;"></i>
        <h3 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 10px;">Couldn't fetch travel info</h3>
        <p style="color: var(--muted); margin-bottom: 24px; line-height: 1.5;">We were unable to retrieve the country profile or generate travel guidelines for <strong>${escapeHTML(countryName)}</strong>. Please verify the spelling or try again.</p>
        <button class="primary-button" onclick="window.location.reload()" style="display: inline-flex; align-items: center; justify-content: center;">
          <i class="fa-solid fa-arrows-rotate" style="margin-right: 8px;"></i> Try Again
        </button>
      </div>
    `;
    tabContent.classList.add("is-visible");
  }
}

// --- TravelEase Footer Logic ---
window.openSidebarPanel = function (panelName) {
  const sidebar = document.getElementById("sidebar");
  const toggleIcon = document.getElementById("toggleIcon");

  if (sidebar && !sidebar.classList.contains("expanded")) {
    sidebar.classList.add("expanded");
    document.body.classList.add("sidebar-expanded");
    if (toggleIcon) toggleIcon.className = "fa-solid fa-chevron-left";
  }

  const btn = document.querySelector(`.nav-icon-btn[data-target="${panelName}"]`);
  if (btn) {
    btn.click();
  } else {
    document.querySelectorAll(".sidebar-panel").forEach((panel) => {
      panel.classList.remove("active");
      if (panel.id === `panel-${panelName}`) {
        panel.classList.add("active");
      }
    });
  }
};

window.openChatWidget = function () {
  const panel = document.querySelector(".chat-panel");
  if (panel) {
    panel.classList.add("open");
    const input = document.getElementById("chatInput");
    if (input) input.focus();
  }
};

function setupFooter() {
  // 1. Stats Counter Animation using IntersectionObserver
  const statsStrip = document.querySelector(".footer-stats-strip");
  const statNumbers = document.querySelectorAll(".stat-number");

  const animateCounters = () => {
    statNumbers.forEach(counter => {
      const target = parseFloat(counter.getAttribute("data-target") || "0");
      const suffix = counter.getAttribute("data-suffix") || "";
      const prefix = counter.getAttribute("data-prefix") || "";
      const isDecimal = counter.getAttribute("data-decimal") === "true";
      const duration = 2000; // 2 seconds
      const startTime = performance.now();

      const updateCount = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        const currentVal = easeProgress * target;

        if (isDecimal) {
          counter.textContent = prefix + currentVal.toFixed(1) + suffix;
        } else {
          counter.textContent = prefix + Math.floor(currentVal).toLocaleString() + suffix;
        }

        if (progress < 1) {
          requestAnimationFrame(updateCount);
        } else {
          if (isDecimal) {
            counter.textContent = prefix + target.toFixed(1) + suffix;
          } else {
            counter.textContent = prefix + Math.floor(target).toLocaleString() + suffix;
          }
        }
      };
      requestAnimationFrame(updateCount);
    });
  };

  if (statsStrip && statNumbers.length > 0) {
    if (typeof IntersectionObserver !== "undefined") {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounters();
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      observer.observe(statsStrip);
    } else {
      animateCounters(); // fallback if IntersectionObserver is not supported
    }
  }

  // 2. Newsletter Signup Submit Handler
  const newsletterForm = document.getElementById("footerNewsletterForm");
  const newsletterEmail = document.getElementById("footerNewsletterEmail");
  const newsletterMsg = document.getElementById("newsletterMsg");

  if (newsletterForm) {
    newsletterForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = newsletterEmail.value.trim();

      if (!email) {
        showNewsletterMsg("Please enter an email address.", "error");
        return;
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
      if (!emailRegex.test(email)) {
        showNewsletterMsg("Invalid email format", "error");
        return;
      }

      newsletterMsg.textContent = "";

      try {
        const res = await fetch(apiUrl("/api/newsletter/subscribe"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        const data = await res.json();

        if (res.ok) {
          showNewsletterMsg("You're subscribed! ✈️", "success");
          newsletterEmail.value = "";
        } else {
          showNewsletterMsg(data.error || "Failed to subscribe.", "error");
        }
      } catch (err) {
        showNewsletterMsg("Network error. Please try again later.", "error");
      }
    });
  }

  function showNewsletterMsg(msg, type) {
    if (!newsletterMsg) return;
    newsletterMsg.textContent = msg;
    newsletterMsg.className = `newsletter-msg ${type}`;
  }

  // 3. Contact Us Form Handler inside Contact Modal
  const contactForm = document.getElementById("footerContactForm");
  const contactName = document.getElementById("footerContactName");
  const contactEmail = document.getElementById("footerContactEmail");
  const contactMessage = document.getElementById("footerContactMessage");
  const contactSuccess = document.getElementById("contactSuccessMsg");
  const contactError = document.getElementById("contactErrorMsg");

  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = contactName.value.trim();
      const email = contactEmail.value.trim();
      const message = contactMessage.value.trim();

      if (!name || !email || !message) {
        showContactFeedback("All fields are required.", "error");
        return;
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
      if (!emailRegex.test(email)) {
        showContactFeedback("Invalid email format", "error");
        return;
      }

      clearContactFeedback();

      try {
        const res = await fetch(apiUrl("/api/contact"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, message })
        });
        const data = await res.json();

        if (res.ok) {
          showContactFeedback("Message sent successfully! ✈️", "success");
          contactForm.reset();
          setTimeout(() => {
            closeModal("contactModal");
            clearContactFeedback();
          }, 1500);
        } else {
          showContactFeedback(data.error || "Failed to send message.", "error");
        }
      } catch (err) {
        showContactFeedback("Network error. Please try again later.", "error");
      }
    });
  }

  function showContactFeedback(msg, type) {
    if (type === "success") {
      if (contactSuccess) {
        contactSuccess.textContent = msg;
        contactSuccess.style.display = "block";
      }
      if (contactError) contactError.style.display = "none";
    } else {
      if (contactError) {
        contactError.textContent = msg;
        contactError.style.display = "block";
      }
      if (contactSuccess) contactSuccess.style.display = "none";
    }
  }

  function clearContactFeedback() {
    if (contactSuccess) {
      contactSuccess.textContent = "";
      contactSuccess.style.display = "none";
    }
    if (contactError) {
      contactError.textContent = "";
      contactError.style.display = "none";
    }
  }

  // 4. Testimonials Rendering (Top Liked Comments Fetch + Fallbacks)
  const testimonialsContainer = document.getElementById("testimonialsContainer");
  const fallbackTestimonials = [
    {
      stars: 5,
      text: "Visa-free entry to Thailand was a breeze. TravelEase's guide on required cash and return tickets was 100% accurate!",
      userName: "Rohan Gupta",
      countryCode: "THAILAND"
    },
    {
      stars: 5,
      text: "I was nervous about my first trip to the UK. The cash vs card tips saved me from paying high ATM conversion fees.",
      userName: "Priya Sharma",
      countryCode: "UNITED KINGDOM"
    },
    {
      stars: 5,
      text: "eSIM setup in Singapore was so smooth because I bought it beforehand as suggested. Highly recommend this guide!",
      userName: "Sujit Kumar",
      countryCode: "SINGAPORE"
    }
  ];

  const renderTestimonials = (items) => {
    if (!testimonialsContainer) return;
    testimonialsContainer.innerHTML = items.map(item => {
      const starIcons = Array(item.stars || 5).fill('<i class="fa-solid fa-star"></i>').join("");
      const quoteText = item.text || "";
      const author = item.userName || "Traveler";
      const destination = item.countryCode || "General";
      return `
        <div class="testimonial-card">
          <div class="testimonial-stars">${starIcons}</div>
          <p class="testimonial-quote">"${quoteText}"</p>
          <div>
            <h4 class="testimonial-author">${author}</h4>
            <div class="testimonial-destination">${destination}</div>
          </div>
        </div>
      `;
    }).join("");
  };

  if (testimonialsContainer) {
    fetch(apiUrl("/api/comments/top/testimonials"))
      .then(res => {
        if (!res.ok) throw new Error("Fetch failed");
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length >= 3) {
          const formatted = data.map(c => ({
            stars: 5,
            text: c.text,
            userName: c.userName,
            countryCode: c.countryCode
          }));
          renderTestimonials(formatted);
        } else {
          renderTestimonials(fallbackTestimonials);
        }
      })
      .catch(() => {
        renderTestimonials(fallbackTestimonials);
      });
  }
}

function initTipsCarousel() {
  const track = document.querySelector(".carousel-track");
  if (!track) return;

  const originalCards = Array.from(track.children);
  if (originalCards.length === 0) return;

  const prevBtn = document.querySelector(".prev-arrow");
  const nextBtn = document.querySelector(".next-arrow");
  const dotsContainer = document.querySelector(".carousel-dots-container");

  const cardCount = originalCards.length; // 8
  let currentIndex = 3; // Start at the first original card (since we prepended 3 clones)

  // Clone nodes for infinite scroll
  // Prepend clones of the last 3 cards
  for (let i = cardCount - 3; i < cardCount; i++) {
    const clone = originalCards[i].cloneNode(true);
    clone.classList.add("clone");
    track.insertBefore(clone, track.firstChild);
  }
  // Append clones of the first 3 cards
  for (let i = 0; i < 3; i++) {
    const clone = originalCards[i].cloneNode(true);
    clone.classList.add("clone");
    track.appendChild(clone);
  }

  // Create dot indicators
  if (dotsContainer) {
    dotsContainer.innerHTML = "";
    for (let i = 0; i < cardCount; i++) {
      const dot = document.createElement("button");
      dot.className = "carousel-dot" + (i === 0 ? " active" : "");
      dot.setAttribute("aria-label", `Go to tip ${i + 1}`);
      dot.addEventListener("click", () => {
        goToIndex(i + 3); // Map original index to track index
      });
      dotsContainer.appendChild(dot);
    }
  }

  const dots = dotsContainer ? Array.from(dotsContainer.children) : [];

  function getVisibleCardsCount() {
    if (window.innerWidth <= 768) return 1;
    if (window.innerWidth <= 940) return 2;
    return 3;
  }

  function getCardWidth() {
    const firstCard = track.children[0];
    if (firstCard) {
      return firstCard.getBoundingClientRect().width;
    }
    return 0;
  }

  function updateSlide(withTransition = true) {
    const cardWidth = getCardWidth();
    const gap = parseFloat(window.getComputedStyle(track).gap) || 24;
    const amountToMove = (cardWidth + gap) * currentIndex;

    if (withTransition) {
      track.style.transition = "transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    } else {
      track.style.transition = "none";
    }

    track.style.transform = `translateX(-${amountToMove}px)`;

    // Update active dot
    if (dots.length > 0) {
      dots.forEach(d => d.classList.remove("active"));
      let activeDotIndex = (currentIndex - 3) % cardCount;
      if (activeDotIndex < 0) activeDotIndex += cardCount;
      if (dots[activeDotIndex]) {
        dots[activeDotIndex].classList.add("active");
      }
    }
  }

  function handleTransitionEnd() {
    // If reached end clone, jump to start original
    if (currentIndex >= cardCount + 3) {
      track.style.transition = "none";
      currentIndex -= cardCount;
      updateSlide(false);
    }
    // If reached start clone, jump to end original
    if (currentIndex < 3) {
      track.style.transition = "none";
      currentIndex += cardCount;
      updateSlide(false);
    }
  }

  track.addEventListener("transitionend", handleTransitionEnd);

  function goToIndex(index) {
    currentIndex = index;
    updateSlide(true);
    resetAutoScroll();
  }

  function slideNext() {
    currentIndex++;
    updateSlide(true);
  }

  function slidePrev() {
    currentIndex--;
    updateSlide(true);
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      slideNext();
      resetAutoScroll();
    });
  }
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      slidePrev();
      resetAutoScroll();
    });
  }

  // Auto-scroll every 3.5 seconds
  let autoScrollTimer = setInterval(slideNext, 3500);

  function resetAutoScroll() {
    clearInterval(autoScrollTimer);
    autoScrollTimer = setInterval(slideNext, 3500);
  }

  // Pause on hover
  const carouselWrapper = document.querySelector(".travel-tips-carousel-wrapper");
  if (carouselWrapper) {
    carouselWrapper.addEventListener("mouseenter", () => {
      clearInterval(autoScrollTimer);
    });
    carouselWrapper.addEventListener("mouseleave", () => {
      resetAutoScroll();
    });
  }

  // Touch swipe support (minimum swipe distance 50px)
  let touchStartX = 0;
  let touchEndX = 0;

  track.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  track.addEventListener("touchend", (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipeGesture();
  }, { passive: true });

  function handleSwipeGesture() {
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swiped left -> show next slide
        slideNext();
      } else {
        // Swiped right -> show prev slide
        slidePrev();
      }
      resetAutoScroll();
    }
  }

  // Recalculate on window resize
  window.addEventListener("resize", () => {
    currentIndex = 3;
    updateSlide(false);
  });

  // Initial update after DOM settling
  setTimeout(() => {
    updateSlide(false);
  }, 150);
}

async function setupPlacesWidget() {
  const getPlacesBtn = document.getElementById('getPlacesBtn');
  const placesContent = document.getElementById('placesContent');
  const categoryFilters = document.getElementById('placesCategoryFilters');
  const interestPills = document.querySelectorAll('#panel-places .interest-pill');

  if (!getPlacesBtn || !placesContent) return;

  let loadedPlaces = []; // cache recommendations locally

  // Toggle interest pills
  interestPills.forEach(pill => {
    pill.addEventListener('click', () => {
      pill.classList.toggle('active');
    });
  });

  // Handle category filtering
  if (categoryFilters) {
    const chips = categoryFilters.querySelectorAll('.filter-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const category = chip.dataset.category;
        renderPlacesList(loadedPlaces, category);
      });
    });
  }

  // Trigger loading recommendations
  async function fetchRecommendations() {
    const user = getCurrentUser();
    if (!user || !user.destination) {
      placesContent.innerHTML = `
        <div class="places-error-container">
          <i class="fa-solid fa-earth-americas" style="color: var(--blue); opacity: 0.7;"></i>
          <p style="margin-top: 10px; font-weight: 600;">No Destination Selected</p>
          <p style="font-size: 0.82rem; margin-bottom: 12px;">Please set a destination in your profile first to get recommendations.</p>
          <button class="primary-button" id="placesOpenProfileBtn" style="padding: 6px 12px; font-size: 0.8rem; font-weight: bold; border-radius: 6px;">
            Open Profile
          </button>
        </div>
      `;
      const openBtn = document.getElementById('placesOpenProfileBtn');
      if (openBtn) {
        openBtn.addEventListener('click', () => openModal('profileModal'));
      }
      if (categoryFilters) categoryFilters.style.display = 'none';
      return;
    }

    const destination = user.destination;
    const travelPurpose = user.tripPurpose || 'tourism';

    // Map tripPurpose for Gemini
    let purposeStr = 'Tourist';
    if (travelPurpose === 'business') purposeStr = 'Business';
    else if (travelPurpose === 'education') purposeStr = 'Student';
    else if (travelPurpose === 'other') purposeStr = 'Family';

    const activePills = document.querySelectorAll('#panel-places .interest-pill.active');
    const interests = Array.from(activePills).map(pill => pill.dataset.interest);

    // Show loading skeleton
    if (categoryFilters) categoryFilters.style.display = 'none';
    placesContent.innerHTML = Array(3).fill(0).map(() => `
      <div class="place-skeleton">
        <div class="place-skeleton-img"></div>
        <div class="place-skeleton-body">
          <div class="place-skeleton-title"></div>
          <div class="place-skeleton-text"></div>
          <div class="place-skeleton-text short"></div>
        </div>
      </div>
    `).join('');

    try {
      // Parallel fetch saved places if logged in to display active bookmarks
      let savedSet = new Set();
      const token = getToken();
      if (token) {
        try {
          const savedRes = await fetch(apiUrl('/api/saved-places'), {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (savedRes.ok) {
            const savedData = await savedRes.json();
            savedData.forEach(item => {
              if (item.destination.toLowerCase() === destination.toLowerCase()) {
                savedSet.add(item.name.toLowerCase());
              }
            });
          }
        } catch (err) {
          console.warn('Failed to load saved places for marking active bookmarks:', err);
        }
      }

      const res = await fetch(apiUrl('/api/places-to-visit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, travelPurpose: purposeStr, interests })
      });

      if (!res.ok) {
        throw new Error('API failed');
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format');
      }

      // Add "isSaved" flag based on user's current saved places
      loadedPlaces = data.map(place => ({
        ...place,
        isSaved: savedSet.has(place.name.toLowerCase())
      }));

      if (categoryFilters) {
        categoryFilters.style.display = 'flex';
        // Reset active filter tab to "All"
        const chips = categoryFilters.querySelectorAll('.filter-chip');
        chips.forEach(c => c.classList.toggle('active', c.dataset.category === 'All'));
      }

      renderPlacesList(loadedPlaces, 'All');
    } catch (error) {
      console.error(error);
      placesContent.innerHTML = `
        <div class="places-error-container">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p style="margin-top: 10px; font-weight: 600;">Failed to load places</p>
          <p style="font-size: 0.82rem; margin-bottom: 12px;">We encountered an error contacting the travel assistant.</p>
          <button class="primary-button" id="placesRetryBtn" style="padding: 6px 12px; font-size: 0.8rem; font-weight: bold; border-radius: 6px;">
            Retry
          </button>
        </div>
      `;
      const retryBtn = document.getElementById('placesRetryBtn');
      if (retryBtn) {
        retryBtn.addEventListener('click', fetchRecommendations);
      }
      if (categoryFilters) categoryFilters.style.display = 'none';
    }
  }

  getPlacesBtn.addEventListener('click', fetchRecommendations);

  // Render places to the list
  function renderPlacesList(places, filterCategory = 'All') {
    const filtered = filterCategory === 'All'
      ? places
      : places.filter(p => p.category.toLowerCase() === filterCategory.toLowerCase());

    if (filtered.length === 0) {
      placesContent.innerHTML = `
        <div style="text-align: center; padding: 30px 10px; color: var(--muted); font-size: 0.85rem;">
          No recommendations found for category "${filterCategory}".
        </div>
      `;
      return;
    }

    placesContent.innerHTML = filtered.map(place => {
      const categoryClass = place.category.toLowerCase().replace(' ', '-');
      const isSavedClass = place.isSaved ? 'saved' : '';
      const bookmarkIcon = place.isSaved ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark';

      return `
        <div class="place-card">
          <div class="place-card-image-wrapper">
            <img src="${escapeHTML(place.photoUrl || getPlaceFallbackImage(place.category))}" class="place-card-img" alt="${escapeHTML(place.name)}" loading="lazy" onerror="this.onerror=null; this.src=getPlaceFallbackImage('${escapeHTML(place.category || '')}');">
            <button class="place-bookmark-btn ${isSavedClass}" data-place-name="${escapeHTML(place.name)}" aria-label="Bookmark place">
              <i class="${bookmarkIcon}"></i>
            </button>
          </div>
          <div class="place-card-body">
            <div class="place-card-header">
              <h4 class="place-title">${escapeHTML(place.name)}</h4>
              <span class="place-badge ${categoryClass}">${escapeHTML(place.category)}</span>
            </div>
            <p class="place-desc">${escapeHTML(place.description)}</p>
            <div class="place-meta">
              <span><i class="fa-regular fa-clock"></i> ${escapeHTML(place.estimatedDuration)}</span>
            </div>
            <div class="place-meta" style="margin-top: -4px;">
              <span><i class="fa-regular fa-lightbulb"></i> <strong>Tip:</strong> ${escapeHTML(place.tip)}</span>
            </div>
            <p class="place-relevance">
              <i class="fa-solid fa-circle-info" style="color: var(--blue); margin-right: 4px;"></i>
              ${escapeHTML(place.relevanceReason)}
            </p>
          </div>
        </div>
      `;
    }).join('');

    // Attach bookmark click listeners
    const bookmarkBtns = placesContent.querySelectorAll('.place-bookmark-btn');
    bookmarkBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const placeName = btn.dataset.placeName;
        const placeObj = places.find(p => p.name === placeName);
        if (!placeObj) return;

        const token = getToken();
        if (!token) {
          showToast("Please log in to save places to your trip!", "warning");
          openModal("loginModal");
          return;
        }

        const countryInput = document.getElementById("placesCountrySearch") || document.getElementById("searchCountryInput");
        const searchedDest = countryInput ? countryInput.value.trim() : "";
        const user = getCurrentUser();
        const destination = searchedDest || placeObj.destination || (user && user.destination ? user.destination : "") || "General";

        try {
          const res = await fetch(apiUrl('/api/saved-places'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              name: placeObj.name,
              category: placeObj.category,
              description: placeObj.description,
              estimatedDuration: placeObj.estimatedDuration,
              tip: placeObj.tip,
              relevanceReason: placeObj.relevanceReason,
              photoUrl: placeObj.photoUrl,
              destination
            })
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            if (res.status === 401) {
              showToast("Session expired or login required. Please log in again.", "warning");
              openModal("loginModal");
              return;
            }
            throw new Error(errData.error || "Save failed");
          }

          const responseData = await res.json();
          placeObj.isSaved = responseData.saved;

          // Toggle button styling
          btn.classList.toggle('saved', responseData.saved);
          const icon = btn.querySelector('i');
          if (icon) {
            icon.className = responseData.saved ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark';
          }

          showToast(responseData.message, "success");

          // Trigger update to the Traveler Dashboard if we are on the mytrip page
          if (window.loadSavedPlaces) {
            window.loadSavedPlaces();
          }
        } catch (err) {
          console.error(err);
          showToast(err.message || "Failed to update saved places. Please try again.", "error");
        }
      });
    });
  }

  // Pre-load if destination is set and user opens panel
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.attributeName === 'class') {
        const panel = document.getElementById('panel-places');
        if (panel && panel.classList.contains('active') && loadedPlaces.length === 0) {
          const user = getCurrentUser();
          if (user && user.destination) {
            fetchRecommendations();
          }
        }
      }
    });
  });

  const placesPanel = document.getElementById('panel-places');
  if (placesPanel) {
    observer.observe(placesPanel, { attributes: true });
  }
}

function getPlaceFallbackImage(category, idx = 0) {
  const cat = (category || '').toLowerCase();

  const naturePhotos = [
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop'
  ];
  const foodPhotos = [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&auto=format&fit=crop'
  ];
  const culturePhotos = [
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop'
  ];
  const hiddenPhotos = [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop'
  ];
  const neutralLandmarkPhotos = [
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1476514525535-ce74f45814d0?w=800&auto=format&fit=crop'
  ];

  let list = neutralLandmarkPhotos;
  if (cat.includes('nature') || cat.includes('park') || cat.includes('outdoor')) list = naturePhotos;
  else if (cat.includes('food') || cat.includes('dining') || cat.includes('restaurant')) list = foodPhotos;
  else if (cat.includes('culture') || cat.includes('museum') || cat.includes('history')) list = culturePhotos;
  else if (cat.includes('hidden') || cat.includes('gem') || cat.includes('beach')) list = hiddenPhotos;

  return list[Math.abs(idx) % list.length];
}

