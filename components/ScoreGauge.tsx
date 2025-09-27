
import React from 'react';

interface ScoreGaugeProps {
  score: number;
  title: string;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, title }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 90) return 'text-green-500';
    if (score >= 50) return 'text-orange-400';
    return 'text-red-500';
  };
  
  const getStrokeColor = () => {
    if (score >= 90) return 'stroke-green-500';
    if (score >= 50) return 'stroke-orange-400';
    return 'stroke-red-500';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full" viewBox="0 0 120 120">
          <circle
            className="stroke-slate-700"
            cx="60"
            cy="60"
            r={radius}
            strokeWidth="10"
            fill="transparent"
          />
          <circle
            className={`transform -rotate-90 origin-center transition-all duration-1000 ease-out ${getStrokeColor()}`}
            cx="60"
            cy="60"
            r={radius}
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-3xl font-bold ${getColor()}`}>
          {score}
        </span>
      </div>
      <p className="font-semibold text-sm text-slate-300">{title}</p>
    </div>
  );
};
