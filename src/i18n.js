import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import en from './locales/en.json';
import ku from './locales/ku.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import zh from './locales/zh.json';
import ar from './locales/ar.json';

const resources = {
    en: { translation: en },
    ku: { translation: ku },
    es: { translation: es },
    fr: { translation: fr },
    de: { translation: de },
    zh: { translation: zh },
    ar: { translation: ar }
};

// Get saved language from localStorage or default to 'en'
const savedLanguage = localStorage.getItem('userLanguage') || 'en';

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: savedLanguage,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false // React already escapes
        }
    });

export default i18n;

// Helper to change language and persist
export const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('userLanguage', lang);
    // Set document direction for RTL languages
    if (lang === 'ar' || lang === 'ku') {
        document.documentElement.dir = 'rtl';
        document.documentElement.lang = lang;
    } else {
        document.documentElement.dir = 'ltr';
        document.documentElement.lang = lang;
    }
};

// Available languages
export const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ku', name: 'Kurdish', nativeName: 'کوردی' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' }
];
