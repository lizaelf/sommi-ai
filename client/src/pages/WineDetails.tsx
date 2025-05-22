import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { ChevronLeft, Circle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Logo from '@/components/Logo';

const WineDetails = () => {
  // State for collapsible sections
  const [activeSection, setActiveSection] = useState<string | null>('taste');
  
  // Mock wine data - in a real app, this would come from an API or props
  const wine = {
    id: 1,
    name: "2021 Ridge Vineyards \"Lytton Springs\" Dry Creek Extended",
    image: "/wine-bottle.png", // Default image path
    region: "Dry Creek Valley | Sonoma | United States",
    vintage: 2021,
    ratings: {
      ws: 94,
      ww: 93,
      js: 92
    },
    tasteCharacteristics: {
      body: 70,
      sweet: 30,
      dry: 75,
      smooth: 60,
      tannic: 80
    },
    foodPairings: [
      { id: 'red-meat', name: 'Red Meat', active: true },
      { id: 'cheese', name: 'Cheese Pairings', active: false },
      { id: 'vegetarian', name: 'Vegetarian Options', active: false },
      { id: 'avoid', name: 'Avoid pairing with...', active: false }
    ],
    history: "Lytton Springs is a renowned single-vineyard red wine produced by Ridge Vineyards, founded in 1962 in Dry Creek Valley of Sonoma County, California. It's primarily composed of old-vine Zinfandel, complemented by Petite Sirah, Carignane, and other varieties, creating one of the most celebrated red blends in the United States.",
    notes: [
      {
        type: "Aged Character",
        details: [
          "Blackberry and cedar aromatics with crushing dark plum and blue fruit on the palate",
          "Strong depth and easy to stand up to its aging from oak and time",
          "Rich finish with lingering tannins"
        ]
      },
      {
        type: "Cheese Pairing",
        details: [
          "Strong: The saltiness of the cheese enhances the richness in tannins",
          "Why: Aged cheese has caramel notes that echo the wine's big plum fruit flavors",
          "Notable: A strong cow's milk Gouda, aged cheddar, or a earthy French mountain cheese",
          "Texture: Dense, slightly crystallized, crackle in aged textures"
        ]
      },
      {
        type: "Food Character",
        details: [
          "Great for a tender centered, heat-seared burgundy and juiciness balance Zinfandel's bold richness in tannins",
          "Heats pulls out texture and dark fruit concentration"
        ]
      },
      {
        type: "Mouthfeel",
        details: [
          "Silky: Dense, slightly chewy mouthfeel creates velvety approach and long, silky middle and ends on elegant Spanish finish",
          "Texture: Firm, earthy"
        ]
      }
    ]
  };

  // Toggle section visibility
  const toggleSection = (section: string) => {
    if (activeSection === section) {
      setActiveSection(null);
    } else {
      setActiveSection(section);
    }
  };

  // Helper function to render taste characteristic bars
  const renderCharacteristicBar = (value: number, leftLabel: string, rightLabel: string) => (
    <div className="mb-4">
      <div className="flex justify-between text-xs mb-1 text-foreground/70">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary rounded-full" 
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top navigation */}
      <div className="bg-background p-4 flex items-center justify-between">
        <Link to="/">
          <div className="flex items-center text-white cursor-pointer">
            <ChevronLeft size={20} />
            <Logo className="ml-2" />
          </div>
        </Link>
        <Button>
          My Cellar
        </Button>
      </div>

      {/* Wine hero image */}
      <div className="w-full h-80 flex items-center justify-center bg-black">
        <img 
          src="https://t3.ftcdn.net/jpg/02/22/85/16/360_F_222851624_jfoMGbJxwRi5AWGdPgXKSABMnzCQo9RN.jpg" 
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
            <div key={key} className="flex flex-col items-center justify-center bg-background border border-primary/20 rounded-full w-10 h-10">
              <span className="text-xs uppercase">{key}</span>
              <span className="text-sm font-semibold">{value}</span>
            </div>
          ))}
        </div>

        {/* Food pairing section */}
        <section className="mb-6">
          <h2 className="text-lg font-medium mb-3">Food pairing</h2>
          
          <div className="space-y-2">
            {wine.foodPairings.map(pairing => (
              <div
                key={pairing.id}
                style={{
                  width: '100%',
                  paddingLeft: 24,
                  paddingRight: 24,
                  paddingTop: 16,
                  paddingBottom: 16,
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: 24,
                  outline: '1px white solid',
                  outlineOffset: '-1px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  color: 'white',
                  fontSize: 14,
                  fontFamily: 'Inter',
                  fontWeight: '400',
                  wordWrap: 'break-word'
                }}>
                  {pairing.name}
                </div>
                {pairing.active && 
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    padding: '4px 8px',
                    borderRadius: 12,
                    color: 'white',
                    fontSize: 12
                  }}>
                    Perfect match
                  </div>
                }
              </div>
            ))}
          </div>
        </section>

        {/* Taste characteristics */}
        <section className="mb-6">
          <h2 className="text-lg font-medium mb-3">Taste characteristics</h2>
          
          <div className="mb-3">
            {renderCharacteristicBar(wine.tasteCharacteristics.body, 'Light', 'Bold')}
            {renderCharacteristicBar(wine.tasteCharacteristics.sweet, 'Sweet', 'Dry')}
            {renderCharacteristicBar(wine.tasteCharacteristics.smooth, 'Smooth', 'Tannic')}
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
              <h3 className="text-base font-semibold mb-2 text-primary">→ {category.type}</h3>
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
          <Button fullWidth>
            Buy again
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WineDetails;