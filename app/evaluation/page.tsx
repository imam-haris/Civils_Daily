'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Upload, Sparkles, CheckCircle2, AlertCircle, 
  ArrowRight, Star, PenTool, Layout, Calendar, ChevronDown, 
  Loader2, Globe, History, Scale, Cpu, Microscope, Ghost, Crown
} from 'lucide-react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// GS Categories configuration
const GS_CATEGORIES = [
  { id: 'gs1', label: 'GS Paper I', icon: History, color: 'text-rose-600', sub: 'History, Geog, Society' },
  { id: 'gs2', label: 'GS Paper II', icon: Scale, color: 'text-blue-600', sub: 'Polity, Gov, IR' },
  { id: 'gs3', label: 'GS Paper III', icon: Cpu, color: 'text-emerald-600', sub: 'Economy, S&T, Env' },
  { id: 'gs4', label: 'GS Paper IV', icon: Sparkles, color: 'text-amber-600', sub: 'Ethics, Integrity' },
];

export default function EvaluationPage() {
  const [selectedGS, setSelectedGS] = useState('gs2');
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState('');
  const [dailyQuestions, setDailyQuestions] = useState<any>(null);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const d = new Date();
    setCurrentDate(d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }));
    
    const fetchInitialData = async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
        const { data } = await supabase.from('profiles').select('is_premium').eq('id', user.id).maybeSingle();
        setIsPremium(data?.is_premium || false);
      } else {
        setIsLoggedIn(false);
        setIsPremium(false);
      }

      try {
        const res = await fetch('/api/questions');
        const data = await res.json();
        setDailyQuestions(data);
      } catch (e) {
        console.error("Failed to fetch questions", e);
      } finally {
        setIsLoadingQuestions(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const runEvaluation = async () => {
    if (!file || !selectedQuestion) return;

    setIsUploading(true);
    setEvaluation(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('questionText', selectedQuestion.text);

      const res = await fetch('/api/evaluate', {
        method: 'POST',
        body: formData,
      });

      const contentType = res.headers.get("content-type");
      if (!res.ok) {
        let errorMessage = 'Evaluation failed';
        if (contentType && contentType.includes("application/json")) {
          const err = await res.json();
          errorMessage = err.error || err.message || errorMessage;
        } else {
          errorMessage = `Server Error (${res.status}): ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setEvaluation(data);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err: any) {
      console.error("Evaluation Error:", err);
      alert(err.message || 'Something went wrong during evaluation.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="py-12 max-w-7xl mx-auto space-y-12">
      {/* --- Page Header --- */}
      <header className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100">
              <PenTool size={12} /> Daily Mains Practice
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Answer <span className="text-blue-600">Evaluation</span></h1>
            <p className="text-slate-500 font-medium max-w-xl">
              Upload your handwritten answers in PDF format. Our AI mentor will analyze your structure, content, and handwriting to provide detailed UPSC-standard feedback.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
            <Calendar className="text-blue-600" size={20} />
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Paper</p>
              <p className="text-sm font-black text-slate-900">{currentDate}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative">
        {/* --- Premium Gate Overlay --- */}
        {isPremium === false && (
          <div className="absolute inset-0 z-50 rounded-[40px] overflow-hidden">
             <div className="absolute inset-x-0 bottom-0 top-[20%] bg-slate-50/20 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center border-t border-white/50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                <div className="max-w-md space-y-6">
                  {isLoggedIn ? (
                    <>
                      <div className="h-20 w-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-amber-200 rotate-6">
                        <Crown className="text-white" size={40} />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-3xl font-black text-slate-900">Unlock Mains Evaluation</h2>
                        <p className="text-slate-500 font-medium">
                          Daily subjective questions and detailed AI handwriting analysis are reserved for our Pro members.
                        </p>
                      </div>
                      <div className="flex flex-col gap-3">
                        <Link href="/pricing">
                          <Button className="w-full py-7 rounded-2xl bg-slate-900 hover:bg-slate-800 text-lg font-black shadow-xl">
                            Upgrade to Pro &bull; ₹199/mo
                          </Button>
                        </Link>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Unlimited AI Briefings &bull; Expert Feedback</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-20 w-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-200 -rotate-3">
                        <PenTool className="text-white" size={40} />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-3xl font-black text-slate-900">Strategic Practice</h2>
                        <p className="text-slate-500 font-medium">
                          Sign in to access today's Mains-style questions and get AI evaluation for your handwritten answers.
                        </p>
                      </div>
                      <div className="flex flex-col gap-3">
                        <Link href="/login">
                          <Button className="w-full py-7 rounded-2xl bg-blue-600 hover:bg-blue-700 text-lg font-black shadow-xl">
                            Login to Start
                          </Button>
                        </Link>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Join 10,000+ Aspirants</p>
                      </div>
                    </>
                  )}
                </div>
             </div>
          </div>
        )}

        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-10 items-start ${isPremium === false ? 'opacity-30 blur-[2px] pointer-events-none select-none max-h-[600px] overflow-hidden' : ''}`}>
        {/* --- Sidebar: Categories & Questions --- */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50">
              <h3 className="font-black text-slate-900 flex items-center gap-2 text-lg">
                <Layout className="text-blue-600" size={20} /> Select Paper
              </h3>
            </div>
            <div className="p-2">
              {GS_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedGS(cat.id); setSelectedQuestion(null); setEvaluation(null); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 group ${
                    selectedGS === cat.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
                    selectedGS === cat.id ? 'bg-white/20' : 'bg-slate-100'
                  }`}>
                    <cat.icon size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">{cat.label}</p>
                    <p className={`text-[10px] font-medium opacity-70 ${selectedGS === cat.id ? 'text-white' : 'text-slate-400'}`}>
                      {cat.sub}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 px-2 flex items-center gap-2">
              <ArrowRight className="text-blue-600" size={16} /> Daily Questions
            </h3>
            <div className="space-y-3">
              {isLoadingQuestions ? (
                Array(2).fill(0).map((_, i) => (
                  <div key={i} className="h-24 w-full bg-slate-100 animate-pulse rounded-2xl" />
                ))
              ) : (
                dailyQuestions && dailyQuestions[selectedGS]?.map((q: any) => (
                  <motion.div
                    key={q.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setSelectedQuestion(q); setEvaluation(null); setFile(null); }}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all overflow-hidden ${
                      selectedQuestion?.id === q.id 
                        ? 'border-blue-600 bg-blue-50/50 shadow-md ring-1 ring-blue-600/20' 
                        : 'border-slate-100 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-3 mb-3">
                      <Badge variant="outline" className="text-[10px] font-black uppercase tracking-wider bg-white shrink-0">
                        GS {selectedGS.slice(-1)}
                      </Badge>
                      <span className="text-[10px] font-bold text-slate-400 italic truncate text-right">Source: {q.source}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 leading-relaxed">
                      {q.text}
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* --- Main Area: Question Preview & Upload --- */}
        <div className="lg:col-span-8 space-y-8">
          <AnimatePresence mode="wait">
            {selectedQuestion ? (
              <motion.div
                key="question-active"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Question Info */}
                <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-3xl">
                  <div className="h-2 bg-blue-600 w-full" />
                  <CardHeader className="p-8">
                    <CardTitle className="text-2xl font-black text-slate-900 leading-tight">
                      {selectedQuestion.text}
                    </CardTitle>
                    <CardDescription className="text-slate-500 font-medium">
                      Standard: UPSC Civil Services (Mains) &bull; Word limit: 250 words
                    </CardDescription>
                  </CardHeader>

                  {!evaluation && (
                    <CardContent className="p-8 pt-0 space-y-6">
                      <div className="bg-slate-50 rounded-2xl p-6 border border-dashed border-slate-200">
                        <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                          <Upload size={18} /> Upload your Answer
                        </h4>
                        
                        {!file ? (
                          <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-white group hover:border-blue-400 transition-colors cursor-pointer relative">
                            <input 
                              type="file" 
                              accept=".pdf" 
                              onChange={handleFileUpload}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                              <FileText className="text-blue-600" size={32} />
                            </div>
                            <p className="font-black text-slate-900 mb-1">Click to upload PDF</p>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Handwritten scan or digital PDF</p>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-blue-100 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                                <FileText size={20} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{file.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="text-red-500 font-bold hover:bg-red-50">
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>

                      <Button 
                        disabled={!file || isUploading}
                        onClick={runEvaluation} 
                        className="w-full py-8 text-lg font-black bg-gradient-to-r from-blue-600 to-indigo-700 hover:shadow-2xl hover:scale-[1.01] transition-all rounded-2xl shadow-xl shadow-blue-100"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="animate-spin mr-2" />
                            Analyzing with AI Mentor...
                          </>
                        ) : (
                          <>
                            Submit for Evaluation
                            <Sparkles className="ml-2" />
                          </>
                        )}
                      </Button>
                    </CardContent>
                  )}
                </Card>

                {/* Evaluation Result */}
                {evaluation && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-8 pb-12"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="md:col-span-1 bg-slate-900 text-white rounded-3xl border-none shadow-2xl overflow-hidden relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 to-purple-600/30" />
                        <CardHeader className="relative p-6 text-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-2">Overall Score</p>
                          <div className="relative inline-block">
                            <h2 className="text-7xl font-black">{evaluation.score}</h2>
                            <span className="absolute bottom-2 -right-6 text-xl font-bold opacity-40">/10</span>
                          </div>
                        </CardHeader>
                        <CardContent className="relative p-6 pt-0">
                          <div className="space-y-2">
                             <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                               <span>Performance</span>
                               <span>{evaluation.score * 10}%</span>
                             </div>
                             <Progress value={evaluation.score * 10} className="h-2 bg-slate-800" />
                          </div>
                          <p className="mt-6 text-xs text-center font-bold text-slate-400 leading-relaxed italic">
                            "Excellent attempt! Your structure is UPSC standard, but some factual depth is needed."
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="md:col-span-2 bg-white rounded-3xl shadow-xl border-slate-100 p-8 flex flex-col justify-center">
                        <h4 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                          <CheckCircle2 className="text-green-500" size={24} /> Mentor's Remark
                        </h4>
                        <p className="text-slate-600 leading-relaxed font-medium">
                          {evaluation.feedback.detailed_remark}
                        </p>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="bg-emerald-50/50 rounded-3xl p-8 border border-emerald-100 min-h-[200px]">
                          <h4 className="text-emerald-700 font-black text-lg mb-6 flex items-center gap-2">
                            <Star size={20} /> Strengths
                          </h4>
                          <ul className="space-y-4">
                            {evaluation.feedback.strengths && evaluation.feedback.strengths.length > 0 ? (
                              evaluation.feedback.strengths.map((s: string, i: number) => (
                                <li key={i} className="flex gap-3 text-sm font-bold text-emerald-900">
                                  <div className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 text-[10px]">
                                    {i+1}
                                  </div>
                                  {s}
                                </li>
                              ))
                            ) : (
                              <li className="text-sm text-emerald-600/60 italic font-medium">No major strengths identified for this attempt.</li>
                            )}
                          </ul>
                       </div>

                       <div className="bg-orange-50/50 rounded-3xl p-8 border border-orange-100 min-h-[200px]">
                          <h4 className="text-orange-700 font-black text-lg mb-6 flex items-center gap-2">
                            <AlertCircle size={20} /> Areas of Improvement
                          </h4>
                          <ul className="space-y-4">
                            {evaluation.feedback.improvements && evaluation.feedback.improvements.length > 0 ? (
                              evaluation.feedback.improvements.map((im: string, i: number) => (
                                <li key={i} className="flex gap-3 text-sm font-bold text-orange-900">
                                  <div className="h-5 w-5 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0 text-[10px]">
                                    {i+1}
                                  </div>
                                  {im}
                                </li>
                              ))
                            ) : (
                              <li className="text-sm text-orange-600/60 italic font-medium">No urgent improvements identified. Keep it up!</li>
                            )}
                          </ul>
                       </div>
                    </div>

                    <div className="flex justify-center pt-8">
                       <Button onClick={() => { setEvaluation(null); setFile(null); setSelectedQuestion(null); }} variant="outline" className="rounded-xl font-bold py-6 px-10 border-slate-200 hover:bg-slate-50">
                          Practice Another Question
                       </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-slate-50/50 rounded-[40px] border border-dashed border-slate-200">
                <div className="h-24 w-24 bg-white rounded-3xl flex items-center justify-center shadow-xl mb-6">
                  <PenTool size={48} className="text-slate-300" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Ready for Main's Practice?</h3>
                <p className="text-slate-500 font-medium max-w-sm">
                  Select a subjective question from the list on the left to start your evaluation.
                </p>
                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-2xl">
                  {[
                    { label: 'Pick a Question', icon: Layout },
                    { label: 'Write on Paper', icon: PenTool },
                    { label: 'Upload & Evaluate', icon: Upload },
                  ].map((step, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4 font-black">
                        {i+1}
                      </div>
                      <p className="text-xs font-black text-slate-800">{step.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  </div>
  );
}
