import { createFileRoute, redirect } from "@tanstack/react-router";

// Folded into /therapy-plan; keep the old URL working.
export const Route = createFileRoute("/treatment-plan")({
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/therapy-plan", search: search as Record<string, unknown>, replace: true });
  },
});
