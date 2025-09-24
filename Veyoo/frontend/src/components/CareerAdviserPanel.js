import React from 'react';
import { useTranslation } from 'react-i18next';

const CareerAdviserPanel = ({ advice }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-2xl font-bold mb-4">{t('adviser_title')}</h2>
      <p>{advice}</p>
    </div>
  );
};

export default CareerAdviserPanel;