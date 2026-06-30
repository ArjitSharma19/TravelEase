// mytrip.js - "My Trip" dashboard page-specific logic

document.addEventListener("DOMContentLoaded", () => {
  // Check auth immediately
  const user = getLoggedInUser();
  if (!user) {
    window.location.href = 'index.html?login=true';
    return;
  }

  // Intercept and wrap window.renderChecklist to also update the stats card in real-time
  const originalRenderChecklist = window.renderChecklist;
  window.renderChecklist = function(checklist) {
    if (originalRenderChecklist) {
      originalRenderChecklist(checklist);
    }
    
    // Update our checklist stat card
    const statChecklist = document.getElementById('statChecklist');
    if (statChecklist) {
      const completed = checklist.filter(item => item.completed).length;
      statChecklist.textContent = `${completed} of ${checklist.length} done`;
    }
  };

  // Load user data and render
  loadTripSummary();

  // Setup click handlers for Edit Trip details (reuses index.html modals)
  setupDashboardEditHandlers();

  // Setup click handlers for Quick Guides Links
  setupQuickLinks();

  // Setup AI Quick Ask widget
  setupQuickAsk();

  // Session monitor to redirect if the user logs out
  setInterval(() => {
    if (!getLoggedInUser()) {
      window.location.href = 'index.html?login=true';
    }
  }, 1000);
});

// Helper to get logged-in user with multiple fallback keys
function getLoggedInUser() {
  const traveleaseUser = localStorage.getItem("travelease_user");
  const standardUser = localStorage.getItem("user");
  
  if (traveleaseUser) return JSON.parse(traveleaseUser);
  if (standardUser) return JSON.parse(standardUser);
  return null;
}

// Fetch and load trip details from server
async function loadTripSummary() {
  const user = getLoggedInUser();
  if (!user) {
    window.location.href = 'index.html?login=true';
    return;
  }

  try {
    // Determine target host dynamically (support relative path)
    const host = window.location.origin;
    const res = await fetch(`${host}/api/trip/summary/${encodeURIComponent(user.email)}`);
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }
    
    const data = await res.json();
    
    // Check if user has planned a trip yet
    if (!data.tripDetails || !data.tripDetails.destination) {
      showEmptyState();
      return;
    }

    // Show dashboard view, hide empty state
    document.getElementById("dashboardView").style.display = "block";
    document.getElementById("emptyStateView").style.display = "none";

    renderTripHeader(data.tripDetails);
    renderQuickStats(data);
    
    // Save to local storage for compatibility with script.js checklist functions
    localStorage.setItem('currentChecklist', JSON.stringify(data.checklist));
    if (window.renderChecklist) {
      window.renderChecklist(data.checklist);
    }
    
    renderFlightCard(data.bookedFlights);
  } catch (error) {
    console.error('Failed to load trip summary:', error);
    showErrorState();
  }
}

// Render Trip Hero details (Flag, Country, Purpose badge, Background Image)
function renderTripHeader(tripDetails) {
  const heroBanner = document.getElementById("tripHeroBanner");
  const heroFlag = document.getElementById("dashboardHeroFlag");
  const heroCountry = document.getElementById("dashboardHeroCountry");
  const heroPurpose = document.getElementById("dashboardHeroPurpose");
  const heroCountdown = document.getElementById("dashboardHeroCountdown");

  if (!tripDetails) return;

  // Find country details in DESTINATIONS
  const countryKey = Object.keys(DESTINATIONS).find(
    k => k.toLowerCase() === tripDetails.destination.toLowerCase() || DESTINATIONS[k].name.toLowerCase() === tripDetails.destination.toLowerCase()
  );
  
  const countryData = countryKey ? DESTINATIONS[countryKey] : null;

  if (heroFlag) {
    if (countryData) {
      const code2 = (window.getCountryCode2 ? window.getCountryCode2(countryKey) : countryKey).toLowerCase();
      heroFlag.innerHTML = `<img src="https://flagcdn.com/h80/${code2}.png" alt="" style="height: 36px; width: auto; vertical-align: middle; border-radius: 3px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">`;
    } else {
      heroFlag.textContent = "🌍";
    }
  }
  
  if (heroCountry) {
    heroCountry.textContent = countryData ? countryData.name : tripDetails.destination;
  }

  if (heroPurpose) {
    heroPurpose.textContent = tripDetails.purpose || "tourism";
  }

  // Calculate Countdown
  if (heroCountdown && tripDetails.departureDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const depDate = new Date(tripDetails.departureDate);
    depDate.setHours(0, 0, 0, 0);
    
    const timeDiff = depDate - today;
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    if (daysDiff > 0) {
      heroCountdown.textContent = `${daysDiff} days until departure`;
      heroCountdown.style.display = "inline-block";
    } else if (daysDiff === 0) {
      heroCountdown.textContent = `Departure is today!`;
      heroCountdown.style.display = "inline-block";
    } else {
      heroCountdown.textContent = `Hope you had a safe trip!`;
      heroCountdown.style.display = "inline-block";
    }
  } else if (heroCountdown) {
    heroCountdown.style.display = "none";
  }

  // Set premium background image from data.js
  if (heroBanner && countryData && countryData.heroImage) {
    heroBanner.style.backgroundImage = `url('${countryData.heroImage}')`;
  }
}

// Render Stats Card row
function renderQuickStats(data) {
  // Checklist Card
  const statChecklist = document.getElementById('statChecklist');
  if (statChecklist && data.checklist) {
    const completed = data.checklist.filter(item => item.completed).length;
    statChecklist.textContent = `${completed} of ${data.checklist.length} done`;
  }

  // Passport Expiry Status Card
  const expiryStatus = checkPassportStatus(data.passportExpiry);
  const statPassport = document.getElementById('statPassport');
  const passportIcon = document.getElementById('statPassportIcon');
  if (statPassport) {
    statPassport.textContent = expiryStatus.message;
    statPassport.style.color = expiryStatus.status === 'warning' ? 'var(--red)' : 'var(--green)';
  }
  if (passportIcon) {
    passportIcon.className = `stat-icon ${expiryStatus.status === 'warning' ? 'red' : 'green'}`;
  }

  // Booked Flights Card
  const statFlight = document.getElementById('statFlight');
  const flightIcon = document.getElementById('statFlightIcon');
  const hasFlight = data.bookedFlights && data.bookedFlights.length > 0;
  if (statFlight) {
    if (hasFlight) {
      statFlight.textContent = `PNR: ${data.bookedFlights[0].pnr}`;
      statFlight.style.color = 'var(--green)';
      if (flightIcon) flightIcon.className = 'stat-icon green';
    } else {
      statFlight.textContent = 'Not Booked';
      statFlight.style.color = 'var(--muted)';
      if (flightIcon) flightIcon.className = 'stat-icon orange';
    }
  }

  // Days until departure Card
  const statDeparture = document.getElementById('statDeparture');
  const departureIcon = document.getElementById('statDepartureIcon');
  if (statDeparture) {
    if (data.tripDetails && data.tripDetails.departureDate) {
      const today = new Date();
      today.setHours(0,0,0,0);
      const depDate = new Date(data.tripDetails.departureDate);
      depDate.setHours(0,0,0,0);
      const daysLeft = Math.ceil((depDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysLeft > 0) {
        statDeparture.textContent = `${daysLeft} days`;
        statDeparture.style.color = 'var(--ink)';
      } else if (daysLeft === 0) {
        statDeparture.textContent = 'Today';
        statDeparture.style.color = 'var(--blue)';
      } else {
        statDeparture.textContent = 'Departed';
        statDeparture.style.color = 'var(--muted)';
      }
    } else {
      statDeparture.textContent = 'Not Set';
      statDeparture.style.color = 'var(--muted)';
    }
  }
}

// Passport Expiry logic
function checkPassportStatus(expiryDate) {
  if (!expiryDate) {
    return { status: 'warning', message: 'No passport details' };
  }
  const monthsLeft = (new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24 * 30);
  return monthsLeft < 6 
    ? { status: 'warning', message: 'Renew soon — under 6 months validity' }
    : { status: 'good', message: 'Valid for travel' };
}

// Flight Details Card Rendering
function renderFlightCard(bookedFlights) {
  const container = document.getElementById("flightCardContainer");
  if (!container) return;

  if (bookedFlights && bookedFlights.length > 0) {
    const flight = bookedFlights[0];
    const depDateStr = new Date(flight.departureTime).toLocaleDateString("en-IN", {day:'numeric', month:'short', year:'numeric'});
    const depTimeStr = new Date(flight.departureTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', hour12: false});
    
    container.innerHTML = `
      <div class="boarding-pass" style="width: 100%; box-shadow: none; border: 1px solid var(--line); border-radius: 8px;">
        <div class="pass-header">
          <span class="pass-logo" style="color: var(--blue);">✈️ TravelEase</span>
          <span class="pass-pnr-label" style="font-size:0.78rem;">PNR: <strong id="passPNR" style="color: var(--ink); font-size:0.85rem;">${escapeHTML(flight.pnr)}</strong></span>
        </div>
        
        <div class="pass-flight-info" style="padding: 15px 0;">
          <div class="pass-airport">
            <h3 style="margin:0; font-size: 1.4rem; font-weight:700;">${escapeHTML(flight.origin)}</h3>
            <p style="margin:0; font-size:0.8rem; color:var(--muted);">Origin</p>
          </div>
          <div class="pass-arrow">
            <span style="font-weight: 700; font-size:0.8rem;">${escapeHTML(flight.flightNumber)}</span>
            <i class="fa-solid fa-plane" style="margin-top: 5px; color: var(--blue);"></i>
          </div>
          <div class="pass-airport text-right">
            <h3 style="margin:0; font-size: 1.4rem; font-weight:700;">${escapeHTML(flight.destination)}</h3>
            <p style="margin:0; font-size:0.8rem; color:var(--muted);">Destination</p>
          </div>
        </div>

        <div class="pass-details-grid" style="padding-top: 10px;">
          <div class="pass-detail-item">
            <span>PASSENGER</span>
            <strong style="font-size:0.85rem;">${escapeHTML(flight.passengerName)}</strong>
          </div>
          <div class="pass-detail-item">
            <span>SEAT</span>
            <strong style="font-size:0.85rem;">${escapeHTML(flight.seat ? flight.seat.split(' ')[0] : '12A')}</strong>
          </div>
          <div class="pass-detail-item">
            <span>DATE</span>
            <strong style="font-size:0.85rem;">${depDateStr}</strong>
          </div>
          <div class="pass-detail-item">
            <span>DEPARTURE</span>
            <strong style="font-size:0.85rem;">${depTimeStr}</strong>
          </div>
        </div>

        <div class="pass-footer" style="padding-top: 15px;">
          <div class="pass-barcode" style="height: 30px;">
            <div class="barcode-stripe"></div>
          </div>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="flight-cta-container">
        <p>No flight bookings saved on your profile yet.</p>
        <a href="index.html?action=searchFlights" class="primary-button" style="display:inline-flex; align-items:center;">
          <i class="fa-solid fa-magnifying-glass" style="margin-right:8px;"></i> Search & Book Flights
        </a>
      </div>
    `;
  }
}

// Bind click handlers to quick links grid
function setupQuickLinks() {
  const grid = document.getElementById("quickLinksGrid");
  if (!grid) return;

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".quick-link-btn");
    if (!btn) return;

    const tab = btn.dataset.tab;
    const user = getLoggedInUser();
    if (user && user.destination) {
      window.location.href = `destination.html?country=${encodeURIComponent(user.destination)}&tab=${encodeURIComponent(tab)}`;
    }
  });
}

// Bind Edit Trip buttons to trigger standard profileModal
function setupDashboardEditHandlers() {
  const editBtn = document.getElementById("dashboardHeroEditBtn");
  const ctaBtn = document.getElementById("emptyStateCTA");

  const openProfileEditor = () => {
    const user = getLoggedInUser();
    if (user) {
      document.getElementById("profileName").value = user.name || "";
      document.getElementById("profilePassportExpiry").value = user.passportExpiry ? user.passportExpiry.substring(0, 10) : "";
      document.getElementById("profileDestination").value = user.destination || "";
      document.getElementById("profileTravelDateFrom").value = user.travelDateFrom ? user.travelDateFrom.substring(0, 10) : "";
      document.getElementById("profileTravelDateTo").value = user.travelDateTo ? user.travelDateTo.substring(0, 10) : "";
      document.getElementById("profileTripPurpose").value = user.tripPurpose || "tourism";
      document.getElementById("profileFirstTime").checked = !!user.isFirstTimeAbroad;
      openModal("profileModal");
    }
  };

  if (editBtn) editBtn.addEventListener("click", openProfileEditor);
  if (ctaBtn) ctaBtn.addEventListener("click", () => openModal("tripModal"));
}

// Setup AI Quick Ask widget
function setupQuickAsk() {
  const form = document.getElementById("quickAskForm");
  const input = document.getElementById("quickAskInput");
  const replyBox = document.getElementById("quickAskReply");

  if (!form || !input || !replyBox) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const question = input.value.trim();
    if (!question) return;

    input.value = "";
    replyBox.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px;"></i> Thinking...`;
    replyBox.className = "quick-ask-reply loading";
    replyBox.style.display = "block";

    const user = getLoggedInUser();
    const destination = user ? user.destination : "destination";
    const purpose = user ? user.tripPurpose : "tourism";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: "You are a travel assistant for Indian passport holders. Answer questions about visas, currency, SIMs, transport and travel essentials. Be concise.",
          messages: [
            {
              role: "user",
              content: `Context: I am travelling to ${destination} for ${purpose}. Question: ${question}`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error("Chat request failed");
      }

      const data = await response.json();
      replyBox.textContent = data.text;
      replyBox.className = "quick-ask-reply";
    } catch (error) {
      console.error(error);
      replyBox.textContent = "Sorry, I couldn't reach the AI travel assistant. Please try again.";
      replyBox.className = "quick-ask-reply";
    }
  });
}

// Helper to escape HTML characters
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Show Empty state view
function showEmptyState() {
  document.getElementById("dashboardView").style.display = "none";
  document.getElementById("emptyStateView").style.display = "block";
}

// Show Error state view
function showErrorState() {
  const container = document.getElementById("dashboardView");
  if (container) {
    container.innerHTML = `
      <div class="empty-dashboard-state" style="border-color: var(--red);">
        <div class="empty-state-icon" style="background: #fdf2f2; color: var(--red);">
          <i class="fa-solid fa-circle-exclamation"></i>
        </div>
        <h2>Something went wrong</h2>
        <p>We were unable to load your trip summary dashboard details. Please reload the page or check your database connection.</p>
        <button class="primary-button" onclick="window.location.reload()">
          <i class="fa-solid fa-arrows-rotate" style="margin-right: 8px;"></i> Retry
        </button>
      </div>
    `;
    container.style.display = "block";
  }
}
