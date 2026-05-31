import { Metadata } from "next";
import { ProductDetailPage } from "@/components/products/product-detail-page";

export const metadata: Metadata = { title: "Detalhes do Produto" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetailPage id={id} />;
}
