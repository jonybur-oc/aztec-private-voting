import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AccountWalletWithSecretKey, PXE } from '@aztec/aztec.js';

export interface AztecClient {
  pxe: PXE;
  wallet: AccountWalletWithSecretKey;
}

export interface AztecProviderProps {
  client: AztecClient | null;
  loading?: boolean;
  error?: string | null;
  children: ReactNode;
}

interface AztecContextValue {
  client: AztecClient | null;
  loading: boolean;
  error: string | null;
}

const AztecContext = createContext<AztecContextValue | null>(null);

export function AztecProvider({
  client,
  loading = false,
  error = null,
  children,
}: AztecProviderProps): JSX.Element {
  const value = useMemo<AztecContextValue>(
    () => ({ client, loading, error }),
    [client, loading, error],
  );
  return <AztecContext.Provider value={value}>{children}</AztecContext.Provider>;
}

export function useAztec(): AztecContextValue {
  const ctx = useContext(AztecContext);
  if (!ctx) {
    throw new Error('useAztec must be used inside <AztecProvider>');
  }
  return ctx;
}

export function useAztecClient(): AztecClient {
  const { client } = useAztec();
  if (!client) {
    throw new Error('Aztec client is not connected yet');
  }
  return client;
}

export interface BrowserAztecOptions {
  pxeUrl: string;
  createWallet: (pxe: PXE) => Promise<AccountWalletWithSecretKey>;
}

export function useBrowserAztecClient(options: BrowserAztecOptions): AztecContextValue {
  const [state, setState] = useState<AztecContextValue>({
    client: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    const connect = async (): Promise<void> => {
      try {
        const { createPXEClient, waitForPXE } = await import('@aztec/aztec.js');
        const pxe = createPXEClient(options.pxeUrl);
        await waitForPXE(pxe);
        const wallet = await options.createWallet(pxe);
        if (!cancelled) {
          setState({ client: { pxe, wallet }, loading: false, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            client: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to connect to Aztec',
          });
        }
      }
    };
    void connect();
    return () => {
      cancelled = true;
    };
  }, [options]);

  return state;
}
