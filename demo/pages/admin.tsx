import dynamic from 'next/dynamic';
import { useState } from 'react';
import { VoteAdmin } from '@aztec-private-voting/react';
import type { VoteConfig } from '@aztec-private-voting/react';

const AztecBoot = dynamic(
  () => import('../components/AztecBoot').then((m) => m.AztecBoot),
  { ssr: false },
);

export default function AdminPage(): JSX.Element {
  const [deployed, setDeployed] = useState<VoteConfig | null>(null);
  return (
    <AztecBoot>
      {deployed ? (
        <div className="demo-deployed">
          <h2>Vote deployed</h2>
          <p>Contract address:</p>
          <code>{deployed.contractAddress}</code>
          <p>
            Add this to <code>NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS</code> in your{' '}
            <code>.env.local</code> and restart the dev server.
          </p>
        </div>
      ) : (
        <VoteAdmin onDeployed={setDeployed} />
      )}
    </AztecBoot>
  );
}
