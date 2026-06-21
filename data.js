const DESTINATIONS = {
  UAE: {
    name: "United Arab Emirates",
    flag: "🇦🇪",
    summary: "Desert skylines, luxury shopping, beaches, and easy short-haul travel from India.",
    hero: "Dubai skyline at sunset",
    heroImage: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1400",
    language: "Arabic",
    bestTime: "November to March",
    plugType: "Type G",
    upiAccepted: false,
    tipping: "Not mandatory but appreciated",
    hospitalTip: "Medical care is excellent but expensive - buy travel insurance",
    weather: "Hot desert climate, avoid June-August",
    visa: {
      type: "e-Visa",
      badge: "blue",
      documents: ["Passport valid for at least 6 months", "Recent passport-size photo", "Confirmed return flight tickets", "Hotel booking or host details", "Travel insurance", "Bank statement or proof of funds"],
      processingTime: "3 to 5 working days",
      cost: "₹6,000 to ₹8,500",
      applyUrl: "https://smartservices.ica.gov.ae",
      warnings: ["Name mismatch between passport and booking", "Low bank balance or unclear funds", "Blurred passport scan or photo", "Unconfirmed hotel or return ticket"]
    },
    currency: {
      code: "AED",
      rate: "1 AED ≈ ₹25.69",
      tip: "Cards work widely in cities, but keep AED 300-500 cash for taxis, tips, and small shops.",
      cashCard: "Use cards for hotels, malls, and restaurants; keep moderate cash for taxis, souks, and small shops.",
      atm: "ATMs are easy to find in malls, metro stations, hotels, and airport terminals.",
      services: ["BookMyForex", "Niyo Global", "Wise", "Thomas Cook Forex"]
    },
    sim: {
      local: "du Tourist SIM or Etisalat Visitor Line",
      carriers: ["du Tourist SIM", "Etisalat Visitor Line", "Virgin Mobile UAE"],
      esim: "Airalo, Nomad, or Holafly UAE eSIM",
      advice: "A 5-10 GB plan is comfortable for a 5-day Dubai or Abu Dhabi trip.",
      airportTip: "Airport SIM counters are convenient and quick; city stores may have better-value bundles."
    },
    transport: {
      cabs: ["Careem", "Uber", "Dubai Taxi"],
      apps: ["Careem", "Uber"],
      airportTip: "Dubai Metro is cheap from DXB Terminal 1 and 3; pre-book hotel transfers if arriving late.",
      airportCost: "Metro from ₹80; Careem/Uber to central Dubai ₹1,800-₹3,200",
      publicNote: "Use a Nol card for Dubai Metro, tram, buses, and water buses."
    },
    essentials: {
      emergency: "999 Police, 998 Ambulance",
      embassy: "+971 2 449 2700",
      embassyName: "Embassy of India, Abu Dhabi",
      dos: ["Dress modestly in religious and government areas.", "Carry passport copy and visa copy while sightseeing.", "Respect prayer timings and local rules during Ramadan."],
      donts: ["Do not consume alcohol in public places.", "Do not photograph people without permission.", "Avoid public arguments or offensive gestures."],
      tips: ["Dress modestly in religious and government areas.", "Public alcohol consumption is restricted.", "Friday afternoons can be slower due to prayer timings."],
      bestTime: "November to March"
    }
  },
  USA: {
    name: "United States",
    flag: "🇺🇸",
    summary: "Big cities, national parks, universities, road trips, and long-haul adventure.",
    hero: "New York and American landmarks",
    heroImage: "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=1400",
    language: "English",
    bestTime: "April to June and September to October",
    plugType: "Type A / Type B",
    upiAccepted: false,
    tipping: "Tipping is expected, usually 15-20% at restaurants",
    hospitalTip: "Healthcare is very expensive - travel insurance is essential",
    weather: "Varies widely by state; check city-specific weather before packing",
    visa: {
      type: "Sticker Visa",
      badge: "red",
      documents: ["Passport valid beyond intended stay", "DS-160 confirmation page", "Visa appointment confirmation", "Recent photo as per US visa rules", "Employment or student proof", "Bank statements and income documents", "Travel itinerary and accommodation details"],
      processingTime: "Interview wait varies; passport return usually 3 to 7 working days after approval",
      cost: "₹15,500 approx. for B1/B2 visa fee",
      applyUrl: "https://www.ustraveldocs.com/in",
      warnings: ["Weak home-country ties", "Unclear purpose of travel", "Inconsistent DS-160 and interview answers", "Insufficient funds for the itinerary"]
    },
    currency: {
      code: "USD",
      rate: "1 USD ≈ ₹83.50",
      tip: "Cards are accepted almost everywhere; keep small cash for tips, laundromats, and transit machines.",
      cashCard: "Prefer cards for most payments; keep USD 100-200 in small notes for tips and emergencies.",
      atm: "ATMs are common, but withdrawal and operator fees can be high.",
      services: ["Niyo Global", "Wise", "BookMyForex", "ICICI Forex Card"]
    },
    sim: {
      local: "T-Mobile Tourist Plan or AT&T prepaid",
      carriers: ["T-Mobile prepaid", "AT&T prepaid", "Verizon prepaid"],
      esim: "Airalo, Nomad, or T-Mobile prepaid eSIM",
      advice: "Choose 10-20 GB for a 2-week trip because maps and ride apps use data heavily.",
      airportTip: "Airport SIMs are limited and costly; eSIM or city stores are usually better."
    },
    transport: {
      cabs: ["Uber", "Lyft", "Curb"],
      apps: ["Uber", "Lyft"],
      airportTip: "Airport rides can be expensive; compare shuttle, metro, and ride-share pickup zones before landing.",
      airportCost: "City transit from ₹250; ride-share often ₹3,000-₹8,000 depending on city",
      publicNote: "Public transport quality varies by city; New York, Chicago, Boston, DC, and San Francisco are easier without a car."
    },
    essentials: {
      emergency: "911",
      embassy: "+1 202 939 7000",
      embassyName: "Embassy of India, Washington DC",
      dos: ["Keep photo ID handy for hotels and age-restricted venues.", "Budget for sales tax and tips.", "Confirm domestic baggage rules before internal flights."],
      donts: ["Do not joke about security at airports.", "Do not ignore pedestrian signals.", "Avoid carrying large amounts of cash."],
      tips: ["Tipping is expected at restaurants and for many services.", "Sales tax is usually added at checkout.", "Carry a photo ID for age-restricted places."],
      bestTime: "April to June and September to October"
    }
  },
  UK: {
    name: "United Kingdom",
    flag: "🇬🇧",
    summary: "Historic cities, museums, countryside, football, and classic first-Europe memories.",
    hero: "London bridge and classic UK streets",
    heroImage: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1400",
    language: "English",
    bestTime: "May to September",
    plugType: "Type G",
    upiAccepted: false,
    tipping: "Often 10-12.5% service charge in restaurants; extra tipping is optional",
    hospitalTip: "Visitors may pay for NHS care - buy travel insurance",
    weather: "Mild and changeable; carry layers and rain protection",
    visa: {
      type: "Sticker Visa",
      badge: "red",
      documents: ["Passport with blank pages", "UK visa application form", "Biometrics appointment confirmation", "Bank statements for 6 months", "Employment, student, or business proof", "Travel itinerary and accommodation proof", "Cover letter explaining trip purpose"],
      processingTime: "3 to 6 weeks",
      cost: "₹11,000 to ₹13,500 approx. for standard visitor visa",
      applyUrl: "https://www.gov.uk/apply-uk-visa",
      warnings: ["Unexplained bank deposits", "Weak trip purpose or cover letter", "Missing employment or study proof", "Accommodation details that do not match itinerary"]
    },
    currency: {
      code: "GBP",
      rate: "1 GBP ≈ ₹106.00",
      tip: "Cards and contactless payments are standard; keep limited cash for small cafes and backup.",
      cashCard: "Contactless cards work almost everywhere; carry GBP 50-100 as backup.",
      atm: "ATMs are widespread; use bank ATMs and avoid dynamic currency conversion.",
      services: ["Wise", "Niyo Global", "BookMyForex", "Thomas Cook Forex"]
    },
    sim: {
      local: "Lebara, EE, Vodafone, or Three prepaid SIM",
      carriers: ["Lebara", "EE", "Vodafone", "Three"],
      esim: "Airalo, Nomad, or Ubigi UK eSIM",
      advice: "A 10 GB plan is enough for a week if hotel Wi-Fi is used.",
      airportTip: "Airport SIMs are convenient; supermarkets and high-street stores often sell cheaper prepaid packs."
    },
    transport: {
      cabs: ["Uber", "Bolt", "Free Now"],
      apps: ["Uber"],
      airportTip: "Use Elizabeth line, Heathrow Express, Gatwick Express, or National Express based on budget and hotel location.",
      airportCost: "Elizabeth line from ₹600; Heathrow Express from ₹2,700; cab often ₹7,000+",
      publicNote: "In London, use contactless card or Oyster for Tube, buses, and trains."
    },
    essentials: {
      emergency: "999 or 112",
      embassy: "+44 20 7836 8484",
      embassyName: "High Commission of India, London",
      dos: ["Stand on the right side of escalators in London.", "Keep an umbrella or rain jacket handy.", "Tap in and out correctly on trains."],
      donts: ["Do not jump queues.", "Do not block Tube doors.", "Avoid loud phone calls on quiet train coaches."],
      tips: ["Stand on the right side of escalators in London.", "Weather changes quickly; carry a compact umbrella.", "Queues are taken seriously."],
      bestTime: "May to September"
    }
  },
  Thailand: {
    name: "Thailand",
    flag: "🇹🇭",
    summary: "Beaches, temples, night markets, food, and one of the easiest first international trips.",
    hero: "Thai beaches and temples",
    heroImage: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=1400",
    language: "Thai",
    bestTime: "November to February",
    plugType: "Type A / B / C / O",
    upiAccepted: true,
    tipping: "Not mandatory; small tips are appreciated for good service",
    hospitalTip: "Private hospitals are good but expensive - keep insurance and passport copy",
    weather: "Tropical climate; monsoon varies by coast",
    visa: {
      type: "On Arrival",
      badge: "orange",
      documents: ["Passport valid for at least 6 months", "Completed arrival form if required", "Passport-size photo", "Confirmed return ticket", "Hotel booking", "Proof of funds"],
      processingTime: "Usually same day at airport counters",
      cost: "₹4,800 approx. when visa-on-arrival fee applies",
      applyUrl: "https://www.thaievisa.go.th",
      warnings: ["Insufficient cash or proof of funds", "No return ticket", "Hotel booking missing for first nights", "Passport validity under 6 months"]
    },
    currency: {
      code: "THB",
      rate: "1 THB ≈ ₹2.30",
      tip: "Cash is useful for street food, markets, tuk-tuks, and island trips; cards are fine in hotels and malls.",
      cashCard: "Carry more cash than card for markets, street food, ferries, and islands.",
      atm: "ATMs are everywhere, but Thai ATM withdrawal fees can be high.",
      services: ["BookMyForex", "Thomas Cook Forex", "Wise", "Niyo Global"]
    },
    sim: {
      local: "AIS, TrueMove H, or dtac Tourist SIM",
      carriers: ["AIS", "TrueMove H", "dtac"],
      esim: "Airalo, Nomad, or dtac Happy Tourist eSIM",
      advice: "Buy an 8-15 day tourist SIM at the airport if you want instant setup.",
      airportTip: "Airport tourist SIM desks are efficient; city shops can be cheaper for longer stays."
    },
    transport: {
      cabs: ["Grab", "Bolt", "inDrive"],
      apps: ["Grab"],
      airportTip: "Use official airport taxi counters or Airport Rail Link in Bangkok to avoid inflated fares.",
      airportCost: "Airport Rail Link from ₹90; taxi to central Bangkok ₹900-₹1,600",
      publicNote: "Bangkok BTS and MRT are reliable; islands usually need songthaews, taxis, or scooters."
    },
    essentials: {
      emergency: "191 Police, 1669 Medical",
      embassy: "+66 2 258 0300",
      embassyName: "Embassy of India, Bangkok",
      dos: ["Remove shoes before entering temples and some homes.", "Dress modestly for temples.", "Carry cash for local markets and islands."],
      donts: ["Do not touch anyone's head.", "Do not disrespect Buddha images.", "Avoid unmetered taxis where app rides are available."],
      tips: ["Remove shoes before entering temples and some homes.", "Dress modestly for temples.", "Do not touch anyone's head; it is considered disrespectful."],
      bestTime: "November to February"
    }
  },
  Singapore: {
    name: "Singapore",
    flag: "🇸🇬",
    summary: "Clean, efficient, family-friendly, and packed with food, shopping, and attractions.",
    hero: "Singapore skyline and gardens",
    heroImage: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1400",
    language: "English, Malay, Mandarin, Tamil",
    bestTime: "February to April",
    plugType: "Type G",
    upiAccepted: true,
    tipping: "Not expected; service charge is often included",
    hospitalTip: "Medical care is excellent but costly - keep travel insurance",
    weather: "Hot and humid year-round with frequent short showers",
    visa: {
      type: "e-Visa",
      badge: "blue",
      documents: ["Passport valid for at least 6 months", "Completed Form 14A", "Recent passport-size photo", "Confirmed return tickets", "Hotel booking", "Bank statement or proof of funds"],
      processingTime: "3 to 5 working days",
      cost: "₹2,500 to ₹3,500 approx. via authorised agent",
      applyUrl: "https://www.ica.gov.sg/enter-transit-depart/entering-singapore/visa-requirements",
      warnings: ["Incorrect photo size", "Passport scan not clear", "Missing return ticket", "Mismatch in hotel and travel dates"]
    },
    currency: {
      code: "SGD",
      rate: "1 SGD ≈ ₹62.00",
      tip: "Cards are widely accepted, but keep SGD 50-100 for hawker centres and small vendors.",
      cashCard: "Cards and contactless are excellent; keep small cash for hawker centres.",
      atm: "ATMs are very easy to find in malls, MRT stations, and neighbourhood centres.",
      services: ["Niyo Global", "Wise", "BookMyForex", "Thomas Cook Forex"]
    },
    sim: {
      local: "Singtel hi! Tourist SIM, StarHub Travel SIM, or M1 Tourist SIM",
      carriers: ["Singtel", "StarHub", "M1"],
      esim: "Airalo, Nomad, or Singtel tourist eSIM",
      advice: "A 100 GB tourist SIM can be good value if travelling with family.",
      airportTip: "Changi Airport SIM counters are reliable; city convenience stores may offer more choices."
    },
    transport: {
      cabs: ["Grab", "Gojek", "ComfortDelGro Zig"],
      apps: ["Grab", "Gojek"],
      airportTip: "MRT from Changi is affordable; taxis are convenient for families with luggage.",
      airportCost: "MRT from ₹150; taxi/Grab to city ₹1,600-₹2,800",
      publicNote: "Use contactless cards or EZ-Link for MRT and buses."
    },
    essentials: {
      emergency: "999 Police, 995 Ambulance/Fire",
      embassy: "+65 6238 2537",
      embassyName: "High Commission of India, Singapore",
      dos: ["Follow public cleanliness rules strictly.", "Return trays at hawker centres.", "Use MRT and buses for most sightseeing."],
      donts: ["Do not litter.", "Do not smoke outside designated zones.", "Do not eat or drink on MRT trains."],
      tips: ["Follow public cleanliness rules strictly.", "Do not litter or smoke outside designated zones.", "Hawker centres often require self-service tray return."],
      bestTime: "February to April"
    }
  },
  Japan: {
    name: "Japan",
    flag: "🇯🇵",
    summary: "Temples, trains, cherry blossoms, anime culture, food, and deeply organized travel.",
    hero: "Tokyo streets and Mount Fuji",
    heroImage: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1400",
    language: "Japanese",
    bestTime: "March to May and October to November",
    plugType: "Type A / Type B",
    upiAccepted: false,
    tipping: "Tipping is not customary and can feel awkward",
    hospitalTip: "Carry travel insurance and translated medicine prescriptions",
    weather: "Four distinct seasons; summer is humid and typhoon season can affect plans",
    visa: {
      type: "Sticker Visa",
      badge: "red",
      documents: ["Passport with blank pages", "Visa application form", "Recent passport-size photo", "Daily itinerary", "Confirmed flight and hotel bookings", "Bank statement and ITR", "Employment or student proof"],
      processingTime: "5 to 7 working days after submission",
      cost: "₹500 to ₹1,500 approx. plus service charges",
      applyUrl: "https://www.vfsglobal.com/japan/india",
      warnings: ["Incomplete day-wise itinerary", "Low or inconsistent bank balance", "Missing ITR or employment proof", "Hotel bookings not matching route"]
    },
    currency: {
      code: "JPY",
      rate: "1 JPY ≈ ₹0.53",
      tip: "Japan is card-friendly but still cash-reliant in small restaurants, temples, and rural areas.",
      cashCard: "Carry cash for temples, small restaurants, lockers, and rural areas; use cards in cities.",
      atm: "7-Eleven, Lawson, Japan Post, and airport ATMs are tourist-friendly.",
      services: ["Wise", "Niyo Global", "BookMyForex", "Thomas Cook Forex"]
    },
    sim: {
      local: "Sakura Mobile, Mobal, or BIC Camera tourist SIM",
      carriers: ["Sakura Mobile", "Mobal", "BIC Camera tourist SIM"],
      esim: "Ubigi, Airalo, or Nomad Japan eSIM",
      advice: "Use eSIM if your phone supports it; local voice SIMs can be harder for tourists.",
      airportTip: "Airport SIM vending machines are convenient; eSIM is usually smoother for short trips."
    },
    transport: {
      cabs: ["GO Taxi", "Uber", "DiDi"],
      apps: ["Uber"],
      airportTip: "Use Narita Express, Keisei Skyliner, Haneda Monorail, or airport limousine bus based on hotel area.",
      airportCost: "Train from ₹700-₹2,000; taxi from Narita can exceed ₹15,000",
      publicNote: "Get Suica, Pasmo, or ICOCA for trains, metros, buses, and convenience stores."
    },
    essentials: {
      emergency: "110 Police, 119 Ambulance/Fire",
      embassy: "+81 3 3262 2391",
      embassyName: "Embassy of India, Tokyo",
      dos: ["Speak softly on public transport.", "Carry your passport while sightseeing.", "Sort waste carefully where bins are available."],
      donts: ["Do not tip at restaurants.", "Do not talk loudly on trains.", "Avoid eating while walking in crowded areas."],
      tips: ["Speak softly on public transport.", "Sort waste carefully where bins are available.", "Carry your passport; police may request ID."],
      bestTime: "March to May and October to November"
    }
  },
  Canada: {
    name: "Canada",
    flag: "🇨🇦",
    summary: "Nature, multicultural cities, universities, road trips, and dramatic seasonal travel.",
    hero: "Canadian mountains and cities",
    heroImage: "https://images.unsplash.com/photo-1517935706615-2717063c2225?w=1400",
    language: "English and French",
    bestTime: "June to September",
    plugType: "Type A / Type B",
    upiAccepted: false,
    tipping: "Customary, usually 15-20% at restaurants and taxis",
    hospitalTip: "Healthcare is expensive for visitors - travel insurance is essential",
    weather: "Cold winters and pleasant summers; pack for the province and season",
    visa: {
      type: "Sticker Visa",
      badge: "red",
      documents: ["Passport valid for travel duration", "Visitor visa application", "Biometrics confirmation", "Bank statements and income proof", "Employment, student, or business proof", "Travel itinerary and hotel bookings", "Invitation letter if visiting family"],
      processingTime: "Several weeks; varies by season and biometrics availability",
      cost: "₹8,500 approx. visa fee plus biometrics fee if applicable",
      applyUrl: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada.html",
      warnings: ["Weak financial proof", "Unclear family or employment ties to India", "Missing invitation documents", "Incomplete biometrics follow-up"]
    },
    currency: {
      code: "CAD",
      rate: "1 CAD ≈ ₹61.00",
      tip: "Cards are easy to use; carry CAD 100-150 cash for small purchases and backup.",
      cashCard: "Cards are widely accepted; carry limited cash for small stores and remote areas.",
      atm: "ATMs are common, but fee-free withdrawals depend on your card network.",
      services: ["Wise", "Niyo Global", "BookMyForex", "ICICI Forex Card"]
    },
    sim: {
      local: "Rogers, Bell, Telus, or Freedom Mobile prepaid",
      carriers: ["Rogers", "Bell", "Telus", "Freedom Mobile"],
      esim: "Airalo, Nomad, or aloSIM Canada eSIM",
      advice: "Mobile data is costly; compare prepaid plans before buying at the airport.",
      airportTip: "Airport SIMs can be expensive; city stores and eSIM plans often offer better value."
    },
    transport: {
      cabs: ["Uber", "Lyft", "Local taxi apps"],
      apps: ["Uber", "Lyft"],
      airportTip: "Toronto UP Express and Vancouver SkyTrain are strong airport options; compare with ride-share.",
      airportCost: "Airport train from ₹600; ride-share to city ₹2,500-₹5,500",
      publicNote: "Public transport is good in major cities, but intercity and national park travel often needs a car."
    },
    essentials: {
      emergency: "911",
      embassy: "+1 613 744 3751",
      embassyName: "High Commission of India, Ottawa",
      dos: ["Pack for province-specific weather.", "Carry insurance documents.", "Budget extra time for winter travel delays."],
      donts: ["Do not underestimate winter conditions.", "Do not miss tipping in restaurants.", "Avoid feeding wildlife in parks."],
      tips: ["Tipping is customary in restaurants and taxis.", "Weather can be extreme; pack for the specific province and month.", "Carry travel insurance because healthcare is expensive for visitors."],
      bestTime: "June to September"
    }
  },
  Australia: {
    name: "Australia",
    flag: "🇦🇺",
    summary: "Beaches, wildlife, road trips, student cities, reefs, and relaxed outdoor travel.",
    hero: "Sydney harbour and Australian coast",
    heroImage: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=1400",
    language: "English",
    bestTime: "September to November and March to May",
    plugType: "Type I",
    upiAccepted: false,
    tipping: "Not mandatory; round up or tip 10% for excellent service",
    hospitalTip: "Healthcare is expensive for visitors - buy comprehensive travel insurance",
    weather: "Seasons are opposite to India; UV levels can be high",
    visa: {
      type: "e-Visa",
      badge: "blue",
      documents: ["Passport valid for intended stay", "Online visitor visa application", "Recent photo if requested", "Bank statements and income proof", "Employment or student proof", "Travel itinerary and accommodation", "Previous travel history if available"],
      processingTime: "2 to 4 weeks for many visitor applications",
      cost: "₹10,000 approx. for visitor visa subclass 600",
      applyUrl: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-finder/visit",
      warnings: ["Insufficient funds", "Weak employment or study proof", "Missing travel history explanation", "Unclear purpose of visit"]
    },
    currency: {
      code: "AUD",
      rate: "1 AUD ≈ ₹55.50",
      tip: "Cards are accepted widely; keep some cash for small shops, markets, and backup.",
      cashCard: "Cards are excellent in cities; keep cash for markets, parking, and small regional shops.",
      atm: "ATMs are easy to find in cities and towns; remote areas need planning.",
      services: ["Wise", "Niyo Global", "BookMyForex", "Thomas Cook Forex"]
    },
    sim: {
      local: "Telstra, Optus, or Vodafone prepaid SIM",
      carriers: ["Telstra", "Optus", "Vodafone"],
      esim: "Airalo, Nomad, or Optus eSIM",
      advice: "Choose Telstra coverage for road trips and regional travel.",
      airportTip: "Airport SIMs are reliable; choose coverage over price if visiting regional areas."
    },
    transport: {
      cabs: ["Uber", "DiDi", "Ola", "13cabs"],
      apps: ["Uber"],
      airportTip: "Airport train is fast in Sydney, but surcharges apply; compare with shuttle or ride-share for groups.",
      airportCost: "Airport train from ₹1,100; ride-share to city ₹2,500-₹4,500",
      publicNote: "Use Opal in Sydney, Myki in Melbourne, and go card in Brisbane."
    },
    essentials: {
      emergency: "000",
      embassy: "+61 2 6273 3999",
      embassyName: "High Commission of India, Canberra",
      dos: ["Declare all food and plant items at customs.", "Use sunscreen seriously.", "Swim between red and yellow beach flags."],
      donts: ["Do not bring undeclared food items.", "Do not ignore beach safety signs.", "Avoid driving long distances without rest stops."],
      tips: ["Biosecurity rules are strict; declare food, seeds, and wooden items.", "Use sunscreen seriously, even on cloudy days.", "Swim only between the red and yellow flags at beaches."],
      bestTime: "September to November and March to May"
    }
  }
};

const POPULAR_COUNTRIES = ["UAE", "USA", "UK", "Thailand", "Singapore", "Japan", "Canada", "Australia"];
