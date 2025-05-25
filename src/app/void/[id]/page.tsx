'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Message, Void, VoidUser } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { PhotoIcon, VideoCameraIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import MediaUpload from '@/components/MediaUpload';
import Link from 'next/link';
import Image from 'next/image';

const getUserColor = (userId: string) => {
  const colors = [
    'bg-purple-600',
    'bg-blue-600',
    'bg-green-600',
    'bg-pink-600',
    'bg-indigo-600',
    'bg-teal-600',
    'bg-orange-600',
    'bg-cyan-600',
    'bg-rose-600',
    'bg-violet-600',
  ];
  const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
};

export default function VoidChat() {
  const params = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<VoidUser | null>(null);
  const [void_, setVoid] = useState<Void | null>(null);
  const [users, setUsers] = useState<VoidUser[]>([]);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [nickname, setNickname] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageTimestampRef = useRef<string | null>(null);
  const processedMessageIds = useRef(new Set<string>());
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);

  const fetchVoid = useCallback(async () => {
    if (!params.id) return null;
    try {
      const { data, error } = await supabase
        .from('voids')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setVoid(data);
      return data;
    } catch (error) {
      console.error('Error fetching void:', error);
      router.push('/');
      return null;
    }
  }, [params.id, router]);

  const fetchMessages = useCallback(async () => {
    if (!params.id) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, void_users(*)')
        .eq('void_id', params.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [params.id]);

  const fetchUsers = useCallback(async () => {
    if (!params.id) return;
    try {
      const { data, error } = await supabase
        .from('void_users')
        .select('*')
        .eq('void_id', params.id);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [params.id]);

  const initializeVoid = useCallback(async () => {
    try {
      const voidData = await fetchVoid();
      if (voidData) {
        // Check for existing user session
        const savedUser = localStorage.getItem(`void_user_${params.id}`);
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          // Verify user still exists in the void
          const { data: user, error } = await supabase
            .from('void_users')
            .select('*')
            .eq('id', userData.id)
            .single();

          if (user && !error) {
            setCurrentUser(user);
            setShowJoinModal(false);
          } else {
            // If user doesn't exist anymore, clear the saved session
            localStorage.removeItem(`void_user_${params.id}`);
          }
        }
        await Promise.all([fetchMessages(), fetchUsers()]);
      }
    } catch (error) {
      console.error('Error initializing void:', error);
      toast.error('Failed to load Void');
    } finally {
      setLoading(false);
    }
  }, [fetchVoid, fetchMessages, fetchUsers, params.id]);

  useEffect(() => {
    initializeVoid();
    return () => {
      // Cleanup subscriptions
      const channel = supabase.channel('void_messages');
      channel.unsubscribe();
    };
  }, [fetchMessages, fetchUsers, fetchVoid]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: voidUser } = await supabase
          .from('void_users')
          .select('*')
          .eq('user_id', user.id)
          .single();
        setCurrentUser(voidUser);
      }
    };

    fetchCurrentUser();
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !void_) return;

    try {
      // Check if void is full
      if (users.length >= void_.user_cap) {
        toast.error('This Void is full');
        return;
      }

      // First, check if user already exists in this void
      const { data: existingUser, error: checkError } = await supabase
        .from('void_users')
        .select('*')
        .eq('void_id', params.id)
        .eq('nickname', nickname)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw checkError;
      }

      if (existingUser) {
        toast.error('This nickname is already taken in this Void');
        return;
      }

      const { data: user, error } = await supabase
        .from('void_users')
        .insert([
          {
            void_id: params.id,
            nickname: nickname.trim(),
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
            media_uploads: { images: 0, videos: 0 },
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!user) {
        throw new Error('No user data returned after insert');
      }

      // Save user session to localStorage
      localStorage.setItem(`void_user_${params.id}`, JSON.stringify(user));

      setCurrentUser(user);
      setUsers((prev) => [...prev, user]);
      setShowJoinModal(false);
      toast.success('Joined Void successfully!');
    } catch (error: any) {
      console.error('Error joining void:', error);
      toast.error(error.message || 'Failed to join Void. Please try again.');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !void_) return;

    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert([
          {
            void_id: params.id,
            user_id: currentUser.id,
            content: newMessage,
            expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
          },
        ])
        .select('*, void_users(*)')
        .single();

      if (error) throw error;
      
      // Add message to local state immediately and mark it as processed
      if (!processedMessageIds.current.has(message.id)) {
        processedMessageIds.current.add(message.id);
        setMessages(prev => [...prev, message]);
        // Only scroll to bottom when current user sends a message
        scrollToBottom();
      }
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleMediaUpload = async (file: File) => {
    if (!file || !currentUser) return;
    
    try {
      setIsUploading(true);
      setUploadError(null);

      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${params.id}/${fileName}`;

      console.log('Uploading file:', { fileName, filePath, fileType: file.type });

      // Upload the file
      const { error: uploadError, data } = await supabase.storage
        .from('void-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(uploadError.message);
      }

      if (!data?.path) {
        throw new Error('No file path returned from upload');
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('void-media')
        .getPublicUrl(data.path);

      console.log('File uploaded successfully:', { publicUrl, path: data.path });

      // Add message with media
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert([
          {
            void_id: params.id,
            user_id: currentUser.id,
            content: '',
            media_url: data.path,
            media_type: file.type.startsWith('image/') ? 'image' : 'video',
            expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString()
          }
        ])
        .select()
        .single();

      if (messageError) {
        console.error('Message creation error:', messageError);
        // If message creation fails, delete the uploaded file
        await supabase.storage
          .from('void-media')
          .remove([data.path]);
        throw new Error(messageError.message);
      }

      // Add the new message to local state
      setMessages(prev => {
        // Check if message already exists
        if (prev.some(existingMsg => existingMsg.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });

      setShowMediaUpload(false);
      toast.success('Media uploaded successfully!');
    } catch (error) {
      console.error('Error uploading media:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload media');
      toast.error('Failed to upload media. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteVoid = async () => {
    if (!void_ || !currentUser || currentUser.id !== void_.created_by) return;
    
    setIsDeleting(true);
    try {
      // Delete all messages
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('void_id', params.id);

      if (messagesError) throw messagesError;

      // Delete all users
      const { error: usersError } = await supabase
        .from('void_users')
        .delete()
        .eq('void_id', params.id);

      if (usersError) throw usersError;

      // Delete all media files
      if (typeof params.id === 'string') {
        const { data: mediaFiles, error: listError } = await supabase.storage
          .from('void-media')
          .list(params.id);

        if (listError) throw listError;

        if (mediaFiles && mediaFiles.length > 0) {
          const { error: deleteMediaError } = await supabase.storage
            .from('void-media')
            .remove(mediaFiles.map(file => `${params.id}/${file.name}`));

          if (deleteMediaError) throw deleteMediaError;
        }
      } else {
        console.error('Invalid void ID for media deletion');
      }

      // Finally, delete the void itself
      const { error: voidError } = await supabase
        .from('voids')
        .delete()
        .eq('id', params.id);

      if (voidError) throw voidError;

      toast.success('Void deleted successfully');
      router.push('/');
    } catch (error) {
      console.error('Error deleting void:', error);
      toast.error('Failed to delete void');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!void_) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Void Not Found</h1>
          <button
            onClick={() => router.push('/')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (showJoinModal) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-800 p-8 rounded-lg max-w-md w-full"
        >
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
        </motion.div>
      </motion.div>
    );
  }

  if (showDeleteModal) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-800 p-8 rounded-lg max-w-md w-full"
        >
          <h2 className="text-2xl font-bold mb-4 text-red-500">Delete Void</h2>
          <p className="text-gray-300 mb-6">
            Are you sure you want to delete this void? This action cannot be undone. All messages, users, and media will be permanently deleted.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteVoid}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <TrashIcon className="w-5 h-5" />
                  Delete Void
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <header className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between flex-wrap mb-2 gap-2">
            <button
              onClick={() => router.push('/')}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm md:text-base"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="inline sm:hidden">Back</span>
            </button>
            <div className="flex items-center gap-4">
              <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
                {users.length}/{void_.user_cap}
              </span>
              {currentUser?.id === void_.created_by && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="text-red-500 hover:text-red-400 transition-colors flex items-center gap-2 text-sm md:text-base"
                >
                  <TrashIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Delete Void</span>
                  <span className="inline sm:hidden">Delete</span>
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h1 className="text-xl font-bold truncate max-w-[50%] sm:max-w-xs">{void_.name}</h1>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/void/${params.id}`}
                className="px-3 py-1 bg-gray-700 rounded-lg text-sm text-gray-300 w-32 sm:w-48 md:w-64 truncate"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/void/${params.id}`);
                  toast.success('Link copied to clipboard!');
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        <AnimatePresence>
          {messages.map((message) => {
            const isCurrentUser = message.user_id === currentUser?.id;
            const sender = users.find((u) => u.id === message.user_id);
            
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex items-start gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}
                  ${isCurrentUser ? 'ml-auto' : 'mr-auto'} max-w-[90%] sm:max-w-[70%]`}
              >
                {!isCurrentUser && (
                  <img
                    src={sender?.avatar_url}
                    alt={sender?.nickname}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />
                )}
                <div className="flex flex-col">
                  {!isCurrentUser && (
                    <span className="text-sm font-medium text-gray-400 mb-1">
                      {sender?.nickname}
                    </span>
                  )}
                  <div
                    className={`rounded-lg p-3 ${getUserColor(message.user_id)}`}
                  >
                    {message.media_url ? (
                      message.media_type === 'image' ? (
                        <Image
                          src={supabase.storage.from('void-media').getPublicUrl(message.media_url).data.publicUrl}
                          alt="Shared image"
                          width={400}
                          height={300}
                          className="max-w-full h-auto rounded-lg"
                          onError={(e) => {
                            console.error('Image load error:', e);
                            e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                          }}
                        />
                      ) : (
                        <video
                          src={supabase.storage.from('void-media').getPublicUrl(message.media_url).data.publicUrl}
                          controls
                          className="max-w-full h-auto rounded-lg"
                          onError={(e) => {
                            console.error('Video load error:', e);
                            e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Video+Not+Found';
                          }}
                        />
                      )
                    ) : (
                      <p className="break-words">{message.content}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 mt-1 self-end">
                    {format(new Date(message.created_at), 'HH:mm')}
                  </span>
                </div>
                {isCurrentUser && (
                  <img
                    src={currentUser.avatar_url}
                    alt="You"
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-800 border-t border-gray-700 z-10">
        <div className="container mx-auto px-4">
          <AnimatePresence>
            {showMediaUpload && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-4">
                  <MediaUpload
                    type="image"
                    onUpload={handleMediaUpload}
                    disabled={false}
                  />
                  <MediaUpload
                    type="video"
                    onUpload={handleMediaUpload}
                    disabled={false}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => setShowMediaUpload(!showMediaUpload)}
              className="p-2 text-gray-400 hover:text-white transition-colors flex-shrink-0"
              title="Upload Media"
            >
              <PhotoIcon className="w-6 h-6" />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-white placeholder-gray-400"
            />
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex-shrink-0"
              disabled={!newMessage.trim()}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 