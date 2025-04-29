import { Container } from "@/components/ui/container";
import PageContent from "@/components/layout/PageContent";

export default function ShippingPage() {
  return (
    <Container className="py-12">
      <div className="mx-auto max-w-4xl">
        <PageContent pageId="shipping" />
      </div>
    </Container>
  );
}