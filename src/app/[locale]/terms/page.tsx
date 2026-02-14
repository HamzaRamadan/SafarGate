// app/terms/page.tsx
import dynamic from "next/dynamic";

const TermsContent = dynamic(() => import("./TermsContent"), { ssr: false });

export default function TermsPage() {
  return <TermsContent />;
}
