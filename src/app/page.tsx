import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          AnonVoidz
        </h1>
        <Link
          href="/create"
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Create Void
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Void cards will be mapped here */}
        <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold">Sample Void</h2>
              <p className="text-gray-400 text-sm">A place for anonymous discussions</p>
            </div>
            <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
              3/5
            </span>
          </div>
          <Link
            href="/void/123"
            className="block w-full bg-purple-600 hover:bg-purple-700 text-white text-center py-2 rounded-lg transition-colors"
          >
            Join Void
          </Link>
        </div>
      </div>
    </main>
  );
}
