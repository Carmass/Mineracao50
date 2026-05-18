import { Metadata } from "next";
import { ProductDetailPage } from "@/components/products/product-detail-page";

export const metadata: Metadata = { title: "Detalhes do Produto" };

export default function Page({ params }: { params: { id: string } }) {
  return <ProductDetailPage id={params.id} />;
}
