import { Header, Footer } from '@/components/layout';
import {
  Hero,
  FeatureShowcase,
  SocialProof,
  AgentCapabilities,
  CallToAction,
} from '@/components/sections';

export default function Home() {
  return (
    <>
      <Header />
      <main id="main-content">
        <Hero />
        <FeatureShowcase />
        <SocialProof />
        <AgentCapabilities />
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
