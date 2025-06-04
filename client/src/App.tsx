import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Scanned from "@/pages/Scanned";
import WineDetails from "@/pages/WineDetails";
import Cellar from "@/pages/Cellar";
import ConversationDialog from "@/pages/ConversationDialog";
import HomeGlobal from "@/pages/HomeGlobal";
import AdminCRM from "@/pages/AdminCRM";
import WineScan from "@/pages/WineScan";
import WineEdit from "@/pages/WineEdit";
import TenantsSimple from "@/pages/TenantsSimple";
import TenantAdminCRM from "@/pages/TenantAdminCRM";


function Router() {
  return (
    <Switch>
      <Route path="/" component={Scanned} />
      <Route path="/scanned" component={Scanned} />
      <Route path="/cellar" component={Cellar} />
      <Route path="/home-global" component={HomeGlobal} />
      <Route path="/wine/conversation" component={ConversationDialog} />
      <Route path="/wine-details/:id" component={WineDetails} />
      <Route path="/admin-crm" component={AdminCRM} />
      <Route path="/tenants" component={TenantsSimple} />
      <Route path="/tenants/:tenantSlug/admin" component={TenantAdminCRM} />

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
