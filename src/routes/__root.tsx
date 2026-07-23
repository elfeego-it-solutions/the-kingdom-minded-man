import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

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
            className="btn-gold inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl text-foreground">
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
            className="btn-gold inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm"
          >
            Try again
          </button>
          <a
            href="/"
            className="btn-outline-gold inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm"
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
      { name: "theme-color", content: "#D4AF37" },
      { title: "CE Men's Conference 2026 · The Kingdom Minded Man" },
      { property: "og:title", content: "CE Men's Conference 2026 · The Kingdom Minded Man" },
      { name: "twitter:title", content: "CE Men's Conference 2026 · The Kingdom Minded Man" },
      { name: "description", content: "Register for CE Karu 1 Men's Conference 2026 — The Kingdom Minded Man | Fri 31 Jul – Sun 2 Aug 2026 | Church 1 Auditorium." },
      { property: "og:description", content: "Register for CE Karu 1 Men's Conference 2026 — The Kingdom Minded Man | Fri 31 Jul – Sun 2 Aug 2026 | Church 1 Auditorium." },
      { name: "twitter:description", content: "Register for CE Karu 1 Men's Conference 2026 — The Kingdom Minded Man | Fri 31 Jul – Sun 2 Aug 2026 | Church 1 Auditorium." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/1OLsk8kDP2aQryyYfnalfZB7JS23/social-images/social-1784794000664-Kingdom_Minded_Man_for_Large_Screen.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/1OLsk8kDP2aQryyYfnalfZB7JS23/social-images/social-1784794000664-Kingdom_Minded_Man_for_Large_Screen.webp" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap",
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
