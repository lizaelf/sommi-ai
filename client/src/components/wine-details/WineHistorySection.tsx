import React, { useEffect, useState } from 'react';
import typography from '@/styles/typography';

interface WineHistorySectionProps {
  wine: {
    name: string;
    year?: number;
    description?: string;
  };
}

const WineHistorySection: React.FC<WineHistorySectionProps> = ({ wine }) => {
  const [aiDescription, setAIDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!wine) return;
    const fetchAIDescription = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/generate-tasting-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: wine.name, year: wine.year }),
        });
        if (response.ok) {
          const data = await response.json();
          setAIDescription(
            data && Array.isArray(data.tastingNotes) && data.tastingNotes.length > 0
              ? data.tastingNotes.map((n: { note: string }) => n.note).join(' ')
              : wine.description || null
          );
        } else {
          setAIDescription(wine.description || null);
        }
      } catch {
        setAIDescription(wine.description || null);
      } finally {
        setLoading(false);
      }
    };

    fetchAIDescription();
  }, [wine?.name, wine?.year, wine?.description]);

  return (
    <div
      style={{
        width: "100%",
        padding: "0 20px",
        marginTop: "24px",
        marginBottom: "32px",
      }}
    >
      <h1
        style={{
          ...typography.h1,
          color: "white",
          marginBottom: "16px",
          textAlign: "left",
        }}
      >
        Tasting notes
      </h1>
      <p
        style={{
          color: "rgba(255, 255, 255, 0.8)",
          textAlign: "left",
          marginBottom: "16px",
          ...typography.body,
        }}
      >
        {loading
          ? "Generating tasting notes..."
          : aiDescription ||
            "No tasting notes available for this wine."}
      </p>
    </div>
  );
};

export default WineHistorySection;