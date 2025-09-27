import React, { useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { UrlInputForm } from './components/UrlInputForm';
import { Header } from './components/Header';
import { ScoreGauge } from './components/ScoreGauge';
import { MetricsGrid } from './components/MetricsGrid';
import { RecommendationCard } from './components/RecommendationCard';
import { Loader } from './components/Loader';
import { analyzeUrl } from './services/geminiService';
import type { AnalysisResult, Device, ReportType, AllAnalysisResults, IconProps } from './types';
import { LighthouseIcon, DownloadIcon, CheckCircleIcon, DocumentTextIcon } from './components/Icons';
import { ReportCharts } from './components/Charts';
import { generateSingleReportPdf, generateFullReportPdf } from './utils/pdfGenerator';
import { PdfPreviewModal } from './components/PdfPreviewModal';

const reportTypes: { id: ReportType, name: string, icon: React.FC<IconProps> }[] = [
    { id: 'pagespeed', name: 'PageSpeed', icon: LighthouseIcon },
    { id: 'healthcare-seo', name: 'Healthcare SEO', icon: CheckCircleIcon },
    { id: 'cwv-fixes', name: 'CWV Fixes', icon: CheckCircleIcon },
    { id: 'local-seo', name: 'Local SEO', icon: CheckCircleIcon },
];

const initialAnalysisState = {
    pagespeed: null,
    'healthcare-seo': null,
    'cwv-fixes': null,
    'local-seo': null,
};

export default function App() {
  const [url, setUrl] = useState<string>('');
  const [analysis, setAnalysis] = useState<{ mobile: AllAnalysisResults; desktop: AllAnalysisResults }>({ mobile: initialAnalysisState, desktop: initialAnalysisState });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDevice, setActiveDevice] = useState<Device>('mobile');
  const [activeReportType, setActiveReportType] = useState<ReportType>('pagespeed');
  const [previewData, setPreviewData] = useState<{url: string; fileName: string} | null>(null);


  const handleAnalyze = useCallback(async (newUrl: string) => {
    if (!newUrl) {
      setError('Please enter a valid URL.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysis({ mobile: initialAnalysisState, desktop: initialAnalysisState });
    setUrl(newUrl);

    try {
        const allReportPromises = reportTypes.flatMap(rt => [
            analyzeUrl(newUrl, 'mobile', rt.id),
            analyzeUrl(newUrl, 'desktop', rt.id)
        ]);

        const results = await Promise.allSettled(allReportPromises);

        const newMobileResults: Partial<AllAnalysisResults> = {};
        const newDesktopResults: Partial<AllAnalysisResults> = {};
        let failures = 0;

        results.forEach((result, index) => {
            const reportIndex = Math.floor(index / 2);
            const device = index % 2 === 0 ? 'mobile' : 'desktop';
            const reportType = reportTypes[reportIndex].id;

            if (result.status === 'fulfilled') {
                if (device === 'mobile') {
                    newMobileResults[reportType] = result.value;
                } else {
                    newDesktopResults[reportType] = result.value;
                }
            } else {
                failures++;
                console.error(`Failed to generate report for ${reportType} on ${device}:`, result.reason);
            }
        });

        setAnalysis({
            mobile: { ...initialAnalysisState, ...newMobileResults },
            desktop: { ...initialAnalysisState, ...newDesktopResults },
        });

        if (failures > 0) {
            setError(`Could not generate all reports. ${failures} section(s) failed. Please try again.`);
        }

    } catch (err) {
      console.error(err);
      setError('A critical error occurred while analyzing the URL. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Helper function to capture chart images
  const captureChartImages = async (): Promise<{ radar: string; line: string; }> => {
    const radarChartEl = document.getElementById('radar-chart-container');
    const lineChartEl = document.getElementById('line-chart-container');

    if (!radarChartEl || !lineChartEl) {
        throw new Error("Could not find chart elements to capture.");
    }

    const [radarCanvas, lineCanvas] = await Promise.all([
        html2canvas(radarChartEl, { backgroundColor: '#1e293b', scale: 4, useCORS: true }),
        html2canvas(lineChartEl, { backgroundColor: '#1e293b', scale: 4, useCORS: true })
    ]);

    return {
        radar: radarCanvas.toDataURL('image/png', 1.0),
        line: lineCanvas.toDataURL('image/png', 1.0)
    };
  };

   const handleDownload = async (fullReport: boolean) => {
    const reportSet = analysis[activeDevice];
    const singleAnalysis = reportSet[activeReportType];

    // Guard clause to ensure there's data to generate a report from.
    const canGenerateFull = fullReport && Object.values(reportSet).some(r => r !== null);
    const canGenerateSingle = !fullReport && singleAnalysis !== null;

    if (!canGenerateFull && !canGenerateSingle) {
        const errorMsg = fullReport ? "No reports available to generate a full report." : "No data available to download this section.";
        setError(errorMsg);
        return;
    }
    
    setIsGeneratingPdf(true);
    setError(null);

    try {
        // Step 1: Capture chart images from the DOM.
        const chartImages = await captureChartImages();
        
        // Step 2: Generate the PDF data URL based on the report type.
        let dataUrl: string;
        let fileName = `report-${url.replace(/[^a-zA-Z0-9]/g, '_')}-${activeDevice}`;

        if (fullReport) {
            fileName += '-full.pdf';
            const reportsToProcess = reportTypes
              .map(rt => ({ ...rt, data: reportSet[rt.id]}))
              .filter(item => item.data !== null) as { id: ReportType, name: string, data: AnalysisResult }[];

            dataUrl = await generateFullReportPdf(reportsToProcess, url, activeDevice, chartImages);
        } else if (singleAnalysis) {
            fileName += `-${activeReportType}.pdf`;
            dataUrl = await generateSingleReportPdf(singleAnalysis, url, activeDevice, activeReportType, chartImages);
        } else {
            // This case is unlikely to be hit because of the guard clause above.
            throw new Error("No data available for PDF generation.");
        }
        
        // Step 3: Set state with the generated PDF data to trigger the preview modal.
        // This does not trigger a download directly; it opens the PdfPreviewModal.
        setPreviewData({ url: dataUrl, fileName: fileName });

    } catch (err) {
        console.error("Failed to generate PDF:", err);
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(`Failed to generate PDF: ${errorMessage}`);
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  const currentAnalysis = analysis[activeDevice][activeReportType];
  const hasResults = Object.values(analysis.mobile).some(r => r) || Object.values(analysis.desktop).some(r => r);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 50) return 'text-orange-400';
    return 'text-red-500';
  };
  
  const buttonText = (isGenerating: boolean, baseText: string) => {
      return isGenerating ? 'Generating...' : baseText;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <Header />
      <main className="max-w-5xl mx-auto p-4 md:p-6">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-slate-100 mb-2">
          AI Web Performance & SEO Suite
        </h1>
        <p className="text-center text-slate-400 mb-8">
          Get a comprehensive analysis of your website, from PageSpeed to specialized SEO.
        </p>
        
        <div className="max-w-xl mx-auto">
            <UrlInputForm onAnalyze={handleAnalyze} isLoading={isLoading} />
        </div>

        {isLoading && <Loader />}
        {error && <div className="mt-8 text-center text-red-400 bg-red-900/20 p-4 rounded-lg">{error}</div>}
        
        {hasResults && !isLoading && (
          <div id="report-container" className="mt-10 animate-fade-in">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 className="text-xl md:text-2xl font-bold truncate pr-4">{url}</h2>
                 <div className="flex items-center space-x-2">
                    <div className="flex items-center bg-slate-800 rounded-full p-1">
                        <button 
                            onClick={() => setActiveDevice('mobile')}
                            className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${activeDevice === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                        >
                            Mobile
                        </button>
                        <button 
                            onClick={() => setActiveDevice('desktop')}
                            className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${activeDevice === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                        >
                            Desktop
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center border-b border-slate-700">
                    {reportTypes.map(rt => (
                        <button 
                            key={rt.id} 
                            onClick={() => setActiveReportType(rt.id)}
                            disabled={!analysis[activeDevice][rt.id]}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeReportType === rt.id ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'} disabled:text-slate-600 disabled:cursor-not-allowed`}
                        >
                            {rt.name}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                     <button 
                        onClick={() => handleDownload(false)}
                        disabled={isGeneratingPdf || !currentAnalysis} 
                        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-slate-700 hover:bg-slate-600 transition-colors text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGeneratingPdf ? 'Generating...' : <><DownloadIcon className="w-4 h-4" /> Download Section</>}
                    </button>
                    <button 
                        onClick={() => handleDownload(true)}
                        disabled={isGeneratingPdf} 
                        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors text-white disabled:bg-indigo-800 disabled:cursor-not-allowed"
                    >
                        {isGeneratingPdf ? 'Generating...' : <><DocumentTextIcon className="w-4 h-4" /> Full Report</>}
                    </button>
                </div>
             </div>

            {currentAnalysis ? (
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-center mb-8">
                    <ScoreGauge score={currentAnalysis.scores.performance} title="Performance" />
                    <ScoreGauge score={currentAnalysis.scores.accessibility} title="Accessibility" />
                    <ScoreGauge score={currentAnalysis.scores.bestPractices} title="Best Practices" />
                    <ScoreGauge score={currentAnalysis.scores.seo} title="SEO" />
                </div>

                <ReportCharts scores={currentAnalysis.scores} metricHistory={currentAnalysis.metricHistory} />
                
                <div className="mb-8">
                    <h3 className={`text-lg font-semibold flex items-center mb-4 ${getScoreColor(currentAnalysis.scores.performance)}`}>
                    <LighthouseIcon className="w-5 h-5 mr-2" />
                    Core Web Vitals Assessment: <span className="ml-2 font-bold">{currentAnalysis.coreWebVitalsStatus}</span>
                    </h3>
                    <MetricsGrid metrics={currentAnalysis.metrics} />
                </div>

                <div>
                    <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Opportunities / Recommendations</h3>
                    <div className="space-y-2">
                        {currentAnalysis.opportunities.map((item, index) => <RecommendationCard key={index} title={item.title} description={item.description} priority={item.priority} />)}
                    </div>
                    </div>
                    <div>
                    <h3 className="text-lg font-semibold mb-3">Diagnostics</h3>
                    <div className="space-y-2">
                        {currentAnalysis.diagnostics.map((item, index) => <RecommendationCard key={index} title={item.title} description={item.description} priority={item.priority} />)}
                    </div>
                    </div>
                </div>
                </div>
            ) : (
                <div className="text-center py-16 bg-slate-800/50 rounded-xl border border-slate-700/50">
                    <p className="text-slate-400">Data for this report section could not be loaded.</p>
                </div>
            )}
          </div>
        )}

      </main>
      <footer className="text-center p-6 text-slate-500 text-sm">
        <p>Powered by Google Gemini. Generated data is illustrative.</p>
      </footer>
      {previewData && (
        <PdfPreviewModal
            src={previewData.url}
            fileName={previewData.fileName}
            onClose={() => setPreviewData(null)}
        />
      )}
    </div>
  );
}