import React, { useState } from 'react';
import { ChevronDownIcon } from './Icons';

interface RecommendationCardProps {
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
}

const priorityClasses = {
    High: 'bg-red-500/20 text-red-400',
    Medium: 'bg-orange-400/20 text-orange-300',
    Low: 'bg-sky-500/20 text-sky-400',
};


export const RecommendationCard: React.FC<RecommendationCardProps> = ({ title, description, priority }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // A more robust way to handle code blocks from simple markdown.
  const formattedDescription = description.replace(/```(?:\w*\n)?([\s\S]+?)```/g, '<pre><code>$1</code></pre>');

  return (
    <div className="border border-slate-700 rounded-lg bg-slate-800/30">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left"
      >
        <div className="flex items-center gap-3">
             <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${priorityClasses[priority]}`}>
                {priority}
            </span>
            <h4 className="font-medium text-slate-200">{title}</h4>
        </div>
        <ChevronDownIcon className={`w-5 h-5 text-slate-400 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 animate-fade-in-down prose prose-sm prose-invert max-w-none prose-pre:bg-slate-900/70 prose-pre:rounded-md">
           <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formattedDescription }}></div>
        </div>
      )}
    </div>
  );
};