'use client';

import React, { useState, useEffect } from 'react';
import { X, Ruler, Scale, Sparkles, Check, Info, ArrowRight, HelpCircle } from 'lucide-react';
import {
  SizeChartType,
  SizeMeasurementInput,
  DEFAULT_SIZE_MEASUREMENTS,
  DEFAULT_WEIGHT_HEIGHT_MEASUREMENTS,
} from '@/lib/types/size-chart';

interface SizeChartModalProps {
  category?: string | null;
  productName?: string;
  sizeChart?: {
    id?: string;
    name?: string;
    type?: SizeChartType | string;
    category?: string | null;
    description?: string | null;
    guideText?: string | null;
    measurements?: SizeMeasurementInput[];
  } | null;
}

export const SIZE_CHART_DATA = DEFAULT_SIZE_MEASUREMENTS;

export default function SizeChartModal({ category, productName, sizeChart }: SizeChartModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'table' | 'image' | 'guide'>('table');

  const chartType: SizeChartType = (sizeChart?.type as SizeChartType) || 'BODY_MEASUREMENT';

  const chartRows: SizeMeasurementInput[] = (sizeChart?.measurements && sizeChart.measurements.length > 0)
    ? sizeChart.measurements
    : chartType === 'WEIGHT_HEIGHT'
    ? DEFAULT_WEIGHT_HEIGHT_MEASUREMENTS
    : DEFAULT_SIZE_MEASUREMENTS;

  const chartTitle = sizeChart?.name || (chartType === 'WEIGHT_HEIGHT' ? 'Weight & Height Fit Guide' : 'Size Chart & Measurement Guide');
  const chartGuide = sizeChart?.guideText || (
    chartType === 'WEIGHT_HEIGHT'
      ? 'Select your size based on your current weight (kg) and height (cm). If between sizes, choose the larger size for a relaxed fit.'
      : 'All garments are tailored to standard proportions. If you fall between two sizes, we recommend selecting the larger size for structured pieces or contacting our atelier for bespoke adjustments.'
  );

  // Interactive Size Helper state (CM & KG only)
  const [userBustCm, setUserBustCm] = useState<string>('');
  const [userWaistCm, setUserWaistCm] = useState<string>('');
  const [userHipsCm, setUserHipsCm] = useState<string>('');
  const [userHeightCm, setUserHeightCm] = useState<string>('');
  const [userWeightKg, setUserWeightKg] = useState<string>('');
  const [recommendedSize, setRecommendedSize] = useState<string | null>(null);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Calculate recommended size
  const handleCalculateSize = (e: React.FormEvent) => {
    e.preventDefault();

    if (chartType === 'WEIGHT_HEIGHT') {
      const weightNum = parseFloat(userWeightKg);
      const heightNum = parseFloat(userHeightCm);

      if (isNaN(weightNum) || weightNum <= 0) {
        setRecommendedSize(null);
        return;
      }

      // Find matching row in chartRows
      const matched = chartRows.find((row) => {
        if (row.minWeightKg && row.maxWeightKg) {
          return weightNum >= row.minWeightKg && weightNum <= row.maxWeightKg;
        }
        if (row.weightKg) {
          const parts = row.weightKg.split('-').map((p) => parseFloat(p.trim()));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            return weightNum >= parts[0] && weightNum <= parts[1];
          }
        }
        return false;
      });

      if (matched) {
        setRecommendedSize(matched.size);
      } else if (weightNum < 45) {
        setRecommendedSize('XS');
      } else if (weightNum <= 52) {
        setRecommendedSize('S');
      } else if (weightNum <= 62) {
        setRecommendedSize('M');
      } else if (weightNum <= 72) {
        setRecommendedSize('L');
      } else if (weightNum <= 82) {
        setRecommendedSize('XL');
      } else if (weightNum <= 92) {
        setRecommendedSize('2XL');
      } else {
        setRecommendedSize('3XL');
      }
    } else {
      const bustNum = parseFloat(userBustCm);
      if (isNaN(bustNum) || bustNum <= 0) {
        setRecommendedSize(null);
        return;
      }

      const matched = chartRows.find((row) => {
        if (row.minBustCm && row.maxBustCm) {
          return bustNum >= row.minBustCm && bustNum <= row.maxBustCm;
        }
        if (row.bustCm) {
          const parts = row.bustCm.split('-').map((p) => parseFloat(p.trim()));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            return bustNum >= parts[0] && bustNum <= parts[1];
          }
        }
        return false;
      });

      if (matched) {
        setRecommendedSize(matched.size);
      } else if (bustNum < 82) setRecommendedSize('XS');
      else if (bustNum <= 89) setRecommendedSize('S');
      else if (bustNum <= 94) setRecommendedSize('M');
      else if (bustNum <= 101) setRecommendedSize('L');
      else if (bustNum <= 109) setRecommendedSize('XL');
      else if (bustNum <= 117) setRecommendedSize('2XL');
      else setRecommendedSize('3XL');
    }
  };

  return (
    <>
      {/* Size Chart Trigger Link */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center space-x-1.5 text-xs text-neutral-800 hover:text-black font-medium underline underline-offset-4 decoration-neutral-300 hover:decoration-black transition-all cursor-pointer group"
      >
        <Ruler className="w-3.5 h-3.5 text-amber-700 group-hover:scale-110 transition-transform shrink-0" />
        <span>Size Guide & Fit Chart</span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-neutral-200">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-neutral-100 flex items-start justify-between bg-neutral-50/50">
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full font-semibold ${
                    chartType === 'WEIGHT_HEIGHT'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {chartType === 'WEIGHT_HEIGHT' ? 'Weight & Height Guide (CM / KG)' : 'Body Measurement Guide (CM)'}
                  </span>
                  {category && (
                    <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                      &bull; {category}
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-2xl text-neutral-900 mt-1 font-normal">
                  {chartTitle}
                </h3>
                <p className="text-xs text-neutral-500 font-light mt-0.5">
                  {productName ? `Fit guide for ${productName}` : 'Find your perfect size across our couture collection.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 text-neutral-400 hover:text-black rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
                aria-label="Close size chart modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-neutral-200 px-6 bg-white shrink-0">
              <div className="flex space-x-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('table')}
                  className={`py-3 text-xs uppercase tracking-wider font-medium border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'table'
                      ? 'border-black text-black'
                      : 'border-transparent text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  Size Table
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('image')}
                  className={`py-3 text-xs uppercase tracking-wider font-medium border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'image'
                      ? 'border-black text-black'
                      : 'border-transparent text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  Visual Diagram
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('guide')}
                  className={`py-3 text-xs uppercase tracking-wider font-medium border-b-2 transition-colors cursor-pointer flex items-center space-x-1 ${
                    activeTab === 'guide'
                      ? 'border-black text-black'
                      : 'border-transparent text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Find My Size</span>
                </button>
              </div>

              {/* Unit Badge */}
              <div className="text-[11px] font-mono text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-md font-semibold">
                {chartType === 'WEIGHT_HEIGHT' ? 'CM & KG' : 'CM'}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* TAB 1: Size Table */}
              {activeTab === 'table' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto border border-neutral-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-neutral-900 text-white uppercase font-mono tracking-wider text-[11px]">
                          <th className="py-3 px-4 font-medium">Size</th>
                          {chartType === 'WEIGHT_HEIGHT' ? (
                            <>
                              <th className="py-3 px-4 font-medium">Height (CM)</th>
                              <th className="py-3 px-4 font-medium">Weight (KG)</th>
                            </>
                          ) : (
                            <>
                              <th className="py-3 px-4 font-medium">Bust (CM)</th>
                              <th className="py-3 px-4 font-medium">Waist (CM)</th>
                              <th className="py-3 px-4 font-medium">Hips (CM)</th>
                              <th className="py-3 px-4 font-medium">Shoulder (CM)</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 font-light">
                        {chartRows.map((row, idx) => (
                          <tr key={row.size || idx} className="hover:bg-amber-50/40 transition-colors">
                            <td className="py-3 px-4 font-mono font-semibold text-neutral-900 bg-neutral-50/50">
                              {row.size}
                            </td>
                            {chartType === 'WEIGHT_HEIGHT' ? (
                              <>
                                <td className="py-3 px-4 text-neutral-700 font-mono">
                                  {row.heightCm || '-'}
                                </td>
                                <td className="py-3 px-4 text-neutral-700 font-mono">
                                  {row.weightKg || '-'}
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="py-3 px-4 text-neutral-700 font-mono">
                                  {row.bustCm || '-'}
                                </td>
                                <td className="py-3 px-4 text-neutral-700 font-mono">
                                  {row.waistCm || '-'}
                                </td>
                                <td className="py-3 px-4 text-neutral-700 font-mono">
                                  {row.hipsCm || '-'}
                                </td>
                                <td className="py-3 px-4 text-neutral-700 font-mono">
                                  {row.shoulderCm || '-'}
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Category Fit Advice */}
                  <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/80 space-y-2">
                    <div className="flex items-center space-x-2 text-neutral-900 font-medium text-xs uppercase tracking-wider">
                      <Info className="w-4 h-4 text-amber-700" />
                      <span>Couture Fit Recommendations</span>
                    </div>
                    <p className="text-xs text-neutral-600 font-light leading-relaxed">
                      {chartGuide}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: Visual Image Guide Diagram */}
              {activeTab === 'image' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-950 text-white rounded-xl p-6 sm:p-8 relative overflow-hidden shadow-lg border border-neutral-800">
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <div className="space-y-4">
                        <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full inline-block">
                          {chartType === 'WEIGHT_HEIGHT' ? 'Height & Weight Diagram' : 'Body Measurement Diagram'}
                        </span>
                        <h4 className="font-serif text-2xl font-light leading-tight">
                          {chartType === 'WEIGHT_HEIGHT' ? 'How to Check Your Height & Weight' : 'How to Measure Yourself Accurately'}
                        </h4>

                        {chartType === 'WEIGHT_HEIGHT' ? (
                          <ul className="space-y-3 text-xs text-neutral-300 font-light">
                            <li className="flex items-start space-x-2.5">
                              <span className="w-5 h-5 rounded-full bg-purple-600/30 border border-purple-500/50 text-purple-300 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                1
                              </span>
                              <div>
                                <strong className="text-white font-normal block">Total Height (CM):</strong>
                                Stand upright without shoes with your heels flat against a wall to measure total height in centimeters.
                              </div>
                            </li>
                            <li className="flex items-start space-x-2.5">
                              <span className="w-5 h-5 rounded-full bg-purple-600/30 border border-purple-500/50 text-purple-300 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                2
                              </span>
                              <div>
                                <strong className="text-white font-normal block">Body Weight (KG):</strong>
                                Weigh yourself in light clothing on a digital scale for accurate size matching in kilograms.
                              </div>
                            </li>
                          </ul>
                        ) : (
                          <ul className="space-y-3 text-xs text-neutral-300 font-light">
                            <li className="flex items-start space-x-2.5">
                              <span className="w-5 h-5 rounded-full bg-amber-600/30 border border-amber-500/50 text-amber-300 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                1
                              </span>
                              <div>
                                <strong className="text-white font-normal block">Bust / Chest (CM):</strong>
                                Measure around the fullest part of your bust in centimeters, keeping the tape parallel to the floor.
                              </div>
                            </li>
                            <li className="flex items-start space-x-2.5">
                              <span className="w-5 h-5 rounded-full bg-amber-600/30 border border-amber-500/50 text-amber-300 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                2
                              </span>
                              <div>
                                <strong className="text-white font-normal block">Natural Waist (CM):</strong>
                                Measure around your narrowest natural waistline in centimeters.
                              </div>
                            </li>
                            <li className="flex items-start space-x-2.5">
                              <span className="w-5 h-5 rounded-full bg-amber-600/30 border border-amber-500/50 text-amber-300 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                3
                              </span>
                              <div>
                                <strong className="text-white font-normal block">Full Hips (CM):</strong>
                                Stand with feet together and measure around the fullest part of your hips in centimeters.
                              </div>
                            </li>
                          </ul>
                        )}
                      </div>

                      {/* Graphic SVG Illustration */}
                      <div className="bg-neutral-800/80 border border-neutral-700/60 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4">
                        {chartType === 'WEIGHT_HEIGHT' ? (
                          <div className="flex items-center justify-center gap-4 py-4 text-purple-400">
                            <Scale className="w-16 h-16 stroke-[1.5]" />
                            <Ruler className="w-16 h-16 stroke-[1.5]" />
                          </div>
                        ) : (
                          <svg className="w-36 h-48 text-amber-400" viewBox="0 0 100 150" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M50,15 C45,15 40,20 38,28 C35,40 30,48 25,52 C20,56 22,65 30,68 C35,70 34,80 32,95 C30,110 28,135 28,145" strokeLinecap="round" />
                            <path d="M50,15 C55,15 60,20 62,28 C65,40 70,48 75,52 C80,56 78,65 70,68 C65,70 66,80 68,95 C70,110 72,135 72,145" strokeLinecap="round" />
                            <line x1="22" y1="52" x2="78" y2="52" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
                            <text x="81" y="55" fill="#f59e0b" fontSize="8" fontFamily="sans-serif">1. Bust</text>
                            <line x1="32" y1="75" x2="68" y2="75" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
                            <text x="71" y="78" fill="#38bdf8" fontSize="8" fontFamily="sans-serif">2. Waist</text>
                            <line x1="29" y1="98" x2="71" y2="98" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="3 3" />
                            <text x="74" y="101" fill="#a855f7" fontSize="8" fontFamily="sans-serif">3. Hips</text>
                          </svg>
                        )}
                        <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-widest">
                          {chartType === 'WEIGHT_HEIGHT' ? 'Centimeter & Kilogram Guide' : 'Anatomical Couture Guide'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Interactive Size Calculator ("Find My Size") */}
              {activeTab === 'guide' && (
                <div className="space-y-6">
                  <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-6 space-y-4">
                    <div className="flex items-center space-x-2 text-neutral-900 font-serif text-lg">
                      <Sparkles className="w-5 h-5 text-amber-600" />
                      <span>Interactive Size Recommender</span>
                    </div>
                    <p className="text-xs text-neutral-600 font-light">
                      {chartType === 'WEIGHT_HEIGHT'
                        ? 'Enter your body weight (KG) and height (CM) below for instant size recommendations.'
                        : 'Enter your body measurements (CM) below for instant size recommendations.'}
                    </p>

                    <form onSubmit={handleCalculateSize} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                      {chartType === 'WEIGHT_HEIGHT' ? (
                        <>
                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-700 mb-1">
                              Height (CM)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              placeholder="e.g. 165"
                              value={userHeightCm}
                              onChange={(e) => setUserHeightCm(e.target.value)}
                              className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-700 mb-1">
                              Body Weight (KG) *
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              required
                              placeholder="e.g. 55"
                              value={userWeightKg}
                              onChange={(e) => setUserWeightKg(e.target.value)}
                              className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black font-mono"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-700 mb-1">
                              Bust / Chest (CM) *
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              required
                              placeholder="e.g. 90"
                              value={userBustCm}
                              onChange={(e) => setUserBustCm(e.target.value)}
                              className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-700 mb-1">
                              Waist (CM)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              placeholder="e.g. 70"
                              value={userWaistCm}
                              onChange={(e) => setUserWaistCm(e.target.value)}
                              className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-700 mb-1">
                              Hips (CM)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              placeholder="e.g. 95"
                              value={userHipsCm}
                              onChange={(e) => setUserHipsCm(e.target.value)}
                              className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black font-mono"
                            />
                          </div>
                        </>
                      )}

                      <div className="sm:col-span-full pt-2 flex items-center justify-end">
                        <button
                          type="submit"
                          className="bg-neutral-900 hover:bg-black text-white text-xs uppercase font-medium tracking-widest px-6 py-2.5 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
                        >
                          <span>Calculate Size</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </form>

                    {recommendedSize && (
                      <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-700 block font-semibold">
                            Recommended Fit
                          </span>
                          <p className="text-sm font-serif font-medium text-emerald-950">
                            Your suggested size is <span className="underline font-bold text-black font-mono">{recommendedSize}</span>
                          </p>
                          <p className="text-[11px] text-emerald-800 font-light mt-0.5">
                            Based on your entered {chartType === 'WEIGHT_HEIGHT' ? 'height and weight' : 'body'} measurements.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 px-6 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between text-xs text-neutral-500 font-light">
              <div className="flex items-center space-x-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
                <span>Need custom fitting or bespoke adjustments?</span>
              </div>
              <a
                href="https://wa.me/628123456789"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-900 font-medium underline hover:text-amber-700 transition-colors"
              >
                Contact Atelier Concierge
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
