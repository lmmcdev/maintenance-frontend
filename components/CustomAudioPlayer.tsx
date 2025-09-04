"use client";

import React, { useRef, useState, useEffect } from "react";
import { Box, IconButton, Slider, Typography } from "@mui/material";
import Replay10Icon from "@mui/icons-material/Replay10";
import Forward10Icon from "@mui/icons-material/Forward10";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";

type Props = { src?: string | null };

export default function CustomAudioPlayer({ src }: Props) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  // (re)crear el elemento de audio cuando cambia src
  useEffect(() => {
    // limpiar anterior
    if (audio.current) {
      audio.current.pause();
      audio.current.src = "";
      audio.current = null;
    }
    if (!src) {
      setPlaying(false);
      setTime(0);
      setDuration(0);
      return;
    }
    const a = new Audio(src);
    audio.current = a;

    const onLoaded = () => setDuration(a.duration || 0);
    const onTime = () => setTime(a.currentTime || 0);

    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("timeupdate", onTime);

    return () => {
      a.pause();
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("timeupdate", onTime);
      audio.current = null;
    };
  }, [src]);

  useEffect(() => {
    const a = audio.current;
    if (a) a.volume = volume;
  }, [volume]);

  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    playing ? a.play() : a.pause();
  }, [playing]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(secs % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  const seekTo = (val: number) => {
    const a = audio.current;
    if (!a) return;
    a.currentTime = val;
    setTime(val);
  };

  const skip = (delta: number) => {
    const newTime = Math.min(duration, Math.max(0, time + delta));
    seekTo(newTime);
  };

  const disabled = !src;
  const hasAudio = !!src;

  return (
    <Box
      sx={{
        p: { xs: 1, sm: 1.5, md: 2 },
        borderRadius: { xs: "10px", sm: "12px", md: "16px" },
        boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.08), 0px 4px 12px rgba(0, 0, 0, 0.1)",
        display: "flex",
        alignItems: "center",
        gap: { xs: 0.5, sm: 1, md: 2 },
        bgcolor: "#fff",
        opacity: disabled ? 0.85 : 1,
        flexWrap: { xs: "wrap", sm: "nowrap" },
        border: "1px solid #e5e7eb",
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.12), 0px 8px 20px rgba(0, 0, 0, 0.15)",
          transform: "translateY(-1px)",
        },
      }}
    >
      {/* skip/play group */}
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.25, sm: 0.5, md: 1 } }}>
        <IconButton 
          onClick={() => skip(-10)} 
          size="small" 
          disabled={disabled}
          sx={{ p: { xs: 0.25, sm: 0.5, md: 1 } }}
        >
          <Replay10Icon sx={{ fontSize: { xs: 16, sm: 18, md: 20 }, color: hasAudio ? "inherit" : "#d1d5db" }} />
        </IconButton>

        <IconButton
          onClick={() => setPlaying((p) => !p)}
          size="small"
          sx={{ 
            width: { xs: 24, sm: 28, md: 32 }, 
            height: { xs: 24, sm: 28, md: 32 }, 
            color: hasAudio ? "#111629" : "#d1d5db",
            "&:hover": {
              transform: hasAudio ? "scale(1.1)" : "none",
              bgcolor: hasAudio ? "#f3f4f6" : "transparent",
            },
          }}
          disabled={disabled}
        >
          {playing ? (
            <PauseRoundedIcon sx={{ fontSize: { xs: 22, sm: 26, md: 30 }, color: hasAudio ? "#111629" : "#d1d5db" }} />
          ) : (
            <PlayArrowRoundedIcon sx={{ fontSize: { xs: 22, sm: 26, md: 30 }, color: hasAudio ? "#111629" : "#d1d5db" }} />
          )}
        </IconButton>

        <IconButton 
          onClick={() => skip(10)} 
          size="small" 
          disabled={disabled}
          sx={{ p: { xs: 0.25, sm: 0.5, md: 1 } }}
        >
          <Forward10Icon sx={{ fontSize: { xs: 16, sm: 18, md: 20 }, color: hasAudio ? "inherit" : "#d1d5db" }} />
        </IconButton>
      </Box>

      {/* divider */}
      <Box
        sx={{
          width: "1px",
          bgcolor: "#eff1f6",
          alignSelf: "stretch",
          mx: { xs: "2px", sm: "4px" },
          display: { xs: "none", sm: "block" },
        }}
      />

      {/* time & slider */}
      <Typography 
        variant="caption" 
        sx={{ 
          width: { xs: 30, sm: 35, md: 40 }, 
          textAlign: "right",
          fontSize: { xs: "0.65rem", sm: "0.7rem", md: "0.75rem" },
          fontWeight: "medium",
          display: { xs: "none", md: "block" },
        }}
      >
        {formatTime(time)}
      </Typography>

      <Slider
        size="small"
        value={hasAudio ? Math.min(time, duration) : 0}
        min={0}
        max={hasAudio ? (duration || 0) : 100}
        onChange={(_, v) => seekTo(v as number)}
        disabled={disabled}
        sx={{
          flexGrow: 1,
          order: { xs: 3, sm: 0 },
          width: { xs: "100%", sm: "auto" },
          mt: { xs: 0.5, sm: 0 },
          mx: { xs: 0, sm: 0.5 },
          "& .MuiSlider-rail": {
            color: "#e5e7eb",
            height: { xs: 2, sm: 3, md: 4 },
          },
          "& .MuiSlider-track": {
            color: hasAudio ? "#00a1ff" : "#d1d5db",
            height: { xs: 2, sm: 3, md: 4 },
          },
          "& .MuiSlider-thumb": {
            width: { xs: 8, sm: 10, md: 12 },
            height: { xs: 8, sm: 10, md: 12 },
            color: hasAudio ? "#00a1ff" : "#d1d5db",
            "&:hover, &.Mui-focusVisible": { boxShadow: hasAudio ? "0 0 0 4px rgba(0, 161, 255, 0.2)" : "none" },
          },
        }}
      />

      <Typography 
        variant="caption" 
        sx={{ 
          width: { xs: 30, sm: 35, md: 40 }, 
          textAlign: "left",
          fontSize: { xs: "0.65rem", sm: "0.7rem", md: "0.75rem" },
          fontWeight: "medium",
          display: { xs: "none", md: "block" },
        }}
      >
        {formatTime(duration)}
      </Typography>

      {/* Mobile time display */}
      <Typography 
        variant="caption" 
        sx={{ 
          display: { xs: "block", md: "none" },
          fontSize: { xs: "0.65rem", sm: "0.7rem" },
          fontWeight: "medium",
          color: hasAudio ? "#6b7280" : "#9ca3af",
          order: 2,
          minWidth: { xs: "70px", sm: "80px" },
          textAlign: "center",
        }}
      >
        {hasAudio ? `${formatTime(time)} / ${formatTime(duration)}` : "00:00 / 00:00"}
      </Typography>

      {/* volume */}
      <VolumeUpIcon 
        sx={{ 
          fontSize: { xs: 16, sm: 18, md: 20 }, 
          opacity: disabled ? 0.3 : 1,
          color: hasAudio ? "#6b7280" : "#d1d5db",
          display: { xs: "none", lg: "block" },
        }} 
      />
      <Slider
        size="small"
        value={volume}
        min={0}
        max={1}
        step={0.01}
        onChange={(_, v) => setVolume(v as number)}
        disabled={disabled}
        sx={{ 
          width: { xs: 50, sm: 60, md: 80 },
          display: { xs: "none", lg: "block" },
          "& .MuiSlider-rail": {
            color: "#e5e7eb",
            height: { xs: 2, sm: 3 },
          },
          "& .MuiSlider-track": {
            color: hasAudio ? "#6b7280" : "#d1d5db",
            height: { xs: 2, sm: 3 },
          },
          "& .MuiSlider-thumb": {
            width: { xs: 6, sm: 8 },
            height: { xs: 6, sm: 8 },
            "&:hover, &.Mui-focusVisible": { boxShadow: "0 0 0 4px rgba(107, 114, 128, 0.2)" },
          },
        }}
      />

      {disabled && (
        <Typography
          variant="caption"
          sx={{
            ml: { xs: 0.5, sm: 1 },
            px: { xs: 1, sm: 1.5, md: 2 },
            py: { xs: 0.5, sm: 0.75 },
            borderRadius: { xs: "6px", sm: "8px" },
            bgcolor: "#f9fafb",
            color: "#9ca3af",
            border: "1px dashed #d1d5db",
            fontSize: { xs: "0.65rem", sm: "0.7rem", md: "0.75rem" },
            fontWeight: "medium",
            order: { xs: 4, sm: 0 },
            mt: { xs: 0.5, sm: 0 },
            textAlign: "center",
          }}
        >
          No audio file
        </Typography>
      )}
    </Box>
  );
}
