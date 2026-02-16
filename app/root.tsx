import {
  isRouteErrorResponse,
  Links,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { BarChart3, FileStack, Gauge, Import } from "lucide-react";

import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Bungee&family=Nunito:wght@500;700;900&display=swap",
  },
];

function BottomNavLink({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex min-h-14 flex-1 flex-col items-center justify-center rounded-xl border-2 px-2 text-xs font-bold transition",
          isActive
            ? "border-black bg-lime-300 shadow-[0_3px_0_0_#111]"
            : "border-transparent bg-white/70",
        ].join(" ")
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 pb-28 pt-5 sm:px-6">
      <header className="mb-5 rounded-2xl border-2 border-black bg-amber-200 px-4 py-3 shadow-[0_6px_0_0_#111]">
        <p className="font-display text-xl uppercase">House Water Tracker</p>
        <p className="text-sm font-semibold text-zinc-800">Fast weekly checks, monthly trends, and bill comparison.</p>
      </header>

      <Outlet />

      <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-3xl border-t-2 border-black bg-gradient-to-r from-cyan-200 via-amber-100 to-lime-200 px-3 py-2">
        <div className="mx-auto flex gap-2">
          <BottomNavLink to="/entry" icon={<Gauge className="h-4 w-4" />} label="Entry" />
          <BottomNavLink to="/dashboard" icon={<BarChart3 className="h-4 w-4" />} label="Dashboard" />
          <BottomNavLink to="/bills" icon={<FileStack className="h-4 w-4" />} label="Bills" />
          <BottomNavLink to="/import" icon={<Import className="h-4 w-4" />} label="Import" />
        </div>
      </nav>
    </main>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops";
  let details = "An unexpected error occurred.";

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (error instanceof Error) {
    details = error.message;
  }

  return (
    <main className="mx-auto mt-10 max-w-xl rounded-2xl border-2 border-black bg-rose-100 p-5 shadow-[0_6px_0_0_#111]">
      <h1 className="font-display text-2xl uppercase">{message}</h1>
      <p className="mt-2 font-semibold">{details}</p>
    </main>
  );
}
