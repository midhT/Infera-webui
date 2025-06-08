import React, { useState, useRef, useEffect } from 'react';
import { Send, PlusCircle, Copy, Check } from 'lucide-react'; // Added Copy and Check icons
import Markdown from 'react-markdown'; // For rendering markdown content

// Main App component
const App = () => {
  // State to store chat messages
  const [messages, setMessages] = useState([]);
  // State for the user's current input
  const [userInput, setUserInput] = useState('');
  // State to show/hide loading indicator
  const [isLoading, setIsLoading] = useState(false);
  // Ref for auto-scrolling chat window
  const chatMessagesRef = useRef(null);
  // State to manage copy button feedback (e.g., 'Copy' -> 'Copied!')
  const [copiedStates, setCopiedStates] = useState({});

  // Bot's name
  const botName = "Infera";
  // User's Name and Role - YOU CAN EDIT THESE!
  const userName = "User 1";
  const userRole = "Boss";

  // Function to initialize a new chat with introductory messages
  const initializeNewChat = () => {
    setMessages([
      // User's introductory message (the AI will "remember" this)
      { id: Date.now(), sender: 'user', text: `Hello, my name is ${userName} and I'm your ${userRole}.` },
      // Bot's initial greeting
      { id: Date.now() + 1, sender: botName, text: `Hello ${userName}! I'm ${botName}. How can I assist you today, ${userRole}?` }
    ]);
  };

  // Scroll to the bottom of the chat window when messages change
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Initial bot message on component mount
  useEffect(() => {
    initializeNewChat(); // Call the initializer when component mounts
  }, []); // Empty dependency array ensures this runs only once

  // Function to copy code to clipboard
  const copyToClipboard = (text, messageId) => {
    try {
      // Using document.execCommand('copy') for broader compatibility in iframes
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed"; // Prevent scrolling to bottom of page
      textArea.style.opacity = "0";      // Make it invisible
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      setCopiedStates(prev => ({ ...prev, [messageId]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [messageId]: false }));
      }, 2000); // Reset "Copied!" after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Optionally show a user-facing message about copy failure
    }
  };

  // Function to send message to the API
  const sendMessage = async () => {
    const prompt = userInput.trim();
    if (!prompt) return;

    // Add user's message to chat
    setMessages((prevMessages) => [
      ...prevMessages,
      { id: Date.now(), sender: 'user', text: prompt },
    ]);
    setUserInput(''); // Clear input

    setIsLoading(true); // Show loading indicator

    try {
      // Build chat history from all previous messages for context
      // The API expects `contents: [{ role: "user" | "model", parts: [{ text: "..." }] }]`
      const chatHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model', // Map 'user' to 'user', anything else (like botName) to 'model'
        parts: [{ text: msg.text }]
      }));

      // Add the current user prompt to the history being sent
      chatHistory.push({ role: "user", parts: [{ text: prompt }] });

      const payload = { contents: chatHistory };

      // API key is handled by the Canvas environment for security
      const apiKey = "";
      const apiUrl = ``;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const botResponse = result.candidates[0].content.parts[0].text;

        // Add bot's response to messages
        setMessages((prevMessages) => [
          ...prevMessages,
          { id: Date.now() + 1, sender: botName, text: botResponse },
        ]);
      } else {
        console.error('Unexpected API response structure:', result);
        setMessages((prevMessages) => [
          ...prevMessages,
          { id: Date.now() + 1, sender: botName, text: 'Sorry, I could not get a response. Please try again.' },
        ]);
      }
    } catch (error) {
      console.error('Error fetching bot response:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: Date.now() + 1, sender: botName, text: 'An error occurred while connecting to the chatbot. Please try again later.' },
      ]);
    } finally {
      setIsLoading(false); // Hide loading indicator
    }
  };

  // Function to start a new chat (clears messages)
  const newChat = () => {
    initializeNewChat(); // Re-initialize chat with your info
    setUserInput('');
    setCopiedStates({}); // Clear copied states for new chat
  };

  return (
    // Dark theme background and text colors
    <div className="flex flex-col md:flex-row h-screen bg-gray-900 font-sans antialiased text-gray-200">
      {/* Sidebar for New Chat/Model Info */}
      <div className="w-full md:w-64 bg-gray-950 text-white flex flex-col p-4 shadow-lg">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Infera Web UI</h2> {/* Updated Bot Name */}
          <p className="text-gray-400 text-sm">Powered by Gemini AI</p>
        </div>

        <button
          onClick={newChat}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 font-semibold text-lg"
        >
          <PlusCircle size={20} /> New Chat
        </button>

        <div className="mt-auto pt-6 border-t border-gray-700 text-sm text-gray-400">
          <p className="mb-1">Model: <span className="font-medium text-indigo-300">gemini-2.0-flash</span></p>
          <p>Version: 1.0</p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col p-4 md:p-6 bg-gray-800 rounded-l-none md:rounded-l-xl shadow-xl">
        {/* Chat Messages Display */}
        <div ref={chatMessagesRef} className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`p-3 rounded-xl shadow-sm max-w-[80%] ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none' // Darker indigo for user
                    : 'bg-gray-700 text-gray-100 rounded-bl-none' // Darker gray for bot
                }`}
              >
                {msg.sender === botName && (
                  <span className="font-bold text-indigo-400 block mb-1">{botName}:</span>
                )}
                {/* Render markdown for bot messages */}
                <Markdown
                  components={{
                    code({node, inline, className, children, ...props}) {
                      const codeContent = String(children).replace(/\n$/, '');
                      const isBlock = !inline;

                      if (isBlock) {
                        return (
                          <div className="relative group">
                            <pre className={`p-2 rounded-md overflow-x-auto text-sm`} style={{ backgroundColor: '#1a202c', color: '#e2e8f0' }}> {/* Even darker background for code */}
                              <code className={className} {...props}>
                                {codeContent}
                              </code>
                            </pre>
                            <button
                              onClick={() => copyToClipboard(codeContent, `${msg.id}-${node.position.start.line}-${node.position.start.column}`)}
                              className="absolute top-2 right-2 p-1 bg-gray-600 text-gray-200 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500"
                              title={copiedStates[`${msg.id}-${node.position.start.line}-${node.position.start.column}`] ? 'Copied!' : 'Copy code'}
                            >
                              {copiedStates[`${msg.id}-${node.position.start.line}-${node.position.start.column}`] ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                            </button>
                          </div>
                        );
                      } else {
                        return (
                          <code className={`bg-gray-600 text-gray-200 px-1 py-0.5 rounded ${className}`} {...props}>
                            {children}
                          </code>
                        );
                      }
                    }
                  }}
                >
                  {msg.text}
                </Markdown>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-700 text-gray-200 p-3 rounded-xl max-w-[80%] shadow-sm animate-pulse">
                <span className="font-bold text-indigo-400">{botName}:</span> Typing...
              </div>
            </div>
          )}
        </div>

        {/* Message Input Area */}
        <div className="mt-6 pt-4 border-t border-gray-700 flex items-center space-x-3">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-grow p-3 border border-gray-600 bg-gray-700 text-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 ease-in-out placeholder-gray-400"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
