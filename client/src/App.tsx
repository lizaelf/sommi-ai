import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/feedback/Toaster";
import { TooltipProvider } from "@/components/ui/overlays/Tooltip";
import NotFound from "@/pages/NotFound";
import WineDetails from "@/pages/end-user/WineDetails";
import FoodPairings from "@/pages/end-user/FoodPairings";
import Cellar from "@/pages/end-user/Cellar";
import ConversationDialog from "@/pages/end-user/ConversationDialog";
import ChatPage from "@/pages/end-user/ChatPage";
import FoodPairingSuggestionsPage from "@/pages/end-user/FoodPairingSuggestionsPage";

import HomeGlobal from "@/pages/end-user/HomeGlobal";
import WineScan from "@/pages/end-user/WineScan";
import WineEditRefactored from "@/pages/end-user/WineEditRefactored";
import TenantAdminRefactored from "@/pages/admin/TenantAdminRefactored";
import SommTenantAdmin from "@/pages/admin/SommTenantAdmin";
import TenantCreate from "@/pages/admin/TenantCreate";
import QRCodes from "@/pages/end-user/QRCodes";
import QRDemo from "@/pages/end-user/QRDemo";
import { useEffect } from "react";

// Scroll restoration for deployed versions
function useScrollRestoration() {
  useEffect(() => {
    // Ensure scroll position is at top on route changes
    const handleRouteChange = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    // Fix iOS Safari scroll issues
    const handleTouchMove = (e: TouchEvent) => {
      // Prevent elastic scrolling on iOS
      if (window.scrollY === 0 && e.touches[0].pageY > e.touches[0].clientY) {
        e.preventDefault();
      }
    };

    // Add scroll restoration on page navigation
    window.addEventListener('popstate', handleRouteChange);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    // Ensure proper viewport height calculation
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      document.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', setViewportHeight);
    };
  }, []);
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeGlobal} />
      <Route path="/scanned" component={WineDetails} />
      <Route path="/cellar" component={Cellar} />
      <Route path="/wine/conversation" component={ConversationDialog} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/food-pairings-ai" component={FoodPairingSuggestionsPage} />
      <Route path="/wine-details/:id" component={() => 
        <WineDetails key={`wine-${Date.now()}`} />
      } />
      <Route path="/food-pairings/:id" component={FoodPairings} />
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
  useScrollRestoration();

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
