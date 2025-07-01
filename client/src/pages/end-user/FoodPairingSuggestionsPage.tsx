import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import AppHeader, { HeaderSpacer } from '@/components/layout/AppHeader';
import Button from '@/components/ui/buttons/Button';
import typography from '@/styles/typography';
import { DataSyncManager } from '@/utils/dataSync';

interface Wine {
  id: number;
  name: string;
  year?: number;
  image: string;
  bottles: number;
  ratings: {
    vn: number;
    jd: number;
    ws: number;
    abv: number;
  };
  location?: string;
  description?: string;
}

interface FoodPairing {
  id: string;
  category: string;
  dish: string;
  description: string;
  pairing_reason: string;
  intensity: number;
}

// Додаю функцію для підбору emoji за назвою страви
function getDishEmoji(dish: string) {
  const d = dish.toLowerCase();
  if (d.includes('steak') || d.includes('beef') || d.includes('lamb') || d.includes('pork') || d.includes('rib') || d.includes('veal')) return '🥩';
  if (d.includes('chicken') || d.includes('duck') || d.includes('turkey') || d.includes('poultry')) return '🍗';
  if (d.includes('fish') || d.includes('salmon') || d.includes('tuna') || d.includes('trout') || d.includes('seafood') || d.includes('shrimp') || d.includes('crab')) return '🐟';
  if (d.includes('cheese')) return '🧀';
  if (d.includes('mushroom') || d.includes('veggie') || d.includes('vegetarian') || d.includes('eggplant') || d.includes('ratatouille') || d.includes('vegetable')) return '🍄';
  if (d.includes('dessert') || d.includes('cake') || d.includes('tart') || d.includes('pudding') || d.includes('sweet')) return '🍰';
  if (d.includes('pizza')) return '🍕';
  if (d.includes('pasta') || d.includes('spaghetti') || d.includes('lasagna')) return '🍝';
  if (d.includes('bread')) return '🍞';
  if (d.includes('salad')) return '🥗';
  if (d.includes('soup')) return '🥣';
  return '🍽️';
}

const FoodPairingSuggestionsPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const [currentWine, setCurrentWine] = useState<Wine | null>(null);
  const [foodPairings, setFoodPairings] = useState<FoodPairing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current wine data
  useEffect(() => {
    const loadWineData = async () => {
      try {
        const wines = await DataSyncManager.getUnifiedWineData();
        // Use the first wine as default for food pairing context
        if (wines.length > 0) {
          setCurrentWine(wines[0]);
        }
      } catch (error) {
        console.error('Failed to load wine data:', error);
      }
    };

    loadWineData();
  }, []);

  // Generate food pairings when wine is loaded
  useEffect(() => {
    if (currentWine) {
      loadFoodPairings();
    }
  }, [currentWine]);

  const getCacheKey = (wine: Wine) => {
    return `food_pairings_${wine.id}`;
  };

  const loadFoodPairings = async () => {
    if (!currentWine) return;

    const cacheKey = getCacheKey(currentWine);
    
    // Check for cached food pairings first
    try {
      const cachedPairings = localStorage.getItem(cacheKey);
      if (cachedPairings) {
        const parsedPairings = JSON.parse(cachedPairings);
        console.log(`Loaded ${parsedPairings.length} cached food pairings for ${currentWine.name}`);
        setFoodPairings(parsedPairings);
        return;
      }
    } catch (error) {
      console.error('Error loading cached food pairings:', error);
    }

    // Generate new food pairings if not cached
    await generateFoodPairings();
  };

  const generateFoodPairings = async () => {
    if (!currentWine) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-food-pairings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wineName: currentWine.name,
          wineYear: currentWine.year,
          wineLocation: currentWine.location,
          wineDescription: currentWine.description,
          abv: currentWine.ratings.abv,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate food pairings');
      }

      const data = await response.json();
      const pairings = data.foodPairings || [];
      
      // Cache the generated food pairings
      const cacheKey = getCacheKey(currentWine);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(pairings));
        console.log(`Cached ${pairings.length} food pairings for ${currentWine.name}`);
      } catch (error) {
        console.error('Error caching food pairings:', error);
      }

      setFoodPairings(pairings);
    } catch (error) {
      console.error('Error generating food pairings:', error);
      setError('Failed to generate food pairings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackClick = () => {
    window.history.back();
  };

  const handleRefresh = async () => {
    if (!currentWine) return;
    
    // Clear cached data and regenerate
    const cacheKey = getCacheKey(currentWine);
    localStorage.removeItem(cacheKey);
    console.log(`Cleared cached food pairings for ${currentWine.name}`);
    
    await generateFoodPairings();
  };

  return (
    <div 
      className="bg-black text-white"
      style={{ 
        backgroundColor: "#0a0a0a",
        minHeight: "100vh",
        width: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        position: "relative"
      }}
    >
      <AppHeader 
        showBackButton={true}
        onBack={() => window.history.back()}
        title={currentWine?.name || ''}
      />
      <HeaderSpacer />
      {/* Content */}
      <div style={{ padding: "24px 16px", flex: 1 }}>
        {isLoading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 0",
              gap: "16px",
            }}
          >
            <RefreshCw size={32} color="white" className="animate-spin" />
            <p style={{ ...typography.body, color: "rgba(255, 255, 255, 0.8)" }}>
              Generating AI food pairings...
            </p>
          </div>
        )}

        {error && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 0",
              gap: "16px",
            }}
          >
            <p style={{ ...typography.body, color: "#EF4444", textAlign: "center" }}>
              {error}
            </p>
            <Button
              variant="primary"
              onClick={generateFoodPairings}
              style={{ padding: "12px 24px" }}
            >
              Try Again
            </Button>
          </div>
        )}

        {!isLoading && !error && foodPairings.length > 0 && (
          <div
            style={{
              display: "grid",
              gap: "20px",
              maxWidth: "800px",
              margin: "0 auto",
            }}
          >
            {foodPairings.map((pairing) => (
              <div
                key={pairing.id}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "12px",
                  padding: "20px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "12px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        ...typography.h2,
                        color: "white",
                        margin: "0 0 4px 0",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span role="img" aria-label="dish-emoji" style={{fontSize: '1.1em', marginRight: '6px'}}>{getDishEmoji(pairing.dish)}</span>{pairing.dish}
                    </h3>
                  </div>
                </div>
                <p
                  style={{
                    ...typography.body,
                    color: "rgba(255, 255, 255, 0.8)",
                    margin: "0 0 12px 0",
                    lineHeight: 1.5,
                  }}
                >
                  {pairing.pairing_reason}
                </p>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !error && foodPairings.length === 0 && currentWine && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 0",
              gap: "16px",
            }}
          >
            <p style={{ ...typography.body, color: "rgba(255, 255, 255, 0.6)", textAlign: "center" }}>
              No food pairings generated yet.
            </p>
            <Button
              variant="primary"
              onClick={generateFoodPairings}
              style={{ padding: "12px 24px" }}
            >
              Generate Pairings
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodPairingSuggestionsPage;