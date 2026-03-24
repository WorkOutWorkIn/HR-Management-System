import { HeroUIProvider } from '@heroui/react';
import { useHref, useNavigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';

export function AppProvider({ children }) {
  const navigate = useNavigate();
  const useHeroHref = useHref;

  return (
    <HeroUIProvider navigate={navigate} useHref={useHeroHref}>
      <AuthProvider>{children}</AuthProvider>
    </HeroUIProvider>
  );
}
