"use client"
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Trophy, Target, TrendingUp, AlertTriangle, CheckCircle, ChevronRight, BarChart3, Lightbulb, Clock, Loader2, Sparkles, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUserReports, createInitialReport, UserReport } from '@/lib/supabase/reports-client';

export default function Dashboard() {
  const [reports, setReports] = useState<UserReport[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      const data = await getUserReports();
      setReports(data);
      setIsLoading(false);
    };
    fetchReports();
  }, []);

  const handleCreateInitial = async () => {
    setIsCreating(true);
    const newReport = await createInitialReport();
    if (newReport) {
      setReports([newReport]);
    }
    setIsCreating(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
        <div className="relative">
          <Loader2 className="animate-spin text-blue-600" size={48} />
          <BrainCircuit className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={20} />
        </div>
        <p className="text-lg font-bold text-slate-700 italic">Synchronizing Your Intelligence Reports...</p>
      </div>
    );
  }

  const activeReport = reports && reports.length > 0 ? reports[0] : null;

  if (!activeReport) {
    return (
      <div className="py-24 text-center space-y-8 max-w-2xl mx-auto">
        <div className="h-24 w-24 rounded-3xl bg-blue-50 flex items-center justify-center mx-auto text-blue-600 shadow-inner">
          <Sparkles size={48} className="animate-pulse" />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Welcome, Aspirant.</h1>
          <p className="text-lg text-slate-600 font-medium leading-relaxed italic">
            You don't have any intelligence reports yet. Your reports are unique to your learning journey and are securely stored in your personal vault.
          </p>
        </div>
        <Button
          onClick={handleCreateInitial}
          disabled={isCreating}
          className="bg-blue-600 hover:bg-blue-700 text-white font-black px-10 py-8 rounded-2xl shadow-2xl shadow-blue-200 text-lg group transition-all hover:scale-105"
        >
          {isCreating ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            <PlusCircle className="mr-2" />
          )}
          Initialize My Strategic Learning Report
        </Button>
      </div>
    );
  }

  const totalSolved = (activeReport.objective_solved || 0) + (activeReport.subjective_solved || 0);
  const objectiveAccuracy = activeReport.objective_solved > 0
    ? Math.round((activeReport.objective_correct / activeReport.objective_solved) * 100)
    : 0;

  const stats = [
    {
      title: 'Total Solved',
      value: totalSolved.toString(),
      percentage: Math.min(100, (totalSolved / 50) * 100),
      icon: <CheckCircle size={20} className="text-blue-600" />,
      change: 'Total Questions',
      sub: 'MCQs + Discussions'
    },
    {
      title: 'MCQ Score',
      value: `${objectiveAccuracy}%`,
      percentage: objectiveAccuracy,
      icon: <Target size={20} className="text-emerald-600" />,
      change: `${activeReport.objective_correct}/${activeReport.objective_solved} Correct`,
      sub: 'Multiple Choice Tests'
    },
    {
      title: 'Discussion Score',
      value: `${activeReport.subjective_accuracy || 0}%`,
      percentage: activeReport.subjective_accuracy || 0,
      icon: <BrainCircuit size={20} className="text-violet-600" />,
      change: `${activeReport.subjective_solved || 0} Discussions`,
      sub: 'Talking with AI'
    },
  ];

  return (
    <div className="py-12 space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge className="bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] px-3">Your Progress</Badge>
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-tight">Updated: {new Date(activeReport.created_at).toLocaleDateString()}</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground font-medium text-lg italic">Track your scores and find out what to improve.</p>
        </div>
        <Button className="font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xl px-8 py-6 rounded-xl cursor-pointer">
          Sync Progress
        </Button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="hover:shadow-xl transition-all duration-300 border-slate-100 group cursor-default shadow-sm lg:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{stat.title}</CardTitle>
                  <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-tight">{stat.sub}</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-white group-hover:scale-110 transition-all duration-300">{stat.icon}</div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="flex justify-between items-end">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</span>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-black border-none px-2 py-0.5 uppercase text-[9px] tracking-widest">
                    {stat.change}
                  </Badge>
                </div>
                <Progress value={stat.percentage} className="h-2 bg-slate-100" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="max-w-4xl">
        {/* Feedback Section */}
        <Card className="shadow-xl border-blue-500/5 overflow-hidden">
          <CardHeader className="border-b border-slate-50 px-8 py-8 bg-slate-50/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <BrainCircuit size={24} />
              </div>
              <div>
                <CardTitle className="text-xl font-black tracking-tight">AI Suggestions</CardTitle>
                <CardDescription className="font-semibold text-slate-500">Based on your recent news assessments.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {activeReport.improvements.map((item, i) => (
                <div key={i} className="p-8 hover:bg-slate-50/50 transition-colors group">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{item.topic}</h3>
                    <Badge
                      variant={item.status === 'Critical' ? 'destructive' : item.status === 'Moderate' ? 'default' : 'secondary'}
                      className="px-3 py-1 font-black text-[10px] uppercase tracking-widest"
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6 max-w-2xl font-medium">
                    {item.reason}
                  </p>
                  <Button variant="outline" className="h-10 text-[11px] font-bold border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg gap-2 cursor-pointer">
                    <Lightbulb size={14} /> {item.action} <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
