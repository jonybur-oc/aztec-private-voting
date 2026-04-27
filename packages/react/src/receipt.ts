import type { VoteReceipt } from './types';

export function serializeReceipt(receipt: VoteReceipt): string {
  return JSON.stringify(
    {
      version: 1,
      kind: 'aztec-private-voting-receipt',
      ...receipt,
    },
    null,
    2,
  );
}

export function downloadReceipt(receipt: VoteReceipt): void {
  const blob = new Blob([serializeReceipt(receipt)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const filename = `vote-receipt-${receipt.voteId}-${receipt.timestamp}.json`;
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
