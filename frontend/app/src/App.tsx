import { AppRouting } from '@/routing/app-routing';
import { ThemeProvider } from 'next-themes';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { LoadingBarContainer } from 'react-top-loading-bar';
import { Toaster } from '@/components/ui/sonner';
import { ClerkProviderWithRouter } from '@/auth/clerk-provider';
import { CondominiumProvider } from '@/contexts/condominium-context';

const { BASE_URL } = import.meta.env;

export function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      storageKey="vite-theme"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      <HelmetProvider>
        <LoadingBarContainer>
          <BrowserRouter basename={BASE_URL}>
            <ClerkProviderWithRouter>
              <CondominiumProvider>
                <Toaster />
                <AppRouting />
              </CondominiumProvider>
            </ClerkProviderWithRouter>
          </BrowserRouter>
        </LoadingBarContainer>
      </HelmetProvider>
    </ThemeProvider>
  );
}
