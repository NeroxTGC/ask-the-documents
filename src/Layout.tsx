import { Outlet, useLocation, Navigate } from "react-router-dom";
import { NextUIProvider } from "@nextui-org/react";
import "./Main.css";
import { useAuth, googleSignInUrl as signInUrl } from 'wasp/client/auth';

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
    <NextUIProvider>
      <div className="dark text-foreground bg-background min-h-screen">
        <Outlet />
      </div>
    </NextUIProvider>
  );
}
