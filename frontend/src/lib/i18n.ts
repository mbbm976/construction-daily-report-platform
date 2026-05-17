import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import mnCommon from '../locales/mn/common.json'
import enCommon from '../locales/en/common.json'

const defaultLanguage = import.meta.env.VITE_DEFAULT_LANGUAGE || 'mn'

i18n.use(initReactI18next).init({
  resources: {
    mn: {
      common: mnCommon,
    },
    en: {
      common: enCommon,
    },
  },
  lng: defaultLanguage,
  fallbackLng: 'mn',
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
