export const Footer = () => {
  return (
    <footer className="border-t border-primary/20 glass mt-10">
      <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-gradient-neon" />
          <span className="font-display tracking-widest">
            <span className="neon-text-red">MATAGOD</span>{" "}
            <span className="neon-text-gold">HUB</span>
          </span>
        </div>
        <p className="font-display text-xs tracking-widest">
          © 2025 — POKEMMO COMPETITIVE NETWORK
        </p>
        <p className="text-xs">Fan project. No afiliado oficialmente con PokeMMO.</p>
      </div>
    </footer>
  );
};
