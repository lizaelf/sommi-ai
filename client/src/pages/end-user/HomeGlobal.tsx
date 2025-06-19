import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import AppHeader, { HeaderSpacer } from "@/components/layout/AppHeader";
import { WelcomeSection } from "@/components/home-global/WelcomeSection";
import { WineCollection } from "@/components/home-global/WineCollection";

interface Wine {
  id: number;
  name: string;
  year: number;
  bottles: number;
  image: string;
  ratings: {
    vn: number;
    jd: number;
    ws: number;
    abv: number;
  };
  buyAgainLink?: string;
  qrCode?: string;
  qrLink?: string;
}

const HomeGlobal = () => {
  const [location, setLocation] = useLocation();
  const [wines, setWines] = useState<Wine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWineClick = (wineId: number) => {
    // Navigate to wine details page for any wine
    setLocation(`/wine-details/${wineId}`);
  };

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetch('/api/wines')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch wines');
        return res.json();
      })
      .then((data: Wine[]) => {
        setWines(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError('Не вдалося завантажити вина. Спробуйте пізніше.');
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white mx-auto" style={{ maxWidth: "1200px" }}>
      <AppHeader />
      <HeaderSpacer />
      <WelcomeSection />
      {error && (
        <div style={{ color: '#FF6B6B', textAlign: 'center', margin: '24px 0' }}>{error}</div>
      )}
      <WineCollection 
        wines={wines}
        onWineClick={handleWineClick}
        isLoading={isLoading}
      />
    </div>
  );
};

export default HomeGlobal;