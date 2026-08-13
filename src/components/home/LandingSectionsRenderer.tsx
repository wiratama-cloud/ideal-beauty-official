import React from 'react';
import NewArrivalsSection from './NewArrivalsSection';
import FeaturedBrandsSection from './FeaturedBrandsSection';
import EditorsPicksSection from './EditorsPicksSection';

interface LandingSectionsRendererProps {
  sections: any[];
  wishlistedIds?: string[];
}

export default function LandingSectionsRenderer({
  sections,
  wishlistedIds = [],
}: LandingSectionsRendererProps) {
  if (!sections || sections.length === 0) return null;

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        switch (section.type) {
          case 'NEW_ARRIVALS':
            return (
              <NewArrivalsSection
                key={section.id}
                section={section}
                wishlistedIds={wishlistedIds}
              />
            );
          case 'FEATURED_BRANDS':
            return <FeaturedBrandsSection key={section.id} section={section} />;
          case 'EDITORS_PICKS':
            return (
              <EditorsPicksSection
                key={section.id}
                section={section}
                wishlistedIds={wishlistedIds}
              />
            );
          default:
            return (
              <NewArrivalsSection
                key={section.id}
                section={section}
                wishlistedIds={wishlistedIds}
              />
            );
        }
      })}
    </div>
  );
}
