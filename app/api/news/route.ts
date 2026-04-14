import { NextRequest, NextResponse } from 'next/server';
import { Article, estimateReadTime, categorizeArticle } from '@/lib/articles';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ── GNews response types ──
interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  source: { name: string; url: string };
}

// ── UPSC Category config ──
export const CATEGORIES: Record<string, { gnews: string; label: string; tag: string; search: string }> = {
  general:     { gnews: 'general',    label: 'Current Affairs', tag: 'Current Affairs', search: 'India national news' },
  polity:      { gnews: 'nation',     label: 'Polity',          tag: 'Polity',          search: 'government OR parliament OR "supreme court" OR constitution OR legislation' },
  economy:     { gnews: 'business',   label: 'Economics',       tag: 'Economy',         search: 'economy OR rbi OR gdp OR inflation OR budget OR finance' },
  ir:          { gnews: 'world',      label: 'IR',              tag: 'IR',              search: 'diplomacy OR "foreign policy" OR summit OR bilateral OR "international relations"' },
  environment: { gnews: 'science',    label: 'Environment',     tag: 'Environment',     search: 'climate OR ecology OR pollution OR wildlife OR environment' },
  science:     { gnews: 'technology', label: 'Science & Tech',  tag: 'Science & Tech',  search: 'isro OR space OR technology OR ai OR science OR biotech' },
  history:     { gnews: 'general',    label: 'History',         tag: 'History',         search: 'archaeology OR heritage OR cultural OR history' },
  geography:   { gnews: 'nation',     label: 'Geography',       tag: 'Geography',       search: 'monsoon OR "natural disaster" OR geography OR cyclones' },
};

// ── Per-category in-memory cache (30 min TTL) ──
interface CachedData {
  articles: Article[];
  timestamp: number;
}

const categoryCache: Record<string, CachedData> = {};
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// AI Classification Function
async function classifyArticles(articles: GNewsArticle[], targetCategory: string): Promise<GNewsArticle[]> {
  if (!process.env.OPENAI_API_KEY || articles.length === 0) return articles;

  const prompt = `You are a Civil Services expert. Given the following news articles, identify which ones are relevant to the Civil Services subject: "${CATEGORIES[targetCategory]?.label || targetCategory}".
  
  Articles:
  ${articles.map((a, i) => `${i+1}. Title: ${a.title}\nDescription: ${a.description}`).join('\n\n')}
  
  Return ONLY the indices (1, 2, 3...) of matching articles, or 'none'. Be moderately inclusive - if it relates to Indian governance, economy, or social issues under this category, include it.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: "You are a UPSC exam preparation assistant." }, { role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 100,
    });

    const result = response.choices[0].message?.content?.toLowerCase() || '';
    if (result.includes('none')) return [];

    const indices = result.match(/\d+/g)?.map(n => parseInt(n)).filter(n => n > 0 && n <= articles.length) || [];
    return indices.map(i => articles[i - 1]).filter(Boolean);
  } catch (error) {
    console.error('[AI Classification Error]:', error);
    return articles.slice(0, 10); // Fallback to raw results
  }
}

// Stable IDs: simple hash of URL to ensure consistency across environments
function makeArticleId(url: string): number {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash % 100000);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const categorySlug = searchParams.get('category') || 'general';
  const query = searchParams.get('q');

  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GNEWS_API_KEY_HERE') {
    return NextResponse.json(
      { error: 'GNEWS_API_KEY is not configured in .env.local' },
      { status: 500 }
    );
  }

  if (id) {
    for (const [slug, cached] of Object.entries(categoryCache)) {
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        const article = cached.articles.find((a) => a.id === parseInt(id));
        if (article) return NextResponse.json(article);
      }
    }
    try {
      await fetchAndCache(categorySlug, apiKey);
      const article = categoryCache[categorySlug]?.articles.find((a) => a.id === parseInt(id));
      if (article) return NextResponse.json(article);
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  if (query) {
    try {
      const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&country=in&max=10&apikey=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) return NextResponse.json({ error: `GNews API returned ${res.status}` }, { status: 502 });
      const data = await res.json();
      const articles = mapArticles(data.articles || [], 'general');
      return NextResponse.json(articles);
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  const cached = categoryCache[categorySlug];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.articles);
  }

  try {
    await fetchAndCache(categorySlug, apiKey);
    return NextResponse.json(categoryCache[categorySlug]?.articles || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch news' }, { status: 500 });
  }
}

async function fetchAndCache(categorySlug: string, apiKey: string) {
  const cat = CATEGORIES[categorySlug] || CATEGORIES.general;
  const url = categorySlug === 'general' 
    ? `https://gnews.io/api/v4/top-headlines?category=general&lang=en&country=in&max=30&apikey=${apiKey}`
    : `https://gnews.io/api/v4/search?q=${encodeURIComponent(cat.search)}&lang=en&country=in&max=30&apikey=${apiKey}`;

  const response = await fetch(url, { next: { revalidate: 1800 } });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GNews API returned ${response.status}: ${body}`);
  }
  const data = await response.json();
  if (!data.articles) throw new Error('Unexpected response from GNews');

  let filteredArticles = data.articles;
  if (categorySlug !== 'general') {
    filteredArticles = await classifyArticles(data.articles, categorySlug);
  }

  if (filteredArticles.length === 0 && data.articles.length > 0) {
    filteredArticles = data.articles.slice(0, 5);
  }

  const articles = mapArticles(filteredArticles, categorySlug);
  categoryCache[categorySlug] = { articles, timestamp: Date.now() };
}

function mapArticles(raw: GNewsArticle[], categorySlug: string): Article[] {
  const cat = CATEGORIES[categorySlug] || CATEGORIES.general;
  return raw.map((a, index) => {
    const displayTag = (categorySlug === 'general' || !CATEGORIES[categorySlug]) 
      ? categorizeArticle(a.title) 
      : cat.tag;
      
    return {
      id: makeArticleId(a.url),
      title: a.title,
      summary: a.description || '',
      content: a.content || a.description || '',
      tag: displayTag,
      date: new Date(a.publishedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      readTime: estimateReadTime(a.content || a.description || ''),
      author: a.source.name,
      role: 'Civil Services Update',
      image: a.image || undefined,
      sourceUrl: a.url,
    };
  });
}
