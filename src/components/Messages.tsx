import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MessageCircle, Send, User, Search, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  read: boolean;
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
    role: string;
  };
  receiver?: {
    id: string;
    full_name: string;
    role: string;
  };
}

interface Conversation {
  userId: string;
  userName: string;
  userRole: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function Messages() {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; full_name: string; role: string }>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
    loadAvailableUsers();

    const channel = supabase
      .channel('messages-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          loadConversations();
          if (selectedUser) {
            loadMessages(selectedUser);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser);
      markMessagesAsRead(selectedUser);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function loadAvailableUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .neq('id', user?.id)
      .order('full_name');

    if (error) {
      console.error('Error loading users:', error);
    } else {
      setAvailableUsers(data || []);
    }
  }

  async function loadConversations() {
    if (!user) return;

    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        receiver_id,
        message,
        read,
        created_at,
        sender:profiles!messages_sender_id_fkey(id, full_name, role),
        receiver:profiles!messages_receiver_id_fkey(id, full_name, role)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading conversations:', error);
      setLoading(false);
      return;
    }

    const conversationMap = new Map<string, Conversation>();

    data?.forEach((msg: any) => {
      const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender;

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          userId: otherUserId,
          userName: otherUser.full_name,
          userRole: otherUser.role,
          lastMessage: msg.message,
          lastMessageTime: msg.created_at,
          unreadCount: 0,
        });
      }

      if (msg.receiver_id === user.id && !msg.read) {
        const conv = conversationMap.get(otherUserId)!;
        conv.unreadCount++;
      }
    });

    setConversations(Array.from(conversationMap.values()));
    setLoading(false);
  }

  async function loadMessages(otherUserId: string) {
    if (!user) return;

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name, role),
        receiver:profiles!messages_receiver_id_fkey(id, full_name, role)
      `)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
    } else {
      setMessages(data || []);
    }
  }

  async function markMessagesAsRead(otherUserId: string) {
    if (!user) return;

    await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', otherUserId)
      .eq('receiver_id', user.id)
      .eq('read', false);

    loadConversations();
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !selectedUser || !newMessage.trim() || !profile) return;

    if (!profile.organization_id) {
      console.error('Profile missing organization_id:', profile);
      alert('Your profile is not properly configured. Please contact support.');
      return;
    }

    setSending(true);

    const { data, error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: selectedUser,
      message: newMessage.trim(),
      organization_id: profile.organization_id,
    }).select();

    if (error) {
      console.error('Error sending message:', error);
      alert(`Failed to send message: ${error.message}`);
    } else {
      console.log('Message sent successfully:', data);
      setNewMessage('');
      loadMessages(selectedUser);
      loadConversations();
    }

    setSending(false);
  }

  const filteredUsers = availableUsers.filter(u =>
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUserData = availableUsers.find(u => u.id === selectedUser);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-250px)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
          <MessageCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Messages</h2>
          <p className="text-slate-400 text-sm">Direct messaging with team members</p>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <div className="w-80 bg-slate-700 rounded-lg border border-slate-600 flex flex-col">
          <div className="p-4 border-b border-slate-600">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {searchTerm ? (
              <div className="p-2">
                {filteredUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setSelectedUser(user.id);
                      setSearchTerm('');
                    }}
                    className="w-full p-3 hover:bg-slate-600 rounded-lg transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500 rounded-full p-2">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{user.full_name}</p>
                        <p className="text-xs text-slate-400 capitalize">{user.role}</p>
                      </div>
                    </div>
                  </button>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-slate-400 text-sm text-center py-4">No users found</p>
                )}
              </div>
            ) : (
              <div className="p-2">
                {conversations.map(conv => (
                  <button
                    key={conv.userId}
                    onClick={() => setSelectedUser(conv.userId)}
                    className={`w-full p-3 rounded-lg transition-colors text-left ${
                      selectedUser === conv.userId
                        ? 'bg-blue-600'
                        : 'hover:bg-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-500 rounded-full p-2 relative">
                        <User className="w-4 h-4 text-white" />
                        {conv.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-white font-medium truncate">{conv.userName}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <p className="text-sm text-slate-300 truncate">{conv.lastMessage}</p>
                      </div>
                    </div>
                  </button>
                ))}
                {conversations.length === 0 && (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-slate-500 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">No conversations yet</p>
                    <p className="text-slate-500 text-xs mt-1">Search for users to start chatting</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 bg-slate-700 rounded-lg border border-slate-600 flex flex-col">
          {selectedUser ? (
            <>
              <div className="p-4 border-b border-slate-600 bg-slate-800">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500 rounded-full p-2">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{selectedUserData?.full_name}</h3>
                    <p className="text-xs text-slate-400 capitalize">{selectedUserData?.role}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => {
                  const isOwn = msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                          isOwn
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-600 text-white'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-1 ${isOwn ? 'text-blue-200' : 'text-slate-400'}`}>
                          {new Date(msg.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-slate-600">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">Select a conversation</p>
                <p className="text-slate-500 text-sm mt-1">Choose a user from the left to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
