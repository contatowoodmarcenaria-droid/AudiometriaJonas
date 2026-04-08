import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Bell,
  Building2,
  FileText,
  Globe,
  MessageSquare,
  Pencil,
  Plus,
  Settings,
  Trash2,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/AppLayout";

export default function Configuracoes() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  // ── Perfil do usuário ─────────────────────────────────────────────────
  const [perfil, setPerfil] = useState({
    name: user?.name ?? "",
    specialty: "Fonoaudiologia Ocupacional",
    crfa: "",
    email: user?.email ?? "",
    phone: "",
  });

  const updateMutation = trpc.perfil.update.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      toast.success("Perfil atualizado com sucesso!");
    },
    onError: (e) => toast.error("Erro ao atualizar perfil: " + e.message),
  });

  const handleSavePerfil = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(perfil);
  };

  // ── Configurações de Laudo ────────────────────────────────────────────
  const { data: configLaudo } = trpc.audiometria.getConfiguracaoLaudo.useQuery();

  const [laudo, setLaudo] = useState({
    nomeClinica: "",
    enderecoClinica: "",
    telefoneClinica: "",
    emailClinica: "",
    cnpjClinica: "",
    logotipoUrl: "",
    nomeProfissional: "",
    titulosProfissional: "",
    crfa: "",
    assinaturaUrl: "",
  });

  useEffect(() => {
    if (configLaudo) {
      setLaudo({
        nomeClinica: configLaudo.nomeClinica ?? "",
        enderecoClinica: configLaudo.enderecoClinica ?? "",
        telefoneClinica: configLaudo.telefoneClinica ?? "",
        emailClinica: configLaudo.emailClinica ?? "",
        cnpjClinica: configLaudo.cnpjClinica ?? "",
        logotipoUrl: configLaudo.logotipoUrl ?? "",
        nomeProfissional: configLaudo.nomeProfissional ?? "",
        titulosProfissional: configLaudo.titulosProfissional ?? "",
        crfa: configLaudo.crfa ?? "",
        assinaturaUrl: configLaudo.assinaturaUrl ?? "",
      });
    }
  }, [configLaudo]);

  const saveLaudoMutation = trpc.audiometria.saveConfiguracaoLaudo.useMutation({
    onSuccess: () => {
      utils.audiometria.getConfiguracaoLaudo.invalidate();
      toast.success("Configurações de laudo salvas!");
    },
    onError: (e) => toast.error("Erro ao salvar: " + e.message),
  });

  const handleSaveLaudo = (e: React.FormEvent) => {
    e.preventDefault();
    saveLaudoMutation.mutate(laudo);
  };

  // ── Pareceres Modelo ──────────────────────────────────────────────────
  const { data: pareceres } = trpc.audiometria.listPareceresModelo.useQuery();

  const [novoParecerOpen, setNovoParecerOpen] = useState(false);
  const [editParecerOpen, setEditParecerOpen] = useState(false);
  const [parecerForm, setParecerForm] = useState({ titulo: "", texto: "", categoria: "" });
  const [editParecerId, setEditParecerId] = useState<number | null>(null);

  const seedMutation = trpc.audiometria.seedPareceresModelo.useMutation({
    onSuccess: (r) => {
      utils.audiometria.listPareceresModelo.invalidate();
      if (r.skipped) toast.info("Pareceres padrão já cadastrados.");
      else toast.success(`${r.count} pareceres padrão adicionados!`);
    },
  });

  const createParecerMutation = trpc.audiometria.createParecerModelo.useMutation({
    onSuccess: () => {
      utils.audiometria.listPareceresModelo.invalidate();
      setNovoParecerOpen(false);
      setParecerForm({ titulo: "", texto: "", categoria: "" });
      toast.success("Parecer criado!");
    },
  });

  const updateParecerMutation = trpc.audiometria.updateParecerModelo.useMutation({
    onSuccess: () => {
      utils.audiometria.listPareceresModelo.invalidate();
      setEditParecerOpen(false);
      toast.success("Parecer atualizado!");
    },
  });

  const deleteParecerMutation = trpc.audiometria.deleteParecerModelo.useMutation({
    onSuccess: () => {
      utils.audiometria.listPareceresModelo.invalidate();
      toast.success("Parecer removido!");
    },
  });

  const handleEditParecer = (p: any) => {
    setEditParecerId(p.id);
    setParecerForm({ titulo: p.titulo, texto: p.texto, categoria: p.categoria ?? "" });
    setEditParecerOpen(true);
  };

  // ── Alertas ───────────────────────────────────────────────────────────
  const [alertas, setAlertas] = useState({
    examesVencidos: true,
    examesAVencer: true,
    novoColaborador: false,
    relatorioMensal: true,
    emailDigest: false,
  });
  const toggleAlerta = (key: keyof typeof alertas) =>
    setAlertas((a) => ({ ...a, [key]: !a[key] }));

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#101828]">Configurações</h1>
        <p className="text-base text-[#4a5565] mt-1">
          Gerencie suas preferências, perfil profissional e modelos de laudo
        </p>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* ── Perfil de Usuário ─────────────────────────────────────── */}
        <div className="bg-white rounded-[14px] border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-[#155dfc]" />
            <h3 className="text-sm font-semibold text-[#101828]">Perfil de Usuário</h3>
          </div>
          <form onSubmit={handleSavePerfil} className="flex flex-col gap-4">
            <div className="flex items-center gap-3 mb-2">
              <UserAvatar name={user?.name} size="lg" />
              <div>
                <p className="text-sm font-medium text-[#101828]">{user?.name ?? "Usuário"}</p>
                <p className="text-xs text-[#6a7282]">Fonoaudiólogo(a)</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-[#364153]">Nome Completo</Label>
                <Input
                  value={perfil.name}
                  onChange={(e) => setPerfil(f => ({ ...f, name: e.target.value }))}
                  className="h-9 rounded-[10px] text-sm"
                  placeholder="Seu nome completo"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-[#364153]">Especialidade</Label>
                <Input
                  value={perfil.specialty}
                  onChange={(e) => setPerfil(f => ({ ...f, specialty: e.target.value }))}
                  className="h-9 rounded-[10px] text-sm"
                  placeholder="Especialidade"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-[#364153]">CRFa</Label>
                <Input
                  value={perfil.crfa}
                  onChange={(e) => setPerfil(f => ({ ...f, crfa: e.target.value }))}
                  className="h-9 rounded-[10px] text-sm"
                  placeholder="Número do CRFa"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-[#364153]">E-mail</Label>
                <Input
                  value={perfil.email}
                  onChange={(e) => setPerfil(f => ({ ...f, email: e.target.value }))}
                  type="email"
                  className="h-9 rounded-[10px] text-sm"
                  placeholder="seu@email.com"
                />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <Label className="text-xs font-medium text-[#364153]">Telefone</Label>
                <Input
                  value={perfil.phone}
                  onChange={(e) => setPerfil(f => ({ ...f, phone: e.target.value }))}
                  className="h-9 rounded-[10px] text-sm"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="h-9 rounded-[10px] bg-[#155dfc] hover:bg-[#1249d4] text-white text-sm"
              >
                {updateMutation.isPending ? "Salvando..." : "Salvar perfil"}
              </Button>
            </div>
          </form>
        </div>

        {/* ── Configurações de Laudo ────────────────────────────────── */}
        <div className="bg-white rounded-[14px] border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-[#155dfc]" />
            <h3 className="text-sm font-semibold text-[#101828]">Configurações do Laudo / Relatório</h3>
          </div>
          <form onSubmit={handleSaveLaudo} className="flex flex-col gap-3">
            <p className="text-xs text-[#6a7282] mb-1">
              Essas informações aparecerão no cabeçalho e rodapé dos laudos gerados em PDF.
            </p>

            <div className="border border-gray-100 rounded-[10px] p-3 bg-gray-50">
              <p className="text-xs font-semibold text-[#364153] mb-2 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Dados da Clínica / Empresa
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1 col-span-2">
                  <Label className="text-xs text-[#364153]">Nome da Clínica</Label>
                  <Input value={laudo.nomeClinica} onChange={e => setLaudo(l => ({ ...l, nomeClinica: e.target.value }))}
                    className="h-8 text-xs rounded-[8px]" placeholder="Nome da clínica ou consultório" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-[#364153]">CNPJ</Label>
                  <Input value={laudo.cnpjClinica} onChange={e => setLaudo(l => ({ ...l, cnpjClinica: e.target.value }))}
                    className="h-8 text-xs rounded-[8px]" placeholder="00.000.000/0000-00" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-[#364153]">Telefone</Label>
                  <Input value={laudo.telefoneClinica} onChange={e => setLaudo(l => ({ ...l, telefoneClinica: e.target.value }))}
                    className="h-8 text-xs rounded-[8px]" placeholder="(11) 3333-4444" />
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <Label className="text-xs text-[#364153]">Endereço</Label>
                  <Input value={laudo.enderecoClinica} onChange={e => setLaudo(l => ({ ...l, enderecoClinica: e.target.value }))}
                    className="h-8 text-xs rounded-[8px]" placeholder="Rua, número, bairro, cidade - UF" />
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <Label className="text-xs text-[#364153]">E-mail</Label>
                  <Input value={laudo.emailClinica} onChange={e => setLaudo(l => ({ ...l, emailClinica: e.target.value }))}
                    className="h-8 text-xs rounded-[8px]" placeholder="contato@clinica.com.br" />
                </div>
              </div>
            </div>

            <div className="border border-gray-100 rounded-[10px] p-3 bg-gray-50">
              <p className="text-xs font-semibold text-[#364153] mb-2 flex items-center gap-1">
                <User className="w-3 h-3" /> Dados do Profissional
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1 col-span-2">
                  <Label className="text-xs text-[#364153]">Nome do Profissional</Label>
                  <Input value={laudo.nomeProfissional} onChange={e => setLaudo(l => ({ ...l, nomeProfissional: e.target.value }))}
                    className="h-8 text-xs rounded-[8px]" placeholder="Nome completo" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-[#364153]">CRFa</Label>
                  <Input value={laudo.crfa} onChange={e => setLaudo(l => ({ ...l, crfa: e.target.value }))}
                    className="h-8 text-xs rounded-[8px]" placeholder="8 - 00000" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-[#364153]">Títulos / Especialidade</Label>
                  <Input value={laudo.titulosProfissional} onChange={e => setLaudo(l => ({ ...l, titulosProfissional: e.target.value }))}
                    className="h-8 text-xs rounded-[8px]" placeholder="Fonoaudiólogo Ocupacional" />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={saveLaudoMutation.isPending}
                className="h-9 rounded-[10px] bg-[#155dfc] hover:bg-[#1249d4] text-white text-sm"
              >
                {saveLaudoMutation.isPending ? "Salvando..." : "Salvar configurações de laudo"}
              </Button>
            </div>
          </form>
        </div>

        {/* ── Modelos de Parecer Audiológico ────────────────────────── */}
        <div className="bg-white rounded-[14px] border border-gray-200 p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#155dfc]" />
              <h3 className="text-sm font-semibold text-[#101828]">Modelos de Parecer Audiológico</h3>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs rounded-[8px]"
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
              >
                Carregar padrões
              </Button>
              <Dialog open={novoParecerOpen} onOpenChange={setNovoParecerOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs rounded-[8px] bg-[#155dfc] hover:bg-[#1249d4] text-white">
                    <Plus className="w-3 h-3 mr-1" />
                    Novo Parecer
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo Modelo de Parecer</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-3 mt-2">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Título</Label>
                      <Input value={parecerForm.titulo} onChange={e => setParecerForm(f => ({ ...f, titulo: e.target.value }))}
                        placeholder="Ex: Audição Normal" className="h-9 text-sm" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Categoria (opcional)</Label>
                      <Input value={parecerForm.categoria} onChange={e => setParecerForm(f => ({ ...f, categoria: e.target.value }))}
                        placeholder="Ex: Normal, Alterado, PAIR..." className="h-9 text-sm" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Texto do Parecer</Label>
                      <Textarea value={parecerForm.texto} onChange={e => setParecerForm(f => ({ ...f, texto: e.target.value }))}
                        placeholder="Digite o texto completo do parecer..." className="text-sm min-h-[120px]" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setNovoParecerOpen(false)}>Cancelar</Button>
                      <Button size="sm" className="bg-[#155dfc] hover:bg-[#1249d4] text-white"
                        onClick={() => createParecerMutation.mutate(parecerForm)}
                        disabled={!parecerForm.titulo || !parecerForm.texto || createParecerMutation.isPending}>
                        Salvar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Lista de pareceres */}
          {!pareceres || pareceres.length === 0 ? (
            <div className="text-center py-8 text-[#6a7282] text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Nenhum modelo cadastrado.</p>
              <p className="text-xs mt-1">Clique em "Carregar padrões" para adicionar modelos pré-definidos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {pareceres.map((p: any) => (
                <div key={p.id} className="border border-gray-200 rounded-[10px] p-3 hover:border-[#155dfc] transition-colors">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="text-sm font-semibold text-[#101828]">{p.titulo}</p>
                      {p.categoria && (
                        <span className="text-xs bg-blue-50 text-[#155dfc] px-1.5 py-0.5 rounded-full">{p.categoria}</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditParecer(p)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600"
                        onClick={() => deleteParecerMutation.mutate({ id: p.id })}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-[#4a5565] line-clamp-3 mt-1">{p.texto}</p>
                </div>
              ))}
            </div>
          )}

          {/* Dialog de edição */}
          <Dialog open={editParecerOpen} onOpenChange={setEditParecerOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Modelo de Parecer</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 mt-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Título</Label>
                  <Input value={parecerForm.titulo} onChange={e => setParecerForm(f => ({ ...f, titulo: e.target.value }))}
                    className="h-9 text-sm" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Categoria</Label>
                  <Input value={parecerForm.categoria} onChange={e => setParecerForm(f => ({ ...f, categoria: e.target.value }))}
                    className="h-9 text-sm" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Texto do Parecer</Label>
                  <Textarea value={parecerForm.texto} onChange={e => setParecerForm(f => ({ ...f, texto: e.target.value }))}
                    className="text-sm min-h-[120px]" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditParecerOpen(false)}>Cancelar</Button>
                  <Button size="sm" className="bg-[#155dfc] hover:bg-[#1249d4] text-white"
                    onClick={() => editParecerId && updateParecerMutation.mutate({ id: editParecerId, ...parecerForm })}
                    disabled={updateParecerMutation.isPending}>
                    Salvar alterações
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* ── Alertas e Notificações ────────────────────────────────── */}
        <div className="bg-white rounded-[14px] border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-[#155dfc]" />
            <h3 className="text-sm font-semibold text-[#101828]">Alertas e Notificações</h3>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { key: "examesVencidos" as const, label: "Exames vencidos", desc: "Notificar quando exames passarem da data de vencimento" },
              { key: "examesAVencer" as const, label: "Exames a vencer", desc: "Notificar 30 dias antes do vencimento" },
              { key: "novoColaborador" as const, label: "Novo colaborador", desc: "Notificar quando um colaborador for cadastrado" },
              { key: "relatorioMensal" as const, label: "Relatório mensal", desc: "Receber resumo mensal das atividades" },
              { key: "emailDigest" as const, label: "E-mail digest", desc: "Receber resumo diário por e-mail" },
            ].map((item) => (
              <div key={item.key} className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-[#101828]">{item.label}</p>
                  <p className="text-xs text-[#6a7282] mt-0.5">{item.desc}</p>
                </div>
                <Switch
                  checked={alertas[item.key]}
                  onCheckedChange={() => toggleAlerta(item.key)}
                  className="data-[state=checked]:bg-[#155dfc] flex-shrink-0"
                />
              </div>
            ))}
            <div className="flex justify-end mt-2">
              <Button
                className="h-9 rounded-[10px] bg-[#155dfc] hover:bg-[#1249d4] text-white text-sm"
                onClick={() => toast.success("Configurações de alertas salvas!")}
              >
                Salvar configurações
              </Button>
            </div>
          </div>
        </div>

        {/* ── Preferências Gerais ───────────────────────────────────── */}
        <div className="bg-white rounded-[14px] border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-[#155dfc]" />
            <h3 className="text-sm font-semibold text-[#101828]">Preferências Gerais</h3>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#364153]">Idioma</Label>
              <Select defaultValue="pt-BR">
                <SelectTrigger className="h-9 rounded-[10px] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#364153]">Fuso Horário</Label>
              <Select defaultValue="America/Sao_Paulo">
                <SelectTrigger className="h-9 rounded-[10px] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">Brasília (UTC-3)</SelectItem>
                  <SelectItem value="America/Manaus">Manaus (UTC-4)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#364153]">Formato de Data</Label>
              <Select defaultValue="DD/MM/YYYY">
                <SelectTrigger className="h-9 rounded-[10px] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/AAAA</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/AAAA</SelectItem>
                  <SelectItem value="YYYY-MM-DD">AAAA-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button
                className="h-9 rounded-[10px] bg-[#155dfc] hover:bg-[#1249d4] text-white text-sm"
                onClick={() => toast.success("Preferências salvas!")}
              >
                Salvar preferências
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
