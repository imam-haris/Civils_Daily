'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Crown, Check, X, Sparkles, BrainCircuit, Target,
  MessageSquare, FileText, Shield, Zap, Star, ArrowRight, Loader2
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from '@/lib/supabase/client';

const FREE_FEATURES = [
  { text: '5 AI Summaries per day', included: true, icon: FileText },
  { text: 'MCQ practice (6 per article)', included: true, icon: Target },
  { text: 'Daily Quiz access', included: true, icon: Zap },
  { text: 'Category-wise news browsing', included: true, icon: Star },
  { text: 'Subjective discussion & analysis', included: false, icon: MessageSquare },
  { text: 'AI answer evaluation & scoring', included: false, icon: BrainCircuit },
  { text: 'Mains-style writing practice', included: false, icon: FileText },
  { text: 'Unlimited AI Summaries', included: false, icon: Sparkles },
];

const PREMIUM_FEATURES = [
  { text: 'Unlimited AI Summaries', included: true, icon: Sparkles },
  { text: 'MCQ practice ', included: true, icon: Target },
  { text: 'Daily Quiz access', included: true, icon: Zap },
  { text: 'Category-wise news browsing', included: true, icon: Star },
  { text: 'Subjective discussion & deep analysis', included: true, icon: MessageSquare },
  { text: 'AI answer evaluation & scoring', included: true, icon: BrainCircuit },
  { text: 'Mains-style writing practice', included: true, icon: FileText },
];

export default function PricingPage() {
  const [user, setUser] = useState<any>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        try {
          const res = await fetch('/api/usage');
          if (res.ok) {
            const data = await res.json();
            setIsPremium(data.is_premium);
          }
        } catch (e) {
          console.error('Failed to check premium status');
        }
      }
      setIsLoading(false);
    };
    checkUser();
  }, []);

  return (
    <div className="py-12 md:py-20 space-y-16 min-h-screen">
      {/* Hero */}
      <header className="text-center space-y-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-full px-5 py-2"
        >
          <Crown size={16} className="text-amber-600" />
          <span className="text-sm font-bold text-amber-700">Upgrade Your Preparation</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-black bg-gradient-to-br from-slate-900 via-blue-800 to-blue-600 bg-clip-text text-transparent leading-tight tracking-tight"
        >
          Unlock Your Full<br className="hidden md:block" /> Potential
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto font-medium leading-relaxed"
        >
          Go beyond MCQs. Get AI-powered subjective analysis, mains answer evaluation,
          and unlimited daily briefings to master every dimension of your exam preparation.
        </motion.p>
      </header>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto px-4">
        {/* Free Plan */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full border-slate-200 hover:shadow-xl transition-all duration-300">
            <CardHeader className="space-y-4 pb-6">
              <div className="flex items-center justify-between">
                <Badge className="bg-slate-100 text-slate-700 font-black uppercase tracking-widest text-[10px] border-none">
                  Free Plan
                </Badge>
              </div>
              <div>
                <CardTitle className="text-4xl font-black text-slate-900 tracking-tight">
                  ₹0
                  <span className="text-base font-bold text-muted-foreground ml-1">/forever</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground font-medium mt-2">
                  Perfect for getting started with daily current affairs
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {FREE_FEATURES.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div key={i} className={`flex items-center gap-3 py-2 ${!feature.included ? 'opacity-40' : ''}`}>
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${feature.included ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                      }`}>
                      {feature.included ? <Check size={14} /> : <X size={14} />}
                    </div>
                    <span className={`text-sm font-semibold ${feature.included ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                      {feature.text}
                    </span>
                  </div>
                );
              })}
              <div className="pt-6">
                <Link href="/">
                  <Button variant="outline" className="w-full py-6 rounded-xl font-bold text-slate-600 border-slate-200 hover:border-slate-300">
                    Continue with Free
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Premium Plan */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full border-blue-200 bg-gradient-to-b from-white to-blue-50/30 hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/10 rounded-full blur-3xl" />

            <CardHeader className="space-y-4 pb-6 relative">
              <div className="flex items-center justify-between">
                <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-widest text-[10px] border-none shadow-lg shadow-blue-200">
                  <Crown size={10} className="mr-1" /> Premium
                </Badge>
                <Badge className="bg-orange-50 text-orange-700 font-black text-[10px] border-none px-2">
                  POPULAR
                </Badge>
              </div>
              <div>
                <CardTitle className="text-4xl font-black text-slate-900 tracking-tight">
                  ₹199
                  <span className="text-base font-bold text-muted-foreground ml-1">/month</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground font-medium mt-2">
                  Complete exam preparation with AI-powered evaluation
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 relative">
              {PREMIUM_FEATURES.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Check size={14} />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">
                      {feature.text}
                    </span>
                  </div>
                );
              })}
              <div className="pt-6">
                {isLoading ? (
                  <Button disabled className="w-full py-6 rounded-xl font-bold">
                    <Loader2 className="animate-spin mr-2" size={18} />
                    Loading...
                  </Button>
                ) : isPremium ? (
                  <Button disabled className="w-full py-6 rounded-xl font-bold bg-emerald-600">
                    <Check size={18} className="mr-2" /> You&apos;re Already Premium!
                  </Button>
                ) : !user ? (
                  <Link href="/login">
                    <Button className="w-full py-6 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 group">
                      Login to Upgrade
                      <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    className="w-full py-6 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-200 group"
                    onClick={() => {
                      // Placeholder for payment integration (Razorpay/Stripe)
                      alert('Payment integration coming soon! Contact admin to activate premium.');
                    }}
                  >
                    <Crown size={18} className="mr-2" />
                    Upgrade to Premium
                    <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Trust Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center space-y-4 max-w-xl mx-auto"
      >
        <p className="text-sm text-muted-foreground font-medium">
          <Shield size={14} className="inline mr-1 text-emerald-500" />
          Secure payments • Cancel anytime • Instant activation
        </p>
      </motion.div>
    </div>
  );
}
