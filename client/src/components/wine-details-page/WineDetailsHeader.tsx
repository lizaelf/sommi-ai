import React from 'react';
import WineBottleImage from '@/components/WineBottleImage';
import USFlagImage from '@/components/USFlagImage';
import WineRating from '@/components/WineRating';
import WineTechnicalDetails from '@/components/WineTechnicalDetails';
import typography from '@/styles/typography';

interface WineDetailsHeaderProps {
  wine: {
    id: number;
    name: string;
    year?: number;
    image: string;
    location?: string;
    ratings: {
      vn: number;
      jd: number;
      ws: number;
      abv: number;
    };
    technicalDetails?: {
      varietal?: {
        primary: string;
        primaryPercentage: number;
        secondary?: string;
        secondaryPercentage?: number;
      };
      appellation?: string;
      aging?: {
        drinkNow: boolean;
        ageUpTo?: string;
      };
      customAbv?: number;
    };
  } | null;
}

const WineDetailsHeader: React.FC<WineDetailsHeaderProps> = ({ wine }) => {
  return (
    <div
      className="w-full flex flex-col items-center justify-center py-8 relative"
      style={{
        minHeight: "100vh",
      }}
    >
      {/* Wine bottle image with blurred circle/glow effect */}
      <WineBottleImage image={wine?.image} wineName={wine?.name} />

      {/* Wine name with typography styling */}
      <div
        style={{
          width: "100%",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          color: "white",
          wordWrap: "break-word",
          position: "relative",
          zIndex: 2,
          padding: "0 20px",
          marginBottom: "20px",
          ...typography.h1,
        }}
      >
        {wine
          ? `${wine.year ? wine.year + " " : "2021 "}${wine.name}`
          : `2021 Wine Name`}
      </div>

      {/* Wine region with typography styling and flag */}
      <div
        style={{
          textAlign: "left",
          justifyContent: "flex-start",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          color: "rgba(255, 255, 255, 0.60)",
          wordWrap: "break-word",
          position: "relative",
          zIndex: 2,
          padding: "0 20px",
          gap: "6px",
          marginBottom: "20px",
          ...typography.body1R,
        }}
      >
        <USFlagImage />
        <span>
          {wine?.location ||
            "Santa Cruz Mountains | California | United States"}
        </span>
      </div>

      {/* Wine ratings section */}
      <WineRating
        ratings={wine ? wine.ratings : { vn: 95, jd: 93, ws: 93, abv: 14.3 }}
        align="left"
        style={{
          position: "relative",
          zIndex: 2,
          padding: "0 20px",
          marginBottom: "32px",
        }}
      />
    </div>
  );
};

export default WineDetailsHeader;