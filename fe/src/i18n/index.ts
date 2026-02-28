import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      heroBadge: "INDIA LAUNCH BUILD",
      heroTitle: "VEDA OS Mobile Console",
      heroText: "Validate past first, then unlock future guidance.",
      onboarding: "Onboarding",
      engine: "Engine",
      scores: "Scores",
      createProfile: "Create Profile",
      assessRisk: "Assess Risk",
      atmakaraka: "Atmakaraka",
      quick5: "Quick 5Y",
      full15: "Full 15Y",
      weekly: "Weekly",
      forecast: "Forecast 12M",
      refreshScores: "Refresh Scores",
      recordConsent: "Record Consent",
    },
  },
  hi: {
    translation: {
      heroBadge: "BHARAT LAUNCH BUILD",
      heroTitle: "VEDA OS मोबाइल कंसोल",
      heroText: "पहले अतीत को सत्यापित करें, फिर भविष्य मार्गदर्शन खोलें।",
      onboarding: "ऑनबोर्डिंग",
      engine: "इंजन",
      scores: "स्कोर्स",
      createProfile: "प्रोफाइल बनाएं",
      assessRisk: "रिस्क जांचें",
      atmakaraka: "आत्मकारक",
      quick5: "क्विक 5Y",
      full15: "फुल 15Y",
      weekly: "साप्ताहिक",
      forecast: "12 माह फोरकास्ट",
      refreshScores: "स्कोर्स रीफ्रेश",
      recordConsent: "सहमति रिकॉर्ड",
    },
  },
  te: {
    translation: {
      heroBadge: "భారత్ లాంచ్ బిల్డ్",
      heroTitle: "VEDA OS మొబైల్ కన్సోల్",
      heroText: "మొదట గతాన్ని ధృవీకరించి, తర్వాత భవిష్యత్ మార్గదర్శకాన్ని తెరవండి.",
      onboarding: "ఆన్‌బోర్డింగ్",
      engine: "ఇంజిన్",
      scores: "స్కోర్లు",
      createProfile: "ప్రొఫైల్ సృష్టించు",
      assessRisk: "రిస్క్ అంచనా",
      atmakaraka: "ఆత్మకారక",
      quick5: "క్విక్ 5Y",
      full15: "ఫుల్ 15Y",
      weekly: "వీక్లీ",
      forecast: "12 నెలల ఫోర్కాస్ట్",
      refreshScores: "స్కోర్లు రిఫ్రెష్",
      recordConsent: "సమ్మతి నమోదు",
    },
  },
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
}

export { i18n };
