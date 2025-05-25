'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function CreateVoid() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    userCap: 5,
    isPrivate: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: void_, error } = await supabase
        .from('voids')
        .insert([
          {
            name: formData.name,
            description: formData.description,
            user_cap: formData.userCap,
            is_private: formData.isPrivate,
            access_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success('Void created successfully!');
      router.push(`/void/${void_.id}`);
    } catch (error) {
      toast.error('Failed to create Void');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
        Create New Void
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Void Name
          </label>
          <input
            type="text"
            id="name"
            required
            className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description (Optional)
          </label>
          <textarea
            id="description"
            className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="userCap" className="block text-sm font-medium mb-2">
            User Cap
          </label>
          <input
            type="number"
            id="userCap"
            min="2"
            max="20"
            required
            className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            value={formData.userCap}
            onChange={(e) => setFormData({ ...formData, userCap: parseInt(e.target.value) })}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPrivate"
            className="rounded bg-gray-800 border-gray-700 text-purple-600 focus:ring-purple-500"
            checked={formData.isPrivate}
            onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
          />
          <label htmlFor="isPrivate" className="text-sm font-medium">
            Make this Void private (requires subscription)
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Void'}
        </button>
      </form>
    </main>
  );
} 