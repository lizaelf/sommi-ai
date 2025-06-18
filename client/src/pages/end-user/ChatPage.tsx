import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import AppHeader, { HeaderSpacer } from '@/components/AppHeader';
import { EnhancedChatInterface } from '@/components/chat';
import Button from '@/components/ui/Button';
import typography from '@/styles/typography';
import { DataSyncManager } from '@/utils/dataSync';

interface Wine {
  id: number;
  name: string;
  year: number;
  image: string;
  bottles: number;
  ratings: {
    vn: number;
    jd: number;
    ws: number;
    abv: number;
  };
}

const ChatPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const [currentWine, setCurrentWine] = useState<Wine | null>(null);

  // Load current wine data
  useEffect(() => {
    const loadWineData = async () => {
      try {
        const wines = DataSyncManager.getUnifiedWineData();
        // Use the first wine as default for chat context
        if (wines.length > 0) {
          setCurrentWine(wines[0]);
        }
      } catch (error) {
        console.error('Failed to load wine data:', error);
      }
    };

    loadWineData();
  }, []);

  const handleBackClick = () => {
    // Navigate back to the previous page or home
    window.history.back();
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

      {/* Chat Page Header */}
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
          <h1
            style={{
              ...typography.h1,
              color: "white",
              margin: "0",
            }}
          >
            Chat History
          </h1>
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
            Conversation about {currentWine.year} {currentWine.name}
          </p>
        )}
      </div>

      {/* Full Chat Interface */}
      <div style={{ flex: 1, minHeight: "calc(100vh - 200px)" }}>
        <EnhancedChatInterface
          selectedWine={currentWine}
          isScannedPage={false}
        />
      </div>
    </div>
  );
};

export default ChatPage;