# 🚀 GapShap - Indori AI WhatsApp Clone

GapShap is a premium, high-fidelity WhatsApp clone built with **Next.js**, **Tailwind CSS**, and **Framer Motion**, powered by **Groq AI (Llama 3)** and **Supabase**.

It features personalized AI chatbots with Indori vibes, memory, and a "Mood Creator" system.

## ✨ Features
- **Authentic WhatsApp UI**: Pixel-perfect replication of the WhatsApp mobile interface.
- **Multiple AI Bots**: Create and chat with different AI personalities (Friends, Gf, Teachers, etc.).
- **Mood Slider 🎭**: Adjust bot personalities from "Chill 🍹" to "Serious 🧐".
- **Real Memory 🧠**: AI remembers past conversations and references previous topics naturally.
- **Auto-Pruning 🧹**: Intelligent database cleanup to stay within Supabase Free Tier limits.
- **Google Auth 🔐**: Secure login using Supabase and Google.
- **Hinglish/Indori Vibes 🇮🇳**: Optimized for local Indian slang and natural conversation.

## 🛠 Tech Stack
- **Frontend**: Next.js 14, React, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend/AI**: Groq Cloud API (Llama 3.3 70B), Next.js App Router (API).
- **Database/Auth**: Supabase (Auth, PostgreSQL, Storage).

## 🚀 Getting Started

### 1. Requirements
- Node.js installed.
- Supabase account.
- Groq Cloud API key.

### 2. Setup
1. Clone the repo:
   ```bash
   git clone https://github.com/mraayush979blip/whatsapp-ai.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   GROQ_API_KEY=your_groq_key
   ```
4. Initialize the database: Run the SQL scripts found in the `scripts/` directory in your Supabase SQL Editor.

### 3. Run
```bash
npm run dev
```

## 🛡 License
Made for Bharat, by aayush.
Powered by Pratu AI.
