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
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Edit,
  Eye,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

const GRADIENT_COLORS = [
  "from-[#51a2ff] to-[#ad46ff]",
  "from-[#2b7fff] to-[#155dfc]",
  "from-[#00c9a7] to-[#155dfc]",
  "from-[#f59e0b] to-[#ef4444]",
  "from-[#8b5cf6] to-[#ec4899]",
];

function getGradient(name: string) {
  const idx = name.charCodeAt(0) % GRADIENT_COLORS.length;
  return GRADIENT_COLORS[idx];
}

export default function Empresas() {
  const utils = trpc.useUtils();
  const [searchNome, setSearchNome] = useState("");
  const [searchCnpj, setSearchCnpj] = useState("");
  const [searchResponsavel, setSearchResponsavel] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterSetor, setFilterSetor] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [viewingEmpresa, setViewingEmpresa] = useState<any>(null);

  const { data: empresas, isLoading } = trpc.empresas.listWithStats.useQuery();
  const { data: stats } = trpc.empresas.stats.useQuery();

  const createMutation = trpc.empresas.create.useMutation({
    onSuccess: () => {
      utils.empresas.listWithStats.invalidate();
      utils.empresas.stats.invalidate();
      setShowCreateModal(false);
      toast.success("Empresa criada com sucesso!");
    },
    onError: (e) => toast.error("Erro ao criar empresa: " + e.message),
  });

  const updateMutation = trpc.empresas.update.useMutation({
    onSuccess: () => {
      utils.empresas.listWithStats.invalidate();
      setEditingEmpresa(null);
      toast.success("Empresa atualizada com sucesso!");
    },
    onError: (e) => toast.error("Erro ao atualizar empresa: " + e.message),
  });

  const deleteMutation = trpc.empresas.delete.useMutation({
    onSuccess: () => {
      utils.empresas.listWithStats.invalidate();
      utils.empresas.stats.invalidate();
      setDeletingId(null);
      toast.success("Empresa removida com sucesso!");
    },
    onError: (e) => toast.error("Erro ao remover empresa: " + e.message),
  });

  const filtered = (empresas ?? []).filter((e) => {
    if (searchNome && !e.nome.toLowerCase().includes(searchNome.toLowerCase())) return false;
    if (searchCnpj && !e.cnpj.includes(searchCnpj)) return false;
    if (searchResponsavel && !(e.responsavel ?? "").toLowerCase().includes(searchResponsavel.toLowerCase())) return false;
    if (filterStatus && filterStatus !== "all" && e.status !== filterStatus) return false;
    if (filterSetor && !(e.setor ?? "").toLowerCase().includes(filterSetor.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#101828]">Empresas</h1>
          <p className="text-base text-[#4a5565] mt-1">Gerencie as empresas atendidas e acompanhe vínculos, pendências e exames relacionados</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-10 rounded-[10px] border-gray-200 text-[#364153] text-sm font-medium gap-2"
            onClick={() => toast.info("Funcionalidade de importação em desenvolvimento")}
          >
            <Upload className="w-4 h-4" />
            Importar Empresas
          </Button>
          <Button
            className="h-10 rounded-[10px] bg-[#155dfc] hover:bg-[#1249d4] text-white text-sm font-medium gap-2"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4" />
            Nova Empresa
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard title="Total de Empresas" value={stats?.total ?? 0} icon={Building2} iconBg="bg-blue-50" iconColor="text-[#155dfc]" />
        <MetricCard title="Empresas com Pendências" value={stats?.comPendencias ?? 0} icon={AlertTriangle} iconBg="bg-red-50" iconColor="text-[#c10007]" />
        <MetricCard title="Empresas com Exames a Vencer" value={stats?.examesAVencer ?? 0} icon={Calendar} iconBg="bg-amber-50" iconColor="text-[#bb4d00]" />
        <MetricCard title="Audiometrias Pendentes" value={stats?.audiometriasPendentes ?? 0} icon={Activity} iconBg="bg-blue-50" iconColor="text-[#155dfc]" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[14px] border border-gray-200 p-6">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#99a1af]" />
            <input
              type="text"
              placeholder="Buscar por nome da empresa..."
              value={searchNome}
              onChange={(e) => setSearchNome(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-gray-50 rounded-[10px] border border-gray-200 text-sm text-[#101828] placeholder:text-[#99a1af] focus:outline-none focus:ring-2 focus:ring-[#155dfc]/20 focus:border-[#155dfc]"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#364153]">CNPJ</Label>
              <input
                type="text"
                placeholder="00.000.000/0000-00"
                value={searchCnpj}
                onChange={(e) => setSearchCnpj(e.target.value)}
                className="h-10 px-3 bg-gray-50 rounded-[10px] border border-gray-200 text-sm text-[#101828] placeholder:text-[#99a1af] focus:outline-none focus:ring-2 focus:ring-[#155dfc]/20 focus:border-[#155dfc]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#364153]">Responsável</Label>
              <input
                type="text"
                placeholder="Nome do responsável"
                value={searchResponsavel}
                onChange={(e) => setSearchResponsavel(e.target.value)}
                className="h-10 px-3 bg-gray-50 rounded-[10px] border border-gray-200 text-sm text-[#101828] placeholder:text-[#99a1af] focus:outline-none focus:ring-2 focus:ring-[#155dfc]/20 focus:border-[#155dfc]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#364153]">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-10 rounded-[10px] border-gray-200 bg-gray-50 text-sm">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="inativa">Inativa</SelectItem>
                  <SelectItem value="pendente">Com Pendências</SelectItem>
                  <SelectItem value="atencao">Atenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#364153]">Setor</Label>
              <input
                type="text"
                placeholder="Setor da empresa"
                value={filterSetor}
                onChange={(e) => setFilterSetor(e.target.value)}
                className="h-10 px-3 bg-gray-50 rounded-[10px] border border-gray-200 text-sm text-[#101828] placeholder:text-[#99a1af] focus:outline-none focus:ring-2 focus:ring-[#155dfc]/20 focus:border-[#155dfc]"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              className="h-10 rounded-[10px] bg-[#155dfc] hover:bg-[#1249d4] text-white text-sm font-medium"
              onClick={() => {}}
            >
              Aplicar Filtros
            </Button>
            <Button
              variant="outline"
              className="h-10 rounded-[10px] border-gray-200 text-[#364153] text-sm font-medium"
              onClick={() => {
                setSearchNome("");
                setSearchCnpj("");
                setSearchResponsavel("");
                setFilterStatus("");
                setFilterSetor("");
              }}
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
                <th className="text-left px-6 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">Empresa</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">CNPJ</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">Responsável</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">Telefone</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">Funcionários</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">Exames</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">Pendências</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">Atualização</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6a7282] uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-sm text-[#6a7282]">Carregando...</td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((empresa) => (
                  <tr key={empresa.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-[10px] bg-gradient-to-br flex items-center justify-center text-white text-sm font-medium flex-shrink-0", getGradient(empresa.nome))}>
                          {getInitials(empresa.nome)}
                        </div>
                        <span className="text-sm font-medium text-[#101828]">{empresa.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-[#4a5565] font-mono">{empresa.cnpj}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-[#4a5565]">{empresa.responsavel ?? "—"}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-[#4a5565]">{empresa.telefone ?? "—"}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#6a7282]" />
                        <span className="text-sm font-medium text-[#101828]">{empresa.totalColaboradores}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#6a7282]" />
                        <span className="text-sm font-medium text-[#101828]">{empresa.totalExames}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#e7000b]" />
                        <span className={cn("text-sm font-medium", empresa.examesPendentes > 0 ? "text-[#e7000b]" : "text-[#99a1af]")}>
                          {empresa.examesPendentes > 0 ? empresa.examesPendentes : "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={empresa.status} />
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-[#4a5565]">
                        {new Date(empresa.updatedAt).toLocaleDateString("pt-BR")}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          className="w-8 h-8 rounded-[10px] flex items-center justify-center hover:bg-blue-50 text-[#6a7282] hover:text-[#155dfc] transition-colors"
                          onClick={() => setViewingEmpresa(empresa)}
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="w-8 h-8 rounded-[10px] flex items-center justify-center hover:bg-blue-50 text-[#6a7282] hover:text-[#155dfc] transition-colors"
                          onClick={() => setEditingEmpresa(empresa)}
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="w-8 h-8 rounded-[10px] flex items-center justify-center hover:bg-red-50 text-[#6a7282] hover:text-[#c10007] transition-colors"
                          onClick={() => setDeletingId(empresa.id)}
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
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Building2 className="w-10 h-10 text-gray-300" />
                      <p className="text-sm text-[#6a7282]">Nenhuma empresa encontrada</p>
                      <Button
                        className="h-9 rounded-[10px] bg-[#155dfc] hover:bg-[#1249d4] text-white text-sm"
                        onClick={() => setShowCreateModal(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar primeira empresa
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Painel lateral de detalhes - usa Sheet (Portal) para escapar do overflow-hidden */}
      <Sheet open={!!viewingEmpresa} onOpenChange={(open) => { if (!open) setViewingEmpresa(null); }}>
        <SheetContent
          side="right"
          className="w-full max-w-[480px] p-0 overflow-y-auto [&>button]:hidden"
        >
          <SheetTitle className="sr-only">Detalhes da Empresa</SheetTitle>
          <SheetDescription className="sr-only">Informações detalhadas da empresa selecionada</SheetDescription>
          {viewingEmpresa && (
            <EmpresaDetalheContent
              empresa={viewingEmpresa}
              onClose={() => setViewingEmpresa(null)}
              onEdit={() => { setEditingEmpresa(viewingEmpresa); setViewingEmpresa(null); }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Modal Criar/Editar - usa key para forçar re-render e preencher os campos */}
      <EmpresaModal
        key={editingEmpresa ? `edit-${editingEmpresa.id}` : showCreateModal ? "create" : "closed"}
        open={showCreateModal || !!editingEmpresa}
        empresa={editingEmpresa}
        onClose={() => { setShowCreateModal(false); setEditingEmpresa(null); }}
        onSave={(data) => {
          if (editingEmpresa) {
            updateMutation.mutate({ id: editingEmpresa.id, ...data });
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
              Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita.
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

// ---- Conteúdo do Painel de Detalhes ----

function EmpresaDetalheContent({ empresa, onClose, onEdit }: {
  empresa: any;
  onClose: () => void;
  onEdit: () => void;
}) {
  const gradient = getGradient(empresa.nome);

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100 flex-shrink-0">
        <div className={cn("w-12 h-12 rounded-[12px] bg-gradient-to-br flex items-center justify-center text-white text-base font-semibold flex-shrink-0", gradient)}>
          {getInitials(empresa.nome)}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-[#101828] truncate">{empresa.nome}</h2>
          <p className="text-sm text-[#6a7282]">Detalhes da empresa</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 text-[#6a7282] transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-5 p-6 flex-1">
        {/* Informações Básicas */}
        <div className="bg-white rounded-[14px] border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-[#6a7282] uppercase tracking-wider mb-4">Informações Básicas</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-[#6a7282]">
                <Building2 className="w-3.5 h-3.5" />
                <span>CNPJ</span>
              </div>
              <p className="text-sm font-medium text-[#101828] font-mono">{empresa.cnpj || "—"}</p>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-[#6a7282]">
                <Users className="w-3.5 h-3.5" />
                <span>Responsável</span>
              </div>
              <p className="text-sm font-medium text-[#101828]">{empresa.responsavel || "—"}</p>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-[#6a7282]">
                <Phone className="w-3.5 h-3.5" />
                <span>Telefone</span>
              </div>
              <p className="text-sm font-medium text-[#101828]">{empresa.telefone || "—"}</p>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-[#6a7282]">
                <Mail className="w-3.5 h-3.5" />
                <span>E-mail</span>
              </div>
              <p className="text-sm font-medium text-[#101828] break-all">{empresa.email || "—"}</p>
            </div>
            {empresa.endereco && (
              <div className="col-span-2 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs text-[#6a7282]">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Endereço</span>
                </div>
                <p className="text-sm font-medium text-[#101828]">{empresa.endereco}</p>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-[#6a7282]">
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Segmento</span>
              </div>
              <p className="text-sm font-medium text-[#101828]">{empresa.setor || "—"}</p>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-[#6a7282]">
                <Calendar className="w-3.5 h-3.5" />
                <span>Última Atualização</span>
              </div>
              <p className="text-sm font-medium text-[#101828]">
                {new Date(empresa.updatedAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 rounded-[14px] p-4 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#155dfc]">
              <Users className="w-3.5 h-3.5" />
              <span>Colaboradores</span>
            </div>
            <p className="text-2xl font-bold text-[#155dfc]">{empresa.totalColaboradores}</p>
            <p className="text-xs text-[#6a7282]">vinculados</p>
          </div>
          <div className="bg-green-50 rounded-[14px] p-4 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#16a34a]">
              <Activity className="w-3.5 h-3.5" />
              <span>Exames</span>
            </div>
            <p className="text-2xl font-bold text-[#16a34a]">{empresa.totalExames}</p>
            <p className="text-xs text-[#6a7282]">realizados</p>
          </div>
          <div className="bg-red-50 rounded-[14px] p-4 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#e7000b]">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Pendências</span>
            </div>
            <p className="text-2xl font-bold text-[#e7000b]">{empresa.examesPendentes}</p>
            <p className="text-xs text-[#6a7282]">ativas</p>
          </div>
        </div>

        {/* Origem dos Dados */}
        <div className="bg-white rounded-[14px] border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-[#6a7282] uppercase tracking-wider mb-4">Origem dos Dados</h3>
          <div className="flex items-center gap-3 bg-blue-50 rounded-[10px] p-3">
            <div className="w-8 h-8 rounded-[8px] bg-[#155dfc]/10 flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-4 h-4 text-[#155dfc]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#101828]">Cadastro Manual</p>
              <p className="text-xs text-[#6a7282]">Dados inseridos pelo sistema</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-[#155dfc] flex-shrink-0" />
          </div>
          <div className="flex items-center justify-between mt-3 px-1">
            <div>
              <p className="text-xs text-[#6a7282]">Última sincronização</p>
              <p className="text-sm font-medium text-[#101828]">
                {new Date(empresa.updatedAt).toLocaleDateString("pt-BR")} às{" "}
                {new Date(empresa.updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <Button
              size="sm"
              className="h-8 rounded-[8px] bg-[#155dfc] hover:bg-[#1249d4] text-white text-xs gap-1.5"
              onClick={() => toast.info("Sincronização não disponível para cadastros manuais")}
            >
              <RefreshCw className="w-3 h-3" />
              Sincronizar
            </Button>
          </div>
        </div>

        {/* Botão de editar */}
        <Button
          className="w-full h-10 rounded-[10px] bg-[#155dfc] hover:bg-[#1249d4] text-white text-sm font-medium gap-2"
          onClick={onEdit}
        >
          <Edit className="w-4 h-4" />
          Editar Empresa
        </Button>
      </div>
    </div>
  );
}

// ---- Modal Criar/Editar ----

function EmpresaModal({ open, empresa, onClose, onSave, loading }: {
  open: boolean;
  empresa?: any;
  onClose: () => void;
  onSave: (data: any) => void;
  loading: boolean;
}) {
  // Inicializa com os dados da empresa (a key prop garante re-render quando empresa muda)
  const [form, setForm] = useState({
    nome: empresa?.nome ?? "",
    cnpj: empresa?.cnpj ?? "",
    responsavel: empresa?.responsavel ?? "",
    telefone: empresa?.telefone ?? "",
    email: empresa?.email ?? "",
    endereco: empresa?.endereco ?? "",
    setor: empresa?.setor ?? "",
    status: empresa?.status ?? "ativa",
  });

  const handleChange = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{empresa ? "Editar Empresa" : "Nova Empresa"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Nome da Empresa *</Label>
              <Input value={form.nome} onChange={(e) => handleChange("nome", e.target.value)} required placeholder="Nome da empresa" className="rounded-[10px]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>CNPJ *</Label>
              <Input value={form.cnpj} onChange={(e) => handleChange("cnpj", e.target.value)} required placeholder="00.000.000/0000-00" className="rounded-[10px]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Responsável</Label>
              <Input value={form.responsavel} onChange={(e) => handleChange("responsavel", e.target.value)} placeholder="Nome do responsável" className="rounded-[10px]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={(e) => handleChange("telefone", e.target.value)} placeholder="(11) 99999-9999" className="rounded-[10px]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>E-mail</Label>
              <Input value={form.email} onChange={(e) => handleChange("email", e.target.value)} type="email" placeholder="email@empresa.com" className="rounded-[10px]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Setor</Label>
              <Input value={form.setor} onChange={(e) => handleChange("setor", e.target.value)} placeholder="Setor da empresa" className="rounded-[10px]" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Endereço</Label>
            <Input value={form.endereco} onChange={(e) => handleChange("endereco", e.target.value)} placeholder="Endereço completo" className="rounded-[10px]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
              <SelectTrigger className="rounded-[10px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativa">Ativa</SelectItem>
                <SelectItem value="inativa">Inativa</SelectItem>
                <SelectItem value="pendente">Com Pendências</SelectItem>
                <SelectItem value="atencao">Atenção</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="rounded-[10px]">Cancelar</Button>
            <Button type="submit" disabled={loading} className="rounded-[10px] bg-[#155dfc] hover:bg-[#1249d4]">
              {loading ? "Salvando..." : empresa ? "Salvar alterações" : "Criar empresa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
