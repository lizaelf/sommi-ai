import React from 'react';
import WineRecommendations from './WineRecommendations';

interface WeRecommendSectionProps {
  wine?: {
    id: number;
    name: string;
  } | null;
}

const WeRecommendSection: React.FC<WeRecommendSectionProps> = ({ wine }) => {
  return (
    <div style={{ 
      marginBottom: "32px"
    }}>
      <WineRecommendations currentWineId={wine?.id || 1} />
    </div>
  );
};

export default WeRecommendSection;