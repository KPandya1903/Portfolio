"use client";
import { Component, type ReactNode } from "react";
import { failGuide } from "./environment";
import { guideStore, type GuideStore } from "./store";

/** A failed chunk, GLB load or WebGL error removes the guide quietly (docs/04 §8). */
export class GuideErrorBoundary extends Component<
  { children: ReactNode; store?: GuideStore },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    failGuide(this.props.store ?? guideStore);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
