function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function simStructuralIntegrity(id: string, combined: boolean): number {
  const base = 84 + (hashString(id) % 13);
  return Math.min(99, combined ? base + 6 : base);
}

export function simPowerOutput(id: string, active: boolean): number {
  const base = 60 + (hashString(id + "pw") % 20);
  return active ? Math.min(100, base + 24) : base;
}
