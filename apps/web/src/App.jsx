import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '@/providers/AppProvider';
import { AppRouter } from '@/router';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </BrowserRouter>
  );
}
