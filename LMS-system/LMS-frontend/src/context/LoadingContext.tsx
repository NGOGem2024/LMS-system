import { createContext, useState, useContext, ReactNode } from 'react';
import { LoadingOverlay, PageLoading } from '../components/ui/LoadingComponents';

interface LoadingContextType {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
  setPageLoading: (isLoading: boolean) => void;
  isPageLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  startLoading: () => {},
  stopLoading: () => {},
  setPageLoading: () => {},
  isPageLoading: false
});

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);

  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);

  return (
    <LoadingContext.Provider value={{ 
      isLoading, 
      startLoading, 
      stopLoading,
      isPageLoading,
      setPageLoading: setIsPageLoading
    }}>
      {isLoading && <LoadingOverlay open={isLoading} />}
      {isPageLoading && <PageLoading />}
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);

export default LoadingContext; 