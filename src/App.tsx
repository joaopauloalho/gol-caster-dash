import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Index from "./pages/Index";
import Matches from "./pages/Matches";
import LongTerm from "./pages/LongTerm";
import Rankings from "./pages/Rankings";
import Groups from "./pages/Groups";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Header />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/jogos" element={<Matches />} />
            <Route path="/long-term" element={<LongTerm />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/grupos" element={<Groups />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/planos" element={<Pricing />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
