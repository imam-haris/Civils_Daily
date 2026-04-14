export interface Article {
  id: number;
  title: string;
  summary: string;
  tag: string;
  date: string;
  readTime: string;
  content: string;
  author: string;
  role: string;
  image?: string;
  sourceUrl?: string;
}

/** Categorize an article into UPSC subjects based on keywords in the title */
export function categorizeArticle(title: string): string {
  const t = title.toLowerCase();

  if (/government|policy|scheme|parliament|law|court|supreme|cabinet|amendment|election|census|governance|act\b|bill\b|regulation/.test(t))
    return 'Polity';
  if (/economy|gdp|inflation|rbi|budget|tax|fiscal|trade|stock|market|banking|rupee|gst/.test(t))
    return 'Economy';
  if (/usa|china|russia|pakistan|un\b|nato|summit|diplomat|treaty|sanction|geopolit|bilateral/.test(t))
    return 'IR';
  if (/environment|climate|carbon|ecology|pollution|forest|wildlife|biodiversity|renewable/.test(t))
    return 'Environment';
  if (/science|tech|ai\b|isro|nasa|cyber|digital|robot|quantum|innovation|software|satellite/.test(t))
    return 'Science & Tech';
  if (/history|culture|art|heritage|archaeology|temple|monument/.test(t))
    return 'History & Culture';
  if (/geography|disaster|monsoon|cyclone|earthquake|flood|drought|mineral|soil/.test(t))
    return 'Geography';
  if (/education|health|social|women|poverty|hunger|justice|society|caste|tribal/.test(t))
    return 'Social Issues';

  return 'Current Affairs';
}

/** Estimate reading time from content length */
export function estimateReadTime(content: string): string {
  const words = content.split(/\s+/).length;
  const minutes = Math.max(2, Math.ceil(words / 200));
  return `${minutes} min read`;
}
