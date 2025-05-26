'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowRightIcon, 
  ChatBubbleLeftRightIcon, 
  UserGroupIcon, 
  ShieldCheckIcon, 
  SparklesIcon, 
  ArrowDownIcon,
  RocketLaunchIcon,
  LockClosedIcon,
  ClockIcon,
  ChatBubbleBottomCenterTextIcon,
  PhotoIcon,
  VideoCameraIcon,
  UserCircleIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { COLORS } from '@/styles/colors';

export default function Home() {
  const [voidUsers, setVoidUsers] = useState<number[]>([]);

  useEffect(() => {
    setVoidUsers(['Tech Talk', 'Gaming Squad', 'Movie Night'].map(() => 
      Math.floor(Math.random() * 5 + 1)
    ));
  }, []);

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

      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
              <span className="text-xl font-['Orbitron'] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-black/80">
                AnonVoidz
              </span>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <Link 
                href="/void-space"
                className="group px-4 py-2 text-sm font-medium text-primary border border-primary/50 rounded-lg hover:bg-primary/10 transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:border-primary"
              >
                Create a Void
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#8b5cf6]/10 via-[#0d0d0d] to-[#00f0ff]/10" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative container mx-auto px-4 py-24"
        >
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl md:text-7xl font-['Orbitron'] font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-black/80"
            >
              Enter the Void of Anonymous Conversations
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl text-gray-300 mb-12 font-['Space_Grotesk']"
            >
              Chat freely. No identity. No history.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col items-center gap-4"
            >
              <Link 
                href="/void-space"
                className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#00f0ff] to-black/80 rounded-lg text-lg font-medium transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]"
              >
                Browse Voids
                <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <motion.button 
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ArrowDownIcon className="w-6 h-6" />
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Active Voids Section */}
      <div className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-['Orbitron'] font-bold text-center mb-16 relative"
            >
              Available Voids
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-full blur-sm animate-gradient" />
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {['Tech Talk', 'Gaming Squad', 'Movie Night'].map((title, index) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="group bg-black/30 backdrop-blur-xl border border-white/5 rounded-lg p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(0,240,255,0.2)] hover:-translate-y-1"
                >
                  <h3 className="text-xl font-semibold mb-2">{title}</h3>
                  <p className="text-gray-400 mb-4">
                    {title === 'Tech Talk' ? '#tech #programming #ai' :
                     title === 'Gaming Squad' ? '#gaming #esports #multiplayer' :
                     '#movies #series #discussion'}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-primary">{voidUsers[index] || 0}/5 users</span>
                    <button className="px-4 py-2 bg-primary/10 text-primary rounded-lg transition-all duration-300 group-hover:bg-[#00f0ff] group-hover:text-black">
                      Join
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-black/50 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-['Orbitron'] font-bold text-center mb-16"
            >
              How It Works
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: ChatBubbleLeftRightIcon,
                  title: 'Anonymous Chat',
                  description: 'Express yourself freely with our secure, anonymous chat system. No personal information required.'
                },
                {
                  icon: UserGroupIcon,
                  title: 'User Control',
                  description: 'Set user limits, manage access codes, and maintain control over your void space.'
                },
                {
                  icon: ShieldCheckIcon,
                  title: 'Secure & Private',
                  description: 'Built with privacy in mind. Your conversations stay within your void.'
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className={`group bg-black/50 backdrop-blur-md border border-[${COLORS.border}] rounded-lg p-6 transition-all duration-300 hover:border-[${COLORS.primary}]/50`}
                >
                  <feature.icon className={`w-12 h-12 text-[${COLORS.primary}] mb-4 group-hover:scale-110 transition-transform`} />
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Features Section */}
      <div className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-['Orbitron'] font-bold text-center mb-16"
            >
              Advanced Features
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: PhotoIcon,
                  title: 'Media Sharing',
                  description: 'Share images and videos securely within your void.'
                },
                {
                  icon: ClockIcon,
                  title: 'Ephemeral Messages',
                  description: 'Messages disappear after a set time period.'
                },
                {
                  icon: UserCircleIcon,
                  title: 'Unique Avatars',
                  description: 'Get a random avatar for each void you join.'
                },
                {
                  icon: GlobeAltIcon,
                  title: 'Public/Private',
                  description: 'Choose between public or private void spaces.'
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`group bg-black/50 backdrop-blur-md border border-[${COLORS.border}] rounded-lg p-6 transition-all duration-300 hover:border-[${COLORS.primary}]/50 hover:shadow-[0_0_20px_${COLORS.glow}]`}
                >
                  <feature.icon className={`w-10 h-10 text-[${COLORS.primary}] mb-4 group-hover:scale-110 transition-transform`} />
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 relative">
        <div className={`absolute inset-0 bg-gradient-to-br from-[${COLORS.primary}]/10 to-[${COLORS.secondary}]/10`} />
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center relative"
          >
            <h2 className="text-3xl md:text-4xl font-['Orbitron'] font-bold mb-6">
              Ready to Enter the Void?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Create your first void and experience anonymous chat today.
            </p>
            <Link 
              href="/void-space"
              className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#00f0ff] to-black/80 rounded-lg text-lg font-medium transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            >
              Create Your Void
              <SparklesIcon className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 bg-black/50 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <p className="text-gray-400">
              © {new Date().getFullYear()} AnonVoidz. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="#" className={`text-gray-400 hover:text-[${COLORS.primary}] transition-colors`}>Terms</a>
              <a href="#" className={`text-gray-400 hover:text-[${COLORS.primary}] transition-colors`}>Privacy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
