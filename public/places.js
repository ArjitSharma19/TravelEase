// places.js - Controller for the full-page Places to Visit view

document.addEventListener("DOMContentLoaded", () => {
  // Sync page title with user destination
  updatePageHeader();

  // Initialize interest pills click toggle
  const interestPills = document.querySelectorAll("#fullPageInterests .interest-pill");
  interestPills.forEach(pill => {
    pill.addEventListener("click", () => {
      pill.classList.toggle("active");
    });
  });

  // Category filter tabs binding
  const categoryFilters = document.getElementById("fullPageCategoryFilters");
  if (categoryFilters) {
    const chips = categoryFilters.querySelectorAll(".filter-chip");
    chips.forEach(chip => {
      chip.addEventListener("click", () => {
        chips.forEach(c => c.classList.remove("active"));
        chip.classList.add('active');
        const category = chip.dataset.category;
        renderPlacesGrid(window.loadedFullPagePlaces || [], category);
      });
    });
  }

  // Find Places button listener
  const findPlacesBtn = document.getElementById("findPlacesBtn");
  if (findPlacesBtn) {
    findPlacesBtn.addEventListener("click", fetchFullPageRecommendations);
  }

  // Auto-run if destination is already set in traveler profile
  const user = getCurrentUser();
  if (user && user.destination) {
    fetchFullPageRecommendations();
  }
});

// Update the main header text with the traveler's destination
function updatePageHeader() {
  const user = getCurrentUser();
  const title = document.getElementById("placesPageTitle");
  if (title) {
    if (user && user.destination) {
      title.textContent = `Personalized Recommendations for ${escapeHTML(user.destination)}`;
    } else {
      title.textContent = `Personalized Recommendations for Your Destination`;
    }
  }
}

// Fetch recommended places from backend
async function fetchFullPageRecommendations() {
  const user = getCurrentUser();
  const grid = document.getElementById("fullPagePlacesGrid");
  const filtersRow = document.getElementById("fullPageCategoryFiltersRow");

  if (!grid) return;

  if (!user || !user.destination) {
    grid.innerHTML = `
      <div class="places-error-container" style="grid-column: 1 / -1; padding: 60px 20px; text-align: center;">
        <i class="fa-solid fa-earth-americas" style="font-size: 3rem; color: var(--blue); opacity: 0.7; margin-bottom: 15px;"></i>
        <h3 style="font-size: 1.25rem; color: var(--ink); margin-bottom: 8px;">No Destination Selected</h3>
        <p style="color: var(--muted); margin-bottom: 20px;">Please set your travel destination in your traveler profile to unlock recommendations.</p>
        <button class="primary-button" onclick="openModal('profileModal')">Open Profile Settings</button>
      </div>
    `;
    if (filtersRow) filtersRow.style.display = "none";
    return;
  }

  const destination = user.destination;
  const travelPurpose = user.tripPurpose || 'tourism';

  // Map tripPurpose for Gemini
  let purposeStr = 'Tourist';
  if (travelPurpose === 'business') purposeStr = 'Business';
  else if (travelPurpose === 'education') purposeStr = 'Student';
  else if (travelPurpose === 'other') purposeStr = 'Family';

  // Get active interest values
  const activePills = document.querySelectorAll("#fullPageInterests .interest-pill.active");
  const interests = Array.from(activePills).map(pill => pill.dataset.interest);

  // Render loading skeleton grid (8 skeletons)
  if (filtersRow) filtersRow.style.display = "none";
  grid.innerHTML = Array(8).fill(0).map(() => `
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
        console.warn('Failed to load saved places for marking bookmarks:', err);
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

    // Set bookmark flag and cache results globally
    window.loadedFullPagePlaces = data.map(place => ({
      ...place,
      isSaved: savedSet.has(place.name.toLowerCase())
    }));

    if (filtersRow) {
      filtersRow.style.display = "block";
      // Reset category filter tab to "All"
      const chips = filtersRow.querySelectorAll(".filter-chip");
      chips.forEach(c => c.classList.toggle('active', c.dataset.category === 'All'));
    }

    updatePageHeader();
    renderPlacesGrid(window.loadedFullPagePlaces, 'All');
  } catch (error) {
    console.error(error);
    grid.innerHTML = `
      <div class="places-error-container" style="grid-column: 1 / -1; padding: 60px 20px; text-align: center;">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; color: var(--red); margin-bottom: 15px;"></i>
        <h3 style="font-size: 1.25rem; color: var(--ink); margin-bottom: 8px;">Failed to load places</h3>
        <p style="color: var(--muted); margin-bottom: 20px;">We encountered an issue contact the travel recommendation engine.</p>
        <button class="primary-button" onclick="fetchFullPageRecommendations()">Retry Fetch</button>
      </div>
    `;
    if (filtersRow) filtersRow.style.display = "none";
  }
}

// Render place cards into the responsive grid
function renderPlacesGrid(places, filterCategory = 'All') {
  const grid = document.getElementById("fullPagePlacesGrid");
  if (!grid) return;

  const filtered = filterCategory === 'All'
    ? places
    : places.filter(p => p.category.toLowerCase() === filterCategory.toLowerCase());

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--muted);">
        <i class="fa-solid fa-folder-open" style="font-size: 2.5rem; opacity: 0.5; margin-bottom: 12px;"></i>
        <p>No places found matching the "${filterCategory}" category.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map((place, idx) => {
    const categoryClass = place.category ? place.category.toLowerCase().replace(' ', '-') : 'landmark';
    const isSavedClass = place.isSaved ? 'saved' : '';
    const bookmarkIcon = place.isSaved ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark';
    const ratingStars = generateRatingStars(place.rating || 4.0);

    return `
      <div class="place-card" style="cursor: pointer;" data-place-index="${idx}">
        <div class="place-card-image-wrapper" style="height: 180px;">
          <img src="${escapeHTML(place.photoUrl)}" class="place-card-img" alt="${escapeHTML(place.name)}" loading="lazy">
          <button class="place-bookmark-btn ${isSavedClass}" data-place-index="${idx}" aria-label="Bookmark place">
            <i class="${bookmarkIcon}"></i>
          </button>
        </div>
        <div class="place-card-body" style="padding: 18px;">
          <div class="place-card-header" style="margin-bottom: 10px;">
            <h3 class="place-title" style="font-size: 1.1rem; line-height: 1.3;">${escapeHTML(place.name)}</h3>
            <span class="place-badge ${categoryClass}">${escapeHTML(place.category || 'Landmark')}</span>
          </div>
          
          <div class="place-rating" style="display: flex; align-items: center; gap: 6px; margin-bottom: 10px; font-size: 0.85rem; color: #ffb100;">
            ${ratingStars}
            <span style="color: var(--muted); font-weight: bold; font-size: 0.8rem;">(${place.rating ? place.rating.toFixed(1) : '4.0'})</span>
          </div>

          <p class="place-desc" style="-webkit-line-clamp: 2; display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; height: 38px; margin-bottom: 12px;">
            ${escapeHTML(place.description)}
          </p>

          <div class="place-meta" style="margin-bottom: 0;">
            <span><i class="fa-regular fa-clock"></i> ${escapeHTML(place.estimatedDuration || '2 hours')}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Attach dynamic event listeners to prevent any single quote syntax errors
  const cards = grid.querySelectorAll(".place-card");
  cards.forEach(card => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".place-bookmark-btn")) return;
      const idx = parseInt(card.dataset.placeIndex);
      const place = filtered[idx];
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
      const place = filtered[idx];
      if (place) {
        togglePlaceBookmark(e, btn, place);
      }
    });
  });
}

// Generate star icon HTML based on rating
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

// Open modal showing comprehensive details of a selected place
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
        <span class="place-badge ${place.category.toLowerCase().replace(' ', '-')}" style="margin-bottom: 8px; display: inline-block;">${escapeHTML(place.category)}</span>
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
          ${escapeHTML(place.relevanceReason)}
        </p>
      </div>

      <!-- Travel Tip -->
      <div style="background: #fffbeb; border-left: 4px solid #d97706; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
        <h4 style="font-size: 0.82rem; font-weight: 800; text-transform: uppercase; color: #b45309; letter-spacing: 0.5px; margin-bottom: 4px;">First-Time Traveler Tip</h4>
        <p style="font-size: 0.88rem; line-height: 1.45; color: #b45309; margin: 0; font-weight: 600;">
          <i class="fa-regular fa-lightbulb" style="margin-right: 4px;"></i> ${escapeHTML(place.tip)}
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

// Toggle saved place state via bookmark button click
async function togglePlaceBookmark(event, btn, place) {
  if (!place) return;

  const token = getToken();
  if (!token) {
    showToast("Please log in to save places to your trip!", "warning");
    openModal("loginModal");
    return;
  }

  const user = getCurrentUser();
  const destination = user ? user.destination : "";

  try {
    const res = await fetch(apiUrl("/api/saved-places"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        id: place.id,
        name: place.name,
        category: place.category,
        description: place.description || place.address,
        estimatedDuration: place.estimatedDuration,
        tip: place.tip,
        relevanceReason: place.relevanceReason,
        photoUrl: place.photoUrl,
        rating: place.rating,
        address: place.address,
        location: place.location,
        destination
      })
    });

    if (!res.ok) {
      throw new Error("Bookmark request failed");
    }

    const data = await res.json();
    place.isSaved = data.saved;

    // Toggle icon and button visual state
    btn.classList.toggle("saved", data.saved);
    const icon = btn.querySelector("i");
    if (icon) {
      icon.className = data.saved ? "fa-solid fa-bookmark" : "fa-regular fa-bookmark";
    }

    showToast(data.message, "success");

    // Sync back to Traveler Dashboard if it exists
    if (window.loadSavedPlaces) {
      window.loadSavedPlaces();
    }
  } catch (err) {
    console.error(err);
    showToast("Failed to update bookmark. Please try again.", "error");
  }
}

// Helper to escape HTML characters safely
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
