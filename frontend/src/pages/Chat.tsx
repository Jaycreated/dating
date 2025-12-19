import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Image as ImageIcon, Lock } from 'lucide-react';
import { messageAPI, matchAPI, paymentAPI } from '../services/api';
import { socketService } from '../services/socket';

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
    isOptimistic?: boolean; 
  isError?: boolean;       
  error?: string;  
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
  const [hasChatAccess, setHasChatAccess] = useState<boolean | null>(() => {
    const storedAccess = localStorage.getItem('hasChatAccess');
    return storedAccess ? storedAccess === 'true' : null;
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Check if user has chat access
  const checkChatAccess = useCallback(async () => {
    try {
      const response = await paymentAPI.checkChatAccess();
      const hasAccess = response.hasAccess;
      setHasChatAccess(hasAccess);
      localStorage.setItem('hasChatAccess', hasAccess ? 'true' : 'false');
      return hasAccess;
    } catch (error) {
      console.error('Error checking chat access:', error);
      // Fallback to localStorage if API call fails
      const storedAccess = localStorage.getItem('hasChatAccess') === 'true';
      setHasChatAccess(storedAccess);
      return storedAccess;
    }
  }, []);

  // Check access when component mounts
  useEffect(() => {
    const verifyAccess = async () => {
      const hasAccess = await checkChatAccess();
      if (hasAccess) {
        // Only load messages if user has access
        if (matchId) {
          loadMessages();
          loadMatchInfo();
        }
      } else {
        setShowPaymentModal(true);
      }
    };
    
    // Get current user ID
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUserId(user.id);
      verifyAccess();
    }
  }, [checkChatAccess, matchId]);

  useEffect(() => {
    // Get current user ID
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUserId(user.id);
      
      // Check chat access when component mounts
      checkChatAccess();
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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId || !matchId || isSending) return;
    
    // Double check access before sending
    const hasAccess = await checkChatAccess();
    if (!hasAccess) {
      setShowPaymentModal(true);
      return;
    }
    
    if (!match) {
      console.log('❌ No match found');
      return;
    }

    // Create a temporary message ID (will be replaced by server)
    const tempId = Date.now();
    const messageContent = newMessage.trim();
    
    // Create optimistic message
    const optimisticMessage: Message = {
      id: tempId,
      sender_id: currentUserId,
      receiver_id: match.id,
      content: messageContent,
      created_at: new Date().toISOString(),
      isOptimistic: true // Custom flag to identify optimistic messages
    };

    // Add to messages immediately for instant feedback
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setIsSending(true);
    
    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socketService.sendStopTyping(parseInt(matchId!), match.id);
    
    try {
      // Send message via socket
      socketService.sendMessage(parseInt(matchId!), match.id, messageContent);
      
      // The actual message will be added to the state via the socket event
      // The optimistic message will be replaced when the real message arrives
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      // Update the message to show it failed to send
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, isError: true, error: 'Failed to send' } 
          : msg
      ));
    } finally {
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
    return Array.isArray(photos) ? photos[0] || 'https://via.placeholder.com/100' : 'https://via.placeholder.com/100';
  };

  // Show loading state while checking access or loading messages
  if (hasChatAccess === null || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Check if user has chat access
  if (hasChatAccess === false) {
    // Double check with server before showing lock screen
    useEffect(() => {
      const verifyAccess = async () => {
        try {
          const response = await paymentAPI.checkChatAccess();
          if (response.hasAccess) {
            setHasChatAccess(true);
            localStorage.setItem('hasChatAccess', 'true');
          }
        } catch (error) {
          console.error('Error verifying chat access:', error);
        }
      };
      
      verifyAccess();
    }, []);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Chat Locked</h2>
          <p className="text-gray-600 mb-6">
            Unlock chat access to start messaging with your matches. This is a one-time payment.
          </p>
          <button
            onClick={() => navigate('/payment/chat')}
            className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Unlock Chat
          </button>
          <button
            onClick={() => navigate('/matches')}
            className="mt-4 text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Back to Matches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex flex-col">
      {/* Header */}
      {/* <header className="bg-white shadow-sm">
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
      </header> */}

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
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex items-center gap-3">
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
            placeholder={hasChatAccess ? "Type a message..." : "Unlock chat to send messages"}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            disabled={!hasChatAccess}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending || !hasChatAccess}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            title={!hasChatAccess ? "Unlock chat to send messages" : "Send message"}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Payment Required Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Unlock Chat Access</h2>
            <p className="mb-6">To start chatting, please complete your payment to unlock chat features.</p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/payment/chat')}
                className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                Unlock Chat for ₦3,000
              </button>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  navigate('/matches');
                }}
                className="w-full py-2 px-4 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                Back to Matches
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
