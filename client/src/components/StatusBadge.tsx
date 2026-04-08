import { cn } from "@/lib/utils";

type StatusType = "ativa" | "inativa" | "pendente" | "atencao" | "ativo" | "inativo" | "afastado" | "realizado" | "vencido" | "agendado" | "normal" | "alteracao" | "perda_leve" | "perda_moderada" | "perda_severa";

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  ativa: { label: "Ativa", className: "bg-green-50 text-[#008236]" },
  inativa: { label: "Inativa", className: "bg-gray-100 text-gray-500" },
  pendente: { label: "Com Pendências", className: "bg-red-50 text-[#c10007]" },
  atencao: { label: "Atenção", className: "bg-amber-50 text-[#bb4d00]" },
  ativo: { label: "Ativo", className: "bg-green-50 text-[#008236]" },
  inativo: { label: "Inativo", className: "bg-gray-100 text-gray-500" },
  afastado: { label: "Afastado", className: "bg-amber-50 text-[#bb4d00]" },
  realizado: { label: "Realizado", className: "bg-green-50 text-[#008236]" },
  vencido: { label: "Vencido", className: "bg-red-50 text-[#c10007]" },
  agendado: { label: "Agendado", className: "bg-blue-50 text-[#155dfc]" },
  normal: { label: "Normal", className: "bg-green-50 text-[#008236]" },
  alteracao: { label: "Alteração", className: "bg-amber-50 text-[#bb4d00]" },
  perda_leve: { label: "Perda Leve", className: "bg-amber-50 text-[#bb4d00]" },
  perda_moderada: { label: "Perda Moderada", className: "bg-orange-50 text-orange-700" },
  perda_severa: { label: "Perda Severa", className: "bg-red-50 text-[#c10007]" },
};

export function StatusBadge({ status }: { status: StatusType | string }) {
  const config = statusConfig[status as StatusType] ?? { label: status, className: "bg-gray-100 text-gray-500" };
  return (
    <span className={cn("inline-flex items-center px-3 py-1 rounded-full text-xs font-medium", config.className)}>
      {config.label}
    </span>
  );
}
