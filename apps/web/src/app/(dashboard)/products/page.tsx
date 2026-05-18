import { Metadata } from "next";
import { ProductsDiscovery } from "@/components/products/products-discovery";

export const metadata: Metadata = { title: "Descoberta de Produtos" };

export default function ProductsPage() {
  return <ProductsDiscovery />;
}
