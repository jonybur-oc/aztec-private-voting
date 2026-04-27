import type { AppProps } from 'next/app';
import Link from 'next/link';

import '@aztec-private-voting/react/src/styles.css';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps): JSX.Element {
  return (
    <div className="demo-shell">
      <header className="demo-shell__header">
        <h1>Aztec Private Voting - Demo</h1>
        <nav>
          <Link href="/">Active vote</Link>
          <Link href="/closed">Closed vote</Link>
          <Link href="/admin">Admin</Link>
        </nav>
      </header>
      <main className="demo-shell__main">
        <Component {...pageProps} />
      </main>
    </div>
  );
}
