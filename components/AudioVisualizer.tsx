"use client";

import React from "react";
import { Box } from "@mui/material";

export default function AudioVisualizer({ isPlaying }: { isPlaying: boolean }) {
  const bars = new Array(5).fill(0);
  return (
    <Box sx={{ display: "flex", alignItems: "flex-end", gap: "4px", height: 24 }}>
      {bars.map((_, i) => (
        <Box
          key={i}
          sx={{
            width: "3px",
            height: isPlaying ? `${8 + (i % 3) * 5}px` : "8px",
            bgcolor: "#00A1FF",
            borderRadius: "2px",
            animation: isPlaying ? `avPulse 0.9s ease-in-out ${i * 0.07}s infinite` : "none",
            "@keyframes avPulse": {
              "0%, 100%": { height: "6px" },
              "50%": { height: `${16 + (i % 3) * 6}px` },
            },
          }}
        />
      ))}
    </Box>
  );
}
