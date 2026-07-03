import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Reports from "./pages/Reports";
import CustomMeals from "./pages/CustomMeals";
import Ingredients from "./pages/Ingredients";
import DonBacilio from "./pages/DonBacilio";
import Shopping from "./pages/Shopping";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/reportes" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/mis-comidas" element={<ProtectedRoute><CustomMeals /></ProtectedRoute>} />
            <Route path="/ingredientes" element={<ProtectedRoute><Ingredients /></ProtectedRoute>} />
            <Route path="/super" element={<ProtectedRoute><Shopping /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
