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
import QRScanModal from "@/components/QRScanModal";
import { useEffect, useState } from "react";


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
// Welcome message caching is now handled entirely by VoiceAssistant component

function App() {
  const [showVoiceChoiceModal, setShowVoiceChoiceModal] = useState(false);

  useEffect(() => {
    const handleShowVoiceChoice = () => {
      console.log("🎤 App: Received show-voice-choice event");
      setShowVoiceChoiceModal(true);
    };

    window.addEventListener('show-voice-choice', handleShowVoiceChoice);
    
    return () => {
      window.removeEventListener('show-voice-choice', handleShowVoiceChoice);
    };
  }, []);

  const handleVoiceChoice = () => {
    console.log("🎤 App: User chose Voice option");
    setShowVoiceChoiceModal(false);
    window.dispatchEvent(new CustomEvent('voice-choice-selected'));
  };

  const handleTextChoice = () => {
    console.log("💬 App: User chose Text option");
    setShowVoiceChoiceModal(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="mobile-fullscreen">
          <Toaster />
          <Router />
          
          {/* Global Voice Choice Modal */}
          <QRScanModal
            isOpen={showVoiceChoiceModal}
            onClose={() => setShowVoiceChoiceModal(false)}
            onTextChoice={handleTextChoice}
            onVoiceChoice={handleVoiceChoice}
          />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
