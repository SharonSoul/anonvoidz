'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import type { Void } from '@/lib/supabase';
import { ClipboardIcon, LinkIcon } from '@heroicons/react/24/outline';

export default function Home() {
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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">AnonVoidz</h1>
            <Link
              href="/admin/login"
              className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors"
            >
              Admin Access
            </Link>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Create a New Void</h2>
            <p className="text-gray-300 mb-6">
              Create a new void for anonymous chat. Each void has a unique access code and can be joined by anyone with the link.
            </p>
            <div className="space-y-4">
              <div>
                <label htmlFor="voidName" className="block text-sm font-medium mb-2">
                  Void Name
                </label>
                <input
                  type="text"
                  id="voidName"
                  required
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600"
                  value={voidName}
                  onChange={(e) => setVoidName(e.target.value)}
                  placeholder="Enter void name"
                  maxLength={50}
                />
              </div>
              <div>
                <label htmlFor="userCap" className="block text-sm font-medium mb-2">
                  User Cap
                </label>
                <input
                  type="number"
                  id="userCap"
                  required
                  min="2"
                  max="50"
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600"
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
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg disabled:opacity-50"
              >
                {isCreating ? 'Creating Void...' : 'Create New Void'}
              </button>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Join Existing Void</h2>
            <p className="text-gray-300 mb-6">
              Have an access code? Enter it below to join an existing void.
            </p>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Enter access code"
                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Active Voids</h2>
            {isLoading ? (
              <p className="text-gray-300">Loading voids...</p>
            ) : activeVoids.length === 0 ? (
              <p className="text-gray-300">No active voids found.</p>
            ) : (
              <div className="space-y-4">
                {activeVoids.map((void_) => (
                  <div 
                    key={void_.id} 
                    className="bg-gray-700 rounded-lg p-4 flex justify-between items-center"
                  >
                    <div>
                      <h3 className="text-lg font-semibold">{void_.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-gray-300">
                          Access Code: {void_.access_code}
                        </p>
                        {isClient && (
                          <>
                            <button
                              onClick={() => copyToClipboard(void_.access_code, 'Access code copied!')}
                              className="text-gray-400 hover:text-white transition-colors"
                              title="Copy access code"
                            >
                              <ClipboardIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => copyToClipboard(`${window.location.origin}/void/${void_.id}`, 'Void link copied!')}
                              className="text-gray-400 hover:text-white transition-colors"
                              title="Copy void link"
                            >
                              <LinkIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/void/${void_.id}`}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
                    >
                      Join
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
