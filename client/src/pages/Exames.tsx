import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Activity, AlertTriangle, Building2, Calendar, CheckCircle, Clock, Edit, Eye, FileText, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const TIPO_LABELS: Record<string, string> = {
  audiometria_ocupacional: "Audiometria Ocupacional",
  avaliacao_audiologica: "Avaliação Audiológica",
  meatoscopia: "Meatoscopia",
  imitanciometria: "Imitanciometria",
};

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export default function Exames() {
  const utils = trpc.useUtils();
  const [, navigate] = useLocation();
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterResultado, setFilterResultado] = useState<string>("");
  const [filterEmpresaId, setFilterEmpresaId] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExame, setEditingExame] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: exames, isLoading } = trpc.exames.list.useQuery({});
  const { data: stats } = trpc.exames.stats.useQuery();
  const { data: colaboradores } = trpc.colaboradores.list.useQuery({});
  const { data: empresas } = trpc.empresas.list.useQuery({});

  const createMutation = trpc.exames.create.useMutation({
    onSuccess: () => {
      utils.exames.list.invalidate();
      utils.exames.stats.invalidate();
      setShowCreateModal(false);
      toast.success("Exame registrado com sucesso!");
    },
    onError: (e) => toast.error("Erro ao registrar exame: " + e.message),
  });

  const deleteMutation = trpc.exames.delete.useMutation({
    onSuccess: () => {
      utils.exames.list.invalidate();
      utils.exames.stats.invalidate();
      setDeletingId(null);
      toast.success("Exame removido com sucesso!");
    },
    onError: (e) => toast.error("Erro ao remover exame: " + e.message),
  });

  const colaboradorMap = Object.fromEntries((colaboradores ?? []).map((c) => [c.id, c.nome]));
  const empresaMap = Object.fromEntries((empresas ?? []).map((e) => [e.id, e.nome]));

  const filtered = (exames ?? []).filter((e) => {
    if (filterStatus && filterStatus !== "all" && e.status !== filterStatus) return false;
    if (filterResultado && filterResultado !== "all" && e.resultado !== filterResultado) return false;
    if (filterEmpresaId && filterEmpresaId !== "all" && e.empresaId !== parseInt(filterEmpresaId)) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#101828]">Exames</h1>
          <p className="text-base text-[#4a5565] mt-1">Registre e acompanhe os exames audiométricos dos colaboradores</p>
        </div>
        <Button
          className="h-10 rounded-[10px] bg-[#155dfc] hover:bg-[#1249d4] text-white text-sm font-medium gap-2"
          onClick={() => navigate("/exames/novo")}
        >
          <Plus className="w-4 h-4" />
          Novo Exame
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard title="Total de Exames" value={stats?.total ?? 0} icon={Activity} iconBg="bg-blue-50" iconColor="text-[#155dfc]" />
        <MetricCard title="Realizados" value={stats?.realizados ?? 0} icon={CheckCircle} iconBg="bg-green-50" iconColor="text-[#008236]" />
        <MetricCard title="Com Alteração" value={stats?.alteracoes ?? 0} icon={AlertTriangle} iconBg="bg-amber-50" iconColor="text-[#bb4d00]" />
        <MetricCard title="Vencidos" value={stats?.vencidos ?? 0} icon={Clock} iconBg="bg-red-50" iconColor="text-[#c10007]" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[14px] border border-gray-200 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-[#364153]">Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-10 rounded-[10px] border-gray-200 bg-gray-50 text-sm">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="realizado">Realizado</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
                <SelectItem value="agendado">Agendado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-[#364153]">Resultado</Label>
            <Select value={filterResultado} onValueChange={setFilterResultado}>
              <SelectTrigger className="h-10 rounded-[10px] border-gray-200 bg-gray-50 text-sm">
                <SelectValue placeholder="Todos os resultados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os resultados</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="alteracao">Alteração</SelectItem>
                <SelectItem value="perda_leve">Perda Leve</SelectItem>
                <SelectItem value="perda_moderada">Perda Moderada</SelectItem>
                <SelectItem value="perda_severa">Perda Severa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-[#364153]">Empresa</Label>
            <Select value={filterEmpresaId} onValueChange={setFilterEmpresaId}>
              <SelectTrigger className="h-10 rounded-[10px] border-gray-200 bg-gray-50 text-sm">
                <SelectValue placeholder="Todas as empresas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as empresas</SelectItem>
                {(empresas ?? []).map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>{e.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              className="h-10 w-full rounded-[10px] border-gray-200 text-[#364153] text-sm"
              onClick={() => { setFilterStatus(""); setFilterResultado(""); setFilterEmpresaId(""); }}
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">Colaborador</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">Empresa</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">Tipo de Exame</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">Data</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">Vencimento</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">Resultado</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-[#6a7282]">Carregando...</td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((exame) => (
                  <tr key={exame.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#51a2ff] to-[#ad46ff] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                          {getInitials(colaboradorMap[exame.colaboradorId] ?? "U")}
                        </div>
                        <span className="text-sm font-medium text-[#101828]">{colaboradorMap[exame.colaboradorId] ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#6a7282]" />
                        <span className="text-sm text-[#4a5565]">{empresaMap[exame.empresaId] ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#6a7282]" />
                        <span className="text-sm text-[#4a5565]">{TIPO_LABELS[exame.tipo] ?? exame.tipo}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#6a7282]" />
                        <span className="text-sm text-[#4a5565]">{exame.dataRealizacao}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#6a7282]" />
                        <span className="text-sm text-[#4a5565]">{exame.dataVencimento ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={exame.resultado ?? "normal"} />
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={exame.status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          className="w-8 h-8 rounded-[10px] flex items-center justify-center hover:bg-blue-50 text-[#6a7282] hover:text-[#155dfc] transition-colors"
                          onClick={() => toast.info("Visualizar laudo")}
                          title="Ver laudo"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          className="w-8 h-8 rounded-[10px] flex items-center justify-center hover:bg-blue-50 text-[#6a7282] hover:text-[#155dfc] transition-colors"
                          onClick={() => setEditingExame(exame)}
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="w-8 h-8 rounded-[10px] flex items-center justify-center hover:bg-red-50 text-[#6a7282] hover:text-[#c10007] transition-colors"
                          onClick={() => setDeletingId(exame.id)}
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Activity className="w-10 h-10 text-gray-300" />
                      <p className="text-sm text-[#6a7282]">Nenhum exame encontrado</p>
                      <Button
                        className="h-9 rounded-[10px] bg-[#155dfc] hover:bg-[#1249d4] text-white text-sm"
                        onClick={() => navigate("/exames/novo")}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Registrar primeiro exame
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <ExameModal
        open={showCreateModal || !!editingExame}
        exame={editingExame}
        colaboradores={colaboradores ?? []}
        empresas={empresas ?? []}
        onClose={() => { setShowCreateModal(false); setEditingExame(null); }}
        onSave={(data) => createMutation.mutate(data)}
        loading={createMutation.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este exame? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deletingId && deleteMutation.mutate({ id: deletingId })}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ExameModal({ open, exame, colaboradores, empresas, onClose, onSave, loading }: {
  open: boolean;
  exame?: any;
  colaboradores: any[];
  empresas: any[];
  onClose: () => void;
  onSave: (data: any) => void;
  loading: boolean;
}) {
  const [colSearch, setColSearch] = useState("");
  const colaboradoresFiltrados = colaboradores.filter((c) => {
    if (!colSearch.trim()) return true;
    const q = colSearch.toLowerCase();
    return c.nome.toLowerCase().includes(q) || (c.codigo ?? "").toLowerCase().includes(q);
  });

  const [form, setForm] = useState({
    colaboradorId: exame?.colaboradorId ? String(exame.colaboradorId) : "",
    empresaId: exame?.empresaId ? String(exame.empresaId) : "",
    tipo: exame?.tipo ?? "audiometria_ocupacional",
    dataRealizacao: exame?.dataRealizacao ?? "",
    dataVencimento: exame?.dataVencimento ?? "",
    resultado: exame?.resultado ?? "normal",
    status: exame?.status ?? "realizado",
    observacoes: exame?.observacoes ?? "",
  });

  const handleChange = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      colaboradorId: parseInt(form.colaboradorId),
      empresaId: parseInt(form.empresaId),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{exame ? "Editar Exame" : "Novo Exame"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Colaborador *</Label>
              <Select value={form.colaboradorId} onValueChange={(v) => handleChange("colaboradorId", v)} required>
                <SelectTrigger className="rounded-[10px]">
                  <SelectValue placeholder="Selecione o colaborador" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1.5">
                    <input
                      type="text"
                      placeholder="Buscar por nome ou COL-XXXX..."
                      value={colSearch}
                      onChange={e => setColSearch(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      onKeyDown={e => e.stopPropagation()}
                      className="w-full h-7 px-2 text-xs border border-gray-200 rounded bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                  {colaboradoresFiltrados.length === 0 && (
                    <div className="px-3 py-2 text-xs text-gray-400">Nenhum colaborador encontrado</div>
                  )}
                  {colaboradoresFiltrados.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.codigo ? <span className="text-blue-600 font-mono mr-1.5">{c.codigo}</span> : null}{c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Empresa *</Label>
              <Select value={form.empresaId} onValueChange={(v) => handleChange("empresaId", v)} required>
                <SelectTrigger className="rounded-[10px]">
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <Label>Tipo de Exame</Label>
              <Select value={form.tipo} onValueChange={(v) => handleChange("tipo", v)}>
                <SelectTrigger className="rounded-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="audiometria_ocupacional">Audiometria Ocupacional</SelectItem>
                  <SelectItem value="avaliacao_audiologica">Avaliação Audiológica</SelectItem>
                  <SelectItem value="meatoscopia">Meatoscopia</SelectItem>
                  <SelectItem value="imitanciometria">Imitanciometria</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Data de Realização *</Label>
              <Input value={form.dataRealizacao} onChange={(e) => handleChange("dataRealizacao", e.target.value)} required placeholder="DD/MM/AAAA" className="rounded-[10px]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Data de Vencimento</Label>
              <Input value={form.dataVencimento} onChange={(e) => handleChange("dataVencimento", e.target.value)} placeholder="DD/MM/AAAA" className="rounded-[10px]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Resultado</Label>
              <Select value={form.resultado} onValueChange={(v) => handleChange("resultado", v)}>
                <SelectTrigger className="rounded-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alteracao">Alteração</SelectItem>
                  <SelectItem value="perda_leve">Perda Leve</SelectItem>
                  <SelectItem value="perda_moderada">Perda Moderada</SelectItem>
                  <SelectItem value="perda_severa">Perda Severa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
                <SelectTrigger className="rounded-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realizado">Realizado</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="agendado">Agendado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <Label>Observações</Label>
              <textarea
                value={form.observacoes}
                onChange={(e) => handleChange("observacoes", e.target.value)}
                placeholder="Observações sobre o exame..."
                rows={3}
                className="px-3 py-2 bg-gray-50 rounded-[10px] border border-gray-200 text-sm text-[#101828] placeholder:text-[#99a1af] focus:outline-none focus:ring-2 focus:ring-[#155dfc]/20 focus:border-[#155dfc] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="rounded-[10px]">Cancelar</Button>
            <Button type="submit" disabled={loading || !form.colaboradorId || !form.empresaId} className="rounded-[10px] bg-[#155dfc] hover:bg-[#1249d4]">
              {loading ? "Salvando..." : exame ? "Salvar alterações" : "Registrar exame"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
