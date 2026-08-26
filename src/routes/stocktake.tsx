import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/stocktake")({
  component: StocktakeLayout,
});

function StocktakeLayout() {
  return <Outlet />;
}
