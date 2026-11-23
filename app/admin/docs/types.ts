export type DocNoteTone = 'tip' | 'warning' | 'info';

export interface DocNote {
  tone: DocNoteTone;
  text: string;
}

export interface DocScreenshot {
  src: string;
  alt: string;
  caption: string;
  focus?: string;
}

export interface DocStep {
  id: string;
  title: string;
  description: string;
  actions: string[];
  note?: DocNote;
  screenshot?: DocScreenshot;
}

export interface DocSection {
  id: string;
  index: string;
  title: string;
  summary: string;
  icon: string;
  link?: { href: string; label: string };
  steps: DocStep[];
}
