import { useState, useCallback, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PokemonSprite } from "./PokemonSprite";
import { TIERS, type Tier } from "@/data/mockBuilds";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { X, Search, Loader2, Plus } from "lucide-react";

let pokemonListCache: { id: number; name: string }[] | null = null;

async function fetchPokemonList() {
  if (pokemonListCache) return pokemonListCache;
  const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=649&offset=0");
  const data = await res.json();
  pokemonListCache = (data.results as { name: string; url: string }[]).map((p, i) => ({
    id: i + 1,
    name: p.name,
  }));
  return pokemonListCache;
}

interface CreateBuildModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export const CreateBuildModal = ({ open, onOpenChange, onCreated }: CreateBuildModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [tier, setTier] = useState<Tier>("OU");
  const [description, setDescription] = useState("");
  const [team, setTeam] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [allPokemon, setAllPokemon] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetchPokemonList()
        .then(setAllPokemon)
        .finally(() => setLoading(false));
    }
  }, [open]);

  const filtered =
    search.length >= 2
      ? allPokemon.filter((p) => p.name.includes(search.toLowerCase())).slice(0, 30)
      : [];

  const addPokemon = useCallback(
    (id: number) => {
      if (team.length >= 6 || team.includes(id)) return;
      setTeam((t) => [...t, id]);
      setSearch("");
      searchRef.current?.focus();
    },
    [team]
  );

  const removePokemon = (id: number) => setTeam((t) => t.filter((x) => x !== id));

  const reset = () => {
    setName("");
    setTier("OU");
    setDescription("");
    setTeam([]);
    setSearch("");
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!name.trim()) {
      toast({ title: "Error", description: "Pon un nombre a tu build.", variant: "destructive" });
      return;
    }
    if (team.length !== 6) {
      toast({ title: "Error", description: "Necesitas exactamente 6 Pokémon.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("builds").insert({
      user_id: user.id,
      name: name.trim(),
      tier,
      description: description.trim() || null,
      pokemon_ids: team,
    });
    setSubmitting(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "¡Build publicada!", description: "Tu equipo ya está en la galería." });
    reset();
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-primary/40 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-wider neon-text-red">
            NUEVA BUILD
          </DialogTitle>
          <DialogDescription className="text-foreground/60">
            Arma tu equipo competitivo y compártelo con la comunidad.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="font-display text-xs tracking-widest text-foreground/70 mb-1 block">
              NOMBRE
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              placeholder="Hyper Offense Reign"
              className="bg-background/60 border-primary/30 focus:border-primary font-display tracking-wide"
            />
          </div>

          <div>
            <label className="font-display text-xs tracking-widest text-foreground/70 mb-1 block">
              TIER
            </label>
            <div className="flex gap-2">
              {TIERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  className={`px-4 py-1.5 rounded-md font-display text-sm tracking-widest border transition-all ${
                    tier === t
                      ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_hsl(var(--primary)/0.5)]"
                      : "bg-card/40 text-foreground/60 border-border hover:border-primary/50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-display text-xs tracking-widest text-foreground/70 mb-1 block">
              DESCRIPCIÓN
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              placeholder="Equipo de presión brutal..."
              className="bg-background/60 border-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="font-display text-xs tracking-widest text-foreground/70 mb-1 block">
              EQUIPO ({team.length}/6)
            </label>
            <div className="grid grid-cols-6 gap-2 mb-3">
              {Array.from({ length: 6 }).map((_, i) => {
                const pId = team[i];
                return (
                  <div
                    key={i}
                    className="aspect-square rounded-md border border-primary/20 bg-background/40 flex items-center justify-center relative group"
                  >
                    {pId ? (
                      <>
                        <PokemonSprite id={pId} size={40} />
                        <button
                          type="button"
                          onClick={() => removePokemon(pId)}
                          className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Quitar"
                        >
                          <X size={10} />
                        </button>
                      </>
                    ) : (
                      <Plus size={16} className="text-foreground/20" />
                    )}
                  </div>
                );
              })}
            </div>

            {team.length < 6 && (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                <Input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar Pokémon (mín. 2 letras)..."
                  className="pl-9 bg-background/60 border-primary/30 focus:border-primary"
                />
                {loading && (
                  <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary" />
                )}

                {filtered.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-md border border-primary/30 bg-card/95 backdrop-blur-xl shadow-lg">
                    {filtered.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addPokemon(p.id)}
                        disabled={team.includes(p.id)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-primary/10 transition-colors disabled:opacity-30"
                      >
                        <PokemonSprite id={p.id} size={28} />
                        <span className="capitalize font-display tracking-wide text-foreground/90">
                          {p.name}
                        </span>
                        <span className="ml-auto text-xs text-foreground/40">#{p.id}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || team.length !== 6 || !name.trim()}
            className="w-full font-display tracking-[0.3em] bg-gradient-neon text-background hover:opacity-90 shadow-[0_0_20px_hsl(var(--primary)/0.4)] disabled:opacity-40"
          >
            {submitting ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            PUBLICAR BUILD
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
