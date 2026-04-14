"use client";
import { useState, useEffect, use, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, LayoutDashboard, BrainCircuit, Loader2, Sparkles, ChevronLeft, Calendar, ExternalLink, Newspaper, RefreshCw, CheckCircle2, Crown, Lock, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';
import { Article } from '@/lib/articles';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from '@/lib/supabase/client';

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

export default function ArticleDetail({ params: paramsPromise, searchParams: searchParamsPromise }: { params: Promise<{ id: string }>, searchParams?: Promise<{ category?: string }> }) {
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoadingArticle, setIsLoadingArticle] = useState(true);
  const [articleError, setArticleError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGatheringSummary, setIsGatheringSummary] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [remaining, setRemaining] = useState(5);
  const [limitReached, setLimitReached] = useState(false);

  const [mounted, setMounted] = useState(false);
  const [params, setParams] = useState<{ id: string } | null>(null);
  const [category, setCategory] = useState('general');
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const resolveParams = async () => {
      const p = await paramsPromise;
      const s = await (searchParamsPromise || Promise.resolve({}));
      setParams(p);
      setCategory((s as any).category || 'general');
      
      // Auto-scroll on mobile if 'analyze' param is present
      if ((s as any).analyze === 'true' && typeof window !== 'undefined' && window.innerWidth < 1024) {
        setTimeout(() => {
          chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 800);
      }
    };
    resolveParams();
  }, [paramsPromise, searchParamsPromise]);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // Fetch usage info for logged-in users
      if (user) {
        try {
          const res = await fetch('/api/usage');
          if (res.ok) {
            const usage = await res.json();
            setIsPremium(usage.is_premium);
            setRemaining(usage.remaining);
            if (!usage.is_premium && usage.remaining <= 0) {
              setLimitReached(true);
            }
          }
        } catch (e) {
          console.error('[USAGE] Failed to fetch usage:', e);
        }
      }
    };
    checkUser();
  }, []);

  const handleSyncReport = async (msgs = messages) => {
    if (msgs.length < 2 || isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs, articleTitle: article?.title })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        console.log('[SYNC] Report synced successfully:', data.update?.performance);
        setHasSynced(true);
        setTimeout(() => setHasSynced(false), 3000);
      } else {
        console.error('[SYNC] Sync failed:', data.error);
      }
    } catch (err) {
      console.error('[SYNC] Network error:', err);
    } finally {
      setIsSyncing(false);
    }
  };


  // Fetch the article from API
  useEffect(() => {
    if (!params?.id) return;
    const fetchArticle = async () => {
      setIsLoadingArticle(true);
      setArticleError(null);
      try {
        console.log(`[CLIENT] Fetching article: ID=${params.id}, Category=${category}`);
        const res = await fetch(`/api/news?id=${params.id}&category=${category}`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Article not found (${res.status})`);
        }
        const data = await res.json();
        setArticle(data);
      } catch (err: any) {
        console.error('[CLIENT] Article fetch error:', err);
        setArticleError(err.message || 'Failed to load article');
      } finally {
        setIsLoadingArticle(false);
      }
    };
    fetchArticle();
  }, [params?.id, category]);

  // Kick off AI summary once article is loaded
  const fetchInitialSummary = async () => {
    if (!article || !mounted || messages.length > 0 || limitReached) return;
    
    setIsGatheringSummary(true);
    console.log(`[CLIENT] Requesting AI summary for: ${article.title}`);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Please provide a summary of the article and start my assessment phase with the first MCQ.' }],
          articleTitle: article.title,
          articleContent: article.content || article.summary || "No content available. Analyze based on title."
        }),
      });
      const data = await response.json();

      // Handle limit reached response
      if (response.status === 402 && data.error === 'LIMIT_REACHED') {
        setLimitReached(true);
        setRemaining(0);
        return;
      }

      if (data.content) {
        setMessages([{ role: 'assistant', content: data.content }]);
        setRemaining(prev => Math.max(0, prev - 1));
      } else {
        console.warn('[CLIENT] AI response empty or error:', data.error);
        setMessages([{ role: 'assistant', content: data.error ? `**Mentor Hub:** ${data.error}` : "I've analyzed the article. What would you like to discuss?" }]);
      }
    } catch (error) {
      console.error('[CLIENT] AI summary fetch error:', error);
      setMessages([{ role: 'assistant', content: "Failed to connect to the mentor. Please click 'Sync Briefing' or refresh to try again." }]);
    } finally {
      setIsGatheringSummary(false);
    }
  };

  useEffect(() => {
    if (article && mounted && messages.length === 0 && !limitReached && !isGatheringSummary) {
      fetchInitialSummary();
    }
  }, [article, mounted, messages.length, limitReached]);

  // Detect MCQ options in an assistant message
  const parseMcqOptions = (content: string): { label: string; text: string }[] => {
    const options: { label: string; text: string }[] = [];
    // Match patterns like (A) ..., (B) ..., a) ..., A. ..., **A.** etc.
    const regex = /(?:^|\n)\s*(?:\*\*)?\(?([A-Da-d])[\.\)\:]\)?(?:\*\*)?\s*(.+)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      options.push({ label: match[1].toUpperCase(), text: match[2].trim().replace(/\*\*/g, '') });
    }
    return options.length >= 2 ? options : [];
  };

  // Check if the last message has MCQ options
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const mcqOptions = lastMessage?.role === 'assistant' && !isLoading ? parseMcqOptions(lastMessage.content) : [];

  const handleOptionSelect = async (option: { label: string; text: string }) => {
    if (isLoading || !article) return;

    const userMessage: Message = { role: 'user', content: `${option.label}` };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          articleTitle: article.title,
          articleContent: article.content
        }),
      });
      const data = await response.json();
      if (data.content) {
        const finalMessages = [...newMessages, { role: 'assistant', content: data.content } as Message];
        setMessages(finalMessages);
        handleSyncReport(finalMessages);
      }
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting to my brain right now. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const hasCompletedAssessment = useMemo(() => {
    if (isPremium || messages.length === 0) return false;

    // 1. Check for standard premium keywords as a fallback
    const hasPremiumKeyword = messages.some(m =>
      m.role === 'assistant' &&
      (/reserved for our Premium/i.test(m.content) || /reserved for PREMIUM/i.test(m.content) || /Upgrade to Premium/i.test(m.content))
    );
    if (hasPremiumKeyword) return true;

    // 2. Strict check: If assistant has responded AFTER "MCQ 6/6" was sent
    let mcq6Index = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant' && messages[i].content?.includes('MCQ 6/6')) {
        mcq6Index = i;
        break;
      }
    }

    if (mcq6Index !== -1) {
      // If there's an assistant message at a higher index than the MCQ 6 prompt,
      // it means the assistant has provided feedback for MCQ 6. Assessment is DONE.
      return messages.slice(mcq6Index + 1).some(m => m.role === 'assistant');
    }

    return false;
  }, [messages, isPremium]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !article) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          articleTitle: article.title,
          articleContent: article.content
        }),
      });
      const data = await response.json();
      if (data.content) {
        const finalMessages = [...newMessages, { role: 'assistant', content: data.content } as Message];
        setMessages(finalMessages);
        handleSyncReport(finalMessages);
      }
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting to my brain right now. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoadingArticle) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
        <div className="relative">
          <Loader2 className="animate-spin text-blue-600" size={48} />
          <Newspaper className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={20} />
        </div>
        <p className="text-lg font-bold text-slate-700">Loading Article...</p>
      </div>
    );
  }

  // Error / not found state
  if (articleError || !article) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
        <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <Newspaper className="text-red-500" size={28} />
        </div>
        <p className="text-lg font-bold text-slate-700">{articleError || 'Article not found'}</p>
        <Link href="/">
          <Button variant="outline" className="font-bold rounded-xl gap-2">
            <ChevronLeft size={16} /> Back to Briefings
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-80px)] py-4 lg:py-6 gap-6 lg:gap-8 overflow-y-auto lg:overflow-hidden px-4 lg:px-0">
      {/* Article Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-blue-600 gap-1.5 font-bold mb-4">
              <ChevronLeft size={16} /> Back to Briefings
            </Button>
          </Link>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50/50 uppercase tracking-widest font-black text-[10px]">
              {article.tag}
            </Badge>
            <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
              <Calendar size={12} /> {article.date.toUpperCase()}
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black leading-tight text-slate-900 mb-6">{article.title}</h1>
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <Avatar className="h-10 w-10 ring-2 ring-blue-50">
              <AvatarImage src="" />
              <AvatarFallback className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-xs font-bold">
                {article.author.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-bold text-slate-900 text-sm leading-none mb-1">{article.author}</p>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-tight">{article.role}</p>
            </div>
            {article.sourceUrl && (
              <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold rounded-lg hover:text-blue-600 hover:border-blue-300">
                  <ExternalLink size={14} /> Read Original
                </Button>
              </a>
            )}
          </div>
        </div>

        {/* Article image */}
        {article.image && (
          <div className="mb-8 lg:mb-10 relative group h-[250px] md:h-[450px] w-full rounded-2xl lg:rounded-3xl overflow-hidden shadow-xl border border-slate-100">
            {/* Blurred Backdrop */}
            <div
              className="absolute inset-0 z-0 bg-cover bg-center blur-2xl opacity-40 scale-110"
              style={{ backgroundImage: `url(${article.image})` }}
            />
            {/* Full Image Contained */}
            <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
              <img
                src={article.image}
                alt={article.title}
                className="max-w-full max-h-full object-contain rounded-xl shadow-lg ring-1 ring-white/20"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-t from-slate-900/10 to-transparent" />
          </div>
        )}

        <ScrollArea className="flex-1 lg:pr-6 lg:-mr-6 hidden lg:block">
          <div className="space-y-6 text-lg lg:text-xl text-slate-700 leading-relaxed font-medium">
            <div className="border-l-4 border-blue-600 pl-4 lg:pl-6 my-6 lg:my-8 italic text-slate-500 font-bold bg-blue-50/30 py-4 rounded-r-xl">
              "Strategic Overview: Initial analysis suggests a significant shift in diplomatic posture. Aspirants should focus on the geopolitical ripple effects described below."
            </div>

            {(article.content || article.summary || "No detailed content available for this brief.").split('\n\n').slice(0, 5).map((para, i) => (
              <p key={i}>{para}</p>
            ))}

            <div className="pt-8 lg:pt-12 pb-12 lg:pb-20 text-center">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-8 lg:mb-12" />
              <Link href="/">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-black px-8 lg:px-10 py-6 lg:py-7 rounded-2xl shadow-xl lg:shadow-2xl shadow-blue-200 text-base lg:text-lg group transition-all hover:scale-105 active:scale-95">
                  Complete Briefing & Return
                  <ChevronLeft className="rotate-180 ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                </Button>
              </Link>
            </div>
          </div>
        </ScrollArea>

        {/* Mobile Content (Visible only on small screens) */}
        <div className="block lg:hidden space-y-6 mb-8">
          <div className="border-l-4 border-blue-600 pl-4 my-6 italic text-slate-500 font-bold bg-blue-50/30 py-4 rounded-r-xl text-sm">
            "Strategic Overview: Initial analysis suggests a significant shift. Focus on the geopolitical ripple effects."
          </div>
          {article.content.split('\n\n').slice(0, 3).map((para, i) => (
            <p key={i} className="text-base text-slate-700 leading-relaxed">{para}</p>
          ))}
          <div className="pt-4">
            <Button 
              onClick={() => chatRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-xl shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
            >
              Analyze with AI Mentor
              <BrainCircuit size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* AI Discussion Sidebar */}
      <Card ref={chatRef} id="ai-mentor" className="w-full lg:w-[450px] shrink-0 h-[600px] lg:h-full shadow-2xl border-blue-500/5 flex flex-col overflow-hidden mb-8 lg:mb-0">
        <CardHeader className="bg-white border-b px-6 py-4 flex flex-col gap-3 space-y-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <BrainCircuit size={20} />
              </div>
              <div>
                <CardTitle className="text-base font-black text-slate-900 leading-none">AI Exam Mentor</CardTitle>
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-1">Live Discussion</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => messages.length > 0 ? handleSyncReport() : fetchInitialSummary()}
                disabled={isSyncing || (messages.length === 0 && isGatheringSummary)}
                className={`h-8 text-[11px] font-black border-blue-200 transition-all ${hasSynced ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'text-blue-600 hover:bg-blue-50'
                  }`}
              >
                {isSyncing || isGatheringSummary ? <RefreshCw size={12} className="animate-spin mr-1.5" /> : hasSynced ? <CheckCircle2 size={12} className="mr-1.5" /> : <RefreshCw size={12} className="mr-1.5" />}
                {hasSynced ? 'SYNCED' : messages.length > 0 ? 'SYNC BRIEFING' : 'RETRY ANALYSIS'}
              </Button>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-muted-foreground hover:text-blue-600 gap-1.5 cursor-pointer">
                  <LayoutDashboard size={14} /> Reports
                </Button>
              </Link>
            </div>
          </div>
          {/* Usage Indicator */}
          {user && (
            <div className="flex items-center justify-between">
              {isPremium ? (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[9px] uppercase tracking-widest border-none shadow-sm">
                  <Crown size={10} className="mr-1" /> Premium
                </Badge>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-slate-500 font-bold text-[10px] border-slate-200">
                    <Zap size={10} className="mr-1" /> {remaining}/5 free today
                  </Badge>
                  {remaining <= 2 && remaining > 0 && (
                    <span className="text-[10px] font-bold text-amber-600 animate-pulse">Running low!</span>
                  )}
                </div>
              )}
              {!isPremium && (
                <Link href="/pricing">
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200 font-black text-[10px] cursor-pointer transition-colors gap-1">
                    <Crown size={10} /> GO PRO
                  </Badge>
                </Link>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 bg-slate-50/50 p-0 overflow-hidden min-h-0">
          <ScrollArea className="h-full px-6 py-6 font-medium">
            <div className="space-y-6">
              {/* Limit Reached Paywall */}
              {limitReached && messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center space-y-6"
                >
                  <div className="relative">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                      <Lock size={32} className="text-amber-600" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-black">0</div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-slate-900">Daily Limit Reached</h3>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-[280px]">
                      You&apos;ve used all 5 free AI briefings for today. Upgrade to Premium for unlimited summaries, subjective analysis, and answer evaluation.
                    </p>
                  </div>
                  <Link href="/pricing">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black px-8 py-6 rounded-xl shadow-xl shadow-blue-200 group">
                      <Crown size={16} className="mr-2" />
                      Upgrade to Premium — ₹199/mo
                      <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <p className="text-[11px] text-muted-foreground font-semibold">
                    Or come back tomorrow for 5 more free briefings
                  </p>
                </motion.div>
              )}

              {isGatheringSummary && (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="relative">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                    <Sparkles className="absolute -top-1 -right-1 text-yellow-500 animate-pulse" size={16} />
                  </div>
                  <p className="text-sm font-bold text-slate-600">Analyzing Article & <br /> Preparing Discussion...</p>
                </div>
              )}

              <AnimatePresence>
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm flex gap-3 ${m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none font-medium'
                      }`}>
                      {m.role === 'assistant' ? (
                        <div className="markdown-content">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {m.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        m.content
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                    <Loader2 className="animate-spin text-blue-600" size={18} />
                  </div>
                </div>
              )}

              {/* MCQ Option Buttons */}
              {mcqOptions.length > 0 && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2 pt-2"
                >
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 px-1">Select your answer</p>
                  {mcqOptions.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => handleOptionSelect(opt)}
                      className="w-full text-left px-4 py-3 rounded-xl border-2 border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 flex items-center gap-3 group cursor-pointer"
                    >
                      <span className="h-8 w-8 rounded-lg bg-slate-100 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-sm font-black text-slate-600 transition-colors shrink-0">
                        {opt.label}
                      </span>
                      <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">
                        {opt.text}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}

              {/* End of Assessment CTA for Free Users */}
              {hasCompletedAssessment && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-6 border-t border-slate-100 mt-6"
                >
                  <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8" />
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <Crown size={20} className="text-amber-400" />
                        <h4 className="font-black text-lg">Unlock Strategic Analysis</h4>
                      </div>
                      <p className="text-sm text-blue-50 font-medium leading-relaxed">
                        Go beyond assessment. Get deep subjective analysis, mains-evaluation, and personal mentoring for this topic.
                      </p>
                      <Link href="/pricing" className="block">
                        <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 font-black rounded-xl py-6 shadow-lg group">
                          Upgrade Now — ₹199/mo
                          <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </ScrollArea>
        </CardContent>

        <CardFooter className="p-4 bg-white border-t flex flex-col gap-3">
          {user ? (
            limitReached && messages.length === 0 ? (
              /* Fully locked state — no interaction allowed */
              <div className="w-full py-3 text-center">
                <p className="text-xs text-muted-foreground font-semibold">Your daily free limit has been reached</p>
              </div>
            ) : (
              <>
                <div className="flex gap-2 w-full overflow-x-auto no-scrollbar">
                  {['# exam-qn', '# summary', '# analysis'].map(tag => (
                    <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors py-1 px-2.5 text-[10px] font-bold">
                      {tag}
                    </Badge>
                  ))}
                  {!isPremium && (
                    <Link href="/pricing">
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[9px] border-none cursor-pointer hover:shadow-md transition-shadow">
                        <Crown size={9} className="mr-1" /> PRO
                      </Badge>
                    </Link>
                  )}
                </div>
                <div className="flex gap-3 w-full">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    disabled={hasCompletedAssessment}
                    placeholder={hasCompletedAssessment ? "Discussion ended for free users" : (isPremium ? "Ask anything — subjective, analysis, evaluation..." : "Ask for an exam question...")}
                    className="bg-slate-50 border-none rounded-xl focus-visible:ring-blue-500 py-6 disabled:opacity-50"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim() || hasCompletedAssessment}
                    className="bg-blue-600 hover:bg-blue-700 h-auto px-4 rounded-xl shadow-lg shadow-blue-100 cursor-pointer"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : (hasCompletedAssessment ? <Lock size={18} /> : <Send size={18} />)}
                  </Button>
                </div>
              </>
            )
          ) : (
            <div className="w-full py-4 text-center space-y-4">
              <div className="inline-flex h-12 w-12 rounded-2xl bg-slate-50 items-center justify-center text-slate-400 mb-2">
                <BrainCircuit size={24} />
              </div>
              <p className="text-sm font-bold text-slate-600 italic px-6">
                Strategic discussion requires authentication. Elevate your status to engage with the AI Mentor.
              </p>
              <Link href="/login" className="block w-full px-4">
                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl py-7 shadow-xl cursor-pointer">
                  Login to Start Discussion
                </Button>
              </Link>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
