import React from "react";
import { Camera, ScanFace, Users } from "lucide-react";

export default function MobileBottomNav({ onCamera, onScan, onPerson }) {
  return (
    <nav className="mobile-bottom-nav" aria-label="Primary navigation">
      <button className="mobile-bottom-nav-item" type="button" onClick={onCamera} aria-label="Open camera">
        <Camera className="icon-svg" size={20} strokeWidth={2.2} />
      </button>

      <button className="mobile-bottom-nav-center" type="button" onClick={onScan} aria-label="Start scan">
        <ScanFace className="icon-svg" size={28} strokeWidth={2.2} />
      </button>

      <button className="mobile-bottom-nav-item" type="button" onClick={onPerson} aria-label="Open people view">
        <Users className="icon-svg" size={20} strokeWidth={2.2} />
      </button>
    </nav>
  );
}