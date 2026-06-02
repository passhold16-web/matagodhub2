import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { computeWinRate, displayPokemmoNick } from "@/lib/combatStats";
import type { RankingRow } from "@/types/challenges";
import { Loader2, Medal, Search, Trophy } from "lucide-react";

const Ranking = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, pokemmo_nick, avatar_url, wins, losses")
        .order("wins", { ascending: false });

      const mapped: RankingRow[] = (data ?? []).map((p) => ({
        ...p,
        wins: p.wins ?? 0,
        losses: p.losses ?? 0,
        win_rate: computeWinRate(p.wins ?? 0, p.losses ?? 0),
      }));

      mapped.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.win_rate - a.win_rate;
      });

      setRows(mapped);
      setLoading(false);
    };
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const nick = (r.pokemmo_nick ?? "").toLowerCase();
      return nick.includes(q) || r.username.toLowerCase().includes(q);
    });
  }, [rows, query]);

  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  const podiumSlots = [
    { row: top3[1], label: "PLATA", h: "h-28", ring: "border-foreground/40", order: "order-1" },
    { row: top3[0], label: "ORO", h: "h-36", ring: "border-accent", order: "order-2" },
    { row: top3[2], label: "BRONCE", h: "h-24", ring: "border-orange-600/60", order: "order-3" },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      <div className="grid-bg fixed inset-0 pointer-events-none opacity-60" />
      <Navbar active="" onNavigate={() => navigate("/")} />

      <main className="relative pt-24 pb-20">
        <div className="container max-w-4xl">
          <header className="text-center mb-10">
            <p className="font-display text-xs tracking-[0.4em] text-accent mb-3">◆ LADDER ◆</p>
            <h1 className="font-display text-4xl md:text-5xl tracking-wider neon-text-gold mb-2">
              RANKING
            </h1>
            <p className="text-foreground/60 text-sm">
              Ordenado por victorias y win rate. Se muestra el nick de PokéMMO.
            </p>
          </header>

          <div className="relative mb-8">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nick de PokéMMO..."
              className="pl-9 bg-card/60 border-primary/30"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : (
            <>
              {top3.length > 0 && (
                <div className="flex items-end justify-center gap-4 mb-12">
                  {podiumSlots.map(({ row, label, h, ring, order }, idx) => {
                    if (!row) return <div key={idx} className={`w-24 ${h} ${order}`} />;
                    const nick = displayPokemmoNick(row.pokemmo_nick, row.username);
                    return (
                      <div
                        key={row.user_id}
                        className={`flex flex-col items-center w-28 md:w-32 ${order}`}
                      >
                        <Trophy
                          size={label === "ORO" ? 28 : 20}
                          className={label === "ORO" ? "text-accent mb-2" : "text-foreground/50 mb-1"}
                        />
                        <div
                          className={`w-full ${h} rounded-t-lg border-2 ${ring} bg-card/80 flex flex-col items-center justify-end p-3 text-center`}
                        >
                          <span className="font-display text-[9px] tracking-widest text-foreground/50">
                            {label}
                          </span>
                          <p className="font-display text-xs md:text-sm text-accent truncate w-full">
                            {nick}
                          </p>
                          <p className="text-[10px] text-primary mt-1">{row.wins}W</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="neon-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-card/60 font-display text-[10px] tracking-widest text-foreground/60">
                      <th className="p-3 text-left">#</th>
                      <th className="p-3 text-left">NICK POKÉMMO</th>
                      <th className="p-3 text-right">W</th>
                      <th className="p-3 text-right">L</th>
                      <th className="p-3 text-right">WR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rest.map((r, i) => (
                      <tr key={r.user_id} className="border-b border-border/30 hover:bg-primary/5">
                        <td className="p-3 font-display text-foreground/50">{i + 4}</td>
                        <td className="p-3 font-medium text-accent">
                          <Medal size={12} className="inline mr-1 opacity-40" />
                          {displayPokemmoNick(r.pokemmo_nick, r.username)}
                        </td>
                        <td className="p-3 text-right text-primary">{r.wins}</td>
                        <td className="p-3 text-right text-destructive">{r.losses}</td>
                        <td className="p-3 text-right">{r.win_rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <p className="text-center py-12 text-foreground/50">Sin resultados.</p>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Ranking;
