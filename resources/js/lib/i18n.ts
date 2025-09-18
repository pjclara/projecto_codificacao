import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      Platform: 'Platform',
      Settings: 'Settings',
      Dashboard: 'Dashboard',
      Users: 'Users',
      Roles: 'Roles',
      Permissions: 'Permissions',
      'Log out': 'Log out',

    },
  },
  pt: {
    translation: {
      Platform: 'Plataforma',
      Settings: 'Configurações',
      Dashboard: 'Painel',
      Users: 'Utilizadores',
      Roles: 'Roles',
      Permissions: 'Permissões',
        'Log out': 'Sair',
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'pt',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
