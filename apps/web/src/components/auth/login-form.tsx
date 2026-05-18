"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Chrome, Github } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

type LoginData = z.infer<typeof LoginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "login";
  const [isRegister, setIsRegister] = useState(mode === "register");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, getValues } = useForm<LoginData>({
    resolver: zodResolver(LoginSchema),
  });

  const supabase = createClient();

  async function onSubmit(data: LoginData) {
    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu email.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;
      router.push(searchParams.get("redirect") || "/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer login");
    }
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function signInWithGithub() {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function sendMagicLink() {
    const email = getValues("email");
    if (!email) { toast.error("Informe seu email"); return; }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) { toast.error(error.message); return; }
    setMagicLinkSent(true);
    toast.success("Magic link enviado! Verifique seu email.");
  }

  if (magicLinkSent) {
    return (
      <div className="glass-card p-8 text-center">
        <Mail className="w-12 h-12 text-blue-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Verifique seu email</h2>
        <p className="text-white/60 text-sm">Enviamos um link mágico para o seu email. Clique nele para entrar.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-8">
      <h2 className="text-2xl font-bold text-white text-center mb-2">
        {isRegister ? "Criar conta grátis" : "Bem-vindo de volta"}
      </h2>
      <p className="text-white/50 text-sm text-center mb-6">
        {isRegister ? "Comece a descobrir produtos virais hoje" : "Entre na sua conta para continuar"}
      </p>

      {/* Social logins */}
      <div className="space-y-3 mb-6">
        <Button variant="outline" className="w-full border-white/20 hover:bg-white/5 text-white" onClick={signInWithGoogle}>
          <Chrome className="w-4 h-4 mr-2" />
          Continuar com Google
        </Button>
        <Button variant="outline" className="w-full border-white/20 hover:bg-white/5 text-white" onClick={signInWithGithub}>
          <Github className="w-4 h-4 mr-2" />
          Continuar com GitHub
        </Button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#0a0b0e] px-2 text-white/40">ou com email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label className="text-white/70 text-sm">Email</Label>
          <Input
            {...register("email")}
            type="email"
            placeholder="seu@email.com"
            className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
        </div>

        {!useMagicLink && (
          <div>
            <Label className="text-white/70 text-sm">Senha</Label>
            <Input
              {...register("password")}
              type="password"
              placeholder="••••••••"
              className="mt-1 bg-white/5 border-white/10 text-white"
            />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>
        )}

        {useMagicLink ? (
          <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700 border-0" onClick={sendMagicLink}>
            <Mail className="w-4 h-4 mr-2" />
            Enviar Magic Link
          </Button>
        ) : (
          <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 border-0 hover:opacity-90" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isRegister ? "Criar conta" : "Entrar"}
          </Button>
        )}
      </form>

      <div className="mt-4 flex flex-col gap-2 text-center text-sm">
        <button
          onClick={() => setUseMagicLink(!useMagicLink)}
          className="text-white/40 hover:text-white/60 transition-colors"
        >
          {useMagicLink ? "Usar senha" : "Usar magic link"}
        </button>
        <button
          onClick={() => setIsRegister(!isRegister)}
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          {isRegister ? "Já tem conta? Entrar" : "Não tem conta? Cadastre-se"}
        </button>
      </div>
    </div>
  );
}
