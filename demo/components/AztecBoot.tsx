import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AztecProvider,
  useBrowserAztecClient,
  setPrivateVotingArtifact,
} from '@aztec-private-voting/react';
import type { ContractArtifact } from '@aztec/aztec.js';

import { createDemoWallet } from '../lib/aztec';

interface AztecBootProps {
  children: ReactNode;
}

export function AztecBoot({ children }: AztecBootProps): JSX.Element {
  const [artifactReady, setArtifactReady] = useState(false);
  const [artifactError, setArtifactError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const mod = (await import(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          /* webpackIgnore: true */ '../public/private_voting-PrivateVoting.json' as any
        )) as { default: ContractArtifact } | ContractArtifact;
        const artifact = 'default' in mod ? mod.default : mod;
        setPrivateVotingArtifact(artifact);
        if (!cancelled) setArtifactReady(true);
      } catch (err) {
        if (!cancelled) {
          setArtifactError(
            err instanceof Error
              ? err.message
              : 'Could not load contract artifact. Run `nargo compile` and copy the JSON into demo/public.',
          );
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const pxeUrl = process.env.NEXT_PUBLIC_AZTEC_PXE_URL;
  if (!pxeUrl) {
    return (
      <div className="boot-error">
        Missing NEXT_PUBLIC_AZTEC_PXE_URL - copy .env.example to .env.local.
      </div>
    );
  }

  if (artifactError) {
    return <div className="boot-error">{artifactError}</div>;
  }

  if (!artifactReady) {
    return <div className="boot-loading">Loading contract artifact...</div>;
  }

  return <ConnectedProvider pxeUrl={pxeUrl}>{children}</ConnectedProvider>;
}

function ConnectedProvider({
  pxeUrl,
  children,
}: {
  pxeUrl: string;
  children: ReactNode;
}): JSX.Element {
  const state = useBrowserAztecClient({ pxeUrl, createWallet: createDemoWallet });
  return (
    <AztecProvider client={state.client} loading={state.loading} error={state.error}>
      {state.loading ? (
        <div className="boot-loading">Connecting to Aztec...</div>
      ) : state.error ? (
        <div className="boot-error">Aztec connection failed: {state.error}</div>
      ) : (
        children
      )}
    </AztecProvider>
  );
}
