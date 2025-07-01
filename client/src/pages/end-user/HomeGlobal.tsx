import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useParams } from "wouter";
import AppHeader, { HeaderSpacer } from "@/components/layout/AppHeader";
import { WelcomeSection } from "@/components/home-global/WelcomeSection";
import { WineCollection } from "@/components/home-global/WineCollection";
import { Wine } from "@/types/wine";
import { Tenant } from "@/types/tenant";

const HomeGlobal = () => {
  const params = useParams();
  const slug = params.slug;
  const [location, setLocation] = useLocation();
  const [wines, setWines] = useState<Wine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);

  const handleWineClick = (wineId: number) => {
    // Navigate to wine details page for any wine
    setLocation(`/wine-details/${wineId}`);
  };

  useEffect(() => {
    if (!slug) return;
    // Fetch tenant info by slug
    fetch(`/api/tenants/slug/${slug}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => setTenant(data))
      .catch(() => setTenant(null));
  }, [slug]);

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
        setError('Wines could not be loaded. Try again later.');
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white mx-auto" style={{ maxWidth: "1200px" }}>
      <AppHeader showMyCellarLink={true} />
      <HeaderSpacer />
      <WelcomeSection logoUrl={tenant?.profile?.wineryLogo} wineryName={tenant?.profile?.wineryName} />
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