# TravelEase

TravelEase is a full-stack travel planning web app for first-time Indian travellers going abroad. It combines country guides, personalized trip planning, checklist tracking, flight search, AI assistance, community tips, saved places, newsletter signup, and contact handling in one browser-based experience.

The project uses a static HTML/CSS/JavaScript frontend served by an Express backend, with MongoDB for accounts, trips, comments, saved places, newsletters, contact messages, and flight bookings.

## Features

- Traveler accounts with email/password signup, login, JWT sessions, Google sign-in, email verification, and OTP-based password reset.
- Personalized traveler profile with destination, trip purpose, travel dates, passport expiry, first-time-abroad flag, traveler count, and budget range.
- Dynamic flyer checklist with saved progress for authenticated users and local fallback behavior on the frontend.
- Country guide experience for visa, currency, SIM, transport, travel tips, testimonials, and community comments.
- AI travel assistant powered through the backend using Gemini 3.1 Flash Lite, with retry handling for transient API failures.
- Personalized places-to-visit recommendations using the Google Places API (New) when configured, Gemini 3.1 Flash Lite annotation (generating place descriptions, custom tips, and interest fit explanations), category filters, multi-select interests, FlagCDN-enabled autocomplete, and save-to-trip support.
- Fully scroll-locked details modal overlay with body scroll isolation and internal card scrolling.
- My Trip dashboard with trip summary, countdown, checklist progress, passport status, booked flights, saved places, quick country-guide links, and contextual AI quick ask.
- Currency converter using live exchange-rate data from the frontend.
- Flight search using Amadeus when credentials are configured, with realistic mock data fallback, filters/sorting on the frontend, and authenticated booking with generated PNR.
- Community tips board with seeded starter comments, category support, likes/upvotes, top testimonials, and destination-specific comment feeds.
- Newsletter subscription storage and duplicate-email validation.
- Contact form storage with optional email notification through Nodemailer.
- REST Countries and Unsplash proxy endpoints for country details and travel imagery when configured.

## Pages

- `public/index.html` - Main landing and app shell with sidebar widgets, country search, destination cards, guide content, auth modals, chat, newsletter, and contact modal.
- `public/destination.html` - Destination guide view for selected countries.
- `public/explore.html` - Explore page for broader country discovery.
- `public/places.html` - Full places-to-visit recommendation workflow.
- `public/mytrip.html` - Authenticated trip dashboard.
- `public/reset-password.html` - Password reset flow.

## Tech Stack

- Frontend: HTML5, CSS, vanilla JavaScript, Font Awesome, Google Identity Services.
- Backend: Node.js, Express.js, native `fetch`, CORS, dotenv.
- Database: MongoDB with Mongoose.
- Auth and security: bcrypt password hashing, JWT sessions, Google OAuth ID token verification, email verification tokens, hashed reset OTPs.
- Email: Nodemailer.
- External services: Gemini API, Google Places API (New), Google OAuth, Amadeus Flight Offers API, REST Countries, Unsplash API, FlagCDN, and live currency-rate APIs used from the frontend.

## Project Structure

```text
TravelEase/
  README.md
  public/
    index.html
    destination.html
    explore.html
    places.html
    mytrip.html
    reset-password.html
    data.js
    script.js
    places.js
    mytrip.js
    style.css
    logo_final.png
    Passport-on-Indian-Flag.jpg
    baggage.webp
  backend/
    server.js
    package.json
    package-lock.json
    .env
    models/
      User.js
      Comment.js
      Contact.js
      Newsletter.js
      PlaceRecommendation.js
      SavedPlace.js
    routes/
      auth.js
      checklist.js
      contact.js
      flights.js
      newsletter.js
      trip.js
    utils/
      mailer.js
```

## Getting Started

### Prerequisites

- Node.js 18 or newer.
- MongoDB running locally, or a MongoDB Atlas connection string.
- API keys only for the integrations you want to use. The app has fallbacks for some missing services, such as mock flight results when Amadeus is not configured.

### Installation

```bash
git clone https://github.com/ArjitSharma19/TravelEase.git
cd TravelEase/backend
npm install
```

### Environment Variables

Create `backend/.env`. The backend explicitly loads environment variables from this file.

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/travelease
JWT_SECRET=replace_with_a_long_random_secret

GOOGLE_CLIENT_ID=your_google_oauth_client_id
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_PLACES_API_KEY=your_google_places_api_key

AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret

REST_COUNTRIES_API_KEY=optional_rest_countries_key
UNSPLASH_API_KEY=your_unsplash_access_key

EMAIL_USER=your_gmail_or_smtp_user
EMAIL_PASS=your_gmail_app_password_or_smtp_password
```

Notes:

- `MONGODB_URI` and `JWT_SECRET` are the most important production values.
- `GOOGLE_CLIENT_ID` is needed for Google sign-in.
- `GEMINI_API_KEY` powers AI chat and AI-generated travel/place recommendations.
- `GOOGLE_PLACES_API_KEY` improves places-to-visit recommendations with real place data and photos.
- `AMADEUS_CLIENT_ID` and `AMADEUS_CLIENT_SECRET` enable live flight offers; without them, the backend returns mock flight data.
- `EMAIL_USER` and `EMAIL_PASS` enable verification, password reset OTP, test email, and contact notification emails. In development, missing email credentials are logged instead of blocking most flows.
- `REST_COUNTRIES_API_KEY` is optional because the backend first tries the public REST Countries endpoint.

### Run

From the `backend` directory:

```bash
npm start
```

The app runs at:

```text
http://localhost:3000
```

Express serves the frontend from `public`, so there is no separate frontend build step.

## API Overview

### Auth and Profile

- `POST /api/auth/signup` - Create a local account and send an email verification link.
- `POST /api/auth/login` - Log in with email/password and receive a JWT.
- `GET /api/auth/profile` - Get the current authenticated profile.
- `PUT /api/auth/profile` - Update the authenticated profile.
- `POST /api/auth/google` - Sign in or create an account using Google Identity Services.
- `GET /api/auth/verify-email/:token` - Verify a local account email.
- `POST /api/auth/resend-verification` - Send a fresh verification email.
- `POST /api/auth/forgot-password` - Send a reset OTP.
- `POST /api/auth/verify-otp` - Verify the reset OTP.
- `POST /api/auth/reset-password` - Reset password using the OTP.
- `GET /api/auth/test-email` - Send a development test email.

### Trips, Checklist, Flights, and Places

- `GET /api/trip/summary/:email` - Load trip details, checklist, booked flights, and passport expiry.
- `GET /api/checklist/:email` - Load a user's checklist.
- `POST /api/checklist/:email` - Save a user's checklist.
- `GET /api/flights/search` - Search flight offers through Amadeus or mock fallback.
- `POST /api/flights/book` - Save a flight booking for an authenticated user.
- `POST /api/places-to-visit` - Generate destination recommendations.
- `GET /api/saved-places` - Load authenticated user's saved places.
- `POST /api/saved-places` - Toggle a saved place for the authenticated user.

### Country Data, AI, Community, and Forms

- `POST /api/chat` - Ask the AI travel assistant.
- `GET /api/countries/:countryName` - Fetch country details through REST Countries.
- `GET /api/countries-list` - Fetch/cache the full country list.
- `GET /api/images/:query` - Fetch Unsplash travel images.
- `GET /api/comments/top/testimonials` - Load top community comments.
- `GET /api/comments/:countryCode` - Load comments for a destination.
- `POST /api/comments` - Post a community comment.
- `POST /api/comments/:commentId/like` - Like/upvote a comment.
- `POST /api/newsletter/subscribe` - Subscribe an email to travel updates.
- `POST /api/contact` - Submit a contact message.
- `GET /api/db-test` - Development database read/write check.

## Data Models

- `User` - Auth details, profile/trip fields, checklist, booked flights, email verification, reset OTP state, and Google auth metadata.
- `Comment` - Destination-specific community travel tips and likes.
- `PlaceRecommendation` - Cached AI/place recommendation results by destination, purpose, and interests.
- `SavedPlace` - Authenticated user's saved places for the My Trip dashboard.
- `Newsletter` - Newsletter email subscriptions.
- `Contact` - Contact form submissions.

## Development Notes

- Run all backend commands from `backend/`; that is where `package.json` lives.
- The backend serves static assets from `../public`, so route and asset changes can usually be tested by refreshing `http://localhost:3000`.
- The server seeds starter community comments when MongoDB has few or no comments.
- The branding assets include `logo_final.png` and `logo_white_bg.png` (which features a solid white circular background to support dark browser tab themes).
- There is no automated test script defined yet in `backend/package.json`.

## Security Notes

- Do not commit `backend/.env` or real API credentials.
- Use a strong `JWT_SECRET` outside local development.
- Email verification and reset OTP values are stored hashed.
- Passwords are hashed with bcrypt.
- Google sign-in validates the ID token against `GOOGLE_CLIENT_ID`.

## License

No project-level license file is currently included. Add one before publishing or accepting external contributions.
