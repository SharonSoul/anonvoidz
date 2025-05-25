'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Message, Void, VoidUser } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function VoidChat() {
  const params = useParams();
  const router = useRouter();
  const [void_, setVoid] = useState<Void | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<VoidUser[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(true);
  const [nickname, setNickname] = useState('');
  const [currentUser, setCurrentUser] = useState<VoidUser | null>(null);

  useEffect(() => {
    fetchVoid();
    const channel = supabase
      .channel('void_messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, handleMessageChange)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id]);

  const fetchVoid = async () => {
    try {
      const { data: void_, error } = await supabase
        .from('voids')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setVoid(void_);
    } catch (error) {
      toast.error('Failed to load Void');
      router.push('/');
    }
  };

  const handleMessageChange = (payload: any) => {
    if (payload.new && payload.new.void_id === params.id) {
      setMessages((prev) => [...prev, payload.new]);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    try {
      const { data: user, error } = await supabase
        .from('void_users')
        .insert([
          {
            void_id: params.id,
            nickname: nickname,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
            media_uploads: { images: 0, videos: 0 },
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setCurrentUser(user);
      setShowJoinModal(false);
      toast.success('Joined Void successfully!');
    } catch (error) {
      toast.error('Failed to join Void');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    try {
      const { error } = await supabase.from('messages').insert([
        {
          void_id: params.id,
          user_id: currentUser.id,
          content: newMessage,
          expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
        },
      ]);

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (showJoinModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full">
          <h2 className="text-2xl font-bold mb-6">Join Void</h2>
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium mb-2">
                Choose a Nickname
              </label>
              <input
                type="text"
                id="nickname"
                required
                className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg"
            >
              Join
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-gray-800 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">{void_?.name}</h1>
          <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
            {users.length}/{void_?.user_cap}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-2 ${
              message.user_id === currentUser?.id ? 'justify-end' : ''
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.user_id === currentUser?.id
                  ? 'bg-purple-600'
                  : 'bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">
                  {users.find((u) => u.id === message.user_id)?.nickname}
                </span>
                <span className="text-xs text-gray-400">
                  {format(new Date(message.created_at), 'HH:mm')}
                </span>
              </div>
              <p>{message.content}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage} className="p-4 bg-gray-800">
        <div className="container mx-auto flex gap-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
} 