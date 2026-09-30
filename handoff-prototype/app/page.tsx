import Link from "next/link";

export default function Home() {
  return (
    <main className="stage stage-home">
      <p className="home-program">PROXIMA</p>
      <h1 className="home-title">EOS MISSION ARCHIVE</h1>
      <nav className="home-links">
        <Link href="/display">Command display</Link>
        <Link href="/controller">Portable terminal</Link>
      </nav>
      <p className="home-note">Open the command display on the big screen, then scan its code with the tablet.</p>
    </main>
  );
}
