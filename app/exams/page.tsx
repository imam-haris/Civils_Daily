'use client';
import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, Clock, ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';

interface Exam {
  title: string;
  categories: string[];
  frequency: string;
  icon: React.ReactNode;
}

export default function Exams() {
  const exams: Exam[] = [
    { title: 'UPSC Civil Services', categories: ['IAS', 'IPS', 'IFS'], frequency: 'Annual', icon: <GraduationCap color="#6366f1" /> },
    { title: 'SSC Combined Graduate Level', categories: ['Audit', 'Income Tax', 'Customs'], frequency: 'Annual', icon: <BookOpen color="#a855f7" /> },
    { title: 'IBPS PO/Clerk', categories: ['Banking', 'Finance'], frequency: 'Multiple', icon: <Clock color="#f59e0b" /> },
    { title: 'State PCS', categories: ['BPSC', 'UPPSC', 'MPPSC'], frequency: 'Varies', icon: <GraduationCap color="#22c55e" /> },
  ];

  return (
    <div style={{ padding: '4rem 0' }}>
      <header style={{ marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Explore Target Exams</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Select your goal to get personalized AI mentoring and relevant current affairs.</p>
      </header>

      <div className="glass" style={{ maxWidth: '400px', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
        <Search size={20} color="var(--text-secondary)" />
        <input 
          type="text" 
          placeholder="Search exams..." 
          style={{ background: 'transparent', border: 'none', width: '100%', color: 'white', outline: 'none' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
        {exams.map((exam, i) => (
          <motion.div 
            key={i} 
            className="glass" 
            style={{ padding: '2rem', transition: '0.3s' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5, borderColor: 'var(--accent-primary)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '10px' }}>{exam.icon}</div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{exam.frequency}</span>
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>{exam.title}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
              {exam.categories.map(cat => (
                <span key={cat} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', border: '1px solid var(--glass-border)', borderRadius: '4px', color: 'var(--text-secondary)' }}>{cat}</span>
              ))}
            </div>
            <button style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              View Details <ChevronRight size={16} />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
