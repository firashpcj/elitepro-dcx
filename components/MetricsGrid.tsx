
import React from 'react';
import type { Metric } from '../types';
import { ColorDotIcon } from './Icons';

interface MetricsGridProps {
  metrics: Metric[];
}

const categoryClasses: Record<string, string> = {
    good: 'text-green-500',
    'needs-improvement': 'text-orange-400',
    poor: 'text-red-500',
};

export const MetricsGrid: React.FC<MetricsGridProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
      {metrics.map((metric) => (
        <div key={metric.id} className="flex items-center justify-between">
          <div className="flex items-center">
            <ColorDotIcon className={categoryClasses[metric.category]} />
            <span className="ml-2 text-slate-300">{metric.name}</span>
          </div>
          <span className="font-semibold text-slate-100">{metric.displayValue}</span>
        </div>
      ))}
    </div>
  );
};
