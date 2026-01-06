import { Header, Footer } from '@/components/layout';
import {
  Hero,
  FeatureAgent,
  FeatureAutocomplete,
  Ecosystem,
  Frontier,
} from '@/components/sections';

export default function Home() {
  return (
    <>
      <Header />
      <main id="main-content">
        <Hero />
        <FeatureAgent />
        <FeatureAutocomplete />
        <Ecosystem />
        <Frontier />
      </main>
      <Footer />
    </>
  );
}
