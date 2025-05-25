'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Void, VoidUser } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function Home() {
  const router = useRouter();
  const [voids, setVoids] = useState<Void[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<VoidUser | null>(null);

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

  useEffect(() => {
    const fetchVoids = async () => {
      try {
        const { data: voids, error } = await supabase
          .from('voids')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setVoids(voids || []);
      } catch (error) {
        console.error('Error fetching voids:', error);
        toast.error('Failed to load Voids');
      } finally {
        setLoading(false);
      }
    };

    fetchVoids();

    // Subscribe to changes in voids
    const voidSubscription = supabase
      .channel('voids_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'voids'
        },
        async (payload) => {
          console.log('Void change received:', payload);
          if (payload.eventType === 'DELETE') {
            setVoids(prevVoids => prevVoids.filter(v => v.id !== payload.old.id));
          } else {
            // For other changes, fetch the latest data
            const { data: latestVoids, error } = await supabase
              .from('voids')
              .select('*')
              .order('created_at', { ascending: false });

            if (!error && latestVoids) {
              setVoids(latestVoids);
            }
          }
        }
      )
      .subscribe();

    return () => {
      voidSubscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">AnonVoidz</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/login"
              className="text-gray-400 hover:text-white transition-colors px-4 py-2"
            >
              Admin
            </Link>
            <Link
              href="/create"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Create Void
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {voids.map((void_) => (
              <motion.div
                key={void_.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-gray-800 p-6 rounded-lg"
              >
                <Link href={`/void/${void_.id}`}>
                  <h2 className="text-xl font-bold text-white mb-2">{void_.name}</h2>
                  <p className="text-gray-400">
                    {void_.user_count} {void_.user_count === 1 ? 'user' : 'users'} online
                  </p>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {voids.length === 0 && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-400 mb-4">No Voids Yet</h2>
            <p className="text-gray-500 mb-8">Be the first to create a Void!</p>
            <Link
              href="/create"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Create Your First Void
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
