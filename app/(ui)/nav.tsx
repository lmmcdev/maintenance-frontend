"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

function cx(...xs: (string | false | null | undefined)[]) { return xs.filter(Boolean).join(" "); }

export function Nav() {
  const pathname = usePathname();
  const tabs = [
    { href: "/tickets", label: "Tickets" },
    { href: "/dashboard", label: "Dashboard" },
  ];
  return (
    <nav className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-200">
      <ul className="mx-auto flex max-w-screen-sm">
        {tabs.map(t => (
          <li key={t.href} className="flex-1">
            <Link
              href={t.href}
              className={cx(
                "block w-full px-4 py-3 text-center text-sm font-medium",
                pathname === t.href ? "text-emerald-700 border-b-2 border-emerald-600" : "text-gray-600"
              )}
            >
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
