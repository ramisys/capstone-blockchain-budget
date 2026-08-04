import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';
import { ToastProvider } from '../components/ui/Toast';
import { AuthContext, type AuthContextValue } from '../context/AuthContext';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function createTestAuthValue(
  overrides: Partial<AuthContextValue> = {}
): AuthContextValue {
  return {
    user: null,
    isAuthenticated: false,
    loading: false,
    initializing: false,
    login: async () => {
      throw new Error('login not implemented in test');
    },
    logout: async () => undefined,
    hasRole: () => false,
    ...overrides,
  };
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  routerInitialEntries?: MemoryRouterProps['initialEntries'];
  authValue?: AuthContextValue;
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const {
    queryClient = createTestQueryClient(),
    routerInitialEntries = ['/'],
    authValue = createTestAuthValue(),
    ...renderOptions
  } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={routerInitialEntries}>
          <ToastProvider>
            <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

export * from '@testing-library/react';
