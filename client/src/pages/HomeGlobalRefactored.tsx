import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { PageLayout } from "@/components/shared/PageLayout";
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

const HomeGlobalRefactored = () => {
  const [location, setLocation] = useLocation();
  const [wines, setWines] = useState<Wine[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleWineClick = (wineId: number) => {
    // Navigate to wine details page for any wine
    setLocation(`/wine-details/${wineId}`);
  };

  useEffect(() => {
    // Load wines from CRM storage - show only wines with ID1 and ID2
    const crmWines = JSON.parse(localStorage.getItem('admin-wines') || '[]');
    const filteredWines = crmWines.filter((wine: Wine) => wine.id === 1 || wine.id === 2);
    setWines(filteredWines);
  }, []);

  return (
    <PageLayout>
      <WelcomeSection />
      <WineCollection 
        wines={wines}
        onWineClick={handleWineClick}
        isLoading={isLoading}
      />
    </PageLayout>
  );
};

export default HomeGlobalRefactored;