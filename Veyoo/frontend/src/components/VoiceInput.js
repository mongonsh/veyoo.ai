import React, { useState, useRef } from 'react';

const VoiceInput = ({ onCareerChange }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };
      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        // In a real application, you would send this audioBlob to a speech-to-text API
        // For now, we'll simulate a response or use a placeholder
        onCareerChange('Simulated voice input: Software Engineer'); // Placeholder
        audioChunks.current = [];
      };
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please ensure it's connected and permissions are granted.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <button
      onClick={isRecording ? stopRecording : startRecording}
      className={`p-2 rounded-full shadow-md transition-colors duration-200
        ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-300 hover:bg-gray-400'}
        text-white focus:outline-none focus:ring-2 focus:ring-offset-2
        ${isRecording ? 'focus:ring-red-500' : 'focus:ring-gray-500'}`}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        {isRecording ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 11a7 7 0 01-7 7v1a1 1 0 01-1 1h-2a1 1 0 01-1-1v-1a7 7 0 01-7-7V7a1 1 0 011-1h2a1 1 0 011 1v4a5 5 0 005 5h0a5 5 0 005-5V7a1 1 0 011-1h2a1 1 0 011 1v4z"
          />
        )}
      </svg>
    </button>
  );
};

export default VoiceInput;