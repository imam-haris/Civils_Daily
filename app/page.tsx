'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Calendar, Clock, Loader2, Newspaper, ExternalLink,
  Globe, Cpu, Flame, TrendingUp, Building2, Scale, Banknote, Leaf, Library, Mountain, Crown, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { Article } from '@/lib/articles';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ── Category config (mirrors the API) ──
const CATEGORIES = [
  { slug: 'general', label: 'Current Affairs', icon: Flame, color: 'text-orange-500', active: 'bg-orange-500' },
  { slug: 'polity', label: 'Polity', icon: Scale, color: 'text-blue-600', active: 'bg-blue-600' },
  { slug: 'economy', label: 'Economics', icon: Banknote, color: 'text-amber-600', active: 'bg-amber-600' },
  { slug: 'ir', label: 'IR', icon: Globe, color: 'text-emerald-600', active: 'bg-emerald-600' },
  { slug: 'environment', label: 'Environment', icon: Leaf, color: 'text-green-600', active: 'bg-green-600' },
  { slug: 'science', label: 'Science & Tech', icon: Cpu, color: 'text-violet-600', active: 'bg-violet-600' },
  { slug: 'history', label: 'Art & Culture', icon: Library, color: 'text-rose-600', active: 'bg-rose-600' },
  { slug: 'geography', label: 'Geography', icon: Mountain, color: 'text-cyan-600', active: 'bg-cyan-600' },
];

// Badge colours per category slug
const TAG_COLORS: Record<string, string> = {
  general: 'bg-orange-50 text-orange-700',
  polity: 'bg-blue-50 text-blue-700',
  economy: 'bg-amber-50 text-amber-700',
  ir: 'bg-emerald-50 text-emerald-700',
  environment: 'bg-green-50 text-green-700',
  science: 'bg-violet-50 text-violet-700',
  history: 'bg-rose-50 text-rose-700',
  geography: 'bg-cyan-50 text-cyan-700',
};

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('general');
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchNews = useCallback(async (category: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/news?category=${category}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch news');
      }
      setArticles(await res.json());
    } catch (err: any) {
      setError(err.message || 'Failed to load articles');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews(activeCategory);
  }, [activeCategory, fetchNews]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) { setSearchMode(false); fetchNews(activeCategory); return; }

    setIsSearching(true);
    setSearchMode(true);
    setError(null);
    try {
      const res = await fetch(`/api/news?q=${encodeURIComponent(q)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Search failed');
      }
      setArticles(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCategorySwitch = (slug: string) => {
    setActiveCategory(slug);
    setSearchMode(false);
    setSearchQuery('');
  };

  const catInfo = CATEGORIES.find(c => c.slug === activeCategory) || CATEGORIES[0];
  const tagColor = TAG_COLORS[activeCategory] || TAG_COLORS.general;

  return (
    <div className="relative py-12 space-y-12 min-h-screen">
      {/* ── Nationalist Subtle Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none">
        <img
          src="/images/nationalist_bg.png"
          alt="Nationalist Background"
          className="w-full h-full object-cover opacity-[0.05] lg:opacity-[0.3]"
        />
        {/* Soft vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/20 via-transparent to-slate-50/90" />
      </div>

      {/* ── Content ── */}
      {!mounted ? null : (
        <div className="relative z-10 space-y-12 md:space-y-16">
          {/* ── Hero ── */}
          <header className="text-center space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-7xl font-black bg-gradient-to-br from-slate-900 to-blue-600 bg-clip-text text-transparent leading-tight tracking-tight"
            >
              Think Smart.<br className="hidden md:block" /> Prepare Smarter.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto font-medium leading-relaxed"
            >
              Precision AI-briefings for every subject. Master the dynamic syllabus with real-time news analysis and interactive mentoring.
            </motion.p>

            {/* Search */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative px-4 md:px-0">
              <Search className="absolute left-6 md:left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics like 'Article 370' or 'Monetary Policy'..."
                className="pl-12 pr-28 py-6 md:py-7 text-base md:text-lg rounded-2xl border-blue-500/10 shadow-sm focus:shadow-md focus:border-blue-500/30 transition-all font-medium"
              />
              <Button
                type="submit"
                disabled={isSearching}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold px-4 md:px-5 h-10 md:h-12"
              >
                {isSearching ? <Loader2 className="animate-spin" size={18} /> : 'Search'}
              </Button>
            </form>
          </header>

          {/* ── Category Tabs ── */}
          {!searchMode && (
            <div className="relative">
              <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = cat.slug === activeCategory;
                  return (
                    <button
                      key={cat.slug}
                      onClick={() => handleCategorySwitch(cat.slug)}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all duration-200 border cursor-pointer ${isActive
                        ? `${cat.active} text-white border-transparent shadow-lg`
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900 hover:shadow-md'
                        }`}
                    >
                      <Icon size={15} className={isActive ? 'text-white' : cat.color} />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
              {/* Fade edge hint */}
              <div className="pointer-events-none absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-slate-50/50 to-transparent" />
            </div>
          )}

          {/* Search mode header */}
          {searchMode && (
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-700">
                Search results for <span className="text-blue-600">"{searchQuery}"</span>
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="font-bold text-muted-foreground hover:text-blue-600"
                onClick={() => { setSearchMode(false); setSearchQuery(''); fetchNews(activeCategory); }}
              >
                ← Back to {catInfo.label}
              </Button>
            </div>
          )}

          {/* ── Loading ── */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-24 space-y-6">
              <div className="relative">
                <Loader2 className="animate-spin text-blue-600" size={48} />
              </div>
              <div className="text-center space-y-1">
                <p className="text-lg font-bold text-slate-700">Loading {catInfo.label}...</p>
                <p className="text-sm text-muted-foreground font-medium">Fetching the latest from Google News</p>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {error && !isLoading && (
            <div className="text-center py-16 space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
                <Newspaper className="text-red-500" size={28} />
              </div>
              <p className="text-lg font-bold text-slate-700">Unable to Load News</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto font-medium">{error}</p>
              <Button onClick={() => fetchNews(activeCategory)} variant="outline" className="mt-4 font-bold rounded-xl">
                Try Again
              </Button>
            </div>
          )}

          {/* ── Premium Callout for Free Users ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-2xl group border border-slate-800"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-orange-500/20" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-blue-600/20 transition-colors" />

            <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black tracking-widest uppercase">
                  <Crown size={12} /> Special Access
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">Master the Current Affairs with <span className="text-blue-400">Strategic AI Mentoring</span></h2>
                <p className="text-slate-400 font-medium text-sm md:text-base max-w-xl">
                  Unlock deep subjective analysis, mains evaluation, and unlimited AI briefings using Civils Daily Pro.
                </p>
              </div>
              <Link href="/pricing" className="shrink-0">
                <Button className="bg-white text-slate-900 hover:bg-slate-100 font-black px-10 py-7 rounded-2xl shadow-xl shadow-white/5 transition-all hover:scale-105 active:scale-95 text-base flex items-center gap-2">
                  Get Premium Access
                  <ArrowRight size={20} className="text-blue-600" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* ── Articles Grid ── */}
          {!isLoading && !error && (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory + (searchMode ? '-search' : '')}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
              >
                {articles.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.07, duration: 0.4 }}
                  >
                    <Card className="h-full flex flex-col hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-slate-100 overflow-hidden group">
                      {/* Article Image */}
                      {article.image ? (
                        <div className="h-48 overflow-hidden">
                          <img
                            src={article.image}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                          />
                        </div>
                      ) : (
                        <div className={`h-1.5 bg-gradient-to-r ${activeCategory === 'polity' ? 'from-blue-500 to-indigo-600' :
                          activeCategory === 'economy' ? 'from-amber-500 to-orange-600' :
                            activeCategory === 'ir' ? 'from-emerald-500 to-teal-600' :
                              activeCategory === 'environment' ? 'from-green-500 to-emerald-600' :
                                activeCategory === 'science' ? 'from-violet-500 to-purple-600' :
                                  activeCategory === 'history' ? 'from-rose-500 to-pink-600' :
                                    activeCategory === 'geography' ? 'from-cyan-500 to-blue-600' :
                                      'from-blue-600 to-indigo-600'
                          }`} />
                      )}

                      <CardHeader className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Badge className={`${tagColor} border-none px-3 py-1 text-[10px] tracking-wider uppercase font-black`}>
                            {article.tag}
                          </Badge>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                            <Calendar size={14} className={catInfo.color} /> {article.date}
                          </div>
                        </div>
                        <CardTitle className="text-xl font-extrabold leading-tight text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {article.title}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="flex-grow">
                        <CardDescription className="text-slate-600 text-sm leading-relaxed line-clamp-3 font-medium">
                          {article.summary}
                        </CardDescription>
                      </CardContent>

                      <CardFooter className="flex flex-col gap-4 pt-2">
                        <div className="flex items-center gap-3 w-full pb-4 border-t border-slate-100 pt-4">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-[10px] font-bold ring-4 ring-slate-50 shrink-0 ${catInfo.active}`}>
                            {article.author.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="text-sm font-bold text-slate-900 leading-none truncate">{article.author}</p>
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-tight mt-1">{article.role}</p>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground shrink-0">
                            <Clock size={12} /> {article.readTime}
                          </div>
                        </div>
                        <div className="flex gap-2 w-full">
                          <Link href={`/article/${article.id}?category=${activeCategory}&analyze=true`} className="flex-1">
                            <Button className="w-full py-6 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
                              Analyze with AI Mentor
                            </Button>
                          </Link>
                          {article.sourceUrl && (
                            <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" className="py-6 rounded-xl px-4 border-slate-200 hover:border-blue-300 hover:text-blue-600">
                                <ExternalLink size={16} />
                              </Button>
                            </a>
                          )}
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {/* ── Empty State ── */}
          {!isLoading && !error && articles.length === 0 && (
            <div className="text-center py-16 space-y-4">
              <Newspaper className="text-slate-300 mx-auto" size={48} />
              <p className="text-lg font-bold text-slate-500">No articles found</p>
              <Button onClick={() => { setSearchMode(false); fetchNews(activeCategory); }} variant="outline" className="font-bold rounded-xl">
                Show Top Headlines
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
