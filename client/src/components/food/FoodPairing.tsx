import React from 'react';
import typography from '@/styles/typography';

interface FoodPairingProps {
  wine: {
    foodPairing?: string[];
    description?: string;
  };
}

export const FoodPairing: React.FC<FoodPairingProps> = ({ wine }) => {
  if (!wine?.foodPairing || wine.foodPairing.length === 0) {
    return null;
  }

  return (
    <div className="px-6 py-4 bg-black/20 backdrop-blur-sm border-t border-white/10">
      {/* Food Pairing Section */}
      <div className="mb-4">
        <h3 
          className="text-white font-semibold mb-3"
          style={typography.h2}
        >
          Perfect Pairings
        </h3>
        <div className="flex flex-wrap gap-2">
          {wine.foodPairing.map((item, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-white/10 rounded-full text-white/80 text-sm"
              style={typography.body}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Wine Description */}
      {wine.description && (
        <div>
          <h3 
            className="text-white font-semibold mb-2"
            style={typography.h2}
          >
            Tasting Notes
          </h3>
          <p 
            className="text-white/70 leading-relaxed"
            style={typography.body}
          >
            {wine.description}
          </p>
        </div>
      )}
    </div>
  );
};

export default FoodPairing;