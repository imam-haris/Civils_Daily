'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, User } from 'lucide-react';

export default function UserNav({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    setIsOpen(false);
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="relative">
      <div
        className="flex items-center gap-4 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Link href="/dashboard" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" className="text-sm font-black text-slate-600 hover:text-blue-600 hidden md:inline-flex rounded-xl">Dashboard</Button>
        </Link>
        <Avatar className="h-11 w-11 border-2 border-white shadow-xl ring-1 ring-slate-100 hover:scale-105 transition-all">
          <AvatarImage src={user.user_metadata?.avatar_url || user.user_metadata?.picture} />
          <AvatarFallback className="bg-blue-600 text-white font-black text-xs uppercase">
            {user.email?.[0]}
          </AvatarFallback>
        </Avatar>
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
            <div className="px-5 py-3 border-b border-slate-50 mb-2">
              <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">Aspirant Profile</p>
              <p className="text-sm font-bold text-slate-900 truncate">{user.email}</p>
            </div>

            <Link href="/dashboard" onClick={() => setIsOpen(false)} className="block">
              <div className="px-5 py-3 flex items-center gap-3 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors font-bold text-sm cursor-pointer group">
                <LayoutDashboard size={18} className="group-hover:scale-110 transition-transform" />
                Intelligence Report
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full px-5 py-3 mt-2 border-t border-slate-50 flex items-center gap-3 text-red-500 hover:bg-red-50 transition-colors font-black text-sm cursor-pointer group text-left"
            >
              <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
