import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { ChevronDown } from "lucide-react";
import { useStrengthRange } from "@/lib/mito/rangeState";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Cristae Lab | Mitochondrial modeling workspace" },
      { name: "description", content: "Explore mitochondrial structure, redox pathways, iron metabolism, photon responses, and ATP energetics." },
      { property: "og:title", content: "Cristae Lab | Mitochondrial modeling workspace" },
      { property: "og:description", content: "Explore mitochondrial structure, redox pathways, iron metabolism, photon responses, and ATP energetics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=DM+Sans:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const navGroups = [
  { label: "Model", links: [
    { to: "/", label: "Simulator" },
    { to: "/carriers", label: "Carriers" },
  ] },
  { label: "Patient", links: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/diagnosis", label: "Diagnosis" },
    { to: "/timeline", label: "Timeline" },
    { to: "/runs", label: "Progress" },
  ] },
  { label: "Plan", links: [
    { to: "/therapy-plan", label: "Therapy plan" },
    { to: "/therapy-tools", label: "Therapy tools" },
  ] },
  { label: "Reference", links: [
    { to: "/lab-ranges", label: "Lab ranges" },
    { to: "/references", label: "References" },
  ] },
] as const;

function NavGroup({ group }: { group: (typeof navGroups)[number] }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const active = group.links.some((l) => (l.to === "/" ? path === "/" : path.startsWith(l.to)));
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-testid={`nav-${group.label.toLowerCase()}`}
        className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm transition-colors ${active ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
      >
        {group.label}
        <ChevronDown className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {group.links.map((l) => (
          <DropdownMenuItem key={l.to} asChild>
            <Link to={l.to} activeOptions={{ exact: l.to === "/" }} activeProps={{ className: "font-medium text-foreground" }}>{l.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BandControl() {
  const [{ lo, hi }, setRange] = useStrengthRange();
  return (
    <Popover>
      <PopoverTrigger data-testid="header-band" className="ml-auto rounded-md border border-border px-2.5 py-1 font-mono text-xs text-muted-foreground hover:text-foreground" aria-label="Strength band">
        Band {lo.toFixed(2)}x-{hi.toFixed(2)}x
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3">
        <p className="text-sm font-medium">Strength band</p>
        <Slider min={0} max={1.5} step={0.05} value={[lo, hi]} onValueChange={(v) => setRange(v[0]!, v[1]!)} aria-label="Strength band" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono">{lo.toFixed(2)}x to {hi.toFixed(2)}x</span>
          <button type="button" className="underline hover:text-foreground disabled:opacity-50" disabled={lo === 0.5 && hi === 1} onClick={() => setRange(0.5, 1)}>Reset to 0.50x-1.00x</button>
        </div>
        <p className="text-xs text-muted-foreground">Same band as the Progress sliders; every chart that colors inside or outside follows it.</p>
      </PopoverContent>
    </Popover>
  );
}

function TopNav() {
  return (
    <nav data-testid="top-nav" className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-1 gap-y-1 px-4 py-2">
        <Link to="/" className="mr-3 text-sm font-semibold tracking-tight text-foreground">Cristae Lab</Link>
        {navGroups.map((g) => <NavGroup key={g.label} group={g} />)}
        <BandControl />
      </div>
    </nav>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <TopNav />
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
