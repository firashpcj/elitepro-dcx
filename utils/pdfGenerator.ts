import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AnalysisResult, Device, ReportType, Recommendation } from '../types';

// --- PDF Generation Constants ---
const PAGE_CONFIG = {
    WIDTH: 297, // A4 landscape width in mm
    HEIGHT: 210, // A4 landscape height in mm
    MARGIN: 15,
    get CONTENT_WIDTH() { return this.WIDTH - (this.MARGIN * 2); }
};

const COLORS = {
    BACKGROUND: '#0f172a',
    TEXT_PRIMARY: '#e2e8f0',
    TEXT_SECONDARY: '#94a3b8',
    BORDER: '#334155',
    BRAND: '#818cf8',
    GOOD: '#22c55e',
    IMPROVEMENT: '#f97316',
    POOR: '#ef4444',
    CODE_BG: '#1e293b' // slate-800
};

const reportTypeNames: Record<ReportType, string> = {
    'pagespeed': 'PageSpeed Insights Analysis',
    'healthcare-seo': 'Healthcare SEO Optimization',
    'cwv-fixes': 'Detailed Core Web Vitals Fixes',
    'local-seo': 'Local SEO for Badr Health Clinics'
};

/**
 * A builder class to programmatically create a professional PDF report.
 */
class PdfBuilder {
    private doc: jsPDF;
    private cursorY: number;
    private url: string;
    private device: Device;

    constructor(url: string, device: Device) {
        this.doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        this.url = url;
        this.device = device;
        this.cursorY = PAGE_CONFIG.MARGIN;
    }
    
    /**
     * Adds a new blank page with the default background and resets the cursor.
     */
    public addPage() {
        this.doc.addPage();
        this.doc.setFillColor(COLORS.BACKGROUND);
        this.doc.rect(0, 0, PAGE_CONFIG.WIDTH, PAGE_CONFIG.HEIGHT, 'F');
        this.cursorY = PAGE_CONFIG.MARGIN;
        return this; // Enable chaining
    }

    /**
     * Draws the cover page for the report.
     */
    public drawCoverPage(isFullReport: boolean, reportType?: ReportType) {
        this.doc.setFillColor(COLORS.BACKGROUND);
        this.doc.rect(0, 0, PAGE_CONFIG.WIDTH, PAGE_CONFIG.HEIGHT, 'F');
        
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(32);
        this.doc.setTextColor(COLORS.TEXT_PRIMARY);
        const title = isFullReport ? "Comprehensive Web Analysis Report" : "Web Analysis Section Report";
        this.doc.text(title, PAGE_CONFIG.WIDTH / 2, PAGE_CONFIG.HEIGHT / 2 - 20, { align: 'center' });
        
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(16);
        this.doc.setTextColor(COLORS.BRAND);
        this.doc.text(this.url, PAGE_CONFIG.WIDTH / 2, PAGE_CONFIG.HEIGHT / 2, { align: 'center' });
        
        this.doc.setFontSize(12);
        this.doc.setTextColor(COLORS.TEXT_SECONDARY);
        const reportTypeName = isFullReport ? "Full Suite Analysis" : reportTypeNames[reportType!];
        this.doc.text(`Report Type: ${reportTypeName}`, PAGE_CONFIG.WIDTH / 2, PAGE_CONFIG.HEIGHT / 2 + 15, { align: 'center' });

        const deviceName = this.device.charAt(0).toUpperCase() + this.device.slice(1);
        this.doc.text(`Device Analyzed: ${deviceName}`, PAGE_CONFIG.WIDTH / 2, PAGE_CONFIG.HEIGHT / 2 + 22, { align: 'center' });
        
        this.doc.text(`Generated on: ${new Date().toLocaleDateString()}`, PAGE_CONFIG.WIDTH / 2, PAGE_CONFIG.HEIGHT / 2 + 29, { align: 'center' });
        
        return this;
    }

    /**
     * Draws a single analysis report section, including scores, charts, and recommendations.
     */
    public drawReportSection(analysis: AnalysisResult, chartImages?: { radar: string; line: string; }) {
        if (chartImages) {
            this.drawScoresAndCharts(analysis, chartImages);
        }

        this.drawSectionHeader("Opportunities & Recommendations");
        analysis.opportunities.forEach(item => this.drawRecommendation(item));
        
        this.drawSectionHeader("Diagnostics");
        analysis.diagnostics.forEach(item => this.drawRecommendation(item));

        return this;
    }

    /**
     * Draws the instructions page.
     */
    public drawInstructionsPage() {
        this.addPage();
        this.drawSectionHeader("How to Use This Report", true);
        const instructions = [
            ["Understanding Scores:", "Scores range from 0-100. Aim for scores in the green (90-100) for the best user experience and SEO performance."],
            ["Actionable Insights:", "The 'Opportunities' section provides specific recommendations to improve your site. 'Diagnostics' offers further insights into your app's performance."],
            ["Prioritizing Tasks:", "Each recommendation is assigned a 'High', 'Medium', or 'Low' priority. Address 'High' priority items first for the most significant impact."],
            ["Task Status Tracker:", "At the end of the full report, you'll find a checklist of all recommendations. Use this to track your progress as you implement fixes."],
            ["Mobile vs. Desktop:", "Always analyze both reports. User experience can differ significantly between devices, and search engines rank them separately."]
        ];

        this.doc.setFont('helvetica', 'normal');
        instructions.forEach(([title, text]) => {
            this.checkPageBreak(20);
            this.doc.setFontSize(12).setTextColor(COLORS.TEXT_PRIMARY).setFont('helvetica', 'bold');
            this.doc.text(title, PAGE_CONFIG.MARGIN, this.cursorY);
            this.cursorY += 7;
            
            this.doc.setFontSize(10).setTextColor(COLORS.TEXT_SECONDARY).setFont('helvetica', 'normal');
            const textLines = this.doc.splitTextToSize(text, PAGE_CONFIG.CONTENT_WIDTH);
            this.doc.text(textLines, PAGE_CONFIG.MARGIN, this.cursorY);
            this.cursorY += textLines.length * 5 + 8;
        });

        return this;
    }

    /**
     * Draws the aggregated task tracker checklist page.
     */
    public drawTaskTrackerPage(reports: { data: AnalysisResult, name: string }[]) {
        this.addPage();
        this.drawSectionHeader("Task Status Tracker", true);
        this.doc.setFontSize(10).setTextColor(COLORS.TEXT_SECONDARY);
        this.doc.text("Use this checklist to track your progress on all recommendations from this report.", PAGE_CONFIG.MARGIN, this.cursorY);
        this.cursorY += 10;
        
        const allRecommendations = reports.flatMap(r => 
            [...r.data.opportunities, ...r.data.diagnostics].map(item => ({...item, category: r.name}))
        );

        const head = [['Status', 'Priority', 'Recommendation', 'Category']];
        const body = allRecommendations.map(rec => ['', rec.priority, rec.title, rec.category]);

        autoTable(this.doc, {
            startY: this.cursorY,
            head: head,
            body: body,
            theme: 'grid',
            headStyles: { fillColor: COLORS.CODE_BG, textColor: COLORS.TEXT_PRIMARY },
            styles: { fillColor: COLORS.BACKGROUND, textColor: COLORS.TEXT_SECONDARY, lineColor: COLORS.BORDER, lineWidth: 0.1 },
            columnStyles: {
                0: { cellWidth: 15, halign: 'center' }, // Status checkbox
                1: { cellWidth: 20 }, // Priority
                3: { cellWidth: 40 }  // Category
            },
            didDrawCell: (data) => {
                if (data.column.index === 0 && data.cell.section === 'body') {
                    this.doc.setDrawColor(COLORS.TEXT_SECONDARY);
                    this.doc.rect(data.cell.x + 5.5, data.cell.y + 2, 4, 4); // Draw a checkbox
                }
            }
        });

        return this;
    }

    /**
     * Draws the final page of the report.
     */
    public drawEndPage() {
        this.addPage();
        this.doc.setFont('helvetica', 'bold').setFontSize(24).setTextColor(COLORS.TEXT_PRIMARY);
        this.doc.text('End of Report', PAGE_CONFIG.WIDTH / 2, PAGE_CONFIG.HEIGHT / 2, { align: 'center' });
        return this;
    }
    
    /**
     * Finalizes the document by adding headers and footers to every page.
     */
    public build() {
        const pageCount = this.doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            this.doc.setPage(i);
            
            // Header
            this.doc.setFontSize(9);
            this.doc.setTextColor(COLORS.TEXT_SECONDARY);
            const headerText = `AI Analysis Report | ${this.url} (${this.device})`;
            this.doc.text(headerText, PAGE_CONFIG.MARGIN, PAGE_CONFIG.MARGIN - 5);
            this.doc.setDrawColor(COLORS.BORDER);
            this.doc.line(PAGE_CONFIG.MARGIN, PAGE_CONFIG.MARGIN - 2, PAGE_CONFIG.WIDTH - PAGE_CONFIG.MARGIN, PAGE_CONFIG.MARGIN - 2);

            // Footer
            const footerText = `Page ${i} of ${pageCount} | Powered by Google Gemini`;
            this.doc.text(footerText, PAGE_CONFIG.MARGIN, PAGE_CONFIG.HEIGHT - 8);
        }
        return this;
    }

    /**
     * Returns the generated PDF as a data URI string.
     */
    public getOutput(): string {
        return this.doc.output('datauristring');
    }

    // --- Private Helper Methods ---
    private checkPageBreak(requiredHeight: number) {
        if (this.cursorY + requiredHeight > PAGE_CONFIG.HEIGHT - PAGE_CONFIG.MARGIN) {
            this.addPage();
        }
    }

    public drawSectionHeader(title: string, mainSection = false) {
        this.checkPageBreak(mainSection ? 25 : 20);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(mainSection ? 20 : 16);
        this.doc.setTextColor(mainSection ? COLORS.BRAND : COLORS.TEXT_PRIMARY);
        this.doc.text(title, PAGE_CONFIG.MARGIN, this.cursorY);
        this.cursorY += mainSection ? 10 : 8;
        this.doc.setDrawColor(COLORS.BRAND);
        this.doc.setLineWidth(0.5);
        this.doc.line(PAGE_CONFIG.MARGIN, this.cursorY, PAGE_CONFIG.MARGIN + (mainSection ? 60 : 40), this.cursorY);
        this.cursorY += 10;
        return this;
    }

    private calculateRecommendationHeight(item: Recommendation): number {
        let totalHeight = 0;
        
        // Title height
        const titleText = `- ${item.title} (Priority: ${item.priority})`;
        const titleLines = this.doc.splitTextToSize(titleText, PAGE_CONFIG.CONTENT_WIDTH);
        totalHeight += titleLines.length * 5 + 2;

        // Description height
        const descriptionParts = item.description.split(/(```[\s\S]*?```)/g);
        descriptionParts.forEach(part => {
            if (!part || part.trim() === '') return;
            if (part.startsWith('```') && part.endsWith('```')) {
                const codeContent = part.substring(3, part.length - 3).trim();
                const codeLines = this.doc.splitTextToSize(codeContent, PAGE_CONFIG.CONTENT_WIDTH - 15);
                const blockHeight = (codeLines.length * 4) + 6;
                totalHeight += blockHeight + 2;
            } else {
                const textLines = this.doc.splitTextToSize(part.trim(), PAGE_CONFIG.CONTENT_WIDTH - 5);
                totalHeight += textLines.length * 5;
            }
        });

        totalHeight += 8; // Spacing after the whole recommendation item
        return totalHeight;
    }

    private drawRecommendation(item: Recommendation) {
        const requiredHeight = this.calculateRecommendationHeight(item);
        this.checkPageBreak(requiredHeight);

        // Draw title
        const titleText = `- ${item.title} (Priority: ${item.priority})`;
        const titleLines = this.doc.splitTextToSize(titleText, PAGE_CONFIG.CONTENT_WIDTH);
        this.doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(COLORS.TEXT_PRIMARY);
        this.doc.text(titleLines, PAGE_CONFIG.MARGIN, this.cursorY);
        this.cursorY += titleLines.length * 5 + 2;

        // Draw description parts (text and code blocks)
        const descriptionParts = item.description.split(/(```[\s\S]*?```)/g);
        descriptionParts.forEach(part => {
            if (!part || part.trim() === '') return;

            if (part.startsWith('```') && part.endsWith('```')) {
                // Render code block
                const codeContent = part.substring(3, part.length - 3).trim();
                const codeLines = this.doc.splitTextToSize(codeContent, PAGE_CONFIG.CONTENT_WIDTH - 15);
                const blockHeight = (codeLines.length * 4) + 6;

                this.doc.setFillColor(COLORS.CODE_BG);
                this.doc.roundedRect(PAGE_CONFIG.MARGIN + 5, this.cursorY, PAGE_CONFIG.CONTENT_WIDTH - 10, blockHeight, 2, 2, 'F');
                this.doc.setFont('courier', 'normal').setFontSize(9).setTextColor(COLORS.TEXT_SECONDARY);
                this.doc.text(codeLines, PAGE_CONFIG.MARGIN + 10, this.cursorY + 4);
                this.cursorY += blockHeight + 2;
            } else {
                // Render normal text
                const textLines = this.doc.splitTextToSize(part.trim(), PAGE_CONFIG.CONTENT_WIDTH - 5);
                this.doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(COLORS.TEXT_SECONDARY);
                this.doc.text(textLines, PAGE_CONFIG.MARGIN + 5, this.cursorY);
                this.cursorY += textLines.length * 5;
            }
        });

        this.cursorY += 8; // Spacing after the whole recommendation item
    }

    private drawScoresAndCharts(analysis: AnalysisResult, chartImages: { radar: string; line: string; }) {
        const scores = analysis.scores;
        const scoreData = [
            { title: 'Performance', score: scores.performance }, { title: 'Accessibility', score: scores.accessibility },
            { title: 'Best Practices', score: scores.bestPractices }, { title: 'SEO', score: scores.seo },
        ];
        const boxWidth = 60, boxHeight = 40, startX = PAGE_CONFIG.MARGIN;
        const spacing = (PAGE_CONFIG.CONTENT_WIDTH - (boxWidth * 4)) / 3;

        scoreData.forEach((s, i) => {
            let color = COLORS.POOR;
            if (s.score >= 90) color = COLORS.GOOD; else if (s.score >= 50) color = COLORS.IMPROVEMENT;
            const x = startX + i * (boxWidth + spacing);
            
            this.doc.setDrawColor(color); this.doc.setFillColor(color);
            this.doc.roundedRect(x, this.cursorY, boxWidth, boxHeight, 3, 3, 'FD');
            
            this.doc.setFont('helvetica', 'bold'); this.doc.setFontSize(24); this.doc.setTextColor('#FFFFFF');
            this.doc.text(s.score.toString(), x + boxWidth / 2, this.cursorY + 20, { align: 'center' });
            
            this.doc.setFontSize(10); this.doc.text(s.title, x + boxWidth / 2, this.cursorY + 30, { align: 'center' });
        });
        this.cursorY += boxHeight + 15;
        
        const chartHeight = (PAGE_CONFIG.CONTENT_WIDTH / 2 - 5) * (9 / 16);
        this.checkPageBreak(chartHeight + 10);
        this.doc.addImage(chartImages.radar, 'PNG', PAGE_CONFIG.MARGIN, this.cursorY, PAGE_CONFIG.CONTENT_WIDTH / 2 - 5, chartHeight);
        this.doc.addImage(chartImages.line, 'PNG', PAGE_CONFIG.MARGIN + PAGE_CONFIG.CONTENT_WIDTH / 2 + 5, this.cursorY, PAGE_CONFIG.CONTENT_WIDTH / 2 - 5, chartHeight);
        this.cursorY += chartHeight + 10;
    }
}

// --- Main Export Functions ---

export async function generateSingleReportPdf(
    analysis: AnalysisResult, url: string, device: Device, reportType: ReportType,
    chartImages: { radar: string; line: string; }
): Promise<string> {
    const builder = new PdfBuilder(url, device);
    
    builder
        .drawCoverPage(false, reportType)
        .addPage()
        .drawReportSection(analysis, chartImages)
        .drawEndPage()
        .build();
        
    return builder.getOutput();
}

export async function generateFullReportPdf(
    reports: { id: ReportType, name: string, data: AnalysisResult }[],
    url: string, device: Device, chartImages: { radar: string; line: string; }
): Promise<string> {
    const builder = new PdfBuilder(url, device);

    builder
        .drawCoverPage(true)
        .drawInstructionsPage();

    reports.forEach((report, index) => {
        builder
            .addPage()
            .drawSectionHeader(reportTypeNames[report.id], true)
            .drawReportSection(report.data, index === 0 ? chartImages : undefined);
    });

    builder
        .drawTaskTrackerPage(reports)
        .drawEndPage()
        .build();

    return builder.getOutput();
}