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
  loadSavedPlaces();
  loadSavedBudgetDisplay();

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
    const res = await fetch(apiUrl(`/api/trip/summary/${encodeURIComponent(user.email)}`));
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
      // Look up in allCountriesList to find flag on Windows
      const matched = (window.allCountriesList || []).find(c => 
        (c.name || "").toLowerCase() === tripDetails.destination.toLowerCase() || 
        (c.officialName || "").toLowerCase() === tripDetails.destination.toLowerCase()
      );
      if (matched && matched.cca2) {
        heroFlag.innerHTML = `<img src="https://flagcdn.com/h80/${matched.cca2.toLowerCase()}.png" alt="" style="height: 36px; width: auto; vertical-align: middle; border-radius: 3px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">`;
      } else {
        heroFlag.textContent = "🌍";
      }
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
      const response = await fetch(apiUrl("/api/chat"), {
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

// Fetch and render user's saved places for the current trip
async function loadSavedPlaces() {
  const panel = document.getElementById("savedPlacesPanel");
  const grid = document.getElementById("savedPlacesGrid");

  if (!panel || !grid) return;

  const token = localStorage.getItem("travelease_token");
  const user = getLoggedInUser();

  if (!token || !user || !user.destination) {
    panel.style.display = "none";
    return;
  }

  const destination = user.destination;

  try {
    const res = await fetch(apiUrl("/api/saved-places"), {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    const data = await res.json();
    
    // Filter places for the current destination
    const filteredPlaces = data.filter(place => 
      place.destination.toLowerCase() === destination.toLowerCase()
    );

    if (filteredPlaces.length === 0) {
      panel.style.display = "none";
      return;
    }

    panel.style.display = "block";

    window.loadedDashboardPlaces = filteredPlaces;

    grid.innerHTML = filteredPlaces.map((place, idx) => {
      const categoryClass = place.category ? place.category.toLowerCase().replace(' ', '-') : 'landmark';
      
      return `
        <div class="place-card" style="cursor: pointer;" data-place-index="${idx}">
          <div class="place-card-image-wrapper">
            <img src="${escapeHTML(place.photoUrl)}" class="place-card-img" alt="${escapeHTML(place.name)}" loading="lazy">
            <button class="place-bookmark-btn saved" data-place-index="${idx}" aria-label="Remove bookmark">
              <i class="fa-solid fa-bookmark"></i>
            </button>
          </div>
          <div class="place-card-body">
            <div class="place-card-header">
              <h4 class="place-title">${escapeHTML(place.name)}</h4>
              <span class="place-badge ${categoryClass}">${escapeHTML(place.category || 'Landmark')}</span>
            </div>
            <p class="place-desc">${escapeHTML(place.description)}</p>
            <div class="place-meta">
              <span><i class="fa-regular fa-clock"></i> ${escapeHTML(place.estimatedDuration || '1-2 hours')}</span>
            </div>
            <div class="place-meta" style="margin-top: -4px;">
              <span><i class="fa-regular fa-lightbulb"></i> <strong>Tip:</strong> ${escapeHTML(place.tip || 'Carry water')}</span>
            </div>
            <p class="place-relevance">
              <i class="fa-solid fa-circle-info" style="color: var(--blue); margin-right: 4px;"></i>
              ${escapeHTML(place.relevanceReason || 'Recommended spot')}
            </p>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners to cards
    const cards = grid.querySelectorAll(".place-card");
    cards.forEach(card => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".place-bookmark-btn")) return;
        const idx = parseInt(card.dataset.placeIndex);
        const place = filteredPlaces[idx];
        if (place) {
          openPlaceDetails(place);
        }
      });
    });

    const bookmarkBtns = grid.querySelectorAll(".place-bookmark-btn");
    bookmarkBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.placeIndex);
        const place = filteredPlaces[idx];
        if (place) {
          toggleDashboardPlaceBookmark(e, btn, place);
        }
      });
    });

  } catch (error) {
    console.error("Failed to load saved places for dashboard:", error);
    panel.style.display = "none";
  }
}

// Open modal showing comprehensive details of a selected place from dashboard
function openPlaceDetails(place) {
  if (!place) return;

  const container = document.getElementById("placeDetailsContainer");
  if (!container) return;

  const ratingStars = generateRatingStars(place.rating || 4.0);

  // Setup directions link using coordinates if present, fallback to text query
  let directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + (place.address || ''))}`;
  if (place.location && place.location.latitude && place.location.longitude) {
    directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.location.latitude},${place.location.longitude}`;
  }

  container.innerHTML = `
    <div class="detail-header-image" style="position: relative; height: 260px; background: #f1f5f9;">
      <img src="${escapeHTML(place.photoUrl)}" alt="${escapeHTML(place.name)}" style="width: 100%; height: 100%; object-fit: cover;">
      <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.8)); padding: 24px 20px 20px 20px; color: #fff;">
        <span class="place-badge ${place.category ? place.category.toLowerCase().replace(' ', '-') : 'landmark'}" style="margin-bottom: 8px; display: inline-block;">${escapeHTML(place.category || 'Landmark')}</span>
        <h2 style="font-size: 1.5rem; font-weight: 800; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${escapeHTML(place.name)}</h2>
      </div>
    </div>
    <div class="detail-body" style="padding: 24px 20px; color: var(--ink);">
      
      <!-- Rating and Location Details -->
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--line); padding-bottom: 15px;">
        <div style="display: flex; align-items: center; gap: 6px; font-size: 0.95rem; color: #ffb100;">
          ${ratingStars}
          <span style="color: var(--muted); font-size: 0.88rem; font-weight: bold;">(${place.rating ? place.rating.toFixed(1) : '4.0'})</span>
        </div>
        <div style="font-size: 0.88rem; color: var(--muted); font-weight: bold;">
          <i class="fa-regular fa-clock" style="color: var(--blue); margin-right: 4px;"></i> Duration: ${escapeHTML(place.estimatedDuration || '2 hours')}
        </div>
      </div>

      <!-- Address -->
      <div style="margin-bottom: 20px;">
        <h4 style="font-size: 0.82rem; font-weight: 800; text-transform: uppercase; color: var(--muted); letter-spacing: 0.5px; margin-bottom: 6px;">Address</h4>
        <p style="font-size: 0.92rem; line-height: 1.5; color: var(--muted); margin: 0;">
          <i class="fa-solid fa-location-dot" style="color: var(--blue); margin-right: 6px;"></i> ${escapeHTML(place.address || 'Address details not available')}
        </p>
      </div>

      <!-- Relevance reason -->
      <div style="background: var(--blue-soft); border-left: 4px solid var(--blue); padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
        <h4 style="font-size: 0.82rem; font-weight: 800; text-transform: uppercase; color: var(--blue-dark); letter-spacing: 0.5px; margin-bottom: 4px;">Why it fits your profile</h4>
        <p style="font-size: 0.88rem; line-height: 1.45; color: var(--blue-dark); margin: 0; font-weight: 600;">
          ${escapeHTML(place.relevanceReason || 'Highly recommended.')}
        </p>
      </div>

      <!-- Travel Tip -->
      <div style="background: #fffbeb; border-left: 4px solid #d97706; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
        <h4 style="font-size: 0.82rem; font-weight: 800; text-transform: uppercase; color: #b45309; letter-spacing: 0.5px; margin-bottom: 4px;">First-Time Traveler Tip</h4>
        <p style="font-size: 0.88rem; line-height: 1.45; color: #b45309; margin: 0; font-weight: 600;">
          <i class="fa-regular fa-lightbulb" style="margin-right: 4px;"></i> ${escapeHTML(place.tip || 'Plan ahead.')}
        </p>
      </div>

      <!-- Action buttons -->
      <div style="display: flex; gap: 12px;">
        <a href="${directionsUrl}" target="_blank" rel="noopener" class="primary-button" style="flex: 1; text-align: center; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; border-radius: 6px; padding: 10px;">
          <i class="fa-solid fa-diamond-turn-right" style="margin-right: 8px;"></i> Get Directions
        </a>
        <button type="button" class="secondary-button" onclick="closeModal('placeDetailsModal')" style="flex: 1; border-radius: 6px;">Close Details</button>
      </div>
    </div>
  `;

  openModal("placeDetailsModal");
}

// Generate rating stars
function generateRatingStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  let starsHtml = '';
  for (let i = 0; i < fullStars; i++) {
    starsHtml += '<i class="fa-solid fa-star"></i>';
  }
  if (hasHalf) {
    starsHtml += '<i class="fa-solid fa-star-half-stroke"></i>';
  }
  for (let i = 0; i < emptyStars; i++) {
    starsHtml += '<i class="fa-regular fa-star"></i>';
  }
  return starsHtml;
}

// Toggle dashboard bookmark
async function toggleDashboardPlaceBookmark(event, btn, place) {
  if (!place) return;

  const token = localStorage.getItem("travelease_token");
  if (!token) return;

  try {
    const toggleRes = await fetch(apiUrl("/api/saved-places"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        name: place.name,
        destination: place.destination
      })
    });

    if (!toggleRes.ok) {
      throw new Error("Failed to unsave place");
    }

    const responseData = await toggleRes.json();
    if (typeof showToast === 'function') {
      showToast(responseData.message, "success");
    }

    // Reload list
    loadSavedPlaces();
  } catch (err) {
    console.error(err);
    if (typeof showToast === 'function') {
      showToast("Failed to unsave place. Please try again.", "error");
    }
  }
}

// Render saved budget on dashboard
function loadSavedBudgetDisplay() {
  const panel = document.getElementById("savedBudgetPanel");
  const container = document.getElementById("savedBudgetContainer");

  if (!panel || !container) return;

  const rawBudget = localStorage.getItem("travelease_saved_budget");
  if (!rawBudget) {
    panel.style.display = "none";
    return;
  }

  try {
    const budget = JSON.parse(rawBudget);
    panel.style.display = "block";

    const dailyAvgINR = Math.round(budget.totalINR / (budget.days * budget.travelers));

    container.innerHTML = `
      <div class="budget-summary-card" style="margin: 0; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 10px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px dashed rgba(255,255,255,0.15); padding-bottom: 10px;">
          <div>
            <span style="font-size: 0.78rem; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Trip Destination</span>
            <h4 style="margin: 2px 0 0 0; font-size: 1.1rem; color: #ffffff; font-weight: 800;">${escapeHTML(budget.destination)} (${budget.currency})</h4>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 0.75rem; color: #cbd5e1; text-transform: uppercase; font-weight: 700;">Duration</span>
            <div style="font-size: 0.95rem; font-weight: 800; color: #38bdf8;">${budget.days} Days (${budget.travelers} ${budget.travelers > 1 ? 'People' : 'Person'})</div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <div>
            <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Estimated Total Expense</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #4ade80;">₹${Math.round(budget.totalINR).toLocaleString('en-IN')}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Daily Avg / Person</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: #38bdf8;">₹${dailyAvgINR.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; font-size: 0.8rem; border: 1px solid rgba(255,255,255,0.08);">
          <div><span style="color:#94a3b8;">🏨 Stay/Day:</span> <strong style="color:#fff;">₹${(budget.stayPerDay || 0).toLocaleString('en-IN')}</strong></div>
          <div><span style="color:#94a3b8;">🍕 Food/Day:</span> <strong style="color:#fff;">₹${(budget.foodPerDay || 0).toLocaleString('en-IN')}</strong></div>
          <div><span style="color:#94a3b8;">🚕 Transit/Day:</span> <strong style="color:#fff;">₹${(budget.transportPerDay || 0).toLocaleString('en-IN')}</strong></div>
          <div><span style="color:#94a3b8;">🎟️ Activities/Day:</span> <strong style="color:#fff;">₹${(budget.activitiesPerDay || 0).toLocaleString('en-IN')}</strong></div>
          <div><span style="color:#94a3b8;">🛍️ Shopping/Day:</span> <strong style="color:#fff;">₹${(budget.shoppingPerDay || 0).toLocaleString('en-IN')}</strong></div>
          <div><span style="color:#f43f5e;">🚨 Emergency Reserve:</span> <strong style="color:#f43f5e;">₹${(budget.emergency || 0).toLocaleString('en-IN')}</strong></div>
        </div>
      </div>
    `;
  } catch (err) {
    console.error("Failed to render saved budget on dashboard:", err);
    panel.style.display = "none";
  }
}

// Make loadSavedPlaces, loadSavedBudgetDisplay and helpers globally available
window.loadSavedPlaces = loadSavedPlaces;
window.loadSavedBudgetDisplay = loadSavedBudgetDisplay;
window.openPlaceDetails = openPlaceDetails;
window.toggleDashboardPlaceBookmark = toggleDashboardPlaceBookmark;

