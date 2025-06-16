import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/Toaster";
import { TooltipProvider } from "@/components/ui/Tooltip";
import NotFound from "@/pages/NotFound";
import WineDetails from "@/pages/WineDetails";
import Cellar from "@/pages/Cellar";
import ConversationDialog from "@/pages/ConversationDialog";
import HomeGlobalRefactored from "@/pages/HomeGlobalRefactored";
import WineScan from "@/pages/WineScan";
import WineEditRefactored from "@/pages/WineEditRefactored";
import TenantAdminRefactored from "@/pages/TenantAdminRefactored";
import SommTenantAdmin from "@/pages/SommTenantAdmin";
import TenantCreate from "@/pages/TenantCreate";
import QRCodes from "@/pages/QRCodes";
import QRDemo from "@/pages/QRDemo";
import { useEffect } from "react";


function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeGlobalRefactored} />
      <Route path="/scanned" component={WineDetails} />
      <Route path="/cellar" component={Cellar} />
      <Route path="/wine/conversation" component={ConversationDialog} />
      <Route path="/wine-details/:id" component={() => 
        <WineDetails key={`wine-${Date.now()}`} />
      } />
      <Route path="/tenants/:tenantSlug/admin" component={TenantAdminRefactored} />
      <Route path="/winery-tenant-admin" component={TenantAdminRefactored} />
      <Route path="/somm-tenant-admin" component={SommTenantAdmin} />
      <Route path="/tenant-create" component={TenantCreate} />

      <Route path="/wine-edit/:id" component={WineEditRefactored} />
      <Route path="/scan-wine/:id" component={WineScan} />
      <Route path="/qr-codes" component={QRCodes} />
      <Route path="/qr-demo" component={QRDemo} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Global welcome message cache initialization
const initializeWelcomeAudioCache = async () => {
  if ((window as any).globalWelcomeAudioCache) return; // Already cached
  
  try {
    console.log("Initializing global welcome audio cache");
    // Use new dynamic welcome message
    const welcomeMessage = "Hello, I see you're looking at the 2021 Ridge Vineyards \"Lytton Springs,\" an excellent choice. The 2021 Lytton Springs Zinfandel expresses a nose of red and black raspberry, sage, and dark chocolate, followed by mid-palate is full bodied and features flavors of blackberry and ripe plum, ending with juicy acidity and a lengthy finish. Out of curiosity, are you planning to open a bottle soon? I can suggest serving tips or food pairings if you'd like.";
    const response = await fetch('/api/text-to-speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: welcomeMessage })
    });
    
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      const audioBlob = new Blob([buffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Create preloaded audio element
      const audioElement = new Audio(audioUrl);
      audioElement.preload = 'auto';
      
      await new Promise((resolve, reject) => {
        audioElement.oncanplaythrough = resolve;
        audioElement.onerror = reject;
        audioElement.load();
      });
      
      (window as any).globalWelcomeAudioCache = {
        url: audioUrl,
        element: audioElement
      };
      console.log("Global welcome audio cache ready for instant playback");
    }
  } catch (error) {
    console.error("Failed to initialize global welcome audio cache:", error);
  }
};

function App() {
  // Initialize welcome audio cache early
  useEffect(() => {
    // Start caching after app initializes
    setTimeout(() => {
      initializeWelcomeAudioCache();
    }, 2000);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="mobile-fullscreen">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
