import dynamic from 'next/dynamic';
import { useState } from 'react';
import { VoteAdmin, VoteFacilitator } from '@aztec-private-voting/react';
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
          <p>
            Vote deployed at <code>{deployed.contractAddress}</code>. Add this to
            <code> NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS</code> in your{' '}
            <code>.env.local</code> to wire the voter and result pages.
          </p>
          <VoteFacilitator config={deployed} />
        </div>
      ) : (
        <VoteAdmin onDeployed={setDeployed} />
      )}
    </AztecBoot>
  );
}
