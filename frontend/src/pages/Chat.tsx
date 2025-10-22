import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Image as ImageIcon } from 'lucide-react';
import { messageAPI, matchAPI } from '../services/api';
import { socketService } from '../services/socket';

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
}

interface Match {
  id: number;
  name: string;
  photos: string[];
}

const Chat = () => {
  const navigate = useNavigate();
  const { matchId } = useParams<{ matchId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Get current user ID
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUserId(user.id);
    }

    // Connect to socket
    console.log('🔌 Connecting to socket...');
    socketService.connect();
    
    // Wait a bit for connection then check
    setTimeout(() => {
      console.log('Socket connection status:', socketService.isConnected());
    }, 1000);

    // Join conversation
    if (matchId) {
      socketService.joinConversation(parseInt(matchId));
      loadMessages();
      loadMatchInfo();
    }

    // Listen for new messages
    socketService.onNewMessage((message: Message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    // Listen for typing
    socketService.onUserTyping((data) => {
      if (data.match_id === parseInt(matchId!)) {
        setIsTyping(true);
      }
    });

    socketService.onUserStopTyping((data) => {
      if (data.match_id === parseInt(matchId!)) {
        setIsTyping(false);
      }
    });

    return () => {
      if (matchId) {
        socketService.leaveConversation(parseInt(matchId));
      }
      socketService.offNewMessage();
      socketService.offUserTyping();
      socketService.offUserStopTyping();
    };
  }, [matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const response = await messageAPI.getConversation(parseInt(matchId!));
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMatchInfo = async () => {
    console.log('🔍 Loading match info for matchId:', matchId);
    
    // Try to get from localStorage first
    const matchesData = localStorage.getItem('matches');
    console.log('Matches from localStorage:', matchesData);
    
    if (matchesData) {
      try {
        const matches = JSON.parse(matchesData);
        console.log('Parsed matches:', matches);
        
        const currentMatch = matches.find((m: any) => m.id === parseInt(matchId!));
        console.log('Found match:', currentMatch);
        
        if (currentMatch) {
          setMatch(currentMatch);
          return;
        }
      } catch (error) {
        console.error('Error parsing matches:', error);
      }
    }
    
    // If not found in localStorage, fetch from API
    console.log('Match not in localStorage, fetching from API...');
    try {
      const response = await matchAPI.getMatches();
      const matchesFromAPI = response.matches || [];
      
      // Parse photos if needed
      const parsedMatches = matchesFromAPI.map((m: any) => ({
        ...m,
        photos: typeof m.photos === 'string' ? JSON.parse(m.photos) : m.photos || [],
      }));
      
      // Save to localStorage
      localStorage.setItem('matches', JSON.stringify(parsedMatches));
      
      // Find current match
      const currentMatch = parsedMatches.find((m: any) => m.id === parseInt(matchId!));
      console.log('Found match from API:', currentMatch);
      
      if (currentMatch) {
        setMatch(currentMatch);
      } else {
        console.error('❌ Match not found with ID:', matchId);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔍 Send button clicked!');
    console.log('Message:', newMessage);
    console.log('Match:', match);
    console.log('Match ID:', matchId);
    console.log('Socket connected:', socketService.isConnected());
    
    if (!newMessage.trim()) {
      console.log('❌ Message is empty');
      return;
    }
    
    if (!match) {
      console.log('❌ No match found');
      return;
    }

    console.log('✅ Sending message via socket...');
    setIsSending(true);
    
    try {
      socketService.sendMessage(parseInt(matchId!), match.id, newMessage.trim());
      setNewMessage('');
      
      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socketService.sendStopTyping(parseInt(matchId!), match.id);
      
      // Reset sending state after a short delay
      setTimeout(() => setIsSending(false), 500);
    } catch (error) {
      console.error('❌ Error sending message:', error);
      setIsSending(false);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (!match) return;

    // Send typing indicator
    socketService.sendTyping(parseInt(matchId!), match.id);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socketService.sendStopTyping(parseInt(matchId!), match.id);
    }, 2000);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getFirstPhoto = (photos: string | string[]) => {
    if (typeof photos === 'string') {
      try {
        const parsed = JSON.parse(photos);
        return parsed[0] || 'https://via.placeholder.com/100';
      } catch {
        return 'https://via.placeholder.com/100';
      }
    }
    return photos[0] || 'https://via.placeholder.com/100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate('/matches')}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>

          {match && (
            <div className="flex items-center gap-3 flex-1">
              <img
                src={getFirstPhoto(match.photos)}
                alt={match.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h2 className="font-semibold text-gray-900">{match.name}</h2>
                {isTyping && (
                  <p className="text-sm text-gray-500 italic">typing...</p>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500">No messages yet. Say hi! 👋</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender_id === currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      isOwnMessage
                        ? 'bg-purple-600 text-white rounded-br-none'
                        : 'bg-white text-gray-900 rounded-bl-none'
                    }`}
                  >
                    <p className="break-words">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-purple-200' : 'text-gray-500'
                      }`}
                    >
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 transition"
            title="Send image (coming soon)"
          >
            <ImageIcon className="w-6 h-6" />
          </button>
          
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="p-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => console.log('🖱️ Send button clicked directly')}
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
