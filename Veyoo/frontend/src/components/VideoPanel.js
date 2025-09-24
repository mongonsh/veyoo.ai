import React from 'react';
import { useTranslation } from 'react-i18next';

const VideoPanel = ({ videoUrl }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">{t('video_title')}</h2>
      {videoUrl ? (
        <video controls src={videoUrl} className="w-full rounded-lg" />
      ) : (
        <p>あなたの未来の職場がここに表示されます。</p>
      )}
    </div>
  );
};

export default VideoPanel;