import { createFileRoute, redirect } from "@tanstack/react-router";

// Merged into /therapy-tools; keep the old URL working.
export const Route = createFileRoute("/therapy-compare")({
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/therapy-tools", search: { ...(search as Record<string, unknown>), tab: "compare" }, replace: true });
  },
});
