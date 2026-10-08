"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("HESMAN 3D viewport failed to initialize:", error);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#01030a] p-8 text-center font-mono text-cyan-300">
          <div className="text-lg tracking-widest">3D RENDER SUBSYSTEM OFFLINE</div>
          <p className="max-w-md text-sm text-slate-400">
            Your browser or device could not initialize WebGL, which HESMAN requires to render the
            assembly hangar. Try a recent version of Chrome, Firefox, or Edge, and ensure hardware
            acceleration is enabled.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
