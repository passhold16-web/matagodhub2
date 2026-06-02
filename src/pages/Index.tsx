import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { NewsSection } from "@/components/NewsSection";
import { BuildsGallery } from "@/components/BuildsGallery";
import { TournamentsSection } from "@/components/TournamentsSection";
import { CommunitySection } from "@/components/CommunitySection";
import { LatestChallengeWidget } from "@/components/challenges/LatestChallengeWidget";
import { Footer } from "@/components/Footer";

const SECTIONS = ["home", "builds", "torneos", "comunidad"];

const Index = () => {
  const [active, setActive] = useState("home");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const goTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar active={active} onNavigate={setActive} />
      <main className="flex-1">
        <Hero onPrimary={() => goTo("builds")} onSecondary={() => goTo("torneos")} />
        <NewsSection />
        <BuildsGallery />
        <TournamentsSection />
        <section className="py-12 container max-w-4xl mx-auto px-4">
          <LatestChallengeWidget />
        </section>
        <CommunitySection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
