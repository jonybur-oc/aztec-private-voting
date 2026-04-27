export function formatTimestamp(ms: number): string {
  const date = new Date(ms);
  const datePart = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${datePart} at ${timePart}`;
}

export function shortenHex(hex: string, head = 6, tail = 4): string {
  const stripped = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (stripped.length <= head + tail) {
    return `0x${stripped}`;
  }
  return `0x${stripped.slice(0, head)}...${stripped.slice(-tail)}`;
}

export function percent(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}
