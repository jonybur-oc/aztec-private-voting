import type { ContractArtifact } from '@aztec/aztec.js';

let cached: ContractArtifact | null = null;

export const PrivateVotingContractArtifact: ContractArtifact = new Proxy(
  {} as ContractArtifact,
  {
    get(_target, prop) {
      if (!cached) {
        throw new Error(
          'PrivateVoting contract artifact has not been registered. ' +
            'Call setPrivateVotingArtifact(artifact) once at app startup with the JSON ' +
            'compiled by `nargo compile` (contracts/target/private_voting-PrivateVoting.json).',
        );
      }
      return cached[prop as keyof ContractArtifact];
    },
  },
);

export function setPrivateVotingArtifact(artifact: ContractArtifact): void {
  cached = artifact;
}
