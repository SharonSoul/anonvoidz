'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

type DeleteType = 'all' | 'messages' | 'users' | 'voids' | 'media' | null;

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    voids: 0,
    messages: 0,
    users: 0,
    media: 0
  });
  const [isDeletingMessages, setIsDeletingMessages] = useState(false);
  const [isDeletingUsers, setIsDeletingUsers] = useState(false);
  const [isDeletingVoids, setIsDeletingVoids] = useState(false);
  const [isDeletingMedia, setIsDeletingMedia] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      
      // Add a small delay to ensure database operations are complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get void count
      const { count: voidCount, error: voidError } = await supabase
        .from('voids')
        .select('*', { count: 'exact', head: true });

      if (voidError) throw voidError;

      // Get message count
      const { count: messageCount, error: messageError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });

      if (messageError) throw messageError;

      // Get user count
      const { count: userCount, error: userError } = await supabase
        .from('void_users')
        .select('*', { count: 'exact', head: true });

      if (userError) throw userError;

      // Get media files count
      const { data: mediaFiles, error: mediaError } = await supabase.storage
        .from('void-media')
        .list();

      if (mediaError) throw mediaError;

      setStats({
        voids: voidCount || 0,
        messages: messageCount || 0,
        users: userCount || 0,
        media: mediaFiles?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check admin session
    const adminSession = localStorage.getItem('admin_session');
    if (!adminSession) {
      router.push('/admin/login');
      return;
    }

    fetchStats();
  }, [router, fetchStats]);

  const handleDeleteMessages = async () => {
    if (!confirm('Are you sure you want to delete all messages? This cannot be undone.')) return;
    setIsDeletingMessages(true);
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;
      toast.success('All messages deleted successfully');
      await fetchStats();
    } catch (error) {
      console.error('Error deleting messages:', error);
      toast.error('Failed to delete messages');
    } finally {
      setIsDeletingMessages(false);
    }
  };

  const handleDeleteUsers = async () => {
    if (!confirm('Are you sure you want to delete all users? This cannot be undone.')) return;
    setIsDeletingUsers(true);
    try {
      const { error } = await supabase
        .from('void_users')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;
      toast.success('All users deleted successfully');
      await fetchStats();
    } catch (error) {
      console.error('Error deleting users:', error);
      toast.error('Failed to delete users');
    } finally {
      setIsDeletingUsers(false);
    }
  };

  const handleDeleteVoids = async () => {
    if (!confirm('Are you sure you want to delete all voids? This cannot be undone.')) return;
    setIsDeletingVoids(true);
    try {
      // Delete all messages
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (messagesError) {
        console.error('Messages deletion error:', messagesError);
        throw new Error(messagesError.message);
      }

      // Delete all users
      const { error: usersError } = await supabase
        .from('void_users')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (usersError) {
        console.error('Users deletion error:', usersError);
        throw new Error(usersError.message);
      }

      // Delete all voids
      const { error: voidsError } = await supabase
        .from('voids')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (voidsError) {
        console.error('Voids deletion error:', voidsError);
        throw new Error(voidsError.message);
      }

      // Delete all media files
      const { data: mediaFiles, error: listError } = await supabase.storage
        .from('void-media')
        .list();

      if (listError) {
        console.error('Media list error:', listError);
        throw new Error(listError.message);
      }

      if (mediaFiles && mediaFiles.length > 0) {
        const { error: deleteMediaError } = await supabase.storage
          .from('void-media')
          .remove(mediaFiles.map(file => file.name));

        if (deleteMediaError) {
          console.error('Media deletion error:', deleteMediaError);
          throw new Error(deleteMediaError.message);
        }
      }

      toast.success('All data cleared successfully');
      await fetchStats();
    } catch (error) {
      console.error('Error deleting data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete data');
    } finally {
      setIsDeletingVoids(false);
    }
  };

  const handleDeleteMedia = async () => {
    if (!confirm('Are you sure you want to delete all media files? This cannot be undone.')) return;
    setIsDeletingMedia(true);
    try {
      const { data: mediaFiles, error: listError } = await supabase.storage
        .from('void-media')
        .list();

      if (listError) throw listError;

      if (mediaFiles && mediaFiles.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from('void-media')
          .remove(mediaFiles.map(file => file.name));

        if (deleteError) throw deleteError;
      }

      toast.success('All media files deleted successfully');
      await fetchStats();
    } catch (error) {
      console.error('Error deleting media:', error);
      toast.error('Failed to delete media files');
    } finally {
      setIsDeletingMedia(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    router.push('/admin/login');
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all data? This cannot be undone.')) return;
    setIsClearingAll(true);
    try {
      // Delete all messages
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (messagesError) {
        console.error('Messages deletion error:', messagesError);
        throw new Error(messagesError.message);
      }

      // Delete all users
      const { error: usersError } = await supabase
        .from('void_users')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (usersError) {
        console.error('Users deletion error:', usersError);
        throw new Error(usersError.message);
      }

      // Delete all voids
      const { error: voidsError } = await supabase
        .from('voids')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (voidsError) {
        console.error('Voids deletion error:', voidsError);
        throw new Error(voidsError.message);
      }

      // Delete all media files
      const { data: mediaFiles, error: listError } = await supabase.storage
        .from('void-media')
        .list();

      if (listError) {
        console.error('Media list error:', listError);
        throw new Error(listError.message);
      }

      if (mediaFiles && mediaFiles.length > 0) {
        const { error: deleteMediaError } = await supabase.storage
          .from('void-media')
          .remove(mediaFiles.map(file => file.name));

        if (deleteMediaError) {
          console.error('Media deletion error:', deleteMediaError);
          throw new Error(deleteMediaError.message);
        }
      }

      toast.success('All data cleared successfully');
      await fetchStats();
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to clear data');
    } finally {
      setIsClearingAll(false);
    }
  };

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
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-2">{stats.voids}</h2>
            <p className="text-gray-400 mb-4">Total Voids</p>
            <button
              onClick={handleDeleteVoids}
              disabled={isDeletingVoids}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isDeletingVoids ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <TrashIcon className="w-5 h-5" />
                  Delete All Voids
                </>
              )}
            </button>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-2">{stats.messages}</h2>
            <p className="text-gray-400 mb-4">Total Messages</p>
            <button
              onClick={handleDeleteMessages}
              disabled={isDeletingMessages}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isDeletingMessages ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <TrashIcon className="w-5 h-5" />
                  Delete All Messages
                </>
              )}
            </button>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-2">{stats.users}</h2>
            <p className="text-gray-400 mb-4">Total Users</p>
            <button
              onClick={handleDeleteUsers}
              disabled={isDeletingUsers}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isDeletingUsers ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <TrashIcon className="w-5 h-5" />
                  Delete All Users
                </>
              )}
            </button>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-2">{stats.media}</h2>
            <p className="text-gray-400 mb-4">Total Media Files</p>
            <button
              onClick={handleDeleteMedia}
              disabled={isDeletingMedia}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isDeletingMedia ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <TrashIcon className="w-5 h-5" />
                  Delete All Media
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold text-white mb-4">Danger Zone</h2>
          <p className="text-gray-400 mb-4">
            Warning: These actions cannot be undone. Please be absolutely sure before proceeding.
          </p>
          <button
            onClick={handleClearAll}
            disabled={isClearingAll}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            {isClearingAll ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                Clearing Data...
              </>
            ) : (
              <>
                <TrashIcon className="w-5 h-5" />
                Clear All Data
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 