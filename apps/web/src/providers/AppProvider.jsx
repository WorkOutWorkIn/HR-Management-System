import { HeroUIProvider } from '@heroui/react';
import { useHref, useNavigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/providers/ThemeProvider';

export function AppProvider({ children }) {
  const navigate = useNavigate();
  const useHeroHref = useHref;

  return (
    <ThemeProvider>
      <HeroUIProvider navigate={navigate} useHref={useHeroHref}>
        <AuthProvider>{children}</AuthProvider>
      </HeroUIProvider>
    </ThemeProvider>
  );
}
