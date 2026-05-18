import { Metadata } from "next";
import { FavoritesPage } from "@/components/favorites/favorites-page";

export const metadata: Metadata = { title: "Favoritos" };

export default function Page() {
  return <FavoritesPage />;
}
