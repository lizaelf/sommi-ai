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

function App() {
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
