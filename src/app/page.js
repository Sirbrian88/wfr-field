import dynamic from "next/dynamic";

// Disable SSR entirely — app uses localStorage, navigator, Worker (browser-only)
const WFRField = dynamic(() => import("@/components/WFRField"), { ssr: false });

export default function Home() {
  return <WFRField />;
}
