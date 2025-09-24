import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import VoiceInput from '../components/VoiceInput';
import CareerAdviserPanel from '../components/CareerAdviserPanel';
import VideoPanel from '../components/VideoPanel';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]); // { id: number, type: 'user' | 'system', content: string, videoUrl?: string, isLoading?: boolean }
  const [currentInput, setCurrentInput] = useState('');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateVideo = async (prompt, messageId) => {
    setIsGeneratingVideo(true);
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === messageId ? { ...msg, isLoading: true } : msg
      )
    );
    try {
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || '';
      const response = await fetch(`${apiBaseUrl}/generate-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId ? { ...msg, videoUrl: data.video_url, isLoading: false } : msg
        )
      );
    } catch (error) {
      console.error("Error generating video:", error);
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId ? { ...msg, content: `Error generating video: ${error.message}`, isLoading: false } : msg
        )
      );
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleSendMessage = async (text, isVoice = false) => {
    if (!text.trim()) return;

    const newUserMessage = { id: messages.length + 1, type: 'user', content: text };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setCurrentInput('');

    // Simulate advice generation (can be replaced with actual API call)
    const adviceContent = `「${text}」素晴らしい夢ですね！${text}になるには、プログラミングとチームワークがとても大切です。では、未来の職場を体験してみましょう！`;
    const newSystemMessage = { id: messages.length + 2, type: 'system', content: adviceContent, isLoading: true };
    setMessages(prevMessages => [...prevMessages, newSystemMessage]);

    // Generate video for the prompt
    generateVideo(text, newSystemMessage.id);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-8 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-4xl font-bold text-center">{t('dashboard_title')}</h1>
        <button onClick={handleLogout} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
          Logout
        </button>
      </div>

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chat Window */}
        <div className="lg:col-span-2 flex flex-col bg-white rounded-lg shadow p-4">
          <div className="flex-grow overflow-y-auto space-y-4 p-2">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-lg p-3 rounded-lg ${msg.type === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                  <p>{msg.content}</p>
                  {msg.isLoading && msg.type === 'system' && (
                    <div className="mt-2 text-sm text-gray-600">Generating video...</div>
                  )}
                  {msg.videoUrl && (
                    <div className="mt-2">
                      <VideoPanel videoUrl={msg.videoUrl} />
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="mt-4 flex items-center space-x-2">
            <textarea
              className="flex-grow p-2 border border-gray-300 rounded-md"
              rows="1"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(currentInput);
                }
              }}
              placeholder="Type your career interest or question..."
            ></textarea>
            <button
              onClick={() => handleSendMessage(currentInput)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              disabled={isGeneratingVideo}
            >
              Send
            </button>
            <VoiceInput onCareerChange={(text) => handleSendMessage(text, true)} />
          </div>
        </div>

        {/* Career Adviser Panel (Optional, can be integrated into chat) */}
        <div className="lg:col-span-1">
          <CareerAdviserPanel advice="" /> {/* Advice will now be in chat messages */}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;