import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/overview" });
  },
  head: () => ({
    meta: [
      { title: "RD4X Dashboard V10" },
      { name: "description", content: "Admin console for RD4X users, keys, tickets, releases and incidents." },
      { property: "og:title", content: "RD4X Dashboard V10" },
      { property: "og:description", content: "Admin console for RD4X users, keys, tickets, releases and incidents." },
    ],
  }),
});
