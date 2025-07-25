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
  const [showMessageDeleteModal, setShowMessageDeleteModal] = useState<{
    messageId: string;
    deleteForEveryone: boolean;
  } | null>(null);
  const [nickname, setNickname] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageTimestampRef = useRef<string | null>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    messageId: string;
  } | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);
  const [userColors, setUserColors] = useState<Record<string, string>>({});

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
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('messages')
        .select('*, void_users(*)')
        .eq('void_id', params.id)
        .gt('expires_at', now)
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
      
      // Assign colors directly here instead of using the callback
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

      const newUserColors: Record<string, string> = {};
      const usedColors = new Set<string>();

      // First, preserve existing color assignments
      data?.forEach(user => {
        if (userColors[user.id]) {
          newUserColors[user.id] = userColors[user.id];
          usedColors.add(userColors[user.id]);
        }
      });

      // Then assign new colors to users without colors
      data?.forEach(user => {
        if (!newUserColors[user.id]) {
          // Find first unused color
          const availableColor = colors.find(color => !usedColors.has(color));
          if (availableColor) {
            newUserColors[user.id] = availableColor;
            usedColors.add(availableColor);
          } else {
            // If all colors are used, start reusing from the beginning
            const fallbackColor = colors[Object.keys(newUserColors).length % colors.length];
            newUserColors[user.id] = fallbackColor;
          }
        }
      });

      setUserColors(newUserColors);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [params.id, userColors]);

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

    // Set up real-time subscriptions
    const channel = supabase
      .channel(`void_${params.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `void_id=eq.${params.id}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch the complete message with user data
            const { data: message, error } = await supabase
              .from('messages')
              .select('*, void_users(*)')
              .eq('id', payload.new.id)
              .single();

            if (error) {
              console.error('Error fetching message with user data:', error);
              return;
            }

            setMessages(prev => {
              // Check if message already exists
              if (prev.some(existingMsg => existingMsg.id === message.id)) {
                return prev;
              }
              return [...prev, message];
            });

            // Only scroll to bottom when current user sends a message
            if (message.user_id === currentUser?.id) {
              scrollToBottom();
            }
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [params.id, currentUser?.id, initializeVoid]);

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

      // Assign color to new user using the same logic
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

      const newUserColors = { ...userColors };
      const usedColors = new Set(Object.values(newUserColors));

      // Find first unused color
      const availableColor = colors.find(color => !usedColors.has(color));
      if (availableColor) {
        newUserColors[user.id] = availableColor;
      } else {
        // If all colors are used, start reusing from the beginning
        newUserColors[user.id] = colors[Object.keys(newUserColors).length % colors.length];
      }

      setUserColors(newUserColors);

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

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    // Create optimistic message with expiration
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString(); // 2 minutes from now
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      void_id: params.id as string,
      user_id: currentUser.id,
      content: messageContent,
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
      void_users: currentUser,
      media_url: undefined,
      media_type: undefined,
      reply_to: replyTo?.id
    } as Message;

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);
    setReplyTo(null); // Clear reply after sending
    scrollToBottom();

    try {
      // First, verify the void still exists
      const { data: voidData, error: voidError } = await supabase
        .from('voids')
        .select('id')
        .eq('id', params.id)
        .single();

      if (voidError || !voidData) {
        throw new Error('Void no longer exists');
      }

      // Create message payload with expiration
      const messagePayload = {
        void_id: params.id,
        user_id: currentUser.id,
        content: messageContent,
        expires_at: expiresAt,
        reply_to: replyTo?.id
      };

      // Then create the message
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert([messagePayload])
        .select('*, void_users(*)')
        .single();

      if (messageError) {
        console.error('Message creation error:', messageError);
        throw new Error(messageError.message);
      }

      if (!message) {
        throw new Error('No message data returned');
      }

      // Replace optimistic message with real message
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id ? message : msg
      ));
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      // Restore the message content to the input
      setNewMessage(messageContent);
      // Show error toast with specific message
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    }
  };

  // Update polling to filter out expired messages
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let lastMessageId: string | null = null;

    const pollMessages = async () => {
      if (!params.id) return;

      try {
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from('messages')
          .select('*, void_users(*)')
          .eq('void_id', params.id)
          .gt('expires_at', now)
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Only update if we have new messages
        const latestMessage = data[data.length - 1];
        if (latestMessage && latestMessage.id !== lastMessageId) {
          lastMessageId = latestMessage.id;
          setMessages(data);
        }
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    };

    // Initial poll
    pollMessages();
    
    // Poll every 1 second
    pollInterval = setInterval(pollMessages, 1000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [params.id]);

  // Add message expiration check
  useEffect(() => {
    if (!mounted) return;

    const checkExpiredMessages = () => {
      const now = new Date().toISOString();
      setMessages(prev => prev.filter(msg => {
        // Keep message if it hasn't expired yet
        return new Date(msg.expires_at) > new Date(now);
      }));
    };

    // Check for expired messages every 10 seconds
    const expirationInterval = setInterval(checkExpiredMessages, 10000);

    return () => {
      clearInterval(expirationInterval);
    };
  }, [mounted]);

  // Fix hydration error by using useEffect for client-side only code
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, messageId: string) => {
    e.preventDefault(); // Prevent default context menu
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      messageId
    });
  };

  const handleTouchStart = (e: React.TouchEvent, messageId: string) => {
    e.preventDefault(); // Prevent text selection
    longPressTimer.current = setTimeout(() => {
      const touch = e.touches[0];
      setContextMenu({
        x: touch.clientX,
        y: touch.clientY,
        messageId
      });
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchMove = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Add click outside handler to close context menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenu) {
        setContextMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu]);

  const handleDeleteMessage = async (messageId: string, deleteForEveryone: boolean) => {
    try {
      if (!currentUser) return;

      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      // If not deleting for everyone, only allow deletion of own messages
      if (!deleteForEveryone && message.user_id !== currentUser.id) {
        toast.error('You can only delete your own messages');
        return;
      }

      // First, find and delete any messages that are replies to this message
      const { error: repliesError } = await supabase
        .from('messages')
        .delete()
        .eq('reply_to', messageId);

      if (repliesError) {
        console.error('Error deleting replies:', repliesError);
        throw new Error(repliesError.message);
      }

      // Then delete the original message
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        console.error('Delete error:', error);
        throw new Error(error.message);
      }

      // Remove message and its replies from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId && msg.reply_to !== messageId));
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete message');
    } finally {
      setShowMessageDeleteModal(null);
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

      // Add message with media and expiration
      const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString(); // 2 minutes from now
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert([
          {
            void_id: params.id,
            user_id: currentUser.id,
            content: '',
            media_url: data.path,
            media_type: file.type.startsWith('image/') ? 'image' : 'video',
            expires_at: expiresAt
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

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00f0ff]"></div>
      </div>
    );
  }

  if (!void_) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-[#8b5cf6]/80 mb-4">Void Not Found</h1>
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-[#00f0ff] to-[#8b5cf6]/80 text-white px-6 py-2 rounded-lg transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,240,255,0.3)]"
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
    <div className="flex flex-col h-screen bg-background select-none">
      <header className="bg-gradient-to-br from-[#00f0ff]/20 via-black/80 to-[#8b5cf6]/20 backdrop-blur-xl border-b border-white/10 shadow-[0_0_30px_0_rgba(0,240,255,0.08)] p-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between flex-wrap mb-2 gap-2">
            <button
              onClick={() => router.push('/void-space')}
              className="group inline-flex items-center gap-2 text-sm md:text-base text-cyan-300 hover:text-white transition-all duration-300"
            >
              <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">Back to Void Space</span>
              <span className="inline sm:hidden">Back</span>
            </button>
            <div className="flex items-center gap-4">
              <span className="bg-gradient-to-r from-[#00f0ff] to-black/80 text-white px-3 py-1 rounded-full text-sm shadow-[0_0_15px_rgba(0,240,255,0.2)]">
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
            <h1 className="text-xl font-['Orbitron'] font-bold truncate max-w-[50%] sm:max-w-xs text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#8b5cf6]/80">
              {void_.name}
            </h1>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/void/${params.id}`}
                className="px-3 py-1 bg-black/40 border border-white/10 rounded-lg text-sm text-gray-300 w-32 sm:w-48 md:w-64 truncate backdrop-blur-md shadow-[0_0_10px_0_rgba(0,240,255,0.08)]"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/void/${params.id}`);
                  toast.success('Link copied to clipboard!');
                }}
                className="bg-gradient-to-r from-[#00f0ff] to-black/80 hover:from-[#00f0ff] hover:to-[#8b5cf6] text-white px-3 py-1 rounded-lg text-sm transition-all duration-300 shadow-[0_0_15px_rgba(0,240,255,0.2)]"
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
            const replyToMessage = message.reply_to ? messages.find(m => m.id === message.reply_to) : null;
            
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex items-start gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}
                  ${isCurrentUser ? 'ml-auto' : 'mr-auto'} max-w-[90%] sm:max-w-[70%] select-none`}
                onContextMenu={(e) => handleContextMenu(e, message.id)}
                onTouchStart={(e) => handleTouchStart(e, message.id)}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
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
                  {replyToMessage && (
                    <div className="text-xs text-gray-400 mb-1 border-l-2 border-gray-600 pl-2">
                      Replying to {users.find(u => u.id === replyToMessage.user_id)?.nickname}: {replyToMessage.content}
                    </div>
                  )}
                  <div
                    className={`rounded-lg p-3 ${userColors[message.user_id] || 'bg-gray-600'} select-none`}
                  >
                    {message.media_url ? (
                      message.media_type === 'image' ? (
                        <Image
                          src={supabase.storage.from('void-media').getPublicUrl(message.media_url).data.publicUrl}
                          alt="Shared image"
                          width={400}
                          height={300}
                          className="max-w-full h-auto rounded-lg select-none"
                          onError={(e) => {
                            console.error('Image load error:', e);
                            e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                          }}
                        />
                      ) : (
                        <video
                          src={supabase.storage.from('void-media').getPublicUrl(message.media_url).data.publicUrl}
                          controls
                          className="max-w-full h-auto rounded-lg select-none"
                          onError={(e) => {
                            console.error('Video load error:', e);
                            e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Video+Not+Found';
                          }}
                        />
                      )
                    ) : (
                      <p className="break-words select-none">{message.content}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 mt-1 self-end select-none">
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

      {/* Add message delete confirmation modal */}
      {showMessageDeleteModal && (
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
            <h2 className="text-2xl font-bold mb-4 text-red-500">Delete Message</h2>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this message?
            </p>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => handleDeleteMessage(showMessageDeleteModal.messageId, false)}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors"
              >
                Delete for me
              </button>
              {messages.find(m => m.id === showMessageDeleteModal.messageId)?.user_id === currentUser?.id && (
                <button
                  onClick={() => handleDeleteMessage(showMessageDeleteModal.messageId, true)}
                  className="w-full bg-red-800 hover:bg-red-900 text-white py-2 rounded-lg transition-colors"
                >
                  Delete for everyone
                </button>
              )}
              <button
                onClick={() => setShowMessageDeleteModal(null)}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Update context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-2 min-w-[150px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button
            onClick={() => {
              const message = messages.find(m => m.id === contextMenu.messageId);
              if (message) {
                setReplyTo(message);
                setContextMenu(null);
              }
            }}
            className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Reply
          </button>
          <button
            onClick={() => {
              setShowMessageDeleteModal({
                messageId: contextMenu.messageId,
                deleteForEveryone: false
              });
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 transition-colors"
          >
            Delete
          </button>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-br from-[#00f0ff]/30 via-black/80 to-[#8b5cf6]/20 backdrop-blur-xl border-t border-white/10 z-10 shadow-[0_0_30px_0_rgba(0,240,255,0.08)]">
        <div className="container mx-auto px-4">
          <AnimatePresence>
            {replyTo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-4 p-2 bg-gray-800 rounded-lg flex items-center justify-between select-none"
              >
                <div className="text-sm text-gray-300">
                  Replying to {users.find(u => u.id === replyTo.user_id)?.nickname}: {replyTo.content}
                </div>
                <button
                  onClick={() => setReplyTo(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </motion.div>
            )}
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
              className="p-2 text-cyan-300 hover:text-white transition-colors flex-shrink-0"
              title="Upload Media"
            >
              <PhotoIcon className="w-6 h-6" />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 rounded-lg bg-black/40 border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white placeholder-gray-400 backdrop-blur-md shadow-[0_0_10px_0_rgba(0,240,255,0.08)] transition-all duration-300"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-[#00f0ff] to-black/80 hover:from-[#00f0ff] hover:to-[#8b5cf6] text-white px-4 py-2 rounded-lg transition-all duration-300 flex-shrink-0 shadow-[0_0_15px_rgba(0,240,255,0.2)] disabled:opacity-50"
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