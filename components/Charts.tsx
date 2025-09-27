import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, Tooltip, ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Legend, Line } from 'recharts';
import type { AnalysisResult } from '../types';
import type { TooltipProps } from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';


interface ReportChartsProps {
  scores: AnalysisResult['scores'];
  metricHistory: AnalysisResult['metricHistory'];
}

const RADAR_CHART_MAPPING = [
  { subject: 'Perf.', key: 'performance', fullMark: 100 },
  { subject: 'Access.', key: 'accessibility', fullMark: 100 },
  { subject: 'Best Prac.', key: 'bestPractices', fullMark: 100 },
  { subject: 'SEO', key: 'seo', fullMark: 100 },
];

const getScoreDescription = (score: number) => {
    if (score >= 90) return { text: 'Good', range: '90-100', color: 'text-green-400' };
    if (score >= 50) return { text: 'Needs Improvement', range: '50-89', color: 'text-orange-400' };
    return { text: 'Poor', range: '0-49', color: 'text-red-400' };
};

const CustomRadarTooltip: React.FC<TooltipProps<ValueType, NameType>> = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const scoreInfo = getScoreDescription(data.score);
        return (
            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg p-3 text-sm shadow-lg">
                <p className="font-bold text-slate-100">{data.subject}</p>
                <p className={`text-lg font-bold ${scoreInfo.color}`}>{data.score}</p>
                <p className="text-slate-400">{scoreInfo.text} ({scoreInfo.range})</p>
            </div>
        );
    }
    return null;
};

const CustomLineTooltip: React.FC<TooltipProps<ValueType, NameType>> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg p-3 text-sm shadow-lg">
                <p className="label font-bold text-slate-100">{`${label}`}</p>
                <p className="intro text-indigo-400">{`${payload[0].name}: ${payload[0].value}s`}</p>
            </div>
        );
    }
    return null;
};


export const ReportCharts: React.FC<ReportChartsProps> = ({ scores, metricHistory }) => {
  const radarChartData = RADAR_CHART_MAPPING.map(item => ({
    ...item,
    score: scores[item.key as keyof typeof scores],
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
      <div id="radar-chart-container" className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
        <h3 className="font-semibold text-center mb-4 text-slate-200">Category Scores</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarChartData}>
            <PolarGrid stroke="#475569" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
            <Radar name="Score" dataKey="score" stroke="#818cf8" fill="#6366f1" fillOpacity={0.6} />
            <Tooltip content={<CustomRadarTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div id="line-chart-container" className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
        <h3 className="font-semibold text-center mb-4 text-slate-200">{metricHistory.name} Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={metricHistory.data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 12 }} angle={-20} textAnchor="end" height={50} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} unit="s" />
            <Tooltip content={<CustomLineTooltip />} />
            <Legend wrapperStyle={{ fontSize: '14px' }} />
            <Line type="monotone" dataKey="value" name={metricHistory.name} stroke="#818cf8" strokeWidth={2} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};