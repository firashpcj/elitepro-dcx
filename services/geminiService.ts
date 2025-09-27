import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult, Device, ReportType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const recommendationSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "Title of the opportunity, recommendation, or analysis point." },
        description: { type: Type.STRING, description: "A detailed description of the item. Use simple markdown for formatting (e.g., use ``` for code blocks)." },
        priority: { type: Type.STRING, description: "The priority of the task: 'High', 'Medium', or 'Low'."}
    },
    required: ["title", "description", "priority"],
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    scores: {
      type: Type.OBJECT,
      properties: {
        performance: { type: Type.INTEGER, description: "A score from 0-100 for performance." },
        accessibility: { type: Type.INTEGER, description: "A score from 0-100 for accessibility." },
        bestPractices: { type: Type.INTEGER, description: "A score from 0-100 for best practices." },
        seo: { type: Type.INTEGER, description: "A score from 0-100 for SEO." },
      },
      required: ["performance", "accessibility", "bestPractices", "seo"],
    },
    coreWebVitalsStatus: { type: Type.STRING, description: "A brief status of Core Web Vitals, e.g., 'Passed' or 'Failed'." },
    metrics: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "A unique ID for the metric (e.g., 'FCP')." },
          name: { type: Type.STRING, description: "The full name of the metric (e.g., 'First Contentful Paint')." },
          displayValue: { type: Type.STRING, description: "The value of the metric with units (e.g., '1.2 s')." },
          score: { type: Type.INTEGER, description: "A score from 0-100 for this specific metric." },
          category: { type: Type.STRING, description: "Category: 'good', 'needs-improvement', or 'poor'." },
        },
        required: ["id", "name", "displayValue", "score", "category"],
      },
    },
    opportunities: {
      type: Type.ARRAY,
      items: recommendationSchema,
    },
    diagnostics: {
      type: Type.ARRAY,
      items: recommendationSchema,
    },
    metricHistory: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "The name of the metric being tracked, e.g. 'Largest Contentful Paint'" },
            data: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        time: { type: Type.STRING, description: "A label for the time point, e.g., '7 days ago'." },
                        value: { type: Type.NUMBER, description: "The numeric value of the metric at that time point (e.g., LCP in seconds)." }
                    },
                    required: ["time", "value"]
                }
            }
        },
        required: ["name", "data"]
    },
  },
  required: ["scores", "metrics", "opportunities", "diagnostics", "coreWebVitalsStatus", "metricHistory"],
};

const getPrompt = (url: string, device: Device, reportType: ReportType): string => {
    const baseIntro = `You are a world-class web performance and SEO expert. Do not browse the web or access the URL. Base your analysis on general knowledge of web development and SEO best practices. Generate a realistic but illustrative dataset that reflects common issues. Provide a detailed report in JSON format that strictly adheres to the provided schema. Ensure all fields are populated with plausible data. For scores and metrics not relevant to the report type, provide reasonable default values. For 'description' fields, use simple markdown for formatting. For every opportunity and diagnostic, assign a priority ('High', 'Medium', or 'Low') based on its potential impact.`;

    switch (reportType) {
        case 'healthcare-seo':
            return `
                ${baseIntro}
                Task: Generate a "Healthcare SEO Optimization" report for the website at "${url}" for a ${device} device.
                Focus on strategies relevant to the healthcare industry. The 'opportunities' section should detail on-page SEO recommendations (e.g., schema markup for doctors, patient testimonials, E-E-A-T signals). The 'diagnostics' section should cover off-page strategies (e.g., local SEO, managing online reviews, building backlinks from reputable health sites).
            `;
        case 'cwv-fixes':
            return `
                ${baseIntro}
                Task: Generate a "Detailed Core Web Vitals Fixes" report for the website at "${url}" for a ${device} device.
                The 'opportunities' section should provide in-depth, actionable advice for fixing LCP (Largest Contentful Paint), INP (Interaction to Next Paint), and CLS (Cumulative Layout Shift). Include illustrative code examples where possible (e.g., how to preload fonts, optimize images, or defer non-critical CSS). The 'diagnostics' section can cover related performance metrics. High-priority items should be those with the biggest impact on user experience and scores.
            `;
        case 'local-seo':
            return `
                ${baseIntro}
                Task: Generate a "Local SEO Optimization" report for "Badr Health Clinics" (hypothetically at URL "${url}") for a ${device} device.
                The 'opportunities' section should focus on optimizing their Google Business Profile (GBP), including posts, services, and photos. The 'diagnostics' section should cover building local citations, managing patient reviews across platforms, and creating location-specific content for their clinics.
            `;
        case 'pagespeed':
        default:
            return `
                ${baseIntro}
                Task: Simulate Google's PageSpeed Insights tool. Analyze the potential performance of the website at the URL "${url}" for a ${device} device.
                For the ${device} device, generate scores and metric values that are typically seen on that form factor (e.g., mobile might have slower FCP/LCP times).
                Also, generate a plausible 7-point historical trend for the 'Largest Contentful Paint' metric. This should be an array of 7 data points, each with a time label (e.g., '7 days ago', '6 days ago', ..., 'Today') and a corresponding LCP value in seconds. The trend should look realistic, with some fluctuations.
            `;
    }
}

export async function analyzeUrl(url: string, device: Device, reportType: ReportType): Promise<AnalysisResult> {
  const prompt = getPrompt(url, device, reportType);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text;
    const result = JSON.parse(jsonText) as AnalysisResult;
    return result;

  } catch (error) {
    console.error(`Error analyzing URL for ${reportType} on ${device}:`, error);
    throw new Error(`Failed to generate analysis for ${reportType} from AI.`);
  }
}
