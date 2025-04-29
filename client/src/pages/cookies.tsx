import { Container } from "@/components/ui/container";
import PageContent from "@/components/layout/PageContent";

export default function CookiesPage() {
  return (
    <Container className="py-12">
      <div className="mx-auto max-w-4xl">
        <PageContent pageId="cookies" />
      </div>
    </Container>
  );
}