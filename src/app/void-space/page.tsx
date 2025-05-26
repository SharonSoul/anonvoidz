'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import type { Void } from '@/lib/supabase';
import { ClipboardIcon, LinkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

export default function VoidSpace() {
  const [isCreating, setIsCreating] = useState(false);
  const [activeVoids, setActiveVoids] = useState<Void[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [voidName, setVoidName] = useState('');
  const [userCap, setUserCap] = useState(50);

  useEffect(() => {
    setIsClient(true);
    fetchActiveVoids();
  }, []);

  const fetchActiveVoids = async () => {
    try {
      const { data, error } = await supabase
        .from('voids')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActiveVoids(data || []);
    } catch (error) {
      console.error('Error fetching voids:', error);
      toast.error('Failed to load active voids');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateVoid = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/voids/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: voidName.trim(),
          user_cap: userCap,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create void');
      }
      
      window.location.href = `/void/${data.id}`;
    } catch (error) {
      console.error('Error creating void:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create void');
      setIsCreating(false);
    }
  };

  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-secure contexts or browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      toast.success(successMessage);
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-text relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#8b5cf6]/10 via-[#0d0d0d] to-[#00f0ff]/10" />
        {/* Floating Bubbles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/20"
            initial={{
              x: Math.random() * 100 + '%',
              y: Math.random() * 100 + '%',
              scale: Math.random() * 0.5 + 0.5,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
        {/* Stars */}
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute w-1 h-1 rounded-full bg-white"
            initial={{
              x: Math.random() * 100 + '%',
              y: Math.random() * 100 + '%',
              scale: Math.random() * 0.5 + 0.5,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: Math.random() * 2 + 1,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-16 relative">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
              <h1 className="text-2xl sm:text-4xl font-['Orbitron'] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-black/80">
                AnonVoidz
              </h1>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col sm:flex-row gap-2 sm:gap-4"
            >
              <Link 
                href="/"
                className="group inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-black/30 backdrop-blur-xl border border-white/5 rounded-lg text-sm sm:text-lg font-medium transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              >
                <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                Home
              </Link>
              <Link 
                href="/admin/login"
                className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-[#00f0ff] to-black/80 rounded-lg text-sm sm:text-lg font-medium transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]"
              >
                Admin Access
              </Link>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/30 backdrop-blur-xl border border-white/5 rounded-lg p-4 sm:p-8 mb-8"
          >
            <h2 className="text-xl sm:text-2xl font-['Orbitron'] font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-black/80">
              Create a New Void
            </h2>
            <p className="text-gray-300 mb-6 text-sm sm:text-base">
              Create a new void for anonymous chat. Each void has a unique access code and can be joined by anyone with the link.
            </p>
            <div className="space-y-4">
              <div>
                <label htmlFor="voidName" className="block text-sm font-medium mb-2 text-gray-300">
                  Void Name
                </label>
                <input
                  type="text"
                  id="voidName"
                  required
                  className="w-full px-4 py-2 rounded-lg bg-black/50 border border-white/5 text-white placeholder-gray-500 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all duration-300"
                  value={voidName}
                  onChange={(e) => setVoidName(e.target.value)}
                  placeholder="Enter void name"
                  maxLength={50}
                />
              </div>
              <div>
                <label htmlFor="userCap" className="block text-sm font-medium mb-2 text-gray-300">
                  User Cap
                </label>
                <input
                  type="number"
                  id="userCap"
                  required
                  min="2"
                  max="50"
                  className="w-full px-4 py-2 rounded-lg bg-black/50 border border-white/5 text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all duration-300"
                  value={userCap}
                  onChange={(e) => setUserCap(parseInt(e.target.value))}
                />
                <p className="text-sm text-gray-400 mt-1">
                  Maximum number of users allowed in the void (2-50)
                </p>
              </div>
              <button
                onClick={handleCreateVoid}
                disabled={isCreating || !voidName.trim()}
                className="w-full bg-gradient-to-r from-[#00f0ff] to-black/80 text-white px-6 py-3 rounded-lg disabled:opacity-50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] disabled:hover:shadow-none"
              >
                {isCreating ? 'Creating Void...' : 'Create New Void'}
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-black/30 backdrop-blur-xl border border-white/5 rounded-lg p-4 sm:p-8 mb-8"
          >
            <h2 className="text-xl sm:text-2xl font-['Orbitron'] font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-black/80">
              Join Existing Void
            </h2>
            <p className="text-gray-300 mb-6 text-sm sm:text-base">
              Have an access code? Enter it below to join an existing void.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <input
                type="text"
                placeholder="Enter access code"
                className="flex-1 px-4 py-2 rounded-lg bg-black/50 border border-white/5 text-white placeholder-gray-500 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all duration-300"
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    const code = e.currentTarget.value.trim();
                    if (code) {
                      try {
                        const { data, error } = await supabase
                          .from('voids')
                          .select('id')
                          .eq('access_code', code)
                          .single();

                        if (error) throw error;
                        if (!data) {
                          toast.error('Invalid access code');
                          return;
                        }

                        window.location.href = `/void/${data.id}`;
                      } catch (error) {
                        console.error('Error finding void:', error);
                        toast.error('Invalid access code');
                      }
                    }
                  }
                }}
              />
              <button
                onClick={async () => {
                  const input = document.querySelector('input[placeholder="Enter access code"]') as HTMLInputElement;
                  const code = input.value.trim();
                  if (code) {
                    try {
                      const { data, error } = await supabase
                        .from('voids')
                        .select('id')
                        .eq('access_code', code)
                        .single();

                      if (error) throw error;
                      if (!data) {
                        toast.error('Invalid access code');
                        return;
                      }

                      window.location.href = `/void/${data.id}`;
                    } catch (error) {
                      console.error('Error finding void:', error);
                      toast.error('Invalid access code');
                    }
                  }
                }}
                className="px-6 py-2 bg-gradient-to-r from-[#00f0ff] to-black/80 text-white rounded-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]"
              >
                Join Void
              </button>
            </div>
          </motion.div>

          {isLoading ? (
            <div className="text-center text-gray-400">Loading active voids...</div>
          ) : activeVoids.length > 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-black/30 backdrop-blur-xl border border-white/5 rounded-lg p-4 sm:p-8"
            >
              <h2 className="text-xl sm:text-2xl font-['Orbitron'] font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-black/80">
                Active Voids
              </h2>
              <div className="space-y-4">
                {activeVoids.map((void_) => (
                  <motion.div
                    key={void_.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-black/50 rounded-lg border border-white/5 hover:border-primary/50 transition-all duration-300 gap-2 sm:gap-4"
                  >
                    <div>
                      <h3 className="font-medium">{void_.name}</h3>
                      <p className="text-sm text-gray-400">
                        Access Code: {void_.access_code}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(
                          `${window.location.origin}/void/${void_.id}`,
                          'Void link copied to clipboard!'
                        )}
                        className="p-2 text-gray-400 hover:text-primary transition-colors"
                      >
                        <LinkIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => copyToClipboard(
                          void_.access_code,
                          'Access code copied to clipboard!'
                        )}
                        className="p-2 text-gray-400 hover:text-primary transition-colors"
                      >
                        <ClipboardIcon className="w-5 h-5" />
                      </button>
                      <Link
                        href={`/void/${void_.id}`}
                        className="px-4 py-2 bg-gradient-to-r from-[#00f0ff] to-black/80 rounded-lg text-sm font-medium transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                      >
                        Join
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="text-center text-gray-400">No active voids found.</div>
          )}
        </div>
      </div>
    </div>
  );
} 