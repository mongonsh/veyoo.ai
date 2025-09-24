import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div>
      <button onClick={() => changeLanguage('jp')} className="text-white mr-2">日本語</button>
      <button onClick={() => changeLanguage('en')} className="text-white">English</button>
    </div>
  );
};

export default LanguageSwitcher;