import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <p>
          Welcome to Chat Frontend&nbsp;
          <code className={styles.code}>OpenWebUI Interface</code>
        </p>
        <div>
          <Link
            href="/openwebui"
            className="bg-primary text-white px-4 py-2 rounded text-decoration-none"
            style={{ backgroundColor: '#0d6efd', color: 'white', padding: '8px 16px', borderRadius: '4px', textDecoration: 'none' }}
          >
            Try OpenWebUI Interface
          </Link>
        </div>
      </div>

      <div className={styles.center}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js Logo"
          width={180}
          height={37}
          priority
        />
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '1rem' }}>Chat Frontend</h1>
        <p style={{ fontSize: '1.1rem', color: '#666', marginTop: '0.5rem' }}>Modern AI Chat Interface</p>
      </div>

      <div className={styles.grid}>
        <Link
          href="/openwebui"
          className={styles.card}
        >
          <h2>
            OpenWebUI <span>-&gt;</span>
          </h2>
          <p>Experience a modern AI chat interface with MDB components and multiple model support.</p>
        </Link>

        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className={styles.card}
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2>
            Learn <span>-&gt;</span>
          </h2>
          <p>Learn about Next.js in an interactive course with&nbsp;quizzes!</p>
        </a>

        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className={styles.card}
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2>
            Templates <span>-&gt;</span>
          </h2>
          <p>Explore starter templates for Next.js.</p>
        </a>

        <a
          href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className={styles.card}
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2>
            Deploy <span>-&gt;</span>
          </h2>
          <p>
            Instantly deploy your Next.js site to a shareable URL with Vercel.
          </p>
        </a>
      </div>
    </main>
  );
}
