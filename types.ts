import type { ReactNode } from "react";
export type MetricCategory = 'good' | 'needs-improvement' | 'poor';

export type Device = 'mobile' | 'desktop';

export type ReportType = 'pagespeed' | 'healthcare-seo' | 'cwv-fixes' | 'local-seo';

export interface Metric {
  id: string;
  name: string;
  displayValue: string;
  score: number;
  category: MetricCategory;
}

export interface Recommendation {
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface MetricHistoryPoint {
  time: string;
  value: number; 
}

export interface AnalysisResult {
  scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  metrics: Metric[];
  opportunities: Recommendation[];
  diagnostics: Recommendation[];
  coreWebVitalsStatus: string;
  metricHistory: {
    name: string;
    data: MetricHistoryPoint[];
  };
}

export type AllAnalysisResults = {
  [key in ReportType]: AnalysisResult | null;
};

export type IconProps = {
  className?: string;
  children?: ReactNode;
};
