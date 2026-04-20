'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, ArrowRight, ArrowLeft, RefreshCw, 
  HelpCircle, CheckCircle2, XCircle, Loader2, Sparkles,
  BookOpen, Timer, ListChecks, ShieldCheck, Lock
} from 'lucide-react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { createClient } from '@/lib/supabase/client';

interface Question {
  id: number;
  type: 'mcq' | 'tf' | 'match';
  question: string;
  options?: string[];
  answer: string | any;
  explanation: string;
}

export default function DailyQuiz() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [results, setResults] = useState<{ id: number; correct: boolean; selected: string }[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);
    };
    checkAuth();
  }, []);

  // Only fetch quiz if user is authenticated
  useEffect(() => {
    if (!authLoading && user) {
      fetchQuiz();
    }
  }, [authLoading, user]);

  const fetchQuiz = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/quiz');
      if (!res.ok) throw new Error('Failed to fetch today\'s quiz');
      const data = await res.json();

      // Normalize every question so rendering never breaks
      const normalized = (data.questions || []).map((q: any) => {
        const typeLower = (q.type || '').toLowerCase().replace(/[^a-z]/g, '');
        const isTF = typeLower === 'tf' || typeLower === 'truefalse';
        const hasOptions = Array.isArray(q.options) && q.options.length >= 2;

        if (isTF || (!hasOptions && !isTF)) {
          // True/False question, or any question missing options — treat as TF
          const ansStr = String(q.answer).toLowerCase();
          return {
            ...q,
            type: 'tf' as const,
            options: undefined,
            answer: ansStr.includes('true') ? 'True' : 'False',
          };
        }

        // MCQ with valid options
        return { ...q, type: 'mcq' as const };
      });

      setQuestions(normalized);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (currentQuestion?.options) {
      setShuffledOptions([...currentQuestion.options]);
    } else {
      setShuffledOptions([]);
    }
    setSelectedAnswer(null);
  }, [currentIndex, questions]);

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer) return; // Prevent multiple clicks
    setSelectedAnswer(answer);
  };

  const handleNext = () => {
    const isCorrect = selectedAnswer === currentQuestion.answer;
    setResults(prev => [...prev, { id: currentQuestion.id, correct: isCorrect, selected: selectedAnswer! }]);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const score = results.filter(r => r.correct).length;

  // Auth loading state
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8">
        <div className="relative">
          <Loader2 className="animate-spin text-blue-600" size={64} />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Checking access</h2>
          <p className="text-muted-foreground font-medium">Verifying your credentials...</p>
        </div>
      </div>
    );
  }

  // Login required gate
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] py-12 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-none shadow-2xl bg-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />

            <CardHeader className="space-y-6 text-center pt-12 pb-4">
              <div className="mx-auto relative">
                <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center shadow-inner">
                  <Lock size={36} className="text-blue-600" />
                </div>
                <div className="absolute -top-1 -right-1 h-7 w-7 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                  <ShieldCheck size={14} className="text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Login Required</CardTitle>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-[300px] mx-auto">
                  You need to be signed in to attempt the Daily Quiz. Authenticate to track your progress and compete.
                </p>
              </div>
            </CardHeader>

            <CardContent className="px-10 pb-10 space-y-4">
              <div className="grid grid-cols-3 gap-3 py-4">
                {[
                  { icon: BookOpen, label: 'Learn', desc: 'Daily MCQs' },
                  { icon: Timer, label: 'Track', desc: 'Your Speed' },
                  { icon: Trophy, label: 'Compete', desc: 'Get Ranked' },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <item.icon size={20} className="text-blue-600" />
                    <span className="text-[10px] font-black uppercase tracking-tight text-slate-700">{item.label}</span>
                    <span className="text-[9px] font-semibold text-muted-foreground">{item.desc}</span>
                  </div>
                ))}
              </div>

              <Link href="/login" className="block">
                <Button className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl text-base shadow-xl shadow-slate-200 group transition-all hover:scale-[1.02] active:scale-95 cursor-pointer">
                  Sign In to Start Quiz
                  <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>

            <CardFooter className="bg-slate-50 border-t py-5 flex justify-center">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Civils Daily &bull; Secure Access
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8">
        <div className="relative">
          <Loader2 className="animate-spin text-blue-600" size={64} />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Getting quiz ready</h2>
          <p className="text-muted-foreground font-medium">Picking today's news to make questions...</p>
        </div>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="h-20 w-20 rounded-3xl bg-red-50 flex items-center justify-center text-red-500">
          <HelpCircle size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Quiz Empty</h2>
          <p className="text-muted-foreground max-w-md mx-auto">{error || 'Could not load today\'s quiz.'}</p>
        </div>
        <Button onClick={fetchQuiz} variant="outline" className="font-bold rounded-xl gap-2">
          <RefreshCw size={18} /> Reload
        </Button>
      </div>
    );
  }

  if (isFinished) {
    const accuracy = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-10">
        <header className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block p-4 bg-yellow-100 rounded-3xl text-yellow-600 mb-2"
          >
            <Trophy size={48} />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Done!</h1>
          <p className="text-lg text-muted-foreground font-medium">Your results for {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border-slate-100 shadow-xl overflow-hidden">
            <CardHeader className="pb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Score</p>
              <CardTitle className="text-4xl font-black text-slate-900">{score}/{questions.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={accuracy} className="h-2 bg-slate-100" />
            </CardContent>
          </Card>

          
          <Card className="bg-white border-slate-100 shadow-xl">
            <CardHeader className="pb-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Accuracy</p>
              <CardTitle className="text-4xl font-black text-emerald-600">{accuracy}%</CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-xs font-bold text-slate-500 italic pb-2">"Great effort today."</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-100 shadow-xl">
            <CardHeader className="pb-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rank</p>
              <CardTitle className="text-4xl font-black text-blue-600">
                {accuracy >= 80 ? 'Master' : accuracy >= 60 ? 'Practitioner' : 'Beginner'}
              </CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-xs font-bold text-slate-500 italic pb-2">"Consistency is key."</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <ListChecks className="text-blue-600" /> Review Answers
          </h3>
          <div className="space-y-4">
            {questions.map((q, i) => {
              const res = results[i];
              return (
                <Card key={q.id} className={`border-l-4 ${res.correct ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                      <p className="font-bold text-slate-800 leading-relaxed text-sm">{i+1}. {q.question}</p>
                      {res.correct ? <CheckCircle2 className="text-emerald-500 shrink-0" /> : <XCircle className="text-red-500 shrink-0" />}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                       <p className="text-[10px] font-bold uppercase text-blue-600 tracking-wider">Explanation</p>
                       <p className="text-sm text-slate-600 font-medium leading-relaxed">{q.explanation}</p>
                    </div>
                    <div className="flex gap-4 text-xs font-bold">
                       <p className="text-slate-500">Your Answer: <span className={res.correct ? 'text-emerald-600' : 'text-red-500'}>{res.selected}</span></p>
                       <p className="text-slate-500">Correct Answer: <span className="text-emerald-600">{q.answer}</span></p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="text-center pt-8">
           <Button onClick={() => window.location.href = '/dashboard'} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-10 py-7 rounded-2xl text-lg shadow-xl shadow-slate-200 transition-all hover:scale-105">
             Back to Dashboard
           </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 space-y-8">
      {/* Quiz Progress */}
      <header className="space-y-4">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <Badge className="bg-blue-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1 mb-2">Daily Quiz</Badge>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Practice Test</h1>
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Question {currentIndex + 1} <span className="text-slate-300">/ {questions.length}</span></p>
        </div>
        <Progress value={((currentIndex) / questions.length) * 100} className="h-2 bg-slate-100" />
      </header>

      {/* Hero Icons */}
      <div className="flex gap-4 py-2">
         {[
           { icon: BookOpen, label: 'Learn' },
           { icon: Timer, label: 'Speed' },
           { icon: ListChecks, label: 'Practice' }
         ].map((item, i) => (
           <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-100 shadow-sm">
             <item.icon size={14} className="text-blue-600" />
             <span className="text-[10px] font-black uppercase tracking-tight text-slate-600">{item.label}</span>
           </div>
         ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
           key={currentIndex}
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -20 }}
           transition={{ duration: 0.3 }}
        >
          <Card className="shadow-2xl border-indigo-500/5 bg-white rounded-3xl overflow-hidden">
            <CardHeader className="px-8 pt-10 pb-6 border-b border-slate-50">
              <div className="flex items-center gap-2 mb-4">
                 <Badge variant="outline" className="border-blue-200 text-blue-600 text-[9px] font-black uppercase">{currentQuestion.type}</Badge>
              </div>
              <CardTitle className="text-xl md:text-2xl font-black leading-tight text-slate-900">
                {currentQuestion.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              {currentQuestion.type === 'mcq' && shuffledOptions.length > 0 ? (
                 <div className="grid grid-cols-1 gap-4">
                    {shuffledOptions.map((option, i) => {
                      const isSelected = selectedAnswer === option;
                      const isCorrect = selectedAnswer && option === currentQuestion.answer;
                      const isWrong = selectedAnswer && isSelected && option !== currentQuestion.answer;

                      return (
                        <button
                          key={i}
                          onClick={() => handleAnswerSelect(option)}
                          disabled={!!selectedAnswer}
                          className={`
                            text-left px-6 py-5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 group cursor-pointer
                            ${!selectedAnswer ? 'border-slate-100 hover:border-blue-500 hover:bg-blue-50/50' : ''}
                            ${isSelected ? 'scale-[0.98]' : ''}
                            ${isCorrect ? 'bg-emerald-50 border-emerald-500' : ''}
                            ${isWrong ? 'bg-red-50 border-red-500' : ''}
                            ${!isSelected && selectedAnswer ? 'opacity-50' : ''}
                          `}
                        >
                          <span className={`
                            h-10 w-10 flex-shrink-0 rounded-xl flex items-center justify-center font-black text-sm
                            ${!selectedAnswer ? 'bg-slate-50 text-slate-500 group-hover:bg-blue-600 group-hover:text-white' : ''}
                            ${isCorrect ? 'bg-emerald-500 text-white' : ''}
                            ${isWrong ? 'bg-red-500 text-white' : ''}
                          `}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className={`font-bold text-slate-700 ${isCorrect ? 'text-emerald-700' : isWrong ? 'text-red-700' : ''}`}>
                            {option}
                          </span>
                        </button>
                      );
                    })}
                 </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {(['True', 'False']).map((option) => {
                      const isSelected = selectedAnswer === option;
                      const isCorrect = selectedAnswer && option === currentQuestion.answer;
                      const isWrong = selectedAnswer && isSelected && option !== currentQuestion.answer;
                      return (
                        <button
                          key={option}
                          onClick={() => handleAnswerSelect(option)}
                          disabled={!!selectedAnswer}
                          className={`
                            py-8 rounded-2xl border-2 transition-all font-black text-lg flex flex-col items-center justify-center gap-2 cursor-pointer
                            ${!selectedAnswer ? 'border-slate-100 hover:border-blue-500 hover:bg-blue-50/50 text-slate-600' : ''}
                            ${isCorrect ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : ''}
                            ${isWrong ? 'bg-red-50 border-red-500 text-red-700' : ''}
                            ${!isSelected && selectedAnswer ? 'opacity-50' : ''}
                          `}
                        >
                          {option === 'True' ? <CheckCircle2 size={32} /> : option === 'False' ? <XCircle size={32} /> : <HelpCircle size={32} />}
                          {option}
                        </button>
                      );
                   })}
                </div>
              )}
            </CardContent>
            
            <CardFooter className="px-8 py-8 bg-slate-50/50 flex flex-col items-center gap-6">
               {selectedAnswer && (
                 <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full space-y-4"
                 >
                    <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                       <div className="flex items-center gap-2 mb-2">
                          <HelpCircle size={16} className="text-blue-600" />
                          <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Note</span>
                       </div>
                       <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                         {currentQuestion.explanation}
                       </p>
                    </div>
                    <Button 
                      onClick={handleNext} 
                      className="w-full h-16 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-lg shadow-xl"
                    >
                      {currentIndex === questions.length - 1 ? 'Finish' : 'Next Question'}
                      <ArrowRight className="ml-2" size={20} />
                    </Button>
                 </motion.div>
               )}
               {!selectedAnswer && (
                 <p className="text-sm font-bold text-slate-400">"Pick an answer to continue."</p>
               )}
            </CardFooter>

          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
