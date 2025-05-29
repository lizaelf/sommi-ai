import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import Button from '@/components/ui/Button';
import typography from '@/styles/typography';
import { WINE_CONFIG } from '@shared/wineConfig';

interface WineData {
  // Primary wine information
  name: string;
  fullName: string;
  vintage: number;
  winery: string;
  vineyard: string;
  region: string;
  appellation: string;
  county: string;
  state: string;
  country: string;
  varietal: string;
  
  // Detailed characteristics
  characteristics: {
    body: number;
    sweet: number;
    dry: number;
    smooth: number;
    tannic: number;
  };
  
  // Professional ratings
  ratings: {
    ws: number;
    ww: number;
    js: number;
  };
  
  // Tasting notes and description
  tastingNotes: string[];
  
  // Historical information
  history: string;
}

interface WineCardData {
  id: number;
  name: string;
  bottles: number;
  image: string;
  ratings: {
    vn: number;
    jd: number;
    ws: number;
    abv: number;
  };
}

export default function AdminCRM() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'wine-config' | 'wine-cards' | 'app-settings'>('wine-config');
  const [wineData, setWineData] = useState<WineData>({
    ...WINE_CONFIG,
    tastingNotes: [...WINE_CONFIG.tastingNotes]
  });
  const [wineCards, setWineCards] = useState<WineCardData[]>([
    {
      id: 1,
      name: "Ridge \"Lytton Springs\" Dry Creek Zinfandel",
      bottles: 4,
      image: "/@fs/home/runner/workspace/attached_assets/Product%20Image.png",
      ratings: { vn: 95, jd: 93, ws: 93, abv: 14.3 }
    },
    {
      id: 2,
      name: "2021 Monte Bello Cabernet Sauvignon",
      bottles: 2,
      image: "/@fs/home/runner/workspace/attached_assets/image-2.png",
      ratings: { vn: 95, jd: 93, ws: 93, abv: 14.3 }
    }
  ]);

  const handleSaveWineConfig = async () => {
    try {
      // Here you would typically save to a backend API
      // For now, we'll save to localStorage and show a success message
      localStorage.setItem('wine_config', JSON.stringify(wineData));
      
      toast({
        title: "Wine Configuration Saved",
        description: "Wine configuration has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save wine configuration.",
        variant: "destructive",
      });
    }
  };

  const handleSaveWineCards = async () => {
    try {
      localStorage.setItem('wine_cards', JSON.stringify(wineCards));
      
      toast({
        title: "Wine Cards Saved",
        description: "Wine cards configuration has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save wine cards configuration.",
        variant: "destructive",
      });
    }
  };

  const updateWineData = (field: string, value: any) => {
    setWineData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateNestedWineData = (category: string, field: string, value: any) => {
    setWineData(prev => ({
      ...prev,
      [category]: {
        ...(prev[category as keyof WineData] as any),
        [field]: value
      }
    }));
  };

  const updateWineCard = (cardId: number, field: string, value: any) => {
    setWineCards(prev => prev.map(card => 
      card.id === cardId 
        ? { ...card, [field]: value }
        : card
    ));
  };

  const updateWineCardRating = (cardId: number, ratingType: string, value: number) => {
    setWineCards(prev => prev.map(card => 
      card.id === cardId 
        ? { 
            ...card, 
            ratings: { ...card.ratings, [ratingType]: value }
          }
        : card
    ));
  };

  const addTastingNote = () => {
    setWineData(prev => ({
      ...prev,
      tastingNotes: [...prev.tastingNotes, ""]
    }));
  };

  const updateTastingNote = (index: number, value: string) => {
    setWineData(prev => ({
      ...prev,
      tastingNotes: prev.tastingNotes.map((note, i) => 
        i === index ? value : note
      )
    }));
  };

  const removeTastingNote = (index: number) => {
    setWineData(prev => ({
      ...prev,
      tastingNotes: prev.tastingNotes.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/90 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation('/home-global')}
              className="text-white hover:text-white/80 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M15.707 4.293a1 1 0 0 1 0 1.414L9.414 12l6.293 6.293a1 1 0 0 1-1.414 1.414l-7-7a1 1 0 0 1 0-1.414l7-7a1 1 0 0 1 1.414 0" />
              </svg>
            </button>
            <h1 style={{ ...typography.h1, color: 'white' }}>Admin CRM</h1>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-white/10">
        <div className="flex">
          {[
            { key: 'wine-config', label: 'Wine Configuration' },
            { key: 'wine-cards', label: 'Wine Cards' },
            { key: 'app-settings', label: 'App Settings' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-white text-white'
                  : 'border-transparent text-white/60 hover:text-white/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'wine-config' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 style={{ ...typography.h1, color: 'white' }}>Wine Configuration</h2>
              <Button onClick={handleSaveWineConfig}>Save Changes</Button>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 style={{ ...typography.bodyPlus1, color: 'white' }}>Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/80 mb-2">Wine Name</label>
                  <input
                    type="text"
                    value={wineData.name}
                    onChange={(e) => updateWineData('name', e.target.value)}
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-2">Vintage</label>
                  <input
                    type="number"
                    value={wineData.vintage}
                    onChange={(e) => updateWineData('vintage', parseInt(e.target.value))}
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-2">Winery</label>
                  <input
                    type="text"
                    value={wineData.winery}
                    onChange={(e) => updateWineData('winery', e.target.value)}
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-2">Varietal</label>
                  <input
                    type="text"
                    value={wineData.varietal}
                    onChange={(e) => updateWineData('varietal', e.target.value)}
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-2">Region</label>
                  <input
                    type="text"
                    value={wineData.region}
                    onChange={(e) => updateWineData('region', e.target.value)}
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-2">Country</label>
                  <input
                    type="text"
                    value={wineData.country}
                    onChange={(e) => updateWineData('country', e.target.value)}
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white"
                  />
                </div>
              </div>
            </div>

            {/* Ratings */}
            <div className="space-y-4">
              <h3 style={{ ...typography.bodyPlus1, color: 'white' }}>Professional Ratings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-white/80 mb-2">Wine Spectator (WS)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={wineData.ratings.ws}
                    onChange={(e) => updateNestedWineData('ratings', 'ws', parseInt(e.target.value))}
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-2">Wine & Whiskey (WW)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={wineData.ratings.ww}
                    onChange={(e) => updateNestedWineData('ratings', 'ww', parseInt(e.target.value))}
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-2">James Suckling (JS)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={wineData.ratings.js}
                    onChange={(e) => updateNestedWineData('ratings', 'js', parseInt(e.target.value))}
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white"
                  />
                </div>
              </div>
            </div>

            {/* Wine History */}
            <div className="space-y-4">
              <h3 style={{ ...typography.bodyPlus1, color: 'white' }}>Wine History</h3>
              <textarea
                value={wineData.history}
                onChange={(e) => updateWineData('history', e.target.value)}
                rows={6}
                className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white resize-none"
                placeholder="Enter wine history and background..."
              />
            </div>

            {/* Tasting Notes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 style={{ ...typography.bodyPlus1, color: 'white' }}>Tasting Notes</h3>
                <Button onClick={addTastingNote}>Add Note</Button>
              </div>
              <div className="space-y-3">
                {wineData.tastingNotes.map((note, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => updateTastingNote(index, e.target.value)}
                      className="flex-1 p-3 bg-white/5 border border-white/20 rounded-lg text-white"
                      placeholder="Enter tasting note..."
                    />
                    <button
                      onClick={() => removeTastingNote(index)}
                      className="p-3 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'wine-cards' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 style={{ ...typography.h1, color: 'white' }}>Wine Cards Management</h2>
              <Button onClick={handleSaveWineCards}>Save Changes</Button>
            </div>

            {wineCards.map((card) => (
              <div key={card.id} className="p-6 bg-white/5 rounded-lg border border-white/20">
                <h3 style={{ ...typography.bodyPlus1, color: 'white', marginBottom: '16px' }}>
                  Wine Card {card.id}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-white/80 mb-2">Wine Name</label>
                    <input
                      type="text"
                      value={card.name}
                      onChange={(e) => updateWineCard(card.id, 'name', e.target.value)}
                      className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/80 mb-2">Number of Bottles</label>
                    <input
                      type="number"
                      value={card.bottles}
                      onChange={(e) => updateWineCard(card.id, 'bottles', parseInt(e.target.value))}
                      className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm text-white/80">Ratings</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs text-white/60 mb-1">Vivino (VN)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={card.ratings.vn}
                        onChange={(e) => updateWineCardRating(card.id, 'vn', parseInt(e.target.value))}
                        className="w-full p-2 bg-white/5 border border-white/20 rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/60 mb-1">James Halliday (JD)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={card.ratings.jd}
                        onChange={(e) => updateWineCardRating(card.id, 'jd', parseInt(e.target.value))}
                        className="w-full p-2 bg-white/5 border border-white/20 rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/60 mb-1">Wine Spectator (WS)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={card.ratings.ws}
                        onChange={(e) => updateWineCardRating(card.id, 'ws', parseInt(e.target.value))}
                        className="w-full p-2 bg-white/5 border border-white/20 rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/60 mb-1">ABV (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.1"
                        value={card.ratings.abv}
                        onChange={(e) => updateWineCardRating(card.id, 'abv', parseFloat(e.target.value))}
                        className="w-full p-2 bg-white/5 border border-white/20 rounded text-white text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'app-settings' && (
          <div className="space-y-8">
            <h2 style={{ ...typography.h1, color: 'white' }}>Application Settings</h2>
            
            <div className="p-6 bg-white/5 rounded-lg border border-white/20">
              <h3 style={{ ...typography.bodyPlus1, color: 'white', marginBottom: '16px' }}>
                Coming Soon
              </h3>
              <p className="text-white/60">
                Additional application settings and configuration options will be available here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}