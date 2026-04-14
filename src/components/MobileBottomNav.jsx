import React from "react";

export default function MobileBottomNav({ onCamera, onScan, onPerson }) {
  return (
    <nav className="mobile-bottom-nav" aria-label="Primary navigation">
      <button className="mobile-bottom-nav-item" type="button" onClick={onCamera} aria-label="Open camera">
        <span className="nav-glyph">◌</span>
      </button>

      <button className="mobile-bottom-nav-center" type="button" onClick={onScan} aria-label="Start scan">
        <span className="mobile-bottom-nav-center-inner">⌂</span>
      </button>

      <button className="mobile-bottom-nav-item" type="button" onClick={onPerson} aria-label="Open people view">
        <span className="nav-glyph">◔</span>
      </button>
    </nav>
  );
}