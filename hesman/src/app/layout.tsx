import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HESMAN // Mecha Assembly System",
  description:
    "Interactive 3D mecha assembly simulator — combine five robotic lions into HESMAN.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" data-theme="dark">
      <body
        className="min-h-full flex flex-col overflow-hidden"
        style={{
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {children}
      </body>
    </html>
  );
}
