import { createFileRoute, redirect } from "@tanstack/react-router";

// Folded into /therapy-plan as a tab; keep the old URL working.
export const Route = createFileRoute("/snap-plan")({
  beforeLoad: () => {
    throw redirect({ to: "/therapy-plan", search: { tab: "schedule" }, replace: true });
  },
});
