'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, LogIn, ShieldCheck, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Login error:', error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-none shadow-2xl bg-white overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />

          <CardHeader className="space-y-4 text-center pt-10 pb-6">
            <div className="mx-auto h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
              <ShieldCheck size={32} />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">Aspirant Portal</CardTitle>
              <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Secure Access Gateway</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 px-10 pb-10">
            <p className="text-center text-slate-600 font-medium text-sm leading-relaxed">
              Authenticate with your credentials to access the strategic dashboard and AI mentor briefings.
            </p>

            <div className="space-y-3">
              <Button
                onClick={handleGoogleLogin}
                disabled={loading}
                variant="outline"
                className="w-full h-14 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-2xl font-bold flex items-center justify-between px-6 transition-all group"
              >
                <div className="flex items-center gap-3">
                  {loading ? <Loader2 className="animate-spin text-blue-600" size={20} /> : <Globe className="text-blue-600 group-hover:scale-110 transition-transform" size={20} />}
                  <span className="text-slate-700">{loading ? 'Redirecting to Google...' : 'Login with Google'}</span>
                </div>
                {!loading && <ArrowRight className="text-slate-300 group-hover:translate-x-1 transition-transform" size={18} />}
              </Button>

              <Button
                disabled
                variant="outline"
                className="w-full h-14 border-slate-100 bg-slate-50 opacity-60 rounded-2xl font-bold flex items-center justify-between px-6 grayscale cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <Mail className="text-slate-400" size={20} />
                  <span className="text-slate-400">Login with Email</span>
                </div>
                <ShieldCheck className="text-slate-300" size={18} />
              </Button>
            </div>
          </CardContent>

          <CardFooter className="bg-slate-50 border-t py-6 flex flex-col gap-3 text-center">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-8">
              Confidentiality Agreement &bull; Data Encrypted &bull; Internal Use Only
            </p>
          </CardFooter>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center"
        >
          <p className="text-sm font-bold text-slate-400">
            Civils Daily Precision Intelligence Systems
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
