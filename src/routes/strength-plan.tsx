import { createFileRoute, redirect } from "@tanstack/react-router";

// Folded into /therapy-plan as a tab; keep the old URL working.
export const Route = createFileRoute("/strength-plan")({
  beforeLoad: () => {
    throw redirect({ to: "/therapy-plan", search: { tab: "suggestions" }, replace: true });
  },
});
