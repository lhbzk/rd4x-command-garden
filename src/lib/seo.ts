export const pageHead = (title: string, description: string) => ({
  meta: [
    { title: `${title} · RD4X Dashboard V10` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} · RD4X Dashboard V10` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ],
});
