import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type AlertaItem = {
  id: string;
  tipo: "exame_vencido" | "exame_vencer";
  titulo: string;
  descricao: string;
  urgente: boolean;
  data_vencimento: string;
  cliente_nome: string;
};

export function useSupabaseAlerts() {
  const [alertas, setAlertas] = useState<AlertaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAlerts() {
      setIsLoading(true);
      setError(null);

      try {
        // Get current session
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          setAlertas([]);
          setIsLoading(false);
          return;
        }

        const today = new Date();
        const in30Days = new Date();
        in30Days.setDate(today.getDate() + 30);

        const todayStr = today.toISOString().split("T")[0];
        const in30DaysStr = in30Days.toISOString().split("T")[0];

        // Fetch expired exams (data_vencimento < today)
        const { data: vencidos, error: errVencidos } = await supabase
          .from("exames")
          .select("id, cliente_nome, data_vencimento")
          .lt("data_vencimento", todayStr)
          .not("data_vencimento", "is", null)
          .order("data_vencimento", { ascending: true });

        if (errVencidos) throw errVencidos;

        // Fetch exams expiring in next 30 days
        const { data: aVencer, error: errAVencer } = await supabase
          .from("exames")
          .select("id, cliente_nome, data_vencimento")
          .gte("data_vencimento", todayStr)
          .lte("data_vencimento", in30DaysStr)
          .not("data_vencimento", "is", null)
          .order("data_vencimento", { ascending: true });

        if (errAVencer) throw errAVencer;

        const result: AlertaItem[] = [];

        // Group expired by cliente_nome
        if (vencidos && vencidos.length > 0) {
          // Group by cliente_nome
          const grouped: Record<string, typeof vencidos> = {};
          for (const e of vencidos) {
            if (!grouped[e.cliente_nome]) grouped[e.cliente_nome] = [];
            grouped[e.cliente_nome].push(e);
          }

          for (const [cliente, exames] of Object.entries(grouped)) {
            const count = exames.length;
            const oldest = exames[0].data_vencimento;
            result.push({
              id: `vencido_${cliente}`,
              tipo: "exame_vencido",
              titulo: count === 1
                ? `1 exame vencido — ${cliente}`
                : `${count} exames vencidos — ${cliente}`,
              descricao: `Vencimento: ${formatDate(oldest)}. Renovação necessária urgentemente.`,
              urgente: true,
              data_vencimento: oldest,
              cliente_nome: cliente,
            });
          }
        }

        // Group expiring soon by cliente_nome
        if (aVencer && aVencer.length > 0) {
          const grouped: Record<string, typeof aVencer> = {};
          for (const e of aVencer) {
            if (!grouped[e.cliente_nome]) grouped[e.cliente_nome] = [];
            grouped[e.cliente_nome].push(e);
          }

          for (const [cliente, exames] of Object.entries(grouped)) {
            const count = exames.length;
            const nearest = exames[0].data_vencimento;
            const daysLeft = Math.ceil(
              (new Date(nearest).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );
            result.push({
              id: `avencer_${cliente}`,
              tipo: "exame_vencer",
              titulo: count === 1
                ? `1 exame vence em ${daysLeft} dias — ${cliente}`
                : `${count} exames vencem em breve — ${cliente}`,
              descricao: `Próximo vencimento: ${formatDate(nearest)}. Agende com antecedência.`,
              urgente: false,
              data_vencimento: nearest,
              cliente_nome: cliente,
            });
          }
        }

        setAlertas(result);
      } catch (err: unknown) {
        console.error("[useSupabaseAlerts] Error:", err);
        setError("Erro ao carregar alertas");
        setAlertas([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAlerts();
  }, []);

  return { alertas, isLoading, error };
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}
