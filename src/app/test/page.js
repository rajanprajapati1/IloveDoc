'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import modelsData from './models.json';
import Dashboard from '@/components/ads/Adsboard';

export default function Home() {
 const [messages, setMessages] = useState([
  { role: 'ai', content: 'Hello! I am your AI assistant. How can I help you today?' }
 ]);
 const [input, setInput] = useState('');
 const [isLoading, setIsLoading] = useState(false);
 const [selectedModel, setSelectedModel] = useState(modelsData[2] || modelsData[0]);
 const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
 const messagesEndRef = useRef(null);
 const dropdownRef = useRef(null);

 const getDisplayName = (model) => model?.model || model?.fullName || 'Model';
 const getRequestModel = (model) => model?.apiModel || model?.fullName || model?.model || '';



 const containerRef = useRef(null);

 const isNearBottom = () => {
  const el = containerRef.current;
  if (!el) return true;

  return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
 };

 const scrollToBottom = () => {
  if (!messagesEndRef.current) return;

  messagesEndRef.current.scrollIntoView({
   behavior: "smooth",
   block: "end",
  });
 };


 useLayoutEffect(() => {
  if (isNearBottom()) {
   scrollToBottom();
  }
 }, [messages]);


 useEffect(() => {
  const handleClickOutside = (event) => {
   if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
    setIsModelDropdownOpen(false);
   }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 const handleSubmit = async (e) => {
  e.preventDefault();
  if (!input.trim() || isLoading) return;

  const userMessage = { role: 'user', content: input };
  setMessages((prev) => [...prev, userMessage]);
  setInput('');
  setIsLoading(true);

  try {
   const response = await fetch('/api/v1/doc/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
     model: getRequestModel(selectedModel),
     messages: [...messages, userMessage].map(m => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.content
     }))
    }),
   });

   if (!response.ok) throw new Error('Failed to fetch');

   const reader = response.body.getReader();
   const decoder = new TextDecoder();
   let aiResponseContent = '';

   setMessages((prev) => [...prev, { role: 'ai', content: '' }]);

   while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
     if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') break;
      try {
       const json = JSON.parse(data);
       const text = json.choices[0]?.delta?.content || '';
       aiResponseContent += text;
       setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].content = aiResponseContent;
        return newMessages;
       });
      } catch (e) {
       // Ignore parse errors
      }
     }
    }
   }
  } catch (error) {
   console.error('Error:', error);
   setMessages((prev) => [...prev, { role: 'ai', content: 'Sorry, I encountered an error. Please try again.' }]);
  } finally {
   setIsLoading(false);
  }
 };

 return (
  <div className="chat-container" ref={containerRef}>
   <Dashboard />
   <header className="chat-header">

    <div className="model-selector" ref={dropdownRef}>
     <button
      className="model-dropdown-btn"
      onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
     >
      {selectedModel.icon && <img src={selectedModel.icon} alt={selectedModel.provider} />}
      <div className="model-info">
       <span className="model-name">{getDisplayName(selectedModel)}</span>
       <span className="model-provider">{selectedModel.provider}</span>
      </div>
      <span className="chevron">▼</span>
     </button>

     {isModelDropdownOpen && (
      <div className="model-options">
       {modelsData.map((m, idx) => (
        <div
         key={idx}
         className={`model-option ${selectedModel.fullName === m.fullName ? 'active' : ''}`}
         onClick={() => {
          setSelectedModel(m);
          setIsModelDropdownOpen(false);
         }}
        >
         {m.icon ? <img src={m.icon} alt={m.provider} /> : <div style={{ width: 24 }} />}
         <div className="model-info">
          <span className="model-name">{getDisplayName(m)}</span>
          <span className="model-provider">{m.provider}</span>
         </div>
        </div>
       ))}
      </div>
     )}
    </div>
   </header>

   <main className="chat-messages">
    {messages.map((msg, index) => (
     <div key={index} className={`message ${msg.role}`}>
      {msg.content}
     </div>
    ))}
    {isLoading && messages[messages.length - 1].role === 'user' && (
     <div className="message ai">
      <div className="typing-indicator">
       <span className="dot"></span>
       <span className="dot"></span>
       <span className="dot"></span>
      </div>
     </div>
    )}
    <div ref={messagesEndRef} />
   </main>

   <footer className="chat-input-area">
    <form onSubmit={handleSubmit} className="input-wrapper">
     <input
      type="text"
      value={input}
      onChange={(e) => setInput(e.target.value)}
      placeholder={`Message ${getDisplayName(selectedModel)}...`}
      disabled={isLoading}
     />
     <button type="submit" disabled={isLoading || !input.trim()}>
      {isLoading ? '...' : 'Send'}
     </button>
    </form>
   </footer>
  </div>
 );
}
