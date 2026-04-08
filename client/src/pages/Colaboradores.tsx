import { trpc } from "@/lib/trpc";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
import {
  Activity,
  Briefcase,
  Building2,
  Calendar,
  Edit,
  Eye,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  Upload,
  User,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function avatarColor(name: string) {
  const colors = [
    "from-[#51a2ff] to-[#ad46ff]",
    "from-[#2b7fff] to-[#155dfc]",
    "from-[#00b86b] to-[#008236]",
    "from-[#ff6b35] to-[#e63900]",
    "from-[#f59e0b] to-[#d97706]",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

export default function Colaboradores() {
  const utils = trpc.useUtils();
  const [location] = useLocation();
  const urlBusca =
    new URLSearchParams(
      location.includes("?") ? location.split("?")[1] : ""
    ).get("busca") ?? "";
  const [busca, setBusca] = useState(urlBusca);

  useEffect(() => {
    const params = new URLSearchParams(
      location.includes("?") ? location.split("?")[1] : ""
    );
    const q = params.get("busca") ?? "";
    setBusca(q);
  }, [location]);

  const [filterEmpresaId, setFilterEmpresaId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingColaborador, setEditingColaborador] = useState<any>(null);
  const [viewingColaborador, setViewingColaborador] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: colaboradores, isLoading } = trpc.colaboradores.list.useQuery({});
  const { data: stats } = trpc.colaboradores.stats.useQuery();
  const { data: empresas } = trpc.empresas.list.useQuery({});

  const createMutation = trpc.colaboradores.create.useMutation({
    onSuccess: () => {
      utils.colaboradores.list.invalidate();
      utils.colaboradores.stats.invalidate();
      setShowCreateModal(false);
      toast.success("Colaborador criado com sucesso!");
    },
    onError: (e) => toast.error("Erro ao criar colaborador: " + e.message),
  });

  const updateMutation = trpc.colaboradores.update.useMutation({
    onSuccess: () => {
      utils.colaboradores.list.invalidate();
      setEditingColaborador(null);
      toast.success("Colaborador atualizado com sucesso!");
    },
    onError: (e) => toast.error("Erro ao atualizar colaborador: " + e.message),
  });

  const deleteMutation = trpc.colaboradores.delete.useMutation({
    onSuccess: () => {
      utils.colaboradores.list.invalidate();
      utils.colaboradores.stats.invalidate();
      setDeletingId(null);
      toast.success("Colaborador removido com sucesso!");
    },
    onError: (e) => toast.error("Erro ao remover colaborador: " + e.message),
  });

  const filtered = (colaboradores ?? []).filter((c) => {
    if (busca) {
      const q = busca.toLowerCase();
      const matchNome = c.nome.toLowerCase().includes(q);
      const matchCodigo = c.codigo ? c.codigo.toLowerCase().includes(q) : false;
      if (!matchNome && !matchCodigo) return false;
    }
    if (
      filterEmpresaId &&
      filterEmpresaId !== "all" &&
      c.empresaId !== parseInt(filterEmpresaId)
    )
      return false;
    if (filterStatus && filterStatus !== "all" && c.status !== filterStatus)
      return false;
    return true;
  });

  const empresaMap = Object.fromEntries(
    (empresas ?? []).map((e) => [e.id, e.nome])
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#101828]">Colaboradores</h1>
          <p className="text-base text-[#4a5565] mt-1">
            Gerencie os colaboradores vinculados às empresas atendidas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-10 rounded-[10px] border-gray-200 text-[#364153] text-sm font-medium gap-2"
            onClick={() =>
              toast.info("Funcionalidade de importação em desenvolvimento")
            }
          >
            <Upload className="w-4 h-4" />
            Importar Colaboradores
          </Button>
          <Button
            className="h-10 rounded-[10px] bg-[#155dfc] hover:bg-[#1249d4] text-white text-sm font-medium gap-2"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4" />
            Novo Colaborador
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Colaboradores"
          value={stats?.total ?? 0}
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-[#155dfc]"
        />
        <MetricCard
          title="Colaboradores Ativos"
          value={stats?.ativos ?? 0}
          icon={UserCheck}
          iconBg="bg-green-50"
          iconColor="text-[#008236]"
        />
        <MetricCard
          title="Inativos"
          value={stats?.inativos ?? 0}
          icon={UserMinus}
          iconBg="bg-gray-100"
          iconColor="text-gray-500"
        />
        <MetricCard
          title="Afastados"
          value={stats?.afastados ?? 0}
          icon={Activity}
          iconBg="bg-amber-50"
          iconColor="text-[#bb4d00]"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[14px] border border-gray-200 p-6">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#99a1af]" />
            <input
              type="text"
              placeholder="Buscar por nome ou ID (ex: COL-0001)..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-gray-50 rounded-[10px] border border-gray-200 text-sm text-[#101828] placeholder:text-[#99a1af] focus:outline-none focus:ring-2 focus:ring-[#155dfc]/20 focus:border-[#155dfc]"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#364153]">Empresa</Label>
              <Select value={filterEmpresaId} onValueChange={setFilterEmpresaId}>
                <SelectTrigger className="h-10 rounded-[10px] border-gray-200 bg-gray-50 text-sm">
                  <SelectValue placeholder="Todas as empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {(empresas ?? []).map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#364153]">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-10 rounded-[10px] border-gray-200 bg-gray-50 text-sm">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="afastado">Afastado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider w-28">
                  ID
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">
                  Colaborador
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">
                  CPF
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">
                  Cargo
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">
                  Empresa
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">
                  Admissão
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-sm text-[#6a7282]"
                  >
                    Carregando...
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((col) => (
                  <tr
                    key={col.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 border border-blue-100 text-xs font-mono font-semibold text-[#155dfc] tracking-wide">
                        {col.codigo ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor(col.nome)} flex items-center justify-center text-white text-xs font-medium flex-shrink-0`}
                        >
                          {getInitials(col.nome)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#101828]">
                            {col.nome}
                          </p>
                          {col.email && (
                            <p className="text-xs text-[#6a7282]">{col.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-[#4a5565]">
                        {col.cpf ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-[#4a5565]">
                        {col.cargo ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#6a7282]" />
                        <span className="text-sm text-[#4a5565]">
                          {empresaMap[col.empresaId] ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-[#4a5565]">
                        {col.dataAdmissao ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={col.status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          className="w-8 h-8 rounded-[10px] flex items-center justify-center hover:bg-blue-50 text-[#6a7282] hover:text-[#155dfc] transition-colors"
                          onClick={() => setViewingColaborador(col)}
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="w-8 h-8 rounded-[10px] flex items-center justify-center hover:bg-blue-50 text-[#6a7282] hover:text-[#155dfc] transition-colors"
                          onClick={() => setEditingColaborador(col)}
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="w-8 h-8 rounded-[10px] flex items-center justify-center hover:bg-red-50 text-[#6a7282] hover:text-[#c10007] transition-colors"
                          onClick={() => setDeletingId(col.id)}
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
                      <Users className="w-10 h-10 text-gray-300" />
                      <p className="text-sm text-[#6a7282]">
                        {busca
                          ? `Nenhum resultado para "${busca}"`
                          : "Nenhum colaborador encontrado"}
                      </p>
                      {!busca && (
                        <Button
                          className="h-9 rounded-[10px] bg-[#155dfc] hover:bg-[#1249d4] text-white text-sm"
                          onClick={() => setShowCreateModal(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar primeiro colaborador
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Painel lateral de detalhes */}
      <Sheet
        open={!!viewingColaborador}
        onOpenChange={(open) => !open && setViewingColaborador(null)}
      >
        <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-y-auto">
          <SheetHeader className="sr-only">
            <SheetTitle>Detalhes do Colaborador</SheetTitle>
            <SheetDescription>
              Informações completas do colaborador selecionado
            </SheetDescription>
          </SheetHeader>
          {viewingColaborador && (
            <ColaboradorDetalheContent
              colaborador={viewingColaborador}
              empresaMap={empresaMap}
              onEdit={() => {
                setEditingColaborador(viewingColaborador);
                setViewingColaborador(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Create/Edit Modal — key força re-mount com dados corretos */}
      <ColaboradorModal
        key={editingColaborador?.id ?? (showCreateModal ? "new" : "closed")}
        open={showCreateModal || !!editingColaborador}
        colaborador={editingColaborador}
        empresas={empresas ?? []}
        onClose={() => {
          setShowCreateModal(false);
          setEditingColaborador(null);
        }}
        onSave={(data) => {
          if (editingColaborador) {
            updateMutation.mutate({ id: editingColaborador.id, ...data });
          } else {
            createMutation.mutate(data);
          }
        }}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este colaborador? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() =>
                deletingId && deleteMutation.mutate({ id: deletingId })
              }
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ─── Painel lateral de detalhes ─────────────────────────────────────── */
function ColaboradorDetalheContent({
  colaborador,
  empresaMap,
  onEdit,
}: {
  colaborador: any;
  empresaMap: Record<number, string>;
  onEdit: () => void;
}) {
  const statusColors: Record<string, string> = {
    ativo: "bg-green-50 text-green-700 border-green-200",
    inativo: "bg-gray-100 text-gray-600 border-gray-200",
    afastado: "bg-amber-50 text-amber-700 border-amber-200",
  };
  const statusLabels: Record<string, string> = {
    ativo: "Ativo",
    inativo: "Inativo",
    afastado: "Afastado",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100">
        <div
          className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarColor(colaborador.nome)} flex items-center justify-center text-white text-base font-semibold flex-shrink-0`}
        >
          {getInitials(colaborador.nome)}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-[#101828] truncate">
            {colaborador.nome}
          </h2>
          <p className="text-sm text-[#6a7282]">Detalhes do colaborador</p>
        </div>
        {colaborador.codigo && (
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-blue-50 border border-blue-100 text-[#155dfc] flex-shrink-0">
            {colaborador.codigo}
          </span>
        )}
      </div>

      {/* Corpo */}
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
        {/* Informações Pessoais */}
        <section>
          <h3 className="text-xs font-semibold text-[#6a7282] uppercase tracking-wider mb-3">
            Informações Pessoais
          </h3>
          <div className="bg-white border border-gray-100 rounded-[12px] p-4 grid grid-cols-2 gap-4">
            <InfoItem
              icon={<User className="w-4 h-4" />}
              label="CPF"
              value={colaborador.cpf}
            />
            <InfoItem
              icon={<Calendar className="w-4 h-4" />}
              label="Nascimento"
              value={colaborador.dataNascimento}
            />
            <InfoItem
              icon={<Mail className="w-4 h-4" />}
              label="E-mail"
              value={colaborador.email}
              className="col-span-2"
            />
            <InfoItem
              icon={<Phone className="w-4 h-4" />}
              label="Telefone"
              value={colaborador.telefone}
            />
            <InfoItem
              icon={<Calendar className="w-4 h-4" />}
              label="Admissão"
              value={colaborador.dataAdmissao}
            />
          </div>
        </section>

        {/* Informações Profissionais */}
        <section>
          <h3 className="text-xs font-semibold text-[#6a7282] uppercase tracking-wider mb-3">
            Informações Profissionais
          </h3>
          <div className="bg-white border border-gray-100 rounded-[12px] p-4 grid grid-cols-2 gap-4">
            <InfoItem
              icon={<Briefcase className="w-4 h-4" />}
              label="Cargo"
              value={colaborador.cargo}
            />
            <InfoItem
              icon={<Briefcase className="w-4 h-4" />}
              label="Setor"
              value={colaborador.setor}
            />
            <InfoItem
              icon={<Building2 className="w-4 h-4" />}
              label="Empresa"
              value={empresaMap[colaborador.empresaId]}
              className="col-span-2"
            />
          </div>
        </section>

        {/* Status */}
        <section>
          <h3 className="text-xs font-semibold text-[#6a7282] uppercase tracking-wider mb-3">
            Status
          </h3>
          <div className="bg-white border border-gray-100 rounded-[12px] p-4">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusColors[colaborador.status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
            >
              {statusLabels[colaborador.status] ?? colaborador.status}
            </span>
          </div>
        </section>
      </div>

      {/* Rodapé */}
      <div className="px-6 py-4 border-t border-gray-100">
        <Button
          className="w-full h-10 rounded-[10px] bg-[#155dfc] hover:bg-[#1249d4] text-white text-sm font-medium gap-2"
          onClick={onEdit}
        >
          <Edit className="w-4 h-4" />
          Editar Colaborador
        </Button>
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <div className="flex items-center gap-1.5 text-[#6a7282]">
        <span className="w-4 h-4 flex-shrink-0">{icon}</span>
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-sm text-[#101828] pl-5">{value ?? "—"}</p>
    </div>
  );
}

/* ─── Modal de criação / edição ──────────────────────────────────────── */
function ColaboradorModal({
  open,
  colaborador,
  empresas,
  onClose,
  onSave,
  loading,
}: {
  open: boolean;
  colaborador?: any;
  empresas: any[];
  onClose: () => void;
  onSave: (data: any) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    nome: colaborador?.nome ?? "",
    cpf: colaborador?.cpf ?? "",
    cargo: colaborador?.cargo ?? "",
    setor: colaborador?.setor ?? "",
    empresaId: colaborador?.empresaId ? String(colaborador.empresaId) : "",
    status: colaborador?.status ?? "ativo",
    dataNascimento: colaborador?.dataNascimento ?? "",
    dataAdmissao: colaborador?.dataAdmissao ?? "",
    email: colaborador?.email ?? "",
    telefone: colaborador?.telefone ?? "",
  });

  const handleChange = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, empresaId: parseInt(form.empresaId) });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {colaborador ? (
              <span className="flex items-center gap-2">
                Editar Colaborador
                {colaborador.codigo && (
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-blue-50 border border-blue-100 text-[#155dfc]">
                    {colaborador.codigo}
                  </span>
                )}
              </span>
            ) : (
              "Novo Colaborador"
            )}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 col-span-2">
              <Label>Nome Completo *</Label>
              <Input
                value={form.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                required
                placeholder="Nome completo"
                className="rounded-[10px]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>CPF</Label>
              <Input
                value={form.cpf}
                onChange={(e) => handleChange("cpf", e.target.value)}
                placeholder="000.000.000-00"
                className="rounded-[10px]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Empresa *</Label>
              <Select
                value={form.empresaId}
                onValueChange={(v) => handleChange("empresaId", v)}
                required
              >
                <SelectTrigger className="rounded-[10px]">
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Cargo</Label>
              <Input
                value={form.cargo}
                onChange={(e) => handleChange("cargo", e.target.value)}
                placeholder="Cargo do colaborador"
                className="rounded-[10px]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Setor</Label>
              <Input
                value={form.setor}
                onChange={(e) => handleChange("setor", e.target.value)}
                placeholder="Setor"
                className="rounded-[10px]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Data de Nascimento</Label>
              <Input
                value={form.dataNascimento}
                onChange={(e) => handleChange("dataNascimento", e.target.value)}
                placeholder="DD/MM/AAAA"
                className="rounded-[10px]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Data de Admissão</Label>
              <Input
                value={form.dataAdmissao}
                onChange={(e) => handleChange("dataAdmissao", e.target.value)}
                placeholder="DD/MM/AAAA"
                className="rounded-[10px]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>E-mail</Label>
              <Input
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                type="email"
                placeholder="email@exemplo.com"
                className="rounded-[10px]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Telefone</Label>
              <Input
                value={form.telefone}
                onChange={(e) => handleChange("telefone", e.target.value)}
                placeholder="(11) 99999-9999"
                className="rounded-[10px]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => handleChange("status", v)}
              >
                <SelectTrigger className="rounded-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="afastado">Afastado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-[10px]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !form.empresaId}
              className="rounded-[10px] bg-[#155dfc] hover:bg-[#1249d4]"
            >
              {loading
                ? "Salvando..."
                : colaborador
                  ? "Salvar alterações"
                  : "Criar colaborador"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
