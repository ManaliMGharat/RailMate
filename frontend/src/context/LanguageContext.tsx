import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi' | 'mr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    app_name: 'RailMate',
    tagline: 'Your journey, simplified.',
    greeting: 'Hi,',
    journey_planner: 'Journey Planner',
    reserved: 'Reserved',
    reserved_desc: 'Book berths & seats in Express & Rajdhani',
    unreserved: 'Unreserved',
    unreserved_desc: 'UTS daily commute & season passes',
    platform: 'Platform',
    platform_desc: 'Instant platform entry passes',
    more_offerings: 'More Offerings',
    search_trains: 'Search Trains',
    pnr_status: 'PNR Status',
    coach_position: 'Coach Position',
    track_your_train: 'Track Your Train',
    order_food: 'Order Food',
    file_refund: 'File Refund',
    rail_support: 'Rail Support',
    wallet_services: 'R-Wallet',
    do_you_know: 'Do You Know?',
    nav_home: 'Home',
    nav_bookings: 'My Bookings',
    nav_you: 'You',
    nav_menu: 'Menu',
    from_station: 'From Station',
    to_station: 'To Station',
    journey_date: 'Journey Date',
    class: 'Class',
    quota: 'Quota',
    search_button: 'Search Trains',
    upcoming: 'Upcoming',
    completed: 'Completed',
    cancelled: 'Cancelled',
    demo_notice: 'Demo data — not live railway information',
    book_now: 'Book Now',
    fare_summary: 'Fare Summary',
    pay_now: 'Pay & Confirm',
    cancel_ticket: 'Cancel Ticket',
    track_status: 'Track Status',
    add_passenger: 'Add Passenger',
  },
  hi: {
    app_name: 'रेलमैट (RailMate)',
    tagline: 'आपकी यात्रा, हुई आसान।',
    greeting: 'नमस्ते,',
    journey_planner: 'यात्रा योजना (Journey Planner)',
    reserved: 'आरक्षित (Reserved)',
    reserved_desc: 'एक्सप्रेस व राजधानी में बर्थ और सीट बुक करें',
    unreserved: 'अनारक्षित (Unreserved)',
    unreserved_desc: 'दैनिक यात्रा व सीजन टिकट पास',
    platform: 'प्लेटफॉर्म (Platform)',
    platform_desc: 'तुरंत प्लेटफॉर्म प्रवेश टिकट',
    more_offerings: 'अन्य सेवाएं (More Offerings)',
    search_trains: 'ट्रेन खोजें',
    pnr_status: 'पीएनआर स्थिति',
    coach_position: 'कोच स्थिति',
    track_your_train: 'लाइव ट्रेन ट्रैक करें',
    order_food: 'खाना आर्डर करें',
    file_refund: 'रिफंड दर्ज करें',
    rail_support: 'रेल सहायता (Rail Support)',
    wallet_services: 'आर-वॉलेट (R-Wallet)',
    do_you_know: 'क्या आप जानते हैं?',
    nav_home: 'होम',
    nav_bookings: 'मेरी बुकिंग्स',
    nav_you: 'आप (You)',
    nav_menu: 'मेनू',
    from_station: 'कहाँ से',
    to_station: 'कहाँ तक',
    journey_date: 'यात्रा तिथि',
    class: 'श्रेणी (Class)',
    quota: 'कोटा (Quota)',
    search_button: 'ट्रेन खोजें',
    upcoming: 'आगामी यात्राएं',
    completed: 'पूर्ण',
    cancelled: 'रद्द',
    demo_notice: 'डेमो डेटा — आधिकारिक लाइव डेटा नहीं है',
    book_now: 'अभी बुक करें',
    fare_summary: 'किराया विवरण',
    pay_now: 'भुगतान करें और पुष्टि करें',
    cancel_ticket: 'टिकट रद्द करें',
    track_status: 'स्थिति जांचें',
    add_passenger: 'यात्री जोड़ें',
  },
  mr: {
    app_name: 'रेलमैट (RailMate)',
    tagline: 'तुमचा प्रवास, सोपा आणि सुकर.',
    greeting: 'नमस्कार,',
    journey_planner: 'प्रवास नियोजन (Journey Planner)',
    reserved: 'आरक्षित (Reserved)',
    reserved_desc: 'एक्सप्रेस व राजधानी गाड्यांमध्ये आरक्षण',
    unreserved: 'अनारक्षित (UTS)',
    unreserved_desc: 'दैनंदिन लोकल प्रवास व मासिक पास',
    platform: 'प्लॅटफॉर्म (Platform)',
    platform_desc: 'त्वरित प्लॅटफॉर्म तिकीट',
    more_offerings: 'इतर सेवा (More Offerings)',
    search_trains: 'गाड्या शोधा',
    pnr_status: 'पीएनआर स्थिती',
    coach_position: 'डब्याची स्थिती (Coach)',
    track_your_train: 'गाडीचा थेट ठावठिकाणा',
    order_food: 'खाद्यपदार्थ मागवा',
    file_refund: 'परतावा मिळवा (Refund)',
    rail_support: 'रेल मदत (Support)',
    wallet_services: 'आर-वॉलेट (Wallet)',
    do_you_know: 'माहित आहे का तुम्हाला?',
    nav_home: 'मुख्यपृष्ठ',
    nav_bookings: 'माझ्या बुकिंग्ज',
    nav_you: 'माझे खाते',
    nav_menu: 'मेनू',
    from_station: 'प्रारंभ स्थानक',
    to_station: 'गंतव्य स्थानक',
    journey_date: 'प्रवासाची तारीख',
    class: 'वर्ग (Class)',
    quota: 'कोटा (Quota)',
    search_button: 'ट्रेन शोधा',
    upcoming: 'पुढील प्रवास',
    completed: 'झालेले प्रवास',
    cancelled: 'रद्द केलेले',
    demo_notice: 'डेमो माहिती — अधिकृत रेल्वे माहिती नाही',
    book_now: 'आता बुक करा',
    fare_summary: 'भाडे तपशील',
    pay_now: 'पैसे भरा आणि निश्चित करा',
    cancel_ticket: 'तिकीट रद्द करा',
    track_status: 'स्थिती तपासा',
    add_passenger: 'प्रवासी जोडा',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('railmate_lang') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('railmate_lang', lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
