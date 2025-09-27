import React, { useState, useEffect } from 'react';
import { DownloadIcon, CloseIcon } from './Icons';

interface PdfPreviewModalProps {
  src: string;
  fileName: string;
  onClose: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ src, fileName, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Trigger the animation on mount
    setShow(true);
    
    // Prevent background scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleClose = () => {
    setShow(false); // Trigger closing animation
    setTimeout(() => {
      onClose(); // Call parent onClose after animation
    }, 300); // Match transition duration
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={`fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out ${show ? 'opacity-100' : 'opacity-0'}`}
      aria-modal="true"
      role="dialog"
    >
      <div className={`bg-slate-800 rounded-lg shadow-2xl w-full h-full max-w-6xl flex flex-col transition-all duration-300 ease-in-out ${show ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-slate-100">Report Preview</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors text-white"
            >
              <DownloadIcon className="w-4 h-4" />
              Download PDF
            </button>
            <button
              onClick={handleClose}
              className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-slate-100 transition-colors"
              aria-label="Close preview"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
        </header>
        <div className="flex-grow p-2 sm:p-4 bg-slate-900 overflow-hidden">
          <iframe
            src={src}
            title="PDF Preview"
            className="w-full h-full border-none rounded bg-white"
          />
        </div>
      </div>
    </div>
  );
};
