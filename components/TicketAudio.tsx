"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Slider,
  Menu,
  MenuItem,
} from "@mui/material";
import Replay10Icon from "@mui/icons-material/Replay10";
import Forward10Icon from "@mui/icons-material/Forward10";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import PlayCircleFilledIcon from "@mui/icons-material/PlayCircleFilled";
import PauseCircleFilledIcon from "@mui/icons-material/PauseCircleFilled";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DownloadIcon from "@mui/icons-material/Download";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AudioVisualizer from "./AudioVisualizer";

type TicketAudioProps = {
  audioUrl?: string | null;
  title?: string;
  status?:
    | "New"
    | "Emergency"
    | "In Progress"
    | "Pending"
    | "Done"
    | "Duplicated"
    | "Total";
};

const statusColors: Record<
  NonNullable<TicketAudioProps["status"]>,
  { bg: string; text: string }
> = {
  New: { bg: "#FFE2EA", text: "#FF6692" },
  Emergency: { bg: "#FFF5DA", text: "#FFB900" },
  "In Progress": { bg: "#DFF3FF", text: "#00A1FF" },
  Pending: { bg: "#EAE8FA", text: "#8965E5" },
  Done: { bg: "#DAF8F4", text: "#00b8a3" },
  Duplicated: { bg: "#FFE3C4", text: "#FF8A00" },
  Total: { bg: "transparent", text: "#0947D7" },
};

export default function TicketAudio({
  audioUrl,
  title = "Audio",
  status = "In Progress",
}: TicketAudioProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1); // 0.0–1.0
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [volumeHover, setVolumeHover] = useState(false);
  const [audioError, setAudioError] = useState(false);

  // on ended -> stop viz
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onEnded = () => setIsPlaying(false);
    el.addEventListener("ended", onEnded);
    return () => el.removeEventListener("ended", onEnded);
  }, []);

  // bind metadata/time
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onLoadedMetadata = () => setDuration(isFinite(el.duration) ? el.duration : 0);
    const onTimeUpdate = () => setCurrentTime(el.currentTime || 0);
    el.addEventListener("loadedmetadata", onLoadedMetadata);
    el.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      el.removeEventListener("loadedmetadata", onLoadedMetadata);
      el.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [audioUrl]);

  // play / pause
  const togglePlayPause = () => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  // -10s / +10s
  const handleReplay10 = () => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, el.currentTime - 10);
  };
  const handleForward10 = () => {
    const el = audioRef.current;
    if (!el) return;
    const dur = Number.isFinite(el.duration) ? el.duration : 0;
    el.currentTime = Math.min(dur, el.currentTime + 10);
  };

  // seek
  const handleSeek = (_: Event, value: number | number[]) => {
    const el = audioRef.current;
    if (!el) return;
    const v = Array.isArray(value) ? value[0] : value;
    el.currentTime = v;
    setCurrentTime(v);
  };

  // mute
  const toggleMute = () => {
    const el = audioRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setIsMuted(el.muted);
  };

  // volume slider (0–100 -> 0–1)
  const handleVolumeChange = (_: Event, value: number | number[]) => {
    const el = audioRef.current;
    if (!el) return;
    const vv = (Array.isArray(value) ? value[0] : value) as number;
    const newVol = Math.max(0, Math.min(1, vv / 100));
    el.volume = newVol;
    setVolume(newVol);
    if (newVol === 0) {
      el.muted = true;
      setIsMuted(true);
    } else {
      el.muted = false;
      setIsMuted(false);
    }
  };

  // menu
  const openMenu = (event: React.MouseEvent<HTMLElement>) => setMenuAnchorEl(event.currentTarget);
  const closeMenu = () => setMenuAnchorEl(null);

  const downloadAudio = async () => {
    if (!audioUrl) return;
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const urlBlob = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = urlBlob;
      link.download = audioUrl.split("/").pop() || "audio.mp3";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(urlBlob);
      closeMenu();
    } catch (err) {
      // fallback: open nueva pestaña
      window.open(audioUrl, "_blank");
      closeMenu();
    }
  };

  const copyLink = async () => {
    if (!audioUrl) return;
    try {
      await navigator.clipboard.writeText(audioUrl);
    } finally {
      closeMenu();
    }
  };

  const formatTime = (sec: number) => {
    if (!Number.isFinite(sec)) return "00:00";
    const min = Math.floor(sec / 60);
    const secPart = Math.floor(sec % 60);
    return `${min.toString().padStart(2, "0")}:${secPart.toString().padStart(2, "0")}`;
    };

  // Siempre mostrar el reproductor, incluso sin audio
  const hasAudio = !!audioUrl;

  // Player completo
  return (
    <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: 3 }}>
      <CardContent sx={{ p: { xs: "16px 20px", sm: "20px 25px 25px 30px" } }}>
        {/* Header: título + visualizer */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: { xs: 1.5, sm: 1 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.5 } }}>
            <Box
              sx={{
                width: { xs: 6, sm: 8 },
                height: { xs: 20, sm: 24 },
                borderRadius: 10,
                backgroundColor: "#00a1ff",
              }}
            />
            <Typography
              variant="h6"
              sx={{ 
                fontWeight: "bold", 
                color: "#00a1ff",
                fontSize: { xs: "0.95rem", sm: "1.25rem" }
              }}
            >
              {title}
            </Typography>
          </Box>
          <AudioVisualizer isPlaying={isPlaying} />
        </Box>

        {/* Controles */}
        <Box sx={{ display: "flex", alignItems: "center", width: "100%", flexWrap: { xs: "wrap", sm: "nowrap" }, gap: { xs: 1, sm: 0 } }}>
          <IconButton onClick={handleReplay10} size="small" sx={{ p: { xs: 0.5, sm: 1 } }} disabled={!hasAudio}>
            <Replay10Icon sx={{ color: hasAudio ? "#68748a" : "#d1d5db", fontSize: { xs: 18, sm: 20 } }} />
          </IconButton>

          <IconButton onClick={togglePlayPause} size="small" sx={{ p: { xs: 0.5, sm: 1 } }} disabled={!hasAudio}>
            {isPlaying ? (
              <PauseCircleFilledIcon sx={{ color: hasAudio ? "#111629" : "#d1d5db", fontSize: { xs: 26, sm: 30 } }} />
            ) : (
              <PlayCircleFilledIcon sx={{ color: hasAudio ? "#111629" : "#d1d5db", fontSize: { xs: 26, sm: 30 } }} />
            )}
          </IconButton>

          <IconButton onClick={handleForward10} size="small" sx={{ p: { xs: 0.5, sm: 1 } }} disabled={!hasAudio}>
            <Forward10Icon sx={{ color: hasAudio ? "#68748a" : "#d1d5db", fontSize: { xs: 18, sm: 20 } }} />
          </IconButton>

          {/* Divider */}
          <Box sx={{ width: "1px", height: { xs: 20, sm: 24 }, bgcolor: "#eff1f6", mx: { xs: 1, sm: 1.5 }, display: { xs: "none", sm: "block" } }} />

          {/* Tiempo combinado */}
          <Typography
            variant="body2"
            sx={{ 
              minWidth: { xs: "60px", sm: "70px" }, 
              textAlign: "center", 
              mr: { xs: 0.5, sm: 1 }, 
              whiteSpace: "nowrap",
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              color: hasAudio ? "inherit" : "#9ca3af"
            }}
          >
            {hasAudio ? `${formatTime(currentTime)} / ${formatTime(duration)}` : "00:00 / 00:00"}
          </Typography>

          {/* Slider de progreso */}
          <Box
            sx={{
              mx: { xs: 0.5, sm: 1 },
              flex: volumeHover ? "1 1 50%" : "1 1 80%",
              transition: "flex 0.3s ease",
              boxShadow: "none",
              borderRadius: 0,
              order: { xs: 3, sm: 0 },
              width: { xs: "100%", sm: "auto" },
              mt: { xs: 1, sm: 0 },
            }}
          >
            <Box sx={{ ml: { xs: "0px", sm: "20px" }, mr: "2px", display: "flex", alignItems: "center", height: { xs: "20px", sm: "24px" } }}>
              <Slider
                size="small"
                value={hasAudio ? Math.min(currentTime, duration) : 0}
                min={0}
                max={hasAudio ? (duration || 0) : 100}
                onChange={hasAudio ? (handleSeek as any) : undefined}
                disabled={!hasAudio}
                sx={{
                  width: "100%",
                  "&.MuiSlider-root": { height: { xs: "20px", sm: "24px" }, padding: 0 },
                  "& .MuiSlider-rail": { bgcolor: "#E6E6E6", height: { xs: 3, sm: 5 } },
                  "& .MuiSlider-track": { bgcolor: hasAudio ? "#00a1ff" : "#d1d5db", height: { xs: 3, sm: 5 } },
                  "& .MuiSlider-thumb": {
                    width: { xs: 10, sm: 12 },
                    height: { xs: 10, sm: 12 },
                    bgcolor: hasAudio ? "#00a1ff" : "#d1d5db",
                    "&:hover": { boxShadow: "none" },
                    "&.Mui-active": { boxShadow: "none" },
                  },
                }}
              />
            </Box>
          </Box>

          {/* Volumen con hover */}
          <Box
            onMouseEnter={() => setVolumeHover(true)}
            onMouseLeave={() => setVolumeHover(false)}
            sx={{
              display: "flex",
              alignItems: "center",
              ml: 1,
              bgcolor: volumeHover ? "#FAFAFB" : "transparent",
              borderRadius: volumeHover ? "999px" : 0,
              transition: "background 0.2s ease, width 0.3s ease, padding 0.2s ease",
              px: volumeHover ? "8px" : 0,
              height: "36px",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: volumeHover ? "50px" : "0px",
                overflow: "hidden",
                transition: "width 0.3s ease",
                mr: volumeHover ? 1 : 0,
                bgcolor: "transparent",
                boxShadow: 0,
                borderRadius: "999px",
                py: 0,
                height: "100%",
              }}
            >
              <Slider
                size="small"
                orientation="horizontal"
                value={isMuted ? 0 : volume * 100}
                onChange={handleVolumeChange as any}
                sx={{
                  width: "calc(100% - 8px)",
                  ml: "4px",
                  "&.MuiSlider-root": { height: "100%", padding: 0 },
                  "& .MuiSlider-rail": { bgcolor: "#E0E0E0", height: 5, borderRadius: 2 },
                  "& .MuiSlider-track": { bgcolor: "#68748A", height: 5, borderRadius: 2 },
                  "& .MuiSlider-thumb": {
                    width: 4,
                    height: 12,
                    bgcolor: "#000000",
                    borderRadius: 2,
                    "&:hover": { boxShadow: "none" },
                    "&.Mui-active": { boxShadow: "none" },
                  },
                }}
              />
            </Box>

            <IconButton
              onClick={toggleMute}
              size="small"
              disableRipple
              disabled={!hasAudio}
              sx={{ p: 0, "&:hover": { backgroundColor: "transparent" } }}
            >
              {isMuted || volume === 0 ? (
                <VolumeOffIcon sx={{ color: hasAudio ? "#68748A" : "#d1d5db", fontSize: 22 }} />
              ) : (
                <VolumeUpIcon sx={{ color: hasAudio ? "#68748A" : "#d1d5db", fontSize: 22 }} />
              )}
            </IconButton>
          </Box>

          {/* Menú de tres puntos */}
          <IconButton onClick={openMenu} size="small" disabled={!hasAudio} sx={{ ml: { xs: 0.5, sm: 1 }, p: { xs: 0.5, sm: 1 } }}>
            <MoreVertIcon sx={{ color: hasAudio ? "#68748a" : "#d1d5db", fontSize: { xs: 16, sm: 18 } }} />
          </IconButton>
          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={closeMenu}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem onClick={downloadAudio}>
              <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
              Download
            </MenuItem>
            <MenuItem onClick={copyLink}>
              <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} />
              Copy Link
            </MenuItem>
          </Menu>
        </Box>

        {/* Mensaje cuando no hay audio */}
        {!hasAudio && (
          <Box sx={{ mt: 2, p: 2, bgcolor: "#f9fafb", borderRadius: 2, border: "1px dashed #d1d5db" }}>
            <Typography variant="body2" sx={{ color: "#6b7280", textAlign: "center", fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
              No audio file available
            </Typography>
          </Box>
        )}

        {/* Elemento de audio oculto */}
        {hasAudio && (
          audioError ? (
            <Typography color="error" sx={{ mt: 2, textAlign: "center", fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
              Audio could not be loaded
            </Typography>
          ) : (
            <audio
              ref={audioRef}
              src={audioUrl}
              preload="metadata"
              style={{ display: "none" }}
              onError={() => setAudioError(true)}
            />
          )
        )}
      </CardContent>
    </Card>
  );
}
