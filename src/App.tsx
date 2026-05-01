import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { PresenceProvider } from "@/hooks/usePresence";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Perfil from "./pages/Perfil";
import EditarPerfil from "./pages/EditarPerfil";
import Chat from "./pages/Chat";
import Foro from "./pages/Foro";
import Mensajes from "./pages/Mensajes";
import Conversacion from "./pages/Conversacion";
import Usuarios from "./pages/Usuarios";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PresenceProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/foro" element={<Foro />} />
            <Route path="/mensajes" element={<Mensajes />} />
            <Route path="/mensajes/:username" element={<Conversacion />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/perfil/editar" element={<EditarPerfil />} />
            <Route path="/perfil/:username" element={<Perfil />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </PresenceProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
