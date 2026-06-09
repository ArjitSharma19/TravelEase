const DESTINATIONS = {
  UAE: {
    name: "United Arab Emirates",
    flag: "🇦🇪",
    summary: "Desert skylines, shopping, beaches, and easy short-haul travel from India.",
    hero: "Dubai skyline at sunset",
    visa: {
      type: "e-Visa",
      badge: "blue",
      documents: [
        "Passport valid for at least 6 months",
        "Recent passport-size photo",
        "Confirmed return flight tickets",
        "Hotel booking or host details",
        "Travel insurance",
        "Bank statement or proof of funds"
      ],
      processingTime: "3 to 5 working days",
      cost: "₹6,000 to ₹8,500",
      applyUrl: "https://smartservices.icp.gov.ae/"
    },
    currency: {
      rate: "1 AED ≈ ₹22.70",
      tip: "Cards work widely in cities, but keep AED 300-500 cash for taxis, tips, and small shops.",
      services: ["BookMyForex", "Niyo Global", "Wise", "Thomas Cook Forex"]
    },
    sim: {
      local: "du Tourist SIM or Etisalat Visitor Line",
      esim: "Airalo, Nomad, or Holafly UAE eSIM",
      advice: "A 5-10 GB plan is comfortable for a 5-day Dubai or Abu Dhabi trip."
    },
    transport: {
      cabs: ["Careem", "Uber", "Dubai Taxi"],
      airportTip: "Dubai Metro is cheap from DXB Terminal 1 and 3; pre-book hotel transfers if arriving late.",
      publicNote: "Use a Nol card for Dubai Metro, tram, buses, and water buses."
    },
    essentials: {
      emergency: "999 Police, 998 Ambulance",
      embassy: "+971 2 449 2700",
      tips: [
        "Dress modestly in religious and government areas.",
        "Public alcohol consumption is restricted.",
        "Friday afternoons can be slower due to prayer timings."
      ],
      bestTime: "November to March"
    }
  },
  USA: {
    name: "United States",
    flag: "🇺🇸",
    summary: "Big cities, national parks, universities, road trips, and long-haul adventure.",
    hero: "New York and American landmarks",
    visa: {
      type: "Sticker Visa",
      badge: "red",
      documents: [
        "Passport valid beyond intended stay",
        "DS-160 confirmation page",
        "Visa appointment confirmation",
        "Recent photo as per US visa rules",
        "Employment or student proof",
        "Bank statements and income documents",
        "Travel itinerary and accommodation details"
      ],
      processingTime: "Interview wait varies; passport return usually 3 to 7 working days after approval",
      cost: "₹15,500 approx. for B1/B2 visa fee",
      applyUrl: "https://www.ustraveldocs.com/in/"
    },
    currency: {
      rate: "1 USD ≈ ₹83.50",
      tip: "Cards are accepted almost everywhere; keep small cash for tips, laundromats, and transit machines.",
      services: ["Niyo Global", "Wise", "BookMyForex", "ICICI Forex Card"]
    },
    sim: {
      local: "T-Mobile Tourist Plan or AT&T prepaid",
      esim: "Airalo, Nomad, or T-Mobile prepaid eSIM",
      advice: "Choose 10-20 GB for a 2-week trip because maps and ride apps use data heavily."
    },
    transport: {
      cabs: ["Uber", "Lyft", "Curb"],
      airportTip: "Airport rides can be expensive; compare shuttle, metro, and ride-share pickup zones before landing.",
      publicNote: "Public transport quality varies by city; New York, Chicago, Boston, DC, and San Francisco are easier without a car."
    },
    essentials: {
      emergency: "911",
      embassy: "+1 202 939 7000",
      tips: [
        "Tipping is expected at restaurants and for many services.",
        "Sales tax is usually added at checkout.",
        "Carry a photo ID for age-restricted places."
      ],
      bestTime: "April to June and September to October"
    }
  },
  UK: {
    name: "United Kingdom",
    flag: "🇬🇧",
    summary: "Historic cities, museums, countryside, football, and classic first-Europe memories.",
    hero: "London bridge and classic UK streets",
    visa: {
      type: "Sticker Visa",
      badge: "red",
      documents: [
        "Passport with blank pages",
        "UK visa application form",
        "Biometrics appointment confirmation",
        "Bank statements for 6 months",
        "Employment, student, or business proof",
        "Travel itinerary and accommodation proof",
        "Cover letter explaining trip purpose"
      ],
      processingTime: "3 to 6 weeks",
      cost: "₹11,000 to ₹13,500 approx. for standard visitor visa",
      applyUrl: "https://www.gov.uk/standard-visitor/apply-standard-visitor-visa"
    },
    currency: {
      rate: "1 GBP ≈ ₹106.00",
      tip: "Cards and contactless payments are standard; keep limited cash for small cafes and backup.",
      services: ["Wise", "Niyo Global", "BookMyForex", "Thomas Cook Forex"]
    },
    sim: {
      local: "Lebara, EE, Vodafone, or Three prepaid SIM",
      esim: "Airalo, Nomad, or Ubigi UK eSIM",
      advice: "A 10 GB plan is enough for a week if hotel Wi-Fi is used."
    },
    transport: {
      cabs: ["Uber", "Bolt", "Free Now"],
      airportTip: "Use Elizabeth line, Heathrow Express, Gatwick Express, or National Express based on budget and hotel location.",
      publicNote: "In London, use contactless card or Oyster for Tube, buses, and trains."
    },
    essentials: {
      emergency: "999 or 112",
      embassy: "+44 20 7836 8484",
      tips: [
        "Stand on the right side of escalators in London.",
        "Weather changes quickly; carry a compact umbrella.",
        "Queues are taken seriously."
      ],
      bestTime: "May to September"
    }
  },
  Thailand: {
    name: "Thailand",
    flag: "🇹🇭",
    summary: "Beaches, temples, night markets, food, and one of the easiest first international trips.",
    hero: "Thai beaches and temples",
    visa: {
      type: "On Arrival",
      badge: "orange",
      documents: [
        "Passport valid for at least 6 months",
        "Completed arrival form if required",
        "Passport-size photo",
        "Confirmed return ticket",
        "Hotel booking",
        "Proof of funds"
      ],
      processingTime: "Usually same day at airport counters",
      cost: "₹4,800 approx. when visa-on-arrival fee applies",
      applyUrl: "https://www.thaievisa.go.th/"
    },
    currency: {
      rate: "1 THB ≈ ₹2.30",
      tip: "Cash is useful for street food, markets, tuk-tuks, and island trips; cards are fine in hotels and malls.",
      services: ["BookMyForex", "Thomas Cook Forex", "Wise", "Niyo Global"]
    },
    sim: {
      local: "AIS, TrueMove H, or dtac Tourist SIM",
      esim: "Airalo, Nomad, or dtac Happy Tourist eSIM",
      advice: "Buy an 8-15 day tourist SIM at the airport if you want instant setup."
    },
    transport: {
      cabs: ["Grab", "Bolt", "inDrive"],
      airportTip: "Use official airport taxi counters or Airport Rail Link in Bangkok to avoid inflated fares.",
      publicNote: "Bangkok BTS and MRT are reliable; islands usually need songthaews, taxis, or scooters."
    },
    essentials: {
      emergency: "191 Police, 1669 Medical",
      embassy: "+66 2 258 0300",
      tips: [
        "Remove shoes before entering temples and some homes.",
        "Dress modestly for temples.",
        "Do not touch anyone's head; it is considered disrespectful."
      ],
      bestTime: "November to February"
    }
  },
  Singapore: {
    name: "Singapore",
    flag: "🇸🇬",
    summary: "Clean, efficient, family-friendly, and packed with food, shopping, and attractions.",
    hero: "Singapore skyline and gardens",
    visa: {
      type: "e-Visa",
      badge: "blue",
      documents: [
        "Passport valid for at least 6 months",
        "Completed Form 14A",
        "Recent passport-size photo",
        "Confirmed return tickets",
        "Hotel booking",
        "Bank statement or proof of funds"
      ],
      processingTime: "3 to 5 working days",
      cost: "₹2,500 to ₹3,500 approx. via authorised agent",
      applyUrl: "https://www.ica.gov.sg/enter-transit-depart/entering-singapore/visa_requirements"
    },
    currency: {
      rate: "1 SGD ≈ ₹62.00",
      tip: "Cards are widely accepted, but keep SGD 50-100 for hawker centres and small vendors.",
      services: ["Niyo Global", "Wise", "BookMyForex", "Thomas Cook Forex"]
    },
    sim: {
      local: "Singtel hi! Tourist SIM, StarHub Travel SIM, or M1 Tourist SIM",
      esim: "Airalo, Nomad, or Singtel tourist eSIM",
      advice: "A 100 GB tourist SIM can be good value if travelling with family."
    },
    transport: {
      cabs: ["Grab", "Gojek", "ComfortDelGro Zig"],
      airportTip: "MRT from Changi is affordable; taxis are convenient for families with luggage.",
      publicNote: "Use contactless cards or EZ-Link for MRT and buses."
    },
    essentials: {
      emergency: "999 Police, 995 Ambulance/Fire",
      embassy: "+65 6238 2537",
      tips: [
        "Follow public cleanliness rules strictly.",
        "Do not litter or smoke outside designated zones.",
        "Hawker centres often require self-service tray return."
      ],
      bestTime: "February to April"
    }
  },
  Japan: {
    name: "Japan",
    flag: "🇯🇵",
    summary: "Temples, trains, cherry blossoms, anime culture, food, and deeply organized travel.",
    hero: "Tokyo streets and Mount Fuji",
    visa: {
      type: "Sticker Visa",
      badge: "red",
      documents: [
        "Passport with blank pages",
        "Visa application form",
        "Recent passport-size photo",
        "Daily itinerary",
        "Confirmed flight and hotel bookings",
        "Bank statement and ITR",
        "Employment or student proof"
      ],
      processingTime: "5 to 7 working days after submission",
      cost: "₹500 to ₹1,500 approx. plus service charges",
      applyUrl: "https://www.in.emb-japan.go.jp/itpr_en/Visa.html"
    },
    currency: {
      rate: "1 JPY ≈ ₹0.53",
      tip: "Japan is card-friendly but still cash-reliant in small restaurants, temples, and rural areas.",
      services: ["Wise", "Niyo Global", "BookMyForex", "Thomas Cook Forex"]
    },
    sim: {
      local: "Sakura Mobile, Mobal, or BIC Camera tourist SIM",
      esim: "Ubigi, Airalo, or Nomad Japan eSIM",
      advice: "Use eSIM if your phone supports it; local voice SIMs can be harder for tourists."
    },
    transport: {
      cabs: ["GO Taxi", "Uber", "DiDi"],
      airportTip: "Use Narita Express, Keisei Skyliner, Haneda Monorail, or airport limousine bus based on hotel area.",
      publicNote: "Get Suica, Pasmo, or ICOCA for trains, metros, buses, and convenience stores."
    },
    essentials: {
      emergency: "110 Police, 119 Ambulance/Fire",
      embassy: "+81 3 3262 2391",
      tips: [
        "Speak softly on public transport.",
        "Sort waste carefully where bins are available.",
        "Carry your passport; police may request ID."
      ],
      bestTime: "March to May and October to November"
    }
  },
  Canada: {
    name: "Canada",
    flag: "🇨🇦",
    summary: "Nature, multicultural cities, universities, road trips, and dramatic seasonal travel.",
    hero: "Canadian mountains and cities",
    visa: {
      type: "Sticker Visa",
      badge: "red",
      documents: [
        "Passport valid for travel duration",
        "Visitor visa application",
        "Biometrics confirmation",
        "Bank statements and income proof",
        "Employment, student, or business proof",
        "Travel itinerary and hotel bookings",
        "Invitation letter if visiting family"
      ],
      processingTime: "Several weeks; varies by season and biometrics availability",
      cost: "₹8,500 approx. visa fee plus biometrics fee if applicable",
      applyUrl: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada.html"
    },
    currency: {
      rate: "1 CAD ≈ ₹61.00",
      tip: "Cards are easy to use; carry CAD 100-150 cash for small purchases and backup.",
      services: ["Wise", "Niyo Global", "BookMyForex", "ICICI Forex Card"]
    },
    sim: {
      local: "Rogers, Bell, Telus, or Freedom Mobile prepaid",
      esim: "Airalo, Nomad, or aloSIM Canada eSIM",
      advice: "Mobile data is costly; compare prepaid plans before buying at the airport."
    },
    transport: {
      cabs: ["Uber", "Lyft", "Local taxi apps"],
      airportTip: "Toronto UP Express and Vancouver SkyTrain are strong airport options; compare with ride-share.",
      publicNote: "Public transport is good in major cities, but intercity and national park travel often needs a car."
    },
    essentials: {
      emergency: "911",
      embassy: "+1 613 744 3751",
      tips: [
        "Tipping is customary in restaurants and taxis.",
        "Weather can be extreme; pack for the specific province and month.",
        "Carry travel insurance because healthcare is expensive for visitors."
      ],
      bestTime: "June to September"
    }
  },
  Australia: {
    name: "Australia",
    flag: "🇦🇺",
    summary: "Beaches, wildlife, road trips, student cities, reefs, and relaxed outdoor travel.",
    hero: "Sydney harbour and Australian coast",
    visa: {
      type: "e-Visa",
      badge: "blue",
      documents: [
        "Passport valid for intended stay",
        "Online visitor visa application",
        "Recent photo if requested",
        "Bank statements and income proof",
        "Employment or student proof",
        "Travel itinerary and accommodation",
        "Previous travel history if available"
      ],
      processingTime: "2 to 4 weeks for many visitor applications",
      cost: "₹10,000 approx. for visitor visa subclass 600",
      applyUrl: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/visitor-600"
    },
    currency: {
      rate: "1 AUD ≈ ₹55.50",
      tip: "Cards are accepted widely; keep some cash for small shops, markets, and backup.",
      services: ["Wise", "Niyo Global", "BookMyForex", "Thomas Cook Forex"]
    },
    sim: {
      local: "Telstra, Optus, or Vodafone prepaid SIM",
      esim: "Airalo, Nomad, or Optus eSIM",
      advice: "Choose Telstra coverage for road trips and regional travel."
    },
    transport: {
      cabs: ["Uber", "DiDi", "Ola", "13cabs"],
      airportTip: "Airport train is fast in Sydney, but surcharges apply; compare with shuttle or ride-share for groups.",
      publicNote: "Use Opal in Sydney, Myki in Melbourne, and go card in Brisbane."
    },
    essentials: {
      emergency: "000",
      embassy: "+61 2 6273 3999",
      tips: [
        "Biosecurity rules are strict; declare food, seeds, and wooden items.",
        "Use sunscreen seriously, even on cloudy days.",
        "Swim only between the red and yellow flags at beaches."
      ],
      bestTime: "September to November and March to May"
    }
  }
};

const POPULAR_COUNTRIES = ["UAE", "USA", "UK", "Thailand", "Singapore", "Japan", "Canada", "Australia"];
