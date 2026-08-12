import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export const QueryClientHookTestUtils = {
  createWrapperComponent() {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    function WrapperComponent({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    return {
      queryClient,
      wrapper: WrapperComponent,
    };
  },
};
