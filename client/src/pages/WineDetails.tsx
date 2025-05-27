import React, { useState } from "react";
import { useLocation, Link, useParams } from "wouter";
import { ChevronLeft, Circle } from "lucide-react";
import Button from "@/components/ui/Button";
import Logo from "@/components/Logo";
import wineBottleImage from '@assets/Product Image.png';

const WineDetails = () => {
  // State for collapsible sections
  const [activeSection, setActiveSection] = useState<string | null>("taste");
  
  // Get wine ID from URL
  const params = useParams();
  const wineId = parseInt(params.id || "1");

  // Wine name and region based on ID
  const getWineName = (id: number) => {
    const names: { [key: number]: string } = {
      1: '2021 Ridge Vineyards "Lytton Springs" Dry Creek Extended',
      2: '2020 Domaine de la Côte "Bloom\'s Field" Pinot Noir',
      3: '2019 Caymus Vineyards Cabernet Sauvignon',
      4: '2021 Whispering Angel Rosé',
      5: '2020 Kosta Browne Pinot Noir "Russian River Valley"',
      6: '2018 Opus One',
      7: '2021 Sancerre "Les Baronnes" Henri Bourgeois',
      8: '2019 Barolo "Brunate" Giuseppe Rinaldi',
      9: '2020 Dom Pérignon Vintage Champagne'
    };
    return names[id] || names[1];
  };

  const getWineRegion = (id: number) => {
    const regions: { [key: number]: string } = {
      1: "Dry Creek Valley | Sonoma | United States",
      2: "Sta. Rita Hills | Santa Barbara | United States", 
      3: "Napa Valley | California | United States",
      4: "Côtes de Provence | France",
      5: "Russian River Valley | Sonoma | United States",
      6: "Oakville | Napa Valley | United States",
      7: "Sancerre | Loire Valley | France",
      8: "Barolo | Piedmont | Italy",
      9: "Champagne | France"
    };
    return regions[id] || regions[1];
  };

  // Mock wine data - in a real app, this would come from an API or props
  const wine = {
    id: wineId,
    name: getWineName(wineId),
    image: wineBottleImage,
    region: getWineRegion(wineId),
    vintage: 2021,
    ratings: {
      ws: 94,
      ww: 93,
      js: 92,
    },
    tasteCharacteristics: {
      body: 70,
      sweet: 30,
      dry: 75,
      smooth: 60,
      tannic: 80,
    },
    foodPairings: [
      { id: "red-meat", name: "Red Meat", active: true },
      { id: "cheese", name: "Cheese Pairings", active: false },
      { id: "vegetarian", name: "Vegetarian Options", active: false },
      { id: "avoid", name: "Avoid pairing with...", active: false },
    ],
    history:
      "Lytton Springs is a renowned single-vineyard red wine produced by Ridge Vineyards, founded in 1962 in Dry Creek Valley of Sonoma County, California. It's primarily composed of old-vine Zinfandel, complemented by Petite Sirah, Carignane, and other varieties, creating one of the most celebrated red blends in the United States.",
    notes: [
      {
        type: "Aged Character",
        details: [
          "Blackberry and cedar aromatics with crushing dark plum and blue fruit on the palate",
          "Strong depth and easy to stand up to its aging from oak and time",
          "Rich finish with lingering tannins",
        ],
      },
      {
        type: "Cheese Pairing",
        details: [
          "Strong: The saltiness of the cheese enhances the richness in tannins",
          "Medium: Perfect balance between wine acidity and cheese creaminess",
          "Mild: Complements without overwhelming the wine's complexity",
        ],
      },
    ],
  };

  // Toggle section function
  const toggleSection = (section: string) => {
    if (activeSection === section) {
      setActiveSection(null);
    } else {
      setActiveSection(section);
    }
  };

  // Render characteristic bar helper
  const renderCharacteristicBar = (
    value: number,
    leftLabel: string,
    rightLabel: string,
  ) => (
    <div className="mb-4">
      <div className="flex justify-between text-sm text-foreground/70 mb-1">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      <div className="relative bg-muted rounded-full h-2">
        <div
          className="absolute top-0 left-0 bg-primary rounded-full h-2"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-background text-foreground min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Link href="/cellar">
          <ChevronLeft size={24} className="cursor-pointer" />
        </Link>
        <Logo />
        <div className="w-6" />
      </div>

      {/* Wine hero image */}
      <div className="w-full h-80 flex items-center justify-center bg-black">
        <img
          src={wine.image}
          alt={wine.name}
          className="h-full object-contain mx-auto"
        />
      </div>

      {/* Wine details */}
      <div className="p-4">
        {/* Wine name and vintage */}
        <h1 className="text-xl font-semibold mb-1">{wine.name}</h1>

        {/* Region with dot icon */}
        <div className="flex items-center text-sm text-foreground/70 mb-4">
          <Circle size={6} className="text-primary mr-2" fill="currentColor" />
          <span>{wine.region}</span>
        </div>

        {/* Ratings */}
        <div className="flex gap-3 mb-6">
          {Object.entries(wine.ratings).map(([key, value]) => (
            <div
              key={key}
              className="flex flex-col items-center justify-center bg-background border border-primary/20 rounded-full w-10 h-10"
            >
              <span className="text-xs uppercase">{key}</span>
              <span className="text-sm font-semibold">{value}</span>
            </div>
          ))}
        </div>

        {/* Food pairing section */}
        <section className="mb-6">
          <h2 className="text-lg font-medium mb-3">Food pairing</h2>

          <div className="grid grid-cols-2 gap-2">
            {wine.foodPairings.map((pairing) => (
              <button
                key={pairing.id}
                className={`text-left p-3 rounded-lg border transition-colors ${
                  pairing.active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-foreground/70"
                }`}
              >
                <span className="text-sm">{pairing.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Taste characteristics */}
        <section className="mb-6">
          <h2 className="text-lg font-medium mb-3">Taste characteristics</h2>

          <div className="mb-3">
            {renderCharacteristicBar(
              wine.tasteCharacteristics.body,
              "Light",
              "Bold",
            )}
            {renderCharacteristicBar(
              wine.tasteCharacteristics.sweet,
              "Sweet",
              "Dry",
            )}
            {renderCharacteristicBar(
              wine.tasteCharacteristics.smooth,
              "Smooth",
              "Tannic",
            )}
          </div>
        </section>

        {/* History */}
        <section className="mb-6">
          <h2 className="text-lg font-medium mb-3">History</h2>
          <p className="text-foreground/80 text-sm leading-relaxed">
            {wine.history}
          </p>

          {/* AI Assistant prompt */}
          <div className="mt-4 bg-primary/5 border border-primary/20 rounded-lg p-3">
            <p className="text-sm text-foreground/80 italic">
              Would you like to hear about food pairings?
            </p>
            <button className="mt-2 text-primary text-sm">
              Choose to chat with the wine AI
            </button>
          </div>
        </section>

        {/* Tasting notes */}
        <section className="mb-6">
          {wine.notes.map((category, index) => (
            <div key={index} className="mb-4">
              <h3 className="text-base font-semibold mb-2 text-primary">
                → {category.type}
              </h3>
              <ul className="space-y-2">
                {category.details.map((detail, detailIndex) => (
                  <li key={detailIndex} className="text-sm text-foreground/80">
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* Buy again */}
        <div className="mb-8">
          <Button fullWidth>Buy again</Button>
        </div>
      </div>
    </div>
  );
};

export default WineDetails;