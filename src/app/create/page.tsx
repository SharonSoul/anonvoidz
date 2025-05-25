'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function CreateVoid() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [voidName, setVoidName] = useState('');
  const [userCap, setUserCap] = useState(10);

  const handleCreateVoid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidName.trim()) {
      toast.error('Please enter a void name');
      return;
    }
    if (userCap < 2 || userCap > 50) {
      toast.error('User cap must be between 2 and 50');
      return;
    }

    setLoading(true);
    try {
      const { data: void_, error: voidError } = await supabase
        .from('voids')
        .insert([
          {
            name: voidName.trim(),
            user_cap: userCap,
            created_by: (await supabase.auth.getUser()).data.user?.id,
          },
        ])
        .select()
        .single();

      if (voidError) throw voidError;

      toast.success('Void created successfully!');
      router.push(`/void/${void_.id}`);
    } catch (error) {
      console.error('Error creating void:', error);
      toast.error('Failed to create void');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 p-8 rounded-lg max-w-md w-full"
      >
        <h1 className="text-2xl font-bold mb-6">Create New Void</h1>
        <form onSubmit={handleCreateVoid} className="space-y-4">
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
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Void'}
          </button>
        </form>
      </motion.div>
    </div>
  );
} 