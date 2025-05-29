import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomeGlobal from "@/pages/HomeGlobal";
import WineDetails from "@/pages/WineDetails";
import Cellar from "@/pages/Cellar";
import ConversationDialog from "@/pages/ConversationDialog";
import CellarWinePage from "@/pages/CellarWinePage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeGlobal} />
      <Route path="/cellar" component={Cellar} />
      <Route path="/cellar-wines" component={CellarWinePage} />
      <Route path="/wine/details" component={WineDetails} />
      <Route path="/wine/conversation" component={ConversationDialog} />
      <Route path="/wine-details/:id" component={WineDetails} />
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
