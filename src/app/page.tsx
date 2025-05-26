'use client';

import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-8">
            Welcome to <span className="text-indigo-400">AnonVoidz</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Create anonymous chat spaces where you can connect with others without revealing your identity.
            Share thoughts, ideas, and media in a secure, private environment.
          </p>
          <div className="space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              href="/void-space"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
            >
              Enter Void Space
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>

        <div className="mt-32 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-indigo-400">Anonymous Chat</h3>
            <p className="text-gray-300">
              Chat with others without revealing your identity. Perfect for open discussions and honest feedback.
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-indigo-400">Media Sharing</h3>
            <p className="text-gray-300">
              Share images and videos in your void. All media is securely stored and accessible only to void members.
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-indigo-400">User Control</h3>
            <p className="text-gray-300">
              Set user caps, manage access codes, and maintain control over your void space.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
