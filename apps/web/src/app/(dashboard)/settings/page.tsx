import { Metadata } from "next";
import { SettingsPage } from "@/components/settings/settings-page";

export const metadata: Metadata = { title: "Configurações" };

export default function Page() {
  return <SettingsPage />;
}
