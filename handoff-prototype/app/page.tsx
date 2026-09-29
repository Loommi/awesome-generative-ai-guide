import Link from "next/link";

export default function Home() {
  return (
    <main className="stage stage-home">
      <nav className="home-links">
        <Link href="/display">Display</Link>
        <Link href="/controller">Controller</Link>
      </nav>
      <p className="home-note">Open the display on the big screen, then scan its code with the tablet.</p>
    </main>
  );
}
