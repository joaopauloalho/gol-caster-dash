import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
import GroupDetail from "./pages/GroupDetail";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import Pricing from "./pages/Pricing";
import PaymentReturn from "./pages/PaymentReturn";
import Admin from "./pages/Admin";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/**
 * AppShell — inner component with access to useLocation.
 *
 * On "/" (landing):
 *   - Outer wrapper is h-[100dvh] flex-col overflow-hidden so the Swiper
 *     inside SnapContainer fills the remaining flex-1 space below the Header.
 *   - BottomNav is hidden (fullscreen snap experience; nav covered by SectionDots).
 *
 * On all other routes: normal scrollable layout with BottomNav.
 */
const AppShell = () => {
  const { pathname } = useLocation();
  const isLanding = pathname === "/";

  return isLanding ? (
    // Fullscreen snap layout: fixed height, no native scroll
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-background">
      <Header />
      {/* flex-1 + overflow-hidden → Swiper fills exactly this box */}
      <div className="flex-1 overflow-hidden min-h-0">
        <Routes>
          <Route path="/" element={<Index />} />
        </Routes>
      </div>
      {/* BottomNav intentionally omitted on landing */}
    </div>
  ) : (
    // Normal scrollable layout for all other pages
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/jogos" element={<Matches />} />
        <Route path="/long-term" element={<LongTerm />} />
        <Route path="/rankings" element={<Rankings />} />
        <Route path="/grupos" element={<Groups />} />
        <Route path="/grupos/:id" element={<GroupDetail />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/planos" element={<Pricing />} />
        <Route path="/pagamento/retorno" element={<PaymentReturn />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/privacidade" element={<Privacy />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNav />
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppShell />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
