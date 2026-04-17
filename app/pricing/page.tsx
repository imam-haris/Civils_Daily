'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, Check, X, Sparkles, BrainCircuit, Target,
  MessageSquare, FileText, Shield, Zap, Star, ArrowRight, Loader2,
  Upload, Camera
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showUPI, setShowUPI] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);

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

  const handleUpgrade = async () => {
    if (!paymentScreenshot) {
      alert("Please upload the payment screenshot first.");
      return;
    }

    setIsUpgrading(true);
    try {
      const formData = new FormData();
      formData.append('screenshot', paymentScreenshot);

      const res = await fetch('/api/payment-request', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setShowUPI(false);
        setPaymentScreenshot(null);
        alert("Success! Your payment request has been received. Your account will be activated within 24 hrs after verification.");
      } else {
        const error = await res.json();
        throw new Error(error.error || "Verification failed");
      }
    } catch (e: any) {
      alert(e.message || "Something went wrong. Please try again.");
    } finally {
      setIsUpgrading(false);
    }
  };

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
                    onClick={() => setShowUPI(true)}
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

      {/* UPI Payment Modal */}
      <AnimatePresence>
        {showUPI && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isUpgrading && setShowUPI(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
            >
              <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="text-center space-y-2">
                  <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto text-blue-600">
                    <Zap size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">Scan to Pay ₹199</h3>
                  <p className="text-[13px] text-muted-foreground font-medium px-4 leading-relaxed">Use any UPI app like GPay, PhonePe, or Paytm</p>
                </div>

                <div className="bg-slate-50 p-6 rounded-[24px] flex flex-col items-center gap-4 border border-slate-100">
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                    {/* Universal UPI QR Code */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=haris.imam1701@oksbi&pn=Haris%20Imam&am=199&cu=INR&tn=Premium%20Plan&mode=02&purpose=00`)}`}
                      alt="UPI QR Code"
                      className="w-40 h-40 md:w-44 md:h-44 rounded-lg"
                    />
                  </div>

                  <div className="w-full space-y-3">


                    <div className="relative group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className={`flex flex-col items-center justify-center gap-2 w-full py-5 border-2 border-dashed rounded-3xl transition-all duration-300 ${paymentScreenshot
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700 shadow-inner'
                        : 'border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50/30 text-slate-400 hover:text-blue-600'
                        }`}>
                        {paymentScreenshot ? (
                          <>
                            <div className="h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                              <Check size={16} strokeWidth={3} />
                            </div>
                            <span className="text-[11px] font-black truncate max-w-[180px]">{paymentScreenshot.name}</span>
                          </>
                        ) : (
                          <>
                            <div className="h-8 w-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                              <Camera size={16} />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-[0.1em]">Upload Transfer Receipt</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="w-full">
                    <a
                      href={`upi://pay?pa=haris.imam1701@oksbi&pn=Haris%20Imam&am=199&cu=INR&tn=Premium%20Plan`}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-slate-200 rounded-xl text-[11px] font-black text-slate-600 hover:bg-slate-50 transition-colors md:hidden"
                    >
                      <Zap size={14} className="text-blue-600" />
                      PAY VIA INSTALLED APP
                    </a>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleUpgrade}
                    disabled={isUpgrading}
                    className="w-full py-7 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95"
                  >
                    {isUpgrading ? (
                      <><Loader2 className="animate-spin mr-2" /> Verifying Payment...</>
                    ) : (
                      "I have paid & want to unlock"
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowUPI(false)}
                    disabled={isUpgrading}
                    className="w-full text-slate-400 font-bold hover:text-slate-600 text-[13px]"
                  >
                    Cancel Payment
                  </Button>
                </div>

                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <p className="text-[10px] text-center text-blue-700 font-bold leading-relaxed">
                    Note: Verification takes up to 24 hrs. Please ensure the screenshot clearly shows the Transaction ID/UTR number.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </div>
  );
}
