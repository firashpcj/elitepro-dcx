
import React from 'react';

export function Header() {
  return (
    <header className="bg-slate-900/60 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-10">
      <nav className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-14">
          <a href="#" className="text-lg font-bold flex items-center">
            <svg className="w-6 h-6 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            AI PageSpeed
          </a>
          <a
            href="https://github.com/google/labs-prototypes"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-slate-400 hover:text-indigo-400 transition-colors"
          >
            Source Code
          </a>
        </div>
      </nav>
    </header>
  );
}