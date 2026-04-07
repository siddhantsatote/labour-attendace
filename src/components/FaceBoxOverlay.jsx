import React from "react";

export default function FaceBoxOverlay({ box, sourceSize, displaySize, color = "#22c55e" }) {
  if (!box || !sourceSize || !displaySize || !sourceSize.width || !sourceSize.height) {
    return null;
  }

  const scaleX = displaySize.width / sourceSize.width;
  const scaleY = displaySize.height / sourceSize.height;

  return (
    <div
      className="overlay"
      style={{
        position: "absolute",
        pointerEvents: "none",
        border: `3px solid ${color}`,
        borderRadius: 16,
        left: box.x * scaleX,
        top: box.y * scaleY,
        width: box.width * scaleX,
        height: box.height * scaleY
      }}
    />
  );
}
