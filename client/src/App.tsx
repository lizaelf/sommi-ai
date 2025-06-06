import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/Toaster";
import { TooltipProvider } from "@/components/ui/Tooltip";
import NotFound from "@/pages/NotFound";
import Scanned from "@/pages/Scanned";
import WineDetails from "@/pages/WineDetails";
import Cellar from "@/pages/Cellar";
import ConversationDialog from "@/pages/ConversationDialog";
import HomeGlobal from "@/pages/HomeGlobal";
import WineScan from "@/pages/WineScan";
import WineEdit from "@/pages/WineEdit";
import TenantAdmin from "@/pages/TenantAdmin";
import SommTenantAdmin from "@/pages/SommTenantAdmin";
import TenantCreate from "@/pages/TenantCreate";


function Router() {
  return (
    <Switch>
      <Route path="/" component={Scanned} />
      <Route path="/scanned" component={Scanned} />
      <Route path="/cellar" component={Cellar} />
      <Route path="/home-global" component={HomeGlobal} />
      <Route path="/wine/conversation" component={ConversationDialog} />
      <Route path="/wine-details/:id" component={WineDetails} />
      <Route path="/tenants/:tenantSlug/admin" component={TenantAdmin} />
      <Route path="/winery-tenant-admin" component={TenantAdmin} />
      <Route path="/somm-tenant-admin" component={SommTenantAdmin} />
      <Route path="/tenant-create" component={TenantCreate} />

      <Route path="/wine-edit/:id" component={WineEdit} />
      <Route path="/scan-wine/:id" component={WineScan} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
