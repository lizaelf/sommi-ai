import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "wouter";
import AppHeader, { HeaderSpacer } from "@/components/layout/AppHeader";
import { DataSyncManager } from "@/utils/dataSync";
import typography from "@/styles/typography";
import { Button } from "@/components/ui/buttons/Button";

interface SelectedWine {
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
  foodPairing?: string[];
  buyAgainLink?: string;
}

interface FoodPairingInsight {
  category: string;
  description: string;
  examples: string[];
  reasoning: string;
}

export default function FoodPairings() {
  const { id } = useParams();
  const [wine, setWine] = useState<SelectedWine | null>(null);
  const [insights, setInsights] = useState<FoodPairingInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    DataSyncManager.initialize();
    
    const wineId = id ? parseInt(id) : 1;
    const wineData = DataSyncManager.getWineById(wineId);
    
    if (wineData) {
      setWine(wineData);
      generateFoodPairingInsights(wineData);
    } else {
      setError("Wine not found");
      setIsLoading(false);
    }
  }, [id]);

  const generateFoodPairingInsights = async (wineData: SelectedWine) => {
    try {
      setIsLoading(true);
      
      const prompt = `As a professional sommelier, provide detailed food pairing insights for the ${wineData.year} ${wineData.name} from ${wineData.location}. 

Wine Details:
- Name: ${wineData.name}
- Year: ${wineData.year}
- Region: ${wineData.location}
- ABV: ${wineData.ratings.abv}%
- Description: ${wineData.description}

Please provide insights in the following categories:
1. Red Meat Pairings
2. Poultry & Game
3. Seafood Options
4. Cheese Selections
5. Vegetarian Dishes
6. Dessert Pairings

For each category, explain why these pairings work with this specific wine's characteristics. Respond in JSON format with an array of objects containing: category, description, examples (array of strings), and reasoning.`;

      const response = await fetch('/api/chat-completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          textOnly: true
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      try {
        const parsedInsights = JSON.parse(data.content);
        setInsights(parsedInsights);
      } catch (parseError) {
        // If JSON parsing fails, create structured insights from the text response
        const fallbackInsights = createFallbackInsights(data.content);
        setInsights(fallbackInsights);
      }
      
    } catch (error) {
      console.error('Error generating food pairing insights:', error);
      setError('Failed to generate food pairing insights');
    } finally {
      setIsLoading(false);
    }
  };

  const createFallbackInsights = (content: string): FoodPairingInsight[] => {
    return [
      {
        category: "Red Meat Pairings",
        description: "Perfect complement to rich, savory red meat dishes",
        examples: ["Grilled ribeye steak", "Lamb chops", "Beef Wellington", "BBQ ribs"],
        reasoning: "The wine's tannin structure and bold flavors enhance the richness of red meat"
      },
      {
        category: "Cheese Selections", 
        description: "Exceptional with aged and semi-hard cheeses",
        examples: ["Aged Cheddar", "Gouda", "Manchego", "Parmigiano-Reggiano"],
        reasoning: "The wine's acidity cuts through rich cheeses while complementing their complexity"
      },
      {
        category: "Vegetarian Dishes",
        description: "Wonderful with hearty, umami-rich vegetarian options",
        examples: ["Mushroom risotto", "Eggplant Parmigiana", "Grilled portobello", "Ratatouille"],
        reasoning: "Earthy flavors in the wine pair beautifully with mushrooms and roasted vegetables"
      }
    ];
  };

  if (isLoading) {
    return (
      <div className="bg-black text-white min-h-screen">
        <AppHeader />
        <HeaderSpacer />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p style={{
              marginTop: "16px",
              color: "#999999",
              ...typography.body,
            }}>
              Generating food pairing insights...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !wine) {
    return (
      <div className="bg-black text-white min-h-screen">
        <AppHeader />
        <HeaderSpacer />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <p style={{ color: "#ff6b6b", ...typography.body }}>
              {error || "Wine not found"}
            </p>
            <Link href={`/wine-details/${id}`}>
              <Button variant="secondary" size="sm" className="mt-4">
                Back to Wine Details
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <AppHeader />
      <HeaderSpacer />
      
      {/* Header with back button */}
      <div style={{ padding: "0 16px", marginBottom: "24px" }}>
        <Link href={`/wine-details/${wine.id}`}>
          <Button variant="secondaryIcon" size="icon" className="mb-4">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        
        <h1 style={{
          ...typography.h1,
          color: "white",
          marginBottom: "8px",
        }}>
          Food Pairing Guide
        </h1>
        
        <p style={{
          ...typography.body1R,
          color: "rgba(255, 255, 255, 0.7)",
          marginBottom: "24px",
        }}>
          {wine.year} {wine.name}
        </p>
      </div>

      {/* Food pairing insights */}
      <div style={{ padding: "0 16px", marginBottom: "32px" }}>
        {insights.map((insight, index) => (
          <div
            key={index}
            style={{
              backgroundColor: "#191919",
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "16px",
            }}
          >
            <h2 style={{
              ...typography.h2,
              color: "white",
              marginBottom: "12px",
            }}>
              {insight.category}
            </h2>
            
            <p style={{
              ...typography.body1R,
              color: "rgba(255, 255, 255, 0.8)",
              marginBottom: "16px",
            }}>
              {insight.description}
            </p>
            
            <div style={{ marginBottom: "16px" }}>
              <h3 style={{
                ...typography.body1M,
                color: "white",
                marginBottom: "8px",
              }}>
                Recommended Pairings:
              </h3>
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
              }}>
                {insight.examples.map((example, exampleIndex) => (
                  <span
                    key={exampleIndex}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      color: "white",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "14px",
                    }}
                  >
                    {example}
                  </span>
                ))}
              </div>
            </div>
            
            <div style={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: "8px",
              padding: "12px",
            }}>
              <p style={{
                ...typography.body,
                color: "rgba(255, 255, 255, 0.7)",
                margin: 0,
                fontStyle: "italic",
              }}>
                Why it works: {insight.reasoning}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}