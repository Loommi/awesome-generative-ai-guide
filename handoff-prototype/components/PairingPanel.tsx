"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

/** Shown on the display until a controller joins: room code + QR to the controller URL. */
export function PairingPanel({ room, show }: { room: string; show: boolean }) {
  const [url, setUrl] = useState("");
  const [svg, setSvg] = useState("");

  useEffect(() => {
    const base = (process.env.NEXT_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, "");
    const target = `${base}/controller?room=${encodeURIComponent(room)}`;
    setUrl(target);
    QRCode.toString(target, {
      type: "svg",
      margin: 0,
      errorCorrectionLevel: "M",
      color: { dark: "#080D14", light: "#00000000" },
    }).then(setSvg, () => setSvg(""));
  }, [room]);

  return (
    <section className="pairing" data-show={show} aria-hidden={!show}>
      <p className="pairing-title">LINK PORTABLE TERMINAL</p>
      <div className="qr" dangerouslySetInnerHTML={{ __html: svg }} />
      <p className="pairing-label">ROOM CODE</p>
      <p className="room-code">{room}</p>
      <p className="pairing-url">{url.replace(/^https?:\/\//, "")}</p>
    </section>
  );
}
