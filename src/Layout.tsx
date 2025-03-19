import { Outlet, useLocation } from "react-router-dom";
import { NextUIProvider } from "@nextui-org/react";
import "./Main.css";
import { useAuth, googleSignInUrl as signInUrl } from 'wasp/client/auth';
import { ThemeProvider } from './theme/ThemeContext';

export function Layout() {
  const { data: user, isLoading } = useAuth();
  const location = useLocation();

  // Verificar si la ruta actual es una ruta de chat
  const isChatRoute = location.pathname.startsWith('/chat');

  // Si es una ruta de chat y el usuario no está autenticado, redirigir al login de Google
  if (isChatRoute && !isLoading && !user) {
    // Redirigir a la URL de autenticación de Google
    window.location.href = signInUrl;
    return null; // Evitar renderizar mientras se redirige
  }

  return (
    <ThemeProvider>
      <NextUIProvider>
        <div className="min-h-screen text-foreground bg-background">
          <Outlet />
        </div>
      </NextUIProvider>
    </ThemeProvider>
  );
}
