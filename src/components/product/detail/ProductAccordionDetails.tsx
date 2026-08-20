'use client';

import React, { useState } from 'react';
import { ChevronDown, Sparkles, Scissors, ShieldAlert, Truck } from 'lucide-react';

export interface ProductAccordionDetailsProps {
  product: {
    description?: string | null;
    category?: string | null;
    name: string;
  };
  optionType?: 'SALE' | 'RENTAL';
}

interface AccordionItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export default function ProductAccordionDetails({
  product,
  optionType = 'SALE',
}: ProductAccordionDetailsProps) {
  // Open the first item by default
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    craftsmanship: true,
    care: false,
    rental: optionType === 'RENTAL',
    shipping: false,
  });

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const sections: AccordionItem[] = [
    {
      id: 'craftsmanship',
      title: 'Atelier Craftsmanship',
      icon: <Scissors className="w-4 h-4 text-neutral-600" />,
      content: (
        <div className="space-y-3 text-xs text-neutral-600 font-light leading-relaxed">
          <p>
            Meticulously constructed in our Jakarta atelier by master couturiers. Each garment undergoes
            up to 80 hours of precision hand-cutting, tailored inner corsetry, and artisanal finishing.
          </p>
          <ul className="list-disc pl-4 space-y-1 text-neutral-500">
            <li>Hand-sculpted silhouette with bespoke structural inner boning.</li>
            <li>Hand-sewn French seams and concealed French zippers.</li>
            <li>Artisanal beadwork and crystal embellishments placed individually.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'care',
      title: 'Fabric & Care Instructions',
      icon: <Sparkles className="w-4 h-4 text-neutral-600" />,
      content: (
        <div className="space-y-3 text-xs text-neutral-600 font-light leading-relaxed">
          <p>
            Crafted from high-grade silk blends, imported organza, and delicate French lace. Due to the
            luxurious nature of the materials, specialized handling is required.
          </p>
          <div className="bg-neutral-50 p-3 rounded-xs space-y-1.5 text-[11px] text-neutral-700">
            <p className="font-medium text-neutral-900">Garment Care Guidelines:</p>
            <ul className="list-disc pl-4 space-y-1 text-neutral-600">
              <li>Strictly professional dry clean only by luxury textile specialists.</li>
              <li>Do not machine wash, tumble dry, or expose to direct bleach.</li>
              <li>Steam on reverse side at low temperature; do not iron directly on embellishments.</li>
              <li>Store in the complimentary breathable Ideal Beauty garment bag.</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'rental',
      title: 'Bespoke Rental Terms & Security Deposit',
      icon: <ShieldAlert className="w-4 h-4 text-neutral-600" />,
      content: (
        <div className="space-y-3 text-xs text-neutral-600 font-light leading-relaxed">
          <p>
            Experience couture elegance for your gala, wedding, or milestone celebration with our seamless
            curated rental service.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
            <div className="border border-neutral-100 p-2.5 rounded-xs">
              <span className="font-medium text-neutral-900 block mb-1">Refundable Deposit</span>
              <p className="text-neutral-500">
                A 100% refundable security deposit is held and released within 24-48 hours upon return inspection.
              </p>
            </div>
            <div className="border border-neutral-100 p-2.5 rounded-xs">
              <span className="font-medium text-neutral-900 block mb-1">Dry Cleaning Included</span>
              <p className="text-neutral-500">
                Post-event eco-friendly couture dry cleaning is complimentary and fully managed by our team.
              </p>
            </div>
          </div>
          <p className="text-[11px] text-neutral-500 italic">
            Garments are delivered sanitized, pressed, and ready to wear in bespoke protective casing.
          </p>
        </div>
      ),
    },
    {
      id: 'shipping',
      title: 'Insured Delivery & Returns',
      icon: <Truck className="w-4 h-4 text-neutral-600" />,
      content: (
        <div className="space-y-3 text-xs text-neutral-600 font-light leading-relaxed">
          <p>
            Every order is dispatched via priority insured courier to ensure your piece arrives in immaculate
            condition.
          </p>
          <ul className="list-disc pl-4 space-y-1 text-neutral-500 text-[11px]">
            <li>
              <strong className="text-neutral-700">Greater Jakarta:</strong> Same-day or next-day white-glove delivery available.
            </li>
            <li>
              <strong className="text-neutral-700">Nationwide (Indonesia):</strong> 2-3 business days express insured air freight.
            </li>
            <li>
              <strong className="text-neutral-700">Purchase Exchanges:</strong> Complimentary 7-day exchange on unworn garments with security ribbons attached.
            </li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pt-4">
      {/* Atelier Description */}
      <div className="space-y-2 text-xs text-neutral-700 leading-relaxed font-light">
        <h3 className="uppercase tracking-widest text-neutral-900 font-medium font-sans">
          Atelier Description
        </h3>
        <p className="whitespace-pre-line text-neutral-600">
          {product.description ||
            'Graceful dusty rose chiffon ensemble featuring delicate sequin sprays and soft silk lining.'}
        </p>
      </div>

      {/* Accordion Sections */}
      <div className="border-t border-neutral-200 divide-y divide-neutral-200">
        {sections.map((section) => {
          const isOpen = Boolean(openSections[section.id]);
          return (
            <div key={section.id} className="py-4">
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between text-left group focus:outline-none"
                aria-expanded={isOpen}
              >
                <div className="flex items-center space-x-3">
                  <span className="p-1.5 rounded-xs bg-neutral-50 border border-neutral-100 text-neutral-600 group-hover:text-black transition-colors">
                    {section.icon}
                  </span>
                  <span className="font-serif text-sm sm:text-base text-neutral-900 tracking-wide group-hover:text-black">
                    {section.title}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ease-out ${
                    isOpen ? 'transform rotate-180 text-black' : 'group-hover:text-neutral-600'
                  }`}
                />
              </button>

              {isOpen && (
                <div className="pt-4 pl-10 pr-2 animate-fadeIn transition-all">
                  {section.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
