import Link from 'next/link';
import './globals.css';
import { Inter } from 'next/font/google';
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import UserNav from "@/components/UserNav";
import { Badge } from "@/components/ui/badge";
import * as motion from 'framer-motion/client';
import { Trophy, ChevronRight, Crown } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Civils Daily | Your Strategic AI Exam Mentor',
  description: 'AI-powered analytical briefings and interactive mentoring for UPSC, SSC, and State PSC aspirants. Master current affairs with precision AI guidance.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check premium status for logged-in users
  let isPremium = false;
  if (user) {
    try {
      const admin = createAdminClient();
      const { data } = await admin.from('profiles').select('is_premium').eq('id', user.id).maybeSingle();
      isPremium = data?.is_premium ?? false;
    } catch (e) {
      // Silently fail - default to free
    }
  }

  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50/50`}>
        <header className="sticky top-0 z-50 w-full border-b bg-white transition-all">
          <nav className="container mx-auto flex h-20 items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:rotate-6 transition-transform">
                <span className="font-black text-xl italic leading-none">C</span>
              </div>
              <div>
                <span className="text-lg md:text-xl font-black text-slate-900 tracking-tight block leading-none">Civils Daily</span>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1 hidden md:block">Strategic AI Mentor</span>
              </div>
            </Link>


            <div className="flex items-center gap-4">
              {user && isPremium && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[9px] uppercase tracking-widest border-none shadow-sm hidden md:flex">
                  <Crown size={10} className="mr-1" /> Premium
                </Badge>
              )}
              {user && !isPremium && (
                <Link href="/pricing">
                  <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-[10px] px-4 h-9 rounded-xl shadow-lg shadow-amber-200/50 border-none group transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5">
                    <Crown size={12} className="group-hover:rotate-12 transition-transform" />
                    UPGRADE
                  </Button>
                </Link>
              )}
              {!user && (
                <Link href="/pricing">
                  <Button variant="ghost" className="text-sm font-bold text-slate-500 hover:text-blue-600 hidden md:inline-flex rounded-xl">
                    Pricing
                  </Button>
                </Link>
              )}
              {!user ? (
                <Link href="/login">
                  <Button className="bg-slate-900 hover:bg-slate-800 text-white font-black px-6 rounded-xl cursor-pointer">Login</Button>
                </Link>
              ) : (
                <UserNav user={user} />
              )}
            </div>
          </nav>
        </header>

        {/* ── Floating Daily Quiz Button ── */}
        <div className="fixed bottom-6 right-6 z-[100]">
          <Link href="/quiz">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative group cursor-pointer"
            >
              <div className="absolute inset-0 bg-orange-500 rounded-xl animate-ping opacity-20" />
              <div className="absolute inset-0 bg-orange-400 rounded-xl animate-pulse opacity-30 scale-105" />

              <div className="relative bg-gradient-to-br from-orange-500 to-rose-600 text-white px-4 py-2.5 rounded-xl shadow-xl border border-white/20 flex items-center gap-2.5">
                <div className="h-7 w-7 bg-white/20 rounded-lg flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                  >
                    <Trophy size={16} className="text-white" />
                  </motion.div>
                </div>
                <div>
                  <span className="text-[8px] font-bold uppercase tracking-wider opacity-80 block leading-none mb-0.5">Live</span>
                  <span className="text-xs font-bold tracking-tight block">DAILY QUIZ</span>
                </div>
                <ChevronRight size={12} className="ml-1 opacity-60 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </motion.div>
          </Link>
        </div>



        <main className="container mx-auto px-4 md:px-6">
          {children}
        </main>

        <footer className="border-t bg-white mt-20 py-12">
          <div className="container mx-auto px-6 text-center">
            <p className="text-sm font-bold text-slate-400">&copy; 2026 Civils Daily &bull; Precision Learning for Public Service</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
