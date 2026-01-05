import { Header, Footer } from '@/components/layout';
import {
  Hero,
  LogoGarden,
  FeatureAgent,
  FeatureAutocomplete,
  Frontier,
} from '@/components/sections';

export default function Home() {
  return (
    <>
      <Header />
      <main id="main-content">
        <Hero />
        <LogoGarden />
        <FeatureAgent />
        <FeatureAutocomplete />
        <Frontier />
      </main>
      <Footer />
    </>
  );
}
