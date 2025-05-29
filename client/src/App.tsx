import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import WineDetails from "@/pages/WineDetails";
import Cellar from "@/pages/Cellar";
import ConversationDialog from "@/pages/ConversationDialog";
import HomeGlobal from "@/pages/HomeGlobal";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/cellar" component={Cellar} />
      <Route path="/home-global" component={HomeGlobal} />
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
