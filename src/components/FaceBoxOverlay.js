import React from "react";
import { StyleSheet, View } from "react-native";

export default function FaceBoxOverlay({ box, imageSize, viewSize, color }) {
  if (!box || !imageSize || !viewSize) {
    return null;
  }

  const scaleX = viewSize.width / imageSize.width;
  const scaleY = viewSize.height / imageSize.height;

  const overlayStyle = {
    left: box.x * scaleX,
    top: box.y * scaleY,
    width: box.width * scaleX,
    height: box.height * scaleY,
    borderColor: color || "#22c55e"
  };

  return <View pointerEvents="none" style={[styles.box, overlayStyle]} />;
}

const styles = StyleSheet.create({
  box: {
    position: "absolute",
    borderWidth: 3,
    borderRadius: 10
  }
});
