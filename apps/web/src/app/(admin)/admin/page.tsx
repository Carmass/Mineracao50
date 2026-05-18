import { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const metadata: Metadata = { title: "Admin" };

export default function Page() {
  return <AdminDashboard />;
}
