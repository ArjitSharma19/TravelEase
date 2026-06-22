# TravelEase 🌍

**TravelEase** is a comprehensive, one-stop travel guide application designed specifically for first-time Indian travelers heading abroad. It provides essential insights, real-time rates, flight searches, and a traveler checklist to ensure a confident and smooth international trip.

---

## 🚀 Features

*   **Personalized Traveler Dashboard:** Dynamic user profiles detailing destination, purpose of travel, dates, traveler count, and automated passport validity alerts.
*   **Dynamic & Synced Flyer Checklist:** Purpose-based checklists (Tourist, Student, Business, Family) combined with country-specific items (e.g., *Visit Japan Web* for Japan or *SG Arrival Card* for Singapore). Saved state syncs seamlessly to the backend for authenticated users (falling back to `localStorage` for guests).
*   **AI Travel Assistant:** An interactive, context-aware chatbot powered by **Google Gemini 2.5 Flash** (via a backend API proxy) with automated retry logic on transient errors.
*   **Live Currency Rates & Exchange Tool:** Real-time exchange rate calculation via the **Frankfurter API** displaying reciprocal rates (e.g., `1 INR = X Foreign` and `1 Foreign = Y INR`) with a fallback for unlisted currencies.
*   **Flight Search & Booking:** Search live flight offers using the **Amadeus API** (falls back to mock data if credentials are missing) and book flights directly, producing a confirmation boarding pass and PNR.
*   **Community Tips Board:** A traveler forum where users can post tips, upvote other travelers' advice, search tips with keyword relevance scoring, and filter by categories (Visa, Money, SIM, Transport).

---

## 🛠️ Tech Stack

*   **Frontend:** HTML5, Vanilla CSS, Vanilla JavaScript (Google Identity Services integration for Google Sign-in).
*   **Backend:** Node.js, Express.js.
*   **Database:** MongoDB (via Mongoose ODM).
*   **Third-Party APIs:**
    *   Google Gemini 2.5 Flash API (AI Chat)
    *   Amadeus Flight Search API (Flights)
    *   Frankfurter Currency API (Live exchange rates)
    *   Google OAuth 2.0 (Authentication)

---

## 📍 Destinations Covered

*   🇦🇪 United Arab Emirates (UAE)
*   🇺🇸 United States (USA)
*   🇬🇧 United Kingdom (UK)
*   🇹🇭 Thailand
*   🇸🇬 Singapore
*   🇯🇵 Japan
*   🇨🇦 Canada
*   🇦🇺 Australia

---

## ⚙️ Setup & Installation

### Prerequisites
*   Node.js (v18+)
*   MongoDB installed and running locally (or a MongoDB Atlas connection string)

### Steps
1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/ArjitSharma19/TravelEase.git
    cd TravelEase
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Configuration:**
    Create a `.env` file in the root directory (based on `.env.example`):
    ```env
    PORT=3000
    MONGODB_URI=mongodb://localhost:27017/travelease
    JWT_SECRET=your_secure_jwt_secret_token
    GEMINI_API_KEY=your_google_gemini_api_key
    GOOGLE_CLIENT_ID=your_google_oauth_client_id
    AMADEUS_CLIENT_ID=your_amadeus_client_id_here
    AMADEUS_CLIENT_SECRET=your_amadeus_client_secret_here
    ```

4.  **Start the Server:**
    ```bash
    npm start
    ```
    The server will connect to MongoDB, seed initial community tips, and run at `http://localhost:3000`.
