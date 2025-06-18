import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Sparkles } from 'lucide-react';
import AppHeader, { HeaderSpacer } from '@/components/AppHeader';
import Button from '@/components/ui/Button';
import typography from '@/styles/typography';
import { DataSyncManager } from '@/utils/dataSync';

interface Wine {
  id: number;
  name: string;
  image: string;
  bottles: number;
  ratings: {
    vn: number;
    jd: number;
    ws: number;
    abv: number;
  };
  description?: string;
  location?: string;
  year?: number;
}

interface TastingNote {
  id: string;
  category: string;
  note: string;
  intensity: number;
}

const TastingNotesPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const [currentWine, setCurrentWine] = useState<Wine | null>(null);
  const [tastingNotes, setTastingNotes] = useState<TastingNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current wine data
  useEffect(() => {
    const loadWineData = async () => {
      try {
        const wines = DataSyncManager.getUnifiedWineData();
        // Use the first wine as default for tasting notes context
        if (wines.length > 0) {
          setCurrentWine(wines[0]);
        }
      } catch (error) {
        console.error('Failed to load wine data:', error);
      }
    };

    loadWineData();
  }, []);

  // Generate AI tasting notes
  const generateTastingNotes = async () => {
    if (!currentWine) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-tasting-notes', {
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
        throw new Error('Failed to generate tasting notes');
      }

      const data = await response.json();
      setTastingNotes(data.tastingNotes || []);
    } catch (error) {
      console.error('Error generating tasting notes:', error);
      setError('Failed to generate tasting notes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load tasting notes when wine is loaded
  useEffect(() => {
    if (currentWine) {
      generateTastingNotes();
    }
  }, [currentWine]);

  const handleBackClick = () => {
    window.history.back();
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 8) return '#FF6B6B'; // Strong - Red
    if (intensity >= 6) return '#4ECDC4'; // Medium - Teal
    if (intensity >= 4) return '#45B7D1'; // Light - Blue
    return '#96CEB4'; // Subtle - Green
  };

  const getIntensityLabel = (intensity: number) => {
    if (intensity >= 8) return 'Strong';
    if (intensity >= 6) return 'Medium';
    if (intensity >= 4) return 'Light';
    return 'Subtle';
  };

  return (
    <div 
      className="bg-black text-white min-h-screen"
      style={{ 
        backgroundColor: "#0a0a0a",
        minHeight: "100vh",
        overflowY: "auto",
        overflowX: "hidden"
      }}
    >
      {/* Header */}
      <AppHeader />
      <HeaderSpacer />

      {/* Tasting Notes Page Header */}
      <div
        style={{
          padding: "0 16px 16px 16px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "8px",
          }}
        >
          <Button
            variant="headerIcon"
            size="icon"
            onClick={handleBackClick}
            style={{
              width: "40px",
              height: "40px",
              padding: "8px",
            }}
          >
            <ArrowLeft size={20} color="white" />
          </Button>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={24} color="#4ECDC4" />
            <h1
              style={{
                ...typography.h1,
                color: "white",
                margin: "0",
              }}
            >
              AI Tasting Notes
            </h1>
          </div>
        </div>
        {currentWine && (
          <p
            style={{
              ...typography.body,
              color: "rgba(255, 255, 255, 0.6)",
              margin: "0",
              paddingLeft: "52px",
            }}
          >
            Detailed analysis of {currentWine.year} {currentWine.name}
          </p>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "24px 16px" }}>
        {error && (
          <div
            style={{
              backgroundColor: "rgba(255, 107, 107, 0.1)",
              border: "1px solid rgba(255, 107, 107, 0.3)",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "24px",
            }}
          >
            <p style={{ ...typography.body, color: "#FF6B6B", margin: "0" }}>
              {error}
            </p>
          </div>
        )}

        {isLoading && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "3px solid rgba(255, 255, 255, 0.1)",
                borderTop: "3px solid #4ECDC4",
                borderRadius: "50%",
                margin: "0 auto 16px",
                animation: "spin 1s linear infinite",
              }}
            />
            <p style={{ ...typography.body, color: "rgba(255, 255, 255, 0.6)" }}>
              Generating AI tasting notes...
            </p>
          </div>
        )}

        {!isLoading && tastingNotes.length > 0 && (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <h2
                style={{
                  ...typography.h2,
                  color: "white",
                  marginBottom: "8px",
                }}
              >
                Flavor Profile Analysis
              </h2>
              <p
                style={{
                  ...typography.body,
                  color: "rgba(255, 255, 255, 0.6)",
                  marginBottom: "16px",
                }}
              >
                AI-generated tasting notes based on wine characteristics and professional analysis
              </p>
            </div>

            <div style={{ display: "grid", gap: "16px" }}>
              {tastingNotes.map((note) => (
                <div
                  key={note.id}
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
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <h3
                      style={{
                        ...typography.h2,
                        fontSize: "18px",
                        color: "white",
                        margin: "0",
                      }}
                    >
                      {note.category}
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          ...typography.body1R,
                          color: getIntensityColor(note.intensity),
                          fontWeight: 500,
                        }}
                      >
                        {getIntensityLabel(note.intensity)}
                      </span>
                      <div
                        style={{
                          width: "60px",
                          height: "4px",
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                          borderRadius: "2px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${note.intensity * 10}%`,
                            height: "100%",
                            backgroundColor: getIntensityColor(note.intensity),
                            borderRadius: "2px",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <p
                    style={{
                      ...typography.body,
                      color: "rgba(255, 255, 255, 0.8)",
                      margin: "0",
                      lineHeight: "1.5",
                    }}
                  >
                    {note.note}
                  </p>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: "32px",
                textAlign: "center",
              }}
            >
              <Button
                variant="secondary"
                onClick={generateTastingNotes}
                style={{ padding: "12px 24px" }}
              >
                Regenerate Notes
              </Button>
            </div>
          </div>
        )}

        {!isLoading && tastingNotes.length === 0 && !error && currentWine && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <Sparkles size={48} color="rgba(255, 255, 255, 0.3)" style={{ margin: "0 auto 16px" }} />
            <p style={{ ...typography.body, color: "rgba(255, 255, 255, 0.6)" }}>
              No tasting notes available yet
            </p>
          </div>
        )}
      </div>


    </div>
  );
};

export default TastingNotesPage;