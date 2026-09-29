import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/sarees")({
  component: SareesLayout,
});

function SareesLayout() {
  return <Outlet />;
}