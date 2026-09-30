import type { NextConfig } from "next";

// `next dev` blocks dev resources (HMR etc.) for origins other than localhost.
// Allow typical LAN addresses so a tablet on the same Wi-Fi can load the dev
// server. Add more hosts via DEV_ORIGINS="my-laptop.local,foo.ngrok.app".
const extraOrigins = (process.env.DEV_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local", ...extraOrigins],
};

export default nextConfig;
