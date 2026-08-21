import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Elore Parfume — Dashboard",
    short_name: "Elore Parfume",
    description: "Elore Parfume hisob-kitob va ombor tizimi",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#faf8f5",
    theme_color: "#c5a880",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
