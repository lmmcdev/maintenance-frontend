"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

function cx(...xs: (string | false | null | undefined)[]) { return xs.filter(Boolean).join(" "); }

export function Nav() {
  // El Nav ahora está integrado en los sticky headers, así que este componente puede estar oculto o vacío
  return null;
}
