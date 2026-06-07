import { useState, type FormEvent } from "react";
import { Navigate } from "react-router";
import { Fish, KeyRound, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useAutenticacao } from "../hooks/useAutenticacao";
import { toast } from "sonner";

export function Login() {
  const { autenticado, entrar } = useAutenticacao();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (autenticado) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEnviando(true);

    try {
      await entrar(email, senha);
      toast.success("Login realizado com sucesso");
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : "Falha ao entrar";
      toast.error(mensagem);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_20%,#d8f3ff_0,#eef9ff_30%,#f9fcff_60%,#ffffff_100%)] px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-cyan-200 bg-white/90 px-4 py-2 text-sm text-cyan-700 shadow-sm backdrop-blur">
            <Fish className="h-4 w-4" />
            Sistema de Associação de Pescadores
          </div>
          <div className="space-y-4">
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              Gestão completa da associação em uma única plataforma.
            </h1>
            <p className="max-w-2xl text-lg text-slate-600">
              Controle associados, comércio, permissões, reuniões e financeiro com visão operacional em tempo real.
            </p>
          </div>
        </div>

        <Card className="border-slate-200/80 bg-white/95 shadow-xl backdrop-blur">
          <CardHeader>
            <CardTitle>Acessar painel</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="pl-10"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@pescadores.local"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Senha</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="pl-10"
                    type="password"
                    value={senha}
                    onChange={(event) => setSenha(event.target.value)}
                    placeholder="Sua senha"
                  />
                </div>
              </div>

              <Button className="w-full" disabled={enviando} type="submit">
                {enviando ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
