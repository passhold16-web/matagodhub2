import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Camera, Loader2, User as UserIcon } from "lucide-react";

const EditarPerfil = () => {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [pokemmoNick, setPokemmoNick] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  // Hydrate from profile
  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? "");
      setPokemmoNick((profile as { pokemmo_nick?: string }).pokemmo_nick ?? "");
      setBio(profile.bio ?? "");
      setAvatarUrl(profile.avatar_url ?? null);
    }
  }, [profile]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Imagen demasiado grande",
        description: "El avatar debe pesar menos de 2 MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600" });

    if (upErr) {
      setUploading(false);
      toast({ title: "Error al subir", description: upErr.message, variant: "destructive" });
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    setUploading(false);
    toast({ title: "Avatar listo", description: "Recuerda guardar los cambios." });
  };

  const handleSave = async () => {
    if (!user) return;
    const trimmed = username.trim();
    if (trimmed.length < 3) {
      toast({
        title: "Nombre inválido",
        description: "El nombre de usuario debe tener al menos 3 caracteres.",
        variant: "destructive",
      });
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      toast({
        title: "Nombre inválido",
        description: "Solo se permiten letras, números, guiones y guiones bajos.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const nick = pokemmoNick.trim();
    if (nick.length > 0 && (nick.length < 2 || nick.length > 32)) {
      toast({
        title: "Nick inválido",
        description: "El nick de PokéMMO debe tener entre 2 y 32 caracteres.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        username: trimmed,
        pokemmo_nick: nick || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
      })
      .eq("user_id", user.id);

    setSaving(false);

    if (error) {
      const msg = error.message.includes("duplicate")
        ? "Ese nombre de usuario ya está en uso."
        : error.message;
      toast({ title: "Error al guardar", description: msg, variant: "destructive" });
      return;
    }

    toast({ title: "Perfil actualizado", description: "Tus cambios se han guardado." });
    navigate(`/perfil/${trimmed}`);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="grid-bg fixed inset-0 pointer-events-none opacity-60" />
      <Navbar active="" onNavigate={() => navigate("/")} />

      <main className="relative pt-24 pb-20">
        <div className="container max-w-2xl">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-foreground/60 hover:text-primary transition-colors mb-6 font-display tracking-widest text-xs"
          >
            <ArrowLeft size={14} /> VOLVER
          </button>

          <div className="neon-border bg-card/80 backdrop-blur-xl rounded-lg p-6 md:p-8 space-y-6">
            <div>
              <p className="font-display text-xs tracking-[0.4em] text-accent mb-2">
                ◆ AJUSTES ◆
              </p>
              <h1 className="font-display text-3xl md:text-4xl tracking-wider neon-text-gold">
                EDITAR PERFIL
              </h1>
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-5">
              <div className="h-24 w-24 rounded-full bg-gradient-neon flex items-center justify-center shrink-0 shadow-[0_0_25px_hsl(var(--primary)/0.4)] overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <UserIcon size={40} className="text-background" />
                )}
              </div>
              <div className="flex-1">
                <label className="font-display text-xs tracking-widest text-foreground/70 mb-2 block">
                  AVATAR
                </label>
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-primary/40 bg-background/60 text-sm font-display tracking-widest cursor-pointer hover:bg-primary/10 transition-colors">
                  {uploading ? (
                    <Loader2 size={14} className="animate-spin text-primary" />
                  ) : (
                    <Camera size={14} className="text-primary" />
                  )}
                  {uploading ? "SUBIENDO..." : "CAMBIAR IMAGEN"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleAvatarChange}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-foreground/40 mt-2">
                  PNG, JPG o WEBP. Máx. 2 MB.
                </p>
              </div>
            </div>

            <div>
              <label className="font-display text-xs tracking-widest text-foreground/70 mb-1 block">
                NOMBRE DE USUARIO
              </label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={24}
                placeholder="trainer_legendario"
                className="bg-background/60 border-primary/30 focus:border-primary font-display tracking-wide"
              />
              <p className="text-[10px] text-foreground/40 mt-1">
                Solo letras, números, guiones y guiones bajos.
              </p>
            </div>

            <div>
              <label className="font-display text-xs tracking-widest text-foreground/70 mb-1 block">
                NICK DE POKÉMMO
              </label>
              <Input
                value={pokemmoNick}
                onChange={(e) => setPokemmoNick(e.target.value)}
                maxLength={32}
                placeholder="Tu personaje en el juego"
                className="bg-background/60 border-primary/30 focus:border-primary font-display tracking-wide"
              />
              <p className="text-[10px] text-foreground/40 mt-1">
                Aparece en el ranking y en los retos. Obligatorio para competir.
              </p>
            </div>

            <div>
              <label className="font-display text-xs tracking-widest text-foreground/70 mb-1 block">
                BIOGRAFÍA
              </label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={240}
                rows={4}
                placeholder="Cuenta a la comunidad quién eres como entrenador..."
                className="bg-background/60 border-primary/30 focus:border-primary resize-none"
              />
              <p className="text-[10px] text-foreground/40 mt-1">{bio.length}/240</p>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || uploading}
              className="w-full font-display tracking-[0.3em] bg-gradient-neon text-background hover:opacity-90 shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
            >
              {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              GUARDAR CAMBIOS
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EditarPerfil;
