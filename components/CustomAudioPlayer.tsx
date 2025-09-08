"use client";

import React, { useRef, useState, useEffect } from "react";
import { Box, IconButton, Slider, Typography } from "@mui/material";
import Replay10Icon from "@mui/icons-material/Replay10";
import Forward10Icon from "@mui/icons-material/Forward10";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import { useLanguage } from "./context/LanguageContext";

type Props = { src?: string | null };

export default function CustomAudioPlayer({ src }: Props) {
  const { t } = useLanguage();
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

  const disabled = !src || duration === 0;
  const hasAudio = !!src && duration > 0;

  // If no source or duration is 0, show only message
  if (!src || duration === 0) {
    return (
      <Box
        sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          borderRadius: { xs: "10px", sm: "12px", md: "16px" },
          bgcolor: "#f9fafb",
          border: "1px dashed #d1d5db",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: { xs: 60, sm: 70, md: 80 },
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "#9ca3af",
            fontSize: { xs: "0.7rem", sm: "0.75rem", md: "0.8rem" },
            fontWeight: "medium",
            textAlign: "center",
          }}
        >
          {!src ? t("no.audio.file") : t("audio.invalid")}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 1, sm: 1.5, md: 2 },
        borderRadius: { xs: "10px", sm: "12px", md: "16px" },
        boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.08), 0px 4px 12px rgba(0, 0, 0, 0.1)",
        display: "flex",
        alignItems: "center",
        gap: { xs: 0.25, sm: 1, md: 2 },
        bgcolor: "#fff",
        opacity: disabled ? 0.85 : 1,
        flexWrap: "nowrap",
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
          width: "auto",
          mx: { xs: 0.5, sm: 0.5 },
          "& .MuiSlider-root": {
            padding: { xs: "13px 0", sm: "15px 0", md: "17px 0" },
          },
          "& .MuiSlider-rail": {
            color: "#e5e7eb",
            height: { xs: 4, sm: 5, md: 6 },
            borderRadius: { xs: 2, sm: 2.5, md: 3 },
            background: "linear-gradient(90deg, #f8fafc 0%, #e2e8f0 100%)",
          },
          "& .MuiSlider-track": {
            color: hasAudio ? "#00a1ff" : "#d1d5db",
            height: { xs: 4, sm: 5, md: 6 },
            borderRadius: { xs: 2, sm: 2.5, md: 3 },
            background: hasAudio 
              ? "linear-gradient(90deg, #0ea5e9 0%, #00a1ff 50%, #0284c7 100%)" 
              : "#d1d5db",
            border: "none",
            boxShadow: hasAudio ? "0 2px 6px rgba(0, 161, 255, 0.3)" : "none",
          },
          "& .MuiSlider-thumb": {
            width: { xs: 14, sm: 16, md: 18 },
            height: { xs: 14, sm: 16, md: 18 },
            backgroundColor: hasAudio ? "#00a1ff" : "#9ca3af",
            border: "2px solid #ffffff",
            boxShadow: hasAudio 
              ? "0 3px 12px rgba(0, 161, 255, 0.4), 0 0 0 1px rgba(0, 161, 255, 0.1)" 
              : "0 2px 4px rgba(0, 0, 0, 0.1)",
            "&:hover, &.Mui-focusVisible": { 
              boxShadow: hasAudio 
                ? "0 0 0 8px rgba(0, 161, 255, 0.2), 0 4px 16px rgba(0, 161, 255, 0.5)" 
                : "0 0 0 6px rgba(107, 114, 128, 0.15)",
              backgroundColor: hasAudio ? "#0284c7" : "#9ca3af",
            },
            "&:active": {
              boxShadow: hasAudio 
                ? "0 0 0 10px rgba(0, 161, 255, 0.25), 0 4px 20px rgba(0, 161, 255, 0.6)" 
                : "0 0 0 8px rgba(107, 114, 128, 0.2)",
              backgroundColor: hasAudio ? "#0369a1" : "#6b7280",
            },
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          },
          "&.Mui-disabled": {
            "& .MuiSlider-thumb": {
              backgroundColor: "#d1d5db",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
            },
            "& .MuiSlider-track": {
              background: "#e5e7eb",
              boxShadow: "none",
            },
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
          minWidth: { xs: "60px", sm: "70px" },
          textAlign: "center",
          flexShrink: 0,
          ml: { xs: 1, sm: 1.5 },
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
          "& .MuiSlider-root": {
            padding: "13px 0",
          },
          "& .MuiSlider-rail": {
            color: "#e5e7eb",
            height: 4,
            borderRadius: 2,
            background: "linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 100%)",
          },
          "& .MuiSlider-track": {
            color: hasAudio ? "#00a1ff" : "#d1d5db",
            height: 4,
            borderRadius: 2,
            background: hasAudio 
              ? "linear-gradient(90deg, #0ea5e9 0%, #00a1ff 50%, #0284c7 100%)" 
              : "#d1d5db",
            border: "none",
            boxShadow: hasAudio ? "0 2px 4px rgba(0, 161, 255, 0.3)" : "none",
          },
          "& .MuiSlider-thumb": {
            width: 16,
            height: 16,
            backgroundColor: hasAudio ? "#00a1ff" : "#9ca3af",
            border: "2px solid #ffffff",
            boxShadow: hasAudio 
              ? "0 2px 8px rgba(0, 161, 255, 0.4), 0 0 0 1px rgba(0, 161, 255, 0.1)" 
              : "0 2px 4px rgba(0, 0, 0, 0.1)",
            "&:hover, &.Mui-focusVisible": { 
              boxShadow: hasAudio 
                ? "0 0 0 6px rgba(0, 161, 255, 0.2), 0 4px 12px rgba(0, 161, 255, 0.5)" 
                : "0 0 0 4px rgba(107, 114, 128, 0.15)",
              backgroundColor: hasAudio ? "#0284c7" : "#9ca3af",
            },
            "&:active": {
              boxShadow: hasAudio 
                ? "0 0 0 8px rgba(0, 161, 255, 0.25), 0 4px 16px rgba(0, 161, 255, 0.6)" 
                : "0 0 0 6px rgba(107, 114, 128, 0.2)",
              backgroundColor: hasAudio ? "#0369a1" : "#6b7280",
            },
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          },
          "&.Mui-disabled": {
            "& .MuiSlider-thumb": {
              backgroundColor: "#d1d5db",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
            },
            "& .MuiSlider-track": {
              background: "#e5e7eb",
              boxShadow: "none",
            },
          },
        }}
      />

    </Box>
  );
}
