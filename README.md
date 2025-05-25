# AnonVoidz

A modern, anonymous group messaging web application built with Next.js and Supabase.

## Features

- 🚀 Real-time anonymous messaging
- 🎨 Unique random avatars for each user
- ⏱️ Ephemeral messages (2-minute expiration)
- 📱 Mobile-first, responsive design
- 🔒 No login required
- 🎯 User caps per Void
- 📸 Media sharing support (images and videos)
- 💫 Modern, futuristic UI

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **Backend**: Supabase (PostgreSQL, Realtime, Storage)
- **Authentication**: Anonymous sessions
- **Styling**: TailwindCSS
- **Icons**: Heroicons
- **Notifications**: React Hot Toast

## Prerequisites

- Node.js 18+ and npm
- Supabase account
- Stripe account (for subscription features)

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/anonvoidz.git
   cd anonvoidz
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
   STRIPE_SECRET_KEY=your-stripe-secret-key
   ```

4. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL commands from `supabase/schema.sql` in your Supabase SQL editor
   - Enable the pg_cron extension for message cleanup
   - Set up storage buckets for media uploads

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
anonvoidz/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── page.tsx        # Landing page
│   │   ├── create/         # Void creation page
│   │   └── void/[id]/      # Void chat page
│   ├── components/         # Reusable components
│   └── lib/               # Utility functions and configurations
├── public/                # Static assets
├── supabase/             # Database schema and migrations
└── package.json
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
