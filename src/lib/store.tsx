/* ===========================================================================
   Estado da aplicação.

   Protótipo sem base de dados: o estado inteiro vive em memória e é espelhado
   no armazenamento local do navegador, para que o trabalho não se perca ao
   recarregar a página. O botão "Repor cenário" devolve tudo ao início.
   ========================================================================= */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AGENDA_SECRETARIADO, AGENDA_TIPO, CARGOS_ELEITORAIS, REGRAS } from './estatutos';
import { addDays, addYears, mesDe, uid } from './format';
import { apurar, quotaReferencia } from './selectors';
import { criarEstadoInicial, VERSAO_SEED } from './seed';
import type {
  Canal,
  Candidatura,
  CargoEleitoral,
  Documento,
  Eleicao,
  Estado,
  EstadoPresenca,
  Lente,
  Membro,
  MetodoVotacao,
  Modalidade,
  Reuniao,
  Segmento,
  TipoReuniao,
} from './types';

const CHAVE = 'sgc.prototipo.estado';
const CHAVE_SESSAO = 'sgc.prototipo.sessao';

export interface Toast {
  id: string;
  tipo: 'ok' | 'erro' | 'info' | 'lei';
  titulo: string;
  texto?: string;
  base?: string;
}

interface Ctx {
  e: Estado;
  lente: Lente;
  setLente: (l: Lente) => void;
  vista: string;
  irPara: (vista: string, params?: Record<string, string>) => void;
  params: Record<string, string>;
  toasts: Toast[];
  avisar: (t: Omit<Toast, 'id'>) => void;
  fecharToast: (id: string) => void;
  repor: () => void;

  // ── sessão ──
  sessao: boolean;
  entrar: (l: Lente, vista: string, params?: Record<string, string>) => void;
  sair: () => void;

  // ── membros ──
  guardarMembro: (m: Membro) => void;
  novoMembro: (m: Partial<Membro>) => Membro;
  mudarEstadoMembro: (id: string, estado: Membro['estado'], motivo?: string) => void;
  definirCargo: (id: string, cargo: Membro['cargo']) => void;

  // ── cotas ──
  registarQuota: (p: { membroId: string; mes: string; valor: number; modalidade: Modalidade; descricaoEspecie?: string }) => void;
  anularQuota: (id: string) => void;
  registarMovimento: (p: { tipo: 'RECEITA' | 'DESPESA'; categoria: string; descricao: string; valor: number; comprovativo?: string }) => void;

  // ── reuniões ──
  agendarReuniao: (p: { tipo: TipoReuniao; titulo: string; data: string; hora: string; local: string; especifico?: string }) => Reuniao;
  enviarConvocatoria: (reuniaoId: string, canais: Canal[]) => void;
  marcarPresenca: (reuniaoId: string, membroId: string, estado: EstadoPresenca, justificacao?: string) => void;
  concluirReuniao: (reuniaoId: string, p: { duracaoMin: number; resumo: string }) => void;
  anexarActa: (reuniaoId: string, ficheiro: string) => void;
  aprovarActa: (reuniaoId: string, naReuniaoId: string) => void;
  addDecisao: (reuniaoId: string, texto: string, responsavelId: string, prazo: string) => void;
  toggleDecisao: (reuniaoId: string, decisaoId: string) => void;
  cancelarReuniao: (reuniaoId: string) => void;

  // ── eleições ──
  criarEleicao: (p: { cargo: CargoEleitoral; vagas: number; metodo: MetodoVotacao; dataEscrutinio: string; observacoes?: string }) => Eleicao;
  gerarCaderno: (eleicaoId: string) => void;
  alternarCaderno: (eleicaoId: string, membroId: string, campo: 'activa' | 'passiva') => void;
  abrirCandidaturas: (eleicaoId: string) => void;
  addCandidatura: (eleicaoId: string, membroId: string, propostoPorId: string, nota?: string) => void;
  aceitarCandidatura: (eleicaoId: string, candidaturaId: string, aceitou: boolean) => void;
  retirarCandidatura: (eleicaoId: string, candidaturaId: string) => void;
  abrirEscrutinio: (eleicaoId: string, p: { presentes: number; efectividade: number }) => void;
  registarVotos: (eleicaoId: string, volta: 1 | 2, votos: Record<string, number>, brancos: number, nulos: number, presentes: number) => void;
  fecharVolta: (eleicaoId: string) => void;
  homologar: (eleicaoId: string) => void;
  anularEleicao: (eleicaoId: string, motivo: string) => void;

  // ── comunicação e documentos ──
  enviarMensagem: (p: { canais: Canal[]; segmento: Segmento; destinatarios: string[]; assunto: string; corpo: string; tipo: 'CONVOCATORIA' | 'AVISO_QUOTA' | 'ANIVERSARIO' | 'ELEITORAL' | 'LIVRE' }) => void;
  arquivarDocumento: (d: Omit<Documento, 'id'>) => void;
}

const StoreCtx = createContext<Ctx | null>(null);

function carregar(): Estado {
  try {
    const raw = localStorage.getItem(CHAVE);
    if (raw) {
      const parsed = JSON.parse(raw) as Estado;
      if (parsed?.versaoSeed === VERSAO_SEED) return parsed;
    }
  } catch {
    /* cenário novo */
  }
  return criarEstadoInicial();
}

export const Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [e, setE] = useState<Estado>(carregar);
  const [lente, setLente] = useState<Lente>('CELULA');
  const [vista, setVista] = useState('painel');
  const [params, setParams] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, number>>({});
  const [sessao, setSessao] = useState<boolean>(() => {
    try {
      return localStorage.getItem(CHAVE_SESSAO) === 'aberta';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(e));
    } catch {
      /* espaço esgotado — o protótipo continua a funcionar em memória */
    }
  }, [e]);

  const fecharToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    window.clearTimeout(timers.current[id]);
  }, []);

  const avisar = useCallback((t: Omit<Toast, 'id'>) => {
    const id = uid('t');
    setToasts((prev) => [...prev.slice(-3), { ...t, id }]);
    timers.current[id] = window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, t.tipo === 'erro' ? 7000 : 5200);
  }, []);

  const irPara = useCallback((v: string, p: Record<string, string> = {}) => {
    setVista(v);
    setParams(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const set = useCallback((fn: (prev: Estado) => Estado) => setE(fn), []);

  const repor = useCallback(() => {
    localStorage.removeItem(CHAVE);
    setE(criarEstadoInicial());
    avisar({ tipo: 'info', titulo: 'Cenário reposto', texto: 'Os dados de demonstração voltaram ao estado inicial.' });
  }, [avisar]);

  // ─────────────────────────────── Sessão ───────────────────────────────────

  const entrar = useCallback((l: Lente, v: string, p: Record<string, string> = {}) => {
    setLente(l);
    setVista(v);
    setParams(p);
    setSessao(true);
    try { localStorage.setItem(CHAVE_SESSAO, 'aberta'); } catch { /* ignorar */ }
    window.scrollTo({ top: 0 });
  }, []);

  const sair = useCallback(() => {
    setSessao(false);
    setVista('painel');
    setParams({});
    try { localStorage.removeItem(CHAVE_SESSAO); } catch { /* ignorar */ }
    window.scrollTo({ top: 0 });
  }, []);

  // ─────────────────────────────── Membros ──────────────────────────────────

  const guardarMembro = useCallback((m: Membro) => {
    set((prev) => ({ ...prev, membros: prev.membros.map((x) => (x.id === m.id ? m : x)) }));
    avisar({ tipo: 'ok', titulo: 'Ficha actualizada', texto: `${m.nome} — alterações guardadas.`, base: 'manual_bd' });
  }, [set, avisar]);

  const novoMembro = useCallback((p: Partial<Membro>) => {
    const id = uid('m');
    const m: Membro = {
      id,
      cartao: p.cartao || `MZ-${Math.floor(1000000 + Math.random() * 8999999)}`,
      nome: p.nome || 'Sem nome',
      telefone: p.telefone || '',
      temWhatsapp: p.temWhatsapp ?? true,
      canal: p.canal || 'WHATSAPP',
      dataAdmissao: p.dataAdmissao || e.hoje,
      estado: p.estado || 'CANDIDATO',
      cargo: p.cargo || 'MEMBRO',
      celulaId: e.celula.id,
      ...p,
    } as Membro;
    set((prev) => ({ ...prev, membros: [...prev.membros, m] }));
    avisar({
      tipo: m.estado === 'CANDIDATO' ? 'lei' : 'ok',
      titulo: m.estado === 'CANDIDATO' ? 'Candidatura registada' : 'Membro registado',
      texto: m.estado === 'CANDIDATO'
        ? `A Reunião Geral tem 120 dias para deliberar — até ${addDays(m.dataAdmissao, REGRAS.PRAZO_CANDIDATURA_DIAS)}.`
        : `${m.nome} passou a constar da base de dados da Célula.`,
      base: m.estado === 'CANDIDATO' ? 'art8' : 'manual_bd',
    });
    return m;
  }, [set, avisar, e.hoje, e.celula.id]);

  const mudarEstadoMembro = useCallback((id: string, estado: Membro['estado'], motivo?: string) => {
    set((prev) => ({
      ...prev,
      membros: prev.membros.map((m) => {
        if (m.id !== id) return m;
        return {
          ...m,
          estado,
          suspensoDesde: estado === 'SUSPENSO' ? prev.hoje : undefined,
          motivoSuspensao: estado === 'SUSPENSO' ? motivo : undefined,
          cessadoEm: estado === 'CESSADO' ? prev.hoje : undefined,
          motivoCessacao: estado === 'CESSADO' ? motivo : undefined,
          cargo: estado === 'CESSADO' || estado === 'SUSPENSO' ? 'MEMBRO' : m.cargo,
        };
      }),
    }));
    const rotulos: Record<Membro['estado'], string> = {
      EFECTIVO: 'Admitido como membro efectivo',
      CANDIDATO: 'Reposto como candidato',
      SUSPENSO: 'Direitos suspensos',
      CESSADO: 'Filiação cessada',
    };
    avisar({
      tipo: estado === 'EFECTIVO' ? 'ok' : 'lei',
      titulo: rotulos[estado],
      texto: estado === 'EFECTIVO'
        ? 'A data de ingresso é a data da deliberação da Reunião Geral.'
        : motivo,
      base: estado === 'EFECTIVO' ? 'art8n4' : estado === 'SUSPENSO' ? 'art16n4' : 'art9',
    });
  }, [set, avisar]);

  const definirCargo = useCallback((id: string, cargo: Membro['cargo']) => {
    set((prev) => ({ ...prev, membros: prev.membros.map((m) => (m.id === id ? { ...m, cargo } : m)) }));
  }, [set]);

  // ──────────────────────────────── Cotas ───────────────────────────────────

  const registarQuota = useCallback((p: { membroId: string; mes: string; valor: number; modalidade: Modalidade; descricaoEspecie?: string }) => {
    set((prev) => {
      const jaPagou = prev.quotas.some((q) => q.membroId === p.membroId && q.mes === p.mes);
      if (jaPagou) return prev;
      return {
        ...prev,
        quotas: [
          {
            id: uid('q'),
            celulaId: prev.celula.id,
            membroId: p.membroId,
            mes: p.mes,
            valor: p.valor,
            modalidade: p.modalidade,
            descricaoEspecie: p.descricaoEspecie,
            dataRegisto: prev.hoje,
            registadoPor: prev.membros.find((m) => m.cargo === 'SECRETARIO')?.id ?? '',
          },
          ...prev.quotas,
        ],
      };
    });
    const retido = p.valor * REGRAS.PERCENT_CELULA;
    avisar({
      tipo: 'ok',
      titulo: 'Quota registada',
      texto: `${Math.round(retido)} MT retidos na Célula, ${Math.round(p.valor - retido)} MT para o escalão superior.`,
      base: 'manual_6040',
    });
  }, [set, avisar]);

  const anularQuota = useCallback((id: string) => {
    set((prev) => ({ ...prev, quotas: prev.quotas.filter((q) => q.id !== id) }));
    avisar({ tipo: 'info', titulo: 'Registo anulado', texto: 'O pagamento foi removido do livro de cotização.' });
  }, [set, avisar]);

  const registarMovimento = useCallback((p: { tipo: 'RECEITA' | 'DESPESA'; categoria: string; descricao: string; valor: number; comprovativo?: string }) => {
    set((prev) => ({
      ...prev,
      movimentos: [{ id: uid('mv'), celulaId: prev.celula.id, data: prev.hoje, ...p }, ...prev.movimentos],
    }));
    avisar({ tipo: 'ok', titulo: p.tipo === 'RECEITA' ? 'Receita registada' : 'Despesa registada', texto: `${p.descricao} — ${p.valor} MT.` });
  }, [set, avisar]);

  // ────────────────────────────── Reuniões ──────────────────────────────────

  const agendarReuniao = useCallback((p: { tipo: TipoReuniao; titulo: string; data: string; hora: string; local: string; especifico?: string }) => {
    const base = p.tipo === 'SECRETARIADO' ? AGENDA_SECRETARIADO : AGENDA_TIPO;
    const r: Reuniao = {
      id: uid('r'),
      celulaId: e.celula.id,
      tipo: p.tipo,
      titulo: p.titulo,
      data: p.data,
      hora: p.hora,
      local: p.local,
      estado: 'AGENDADA',
      agenda: base.map((x, i) => ({
        id: `p${i}`,
        ordem: i + 1,
        titulo: x.titulo === 'Ponto específico do momento' && p.especifico ? `Ponto específico: ${p.especifico}` : x.titulo,
        fixo: x.fixo,
      })),
      presencas: {},
      decisoes: [],
    };
    set((prev) => ({ ...prev, reunioes: [r, ...prev.reunioes] }));
    avisar({
      tipo: 'lei',
      titulo: 'Reunião marcada',
      texto: `A convocatória deve ser difundida até ${addDays(p.data, -REGRAS.ANTECEDENCIA_CONVOCATORIA_DIAS)} (dois dias de antecedência).`,
      base: 'manual_convocatoria',
    });
    return r;
  }, [set, avisar, e.celula.id]);

  const enviarConvocatoria = useCallback((reuniaoId: string, canais: Canal[]) => {
    set((prev) => {
      const r = prev.reunioes.find((x) => x.id === reuniaoId);
      if (!r) return prev;
      const destinatarios = prev.membros
        .filter((m) => (r.tipo === 'SECRETARIADO' ? m.cargo !== 'MEMBRO' : m.estado === 'EFECTIVO' || m.estado === 'CANDIDATO'))
        .map((m) => m.id);
      const custo = destinatarios.length * (canais.includes('SMS') ? 1.5 : 0.6);
      return {
        ...prev,
        reunioes: prev.reunioes.map((x) => (x.id === reuniaoId ? { ...x, convocatoriaEnviadaEm: prev.hoje, canaisConvocatoria: canais } : x)),
        mensagens: [
          {
            id: uid('ms'),
            celulaId: prev.celula.id,
            canais,
            segmento: (r.tipo === 'SECRETARIADO' ? 'SECRETARIADO' : 'TODOS') as Segmento,
            destinatarios,
            assunto: `Convocatória — ${r.titulo}`,
            corpo: `Camaradas, convoca-se ${r.titulo} para ${r.data}, às ${r.hora}, em ${r.local}. Agenda: ${r.agenda.map((a) => a.titulo).join('; ')}.`,
            enviadaEm: prev.hoje,
            custoEstimado: Math.round(custo),
            tipo: 'CONVOCATORIA' as const,
          },
          ...prev.mensagens,
        ],
      };
    });
    avisar({ tipo: 'ok', titulo: 'Convocatória difundida', texto: `Enviada por ${canais.join(', ')} com a agenda, data, hora e local.`, base: 'manual_convocatoria' });
  }, [set, avisar]);

  const marcarPresenca = useCallback((reuniaoId: string, membroId: string, estado: EstadoPresenca, justificacao?: string) => {
    set((prev) => ({
      ...prev,
      reunioes: prev.reunioes.map((r) =>
        r.id === reuniaoId
          ? {
              ...r,
              presencas: { ...r.presencas, [membroId]: estado },
              justificacoes: justificacao ? { ...(r.justificacoes ?? {}), [membroId]: justificacao } : r.justificacoes,
            }
          : r,
      ),
    }));
  }, [set]);

  const concluirReuniao = useCallback((reuniaoId: string, p: { duracaoMin: number; resumo: string }) => {
    set((prev) => ({
      ...prev,
      reunioes: prev.reunioes.map((r) => (r.id === reuniaoId ? { ...r, estado: 'REALIZADA', duracaoMin: p.duracaoMin, resumo: p.resumo, dirigidaPor: prev.membros.find((m) => m.cargo === 'SECRETARIO')?.id } : r)),
    }));
    const excedeu = p.duracaoMin > REGRAS.DURACAO_MAX_REUNIAO_GERAL_MIN;
    avisar({
      tipo: excedeu ? 'lei' : 'ok',
      titulo: excedeu ? 'Reunião encerrada — duração excedida' : 'Reunião encerrada',
      texto: excedeu
        ? `Durou ${p.duracaoMin} minutos; o Manual da Célula fixa o limite de 90 minutos.`
        : `Presenças e decisões registadas. Duração: ${p.duracaoMin} minutos.`,
      base: excedeu ? 'manual_duracao' : 'manual_acta',
    });
  }, [set, avisar]);

  const anexarActa = useCallback((reuniaoId: string, ficheiro: string) => {
    set((prev) => ({
      ...prev,
      reunioes: prev.reunioes.map((r) => (r.id === reuniaoId ? { ...r, acta: { ficheiro, anexadaEm: prev.hoje } } : r)),
      documentos: [
        { id: uid('dc'), titulo: ficheiro.replace('.pdf', ''), categoria: 'ACTA' as const, escopo: 'CELULA' as const, data: prev.hoje, paginas: 3, tamanhoKb: 190 },
        ...prev.documentos,
      ],
    }));
    avisar({ tipo: 'ok', titulo: 'Acta anexada', texto: 'Fica pendente de leitura e aprovação na reunião seguinte.', base: 'manual_acta' });
  }, [set, avisar]);

  const aprovarActa = useCallback((reuniaoId: string, naReuniaoId: string) => {
    set((prev) => ({
      ...prev,
      reunioes: prev.reunioes.map((r) =>
        r.id === reuniaoId && r.acta ? { ...r, acta: { ...r.acta, aprovadaEm: prev.hoje, aprovadaNaReuniaoId: naReuniaoId } } : r,
      ),
    }));
    avisar({ tipo: 'ok', titulo: 'Acta aprovada', texto: 'Lida e aprovada em sessão, conforme o Manual da Célula.', base: 'manual_acta' });
  }, [set, avisar]);

  const addDecisao = useCallback((reuniaoId: string, texto: string, responsavelId: string, prazo: string) => {
    set((prev) => ({
      ...prev,
      reunioes: prev.reunioes.map((r) =>
        r.id === reuniaoId ? { ...r, decisoes: [...r.decisoes, { id: uid('d'), texto, responsavelId, prazo, cumprida: false }] } : r,
      ),
    }));
    avisar({ tipo: 'ok', titulo: 'Decisão registada', texto: 'Será verificada na reunião seguinte.', base: 'manual_agenda' });
  }, [set, avisar]);

  const toggleDecisao = useCallback((reuniaoId: string, decisaoId: string) => {
    set((prev) => ({
      ...prev,
      reunioes: prev.reunioes.map((r) =>
        r.id === reuniaoId ? { ...r, decisoes: r.decisoes.map((d) => (d.id === decisaoId ? { ...d, cumprida: !d.cumprida } : d)) } : r,
      ),
    }));
  }, [set]);

  const cancelarReuniao = useCallback((reuniaoId: string) => {
    set((prev) => ({ ...prev, reunioes: prev.reunioes.map((r) => (r.id === reuniaoId ? { ...r, estado: 'CANCELADA' } : r)) }));
    avisar({ tipo: 'info', titulo: 'Reunião cancelada' });
  }, [set, avisar]);

  // ────────────────────────────── Eleições ──────────────────────────────────

  const criarEleicao = useCallback((p: { cargo: CargoEleitoral; vagas: number; metodo: MetodoVotacao; dataEscrutinio: string; observacoes?: string }) => {
    const meta = CARGOS_ELEITORAIS[p.cargo];
    const el: Eleicao = {
      id: uid('el'),
      escopo: meta.escopo,
      celulaId: meta.escopo === 'CELULA' ? e.celula.id : undefined,
      circuloId: meta.escopo !== 'CELULA' ? e.circulo.id : undefined,
      cargo: p.cargo,
      titulo: `Eleição — ${meta.titulo}`,
      vagas: p.vagas,
      metodo: p.metodo,
      fase: 'CONVOCADA',
      convocadaEm: e.hoje,
      dataEscrutinio: p.dataEscrutinio,
      caderno: [],
      candidaturas: [],
      voltas: [],
      eleitos: [],
      mandato: { inicio: addDays(p.dataEscrutinio, 1), fim: addYears(addDays(p.dataEscrutinio, 1), REGRAS.MANDATO_ANOS) },
      observacoes: p.observacoes,
    };
    set((prev) => ({ ...prev, eleicoes: [el, ...prev.eleicoes] }));
    avisar({
      tipo: 'lei',
      titulo: 'Eleição convocada',
      texto: `${meta.titulo} — elege ${meta.orgaoEleitor}. Mandato de ${REGRAS.MANDATO_ANOS} anos.`,
      base: 'art26',
    });
    return el;
  }, [set, avisar, e.celula.id, e.circulo.id, e.hoje]);

  const gerarCaderno = useCallback((eleicaoId: string) => {
    set((prev) => {
      const el = prev.eleicoes.find((x) => x.id === eleicaoId);
      if (!el) return prev;
      const meta = CARGOS_ELEITORAIS[el.cargo];
      const caderno = prev.membros
        .filter((m) => m.estado !== 'CESSADO')
        .map((m) => {
          const impedimentos: { motivo: string; base: string }[] = [];
          if (m.estado === 'CANDIDATO') impedimentos.push({ motivo: 'Candidato a membro — admissão ainda não deliberada pela Reunião Geral', base: 'art8' });
          if (m.estado === 'SUSPENSO') impedimentos.push({ motivo: 'Direitos suspensos por falta de pagamento de quotas', base: 'art16n4' });
          const idade = m.dataNascimento ? (new Date(prev.hoje).getFullYear() - new Date(m.dataNascimento).getFullYear()) : 99;
          if (idade < REGRAS.IDADE_MINIMA) impedimentos.push({ motivo: 'Menor de 18 anos', base: 'art7' });
          const activa = impedimentos.length === 0;
          let passiva = activa;
          if (activa && meta.deEntreOsSeusMembros && el.cargo !== 'DELEGADOS_CONFERENCIA_CIRCULO') {
            // Cargos dos órgãos da Célula: só membros efectivos da Célula.
            passiva = m.estado === 'EFECTIVO';
          }
          // Ninguém acumula dois cargos nos órgãos da Célula (Art. 35 n.º 4).
          const CARGO_ALVO: Record<string, Membro['cargo']> = {
            SECRETARIO_CELULA: 'SECRETARIO',
            ASSISTENTES_CELULA: 'ASSISTENTE',
            ELEMENTO_LIGACAO: 'ELEMENTO_LIGACAO',
          };
          const alvo = CARGO_ALVO[el.cargo];
          const ROTULO_CARGO: Record<string, string> = {
            SECRETARIO: 'Secretário da Célula',
            ASSISTENTE: 'Assistente do Secretariado',
            ELEMENTO_LIGACAO: 'Elemento de Ligação',
          };
          if (passiva && alvo && m.cargo !== 'MEMBRO' && m.cargo !== alvo) {
            passiva = false;
            impedimentos.push({
              motivo: `Já exerce o cargo de ${ROTULO_CARGO[m.cargo]} nos órgãos da Célula`,
              base: 'art35n4',
            });
          }
          if (activa && !passiva && impedimentos.length === 0) {
            impedimentos.push({ motivo: 'Sem capacidade eleitoral passiva para este cargo', base: 'art28' });
          }
          return { membroId: m.id, activa, passiva, impedimentos };
        });
      return {
        ...prev,
        eleicoes: prev.eleicoes.map((x) => (x.id === eleicaoId ? { ...x, caderno, fase: 'CADERNO' as const } : x)),
      };
    });
    avisar({ tipo: 'lei', titulo: 'Caderno eleitoral apurado', texto: 'Capacidade activa e passiva verificadas membro a membro.', base: 'art28' });
  }, [set, avisar]);

  const alternarCaderno = useCallback((eleicaoId: string, membroId: string, campo: 'activa' | 'passiva') => {
    set((prev) => ({
      ...prev,
      eleicoes: prev.eleicoes.map((el) =>
        el.id === eleicaoId
          ? { ...el, caderno: el.caderno.map((l) => (l.membroId === membroId ? { ...l, [campo]: !l[campo] } : l)) }
          : el,
      ),
    }));
  }, [set]);

  const abrirCandidaturas = useCallback((eleicaoId: string) => {
    set((prev) => ({
      ...prev,
      eleicoes: prev.eleicoes.map((el) => (el.id === eleicaoId ? { ...el, fase: 'CANDIDATURAS' as const } : el)),
    }));
    avisar({
      tipo: 'lei',
      titulo: 'Candidaturas abertas',
      texto: 'Qualquer membro com capacidade activa pode propor candidatos; a aceitação é obrigatória.',
      base: 'art14d',
    });
  }, [set, avisar]);

  const addCandidatura = useCallback((eleicaoId: string, membroId: string, propostoPorId: string, nota?: string) => {
    set((prev) => ({
      ...prev,
      eleicoes: prev.eleicoes.map((el) => {
        if (el.id !== eleicaoId) return el;
        if (el.candidaturas.some((c) => c.membroId === membroId && !c.retirada)) return el;
        const incumbente = prev.mandatos.some((md) => md.membroId === membroId && md.cargo === el.cargo && md.estado === 'ACTIVO');
        const c: Candidatura = { id: uid('c'), membroId, propostoPorId, aceitou: false, incumbente, nota };
        return { ...el, candidaturas: [...el.candidaturas, c], fase: el.fase === 'CADERNO' ? 'CANDIDATURAS' : el.fase };
      }),
    }));
    avisar({ tipo: 'lei', titulo: 'Candidatura proposta', texto: 'Fica pendente da aceitação do camarada — voluntariedade e consulta prévia.', base: 'art22' });
  }, [set, avisar]);

  const aceitarCandidatura = useCallback((eleicaoId: string, candidaturaId: string, aceitou: boolean) => {
    set((prev) => ({
      ...prev,
      eleicoes: prev.eleicoes.map((el) =>
        el.id === eleicaoId ? { ...el, candidaturas: el.candidaturas.map((c) => (c.id === candidaturaId ? { ...c, aceitou } : c)) } : el,
      ),
    }));
  }, [set]);

  const retirarCandidatura = useCallback((eleicaoId: string, candidaturaId: string) => {
    set((prev) => ({
      ...prev,
      eleicoes: prev.eleicoes.map((el) =>
        el.id === eleicaoId ? { ...el, candidaturas: el.candidaturas.map((c) => (c.id === candidaturaId ? { ...c, retirada: true } : c)) } : el,
      ),
    }));
    avisar({ tipo: 'info', titulo: 'Candidatura retirada' });
  }, [set, avisar]);

  const abrirEscrutinio = useCallback((eleicaoId: string, p: { presentes: number; efectividade: number }) => {
    set((prev) => ({
      ...prev,
      eleicoes: prev.eleicoes.map((el) => {
        if (el.id !== eleicaoId) return el;
        const votos: Record<string, number> = {};
        el.candidaturas.filter((c) => !c.retirada && c.aceitou).forEach((c) => { votos[c.id] = 0; });
        return {
          ...el,
          fase: 'ESCRUTINIO' as const,
          voltas: [{ numero: 1 as const, votos, brancos: 0, nulos: 0, presentes: p.presentes, efectividade: p.efectividade }],
        };
      }),
    }));
    const q = Math.floor(p.efectividade / 2) + 1;
    avisar({
      tipo: p.presentes >= q ? 'lei' : 'erro',
      titulo: p.presentes >= q ? 'Escrutínio aberto' : 'Quórum não verificado',
      texto: p.presentes >= q
        ? `Quórum verificado: ${p.presentes} de ${p.efectividade}. Maioria absoluta exigida à 1.ª volta: ${q} votos.`
        : `São necessários ${q} presentes para deliberar validamente.`,
      base: p.presentes >= q ? 'art25n4' : 'art30',
    });
  }, [set, avisar]);

  const registarVotos = useCallback((eleicaoId: string, volta: 1 | 2, votos: Record<string, number>, brancos: number, nulos: number, presentes: number) => {
    set((prev) => ({
      ...prev,
      eleicoes: prev.eleicoes.map((el) =>
        el.id === eleicaoId
          ? { ...el, voltas: el.voltas.map((v) => (v.numero === volta ? { ...v, votos, brancos, nulos, presentes } : v)) }
          : el,
      ),
    }));
  }, [set]);

  const fecharVolta = useCallback((eleicaoId: string) => {
    let mensagem: Toast | null = null;
    set((prev) => {
      const el = prev.eleicoes.find((x) => x.id === eleicaoId);
      if (!el) return prev;
      const voltaActual = el.voltas[el.voltas.length - 1];
      if (!voltaActual) return prev;
      const ap = apurar(el, voltaActual.numero);
      if (!ap) return prev;

      if (!ap.quorum.atingido) {
        mensagem = {
          id: uid('t'),
          tipo: 'erro',
          titulo: 'Deliberação inválida',
          texto: `Presentes ${ap.presentes} de ${ap.efectividade}; exigidos ${ap.quorum.exigido}.`,
          base: CARGOS_ELEITORAIS[el.cargo].quorum === 'DOIS_TERCOS' ? 'art30n1' : 'art30',
        };
        return prev;
      }

      if (ap.precisaSegundaVolta) {
        const votos: Record<string, number> = {};
        ap.candidatosSegundaVolta.forEach((c) => { votos[c] = 0; });
        mensagem = {
          id: uid('t'),
          tipo: 'lei',
          titulo: 'Segunda volta necessária',
          texto: `Nenhum candidato alcançou a maioria absoluta (${ap.maioriaExigida} votos). Concorrem os ${ap.candidatosSegundaVolta.length} mais votados.`,
          base: 'art25n4',
        };
        return {
          ...prev,
          eleicoes: prev.eleicoes.map((x) =>
            x.id === eleicaoId
              ? {
                  ...x,
                  fase: 'SEGUNDA_VOLTA' as const,
                  voltas: [
                    ...x.voltas.map((v) => (v.numero === voltaActual.numero ? { ...v, fechadaEm: prev.hoje } : v)),
                    { numero: 2 as const, votos, brancos: 0, nulos: 0, presentes: voltaActual.presentes, efectividade: voltaActual.efectividade },
                  ],
                }
              : x,
          ),
        };
      }

      // Proclamação: eleitos + suplentes pela ordem de eleição (Art. 32 n.º 1).
      const eleitos = ap.linhas.map((l, i) => ({
        membroId: l.membroId,
        votos: l.votos,
        ordem: i + 1,
        suplente: !ap.eleitosAgora.includes(l.candidaturaId),
      }));
      const proclamadaEm = prev.hoje;
      const prazo = addDays(proclamadaEm, REGRAS.PRAZO_IMPUGNACAO_DIAS);
      const nomes = eleitos.filter((x) => !x.suplente).map((x) => prev.membros.find((m) => m.id === x.membroId)?.nome ?? x.membroId);

      mensagem = {
        id: uid('t'),
        tipo: 'ok',
        titulo: 'Resultado proclamado',
        texto: `${nomes.join(', ')}. Prazo de impugnação até ${prazo}.`,
        base: 'art33',
      };

      const mandatoInicio = addDays(proclamadaEm, 1);
      const mandatoFim = addYears(mandatoInicio, REGRAS.MANDATO_ANOS);
      const novosMandatos = eleitos
        .filter((x) => !x.suplente)
        .map((x) => ({
          id: uid('md'),
          membroId: x.membroId,
          cargo: el.cargo,
          orgao: CARGOS_ELEITORAIS[el.cargo].escopo === 'CELULA' ? prev.celula.nome : prev.circulo.nome,
          inicio: mandatoInicio,
          fim: mandatoFim,
          eleicaoId: el.id,
          estado: 'ACTIVO' as const,
        }));

      const cargoCelula: Record<string, Membro['cargo']> = {
        SECRETARIO_CELULA: 'SECRETARIO',
        ASSISTENTES_CELULA: 'ASSISTENTE',
        ELEMENTO_LIGACAO: 'ELEMENTO_LIGACAO',
      };
      const novoCargo = cargoCelula[el.cargo];

      return {
        ...prev,
        eleicoes: prev.eleicoes.map((x) =>
          x.id === eleicaoId
            ? {
                ...x,
                fase: 'PROCLAMADA' as const,
                voltas: x.voltas.map((v) => (v.numero === voltaActual.numero ? { ...v, fechadaEm: proclamadaEm } : v)),
                eleitos,
                proclamadaEm,
                prazoImpugnacao: prazo,
                mandato: { inicio: mandatoInicio, fim: mandatoFim },
                acta: `Acta de Eleição — ${x.titulo}. Escrutínio de ${proclamadaEm}.`,
              }
            : x,
        ),
        mandatos: [
          ...prev.mandatos.map((md) =>
            md.cargo === el.cargo && md.estado !== 'CESSADO' && (md.estado === 'VAGO' || md.estado === 'ACTIVO')
              ? { ...md, estado: 'CESSADO' as const, notaCessacao: 'Substituído por eleição' }
              : md,
          ),
          ...novosMandatos,
        ],
        membros: novoCargo
          ? prev.membros.map((m) => {
              if (eleitos.some((x) => !x.suplente && x.membroId === m.id)) return { ...m, cargo: novoCargo };
              if (m.cargo === novoCargo) return { ...m, cargo: 'MEMBRO' as const };
              return m;
            })
          : prev.membros,
        documentos: [
          { id: uid('dc'), titulo: `Acta de Eleição — ${el.titulo}`, categoria: 'ELEITORAL' as const, escopo: 'CELULA' as const, data: proclamadaEm, paginas: 2, tamanhoKb: 160 },
          ...prev.documentos,
        ],
      };
    });
    if (mensagem) {
      const m = mensagem as Toast;
      avisar({ tipo: m.tipo, titulo: m.titulo, texto: m.texto, base: m.base });
    }
  }, [set, avisar]);

  const homologar = useCallback((eleicaoId: string) => {
    set((prev) => ({ ...prev, eleicoes: prev.eleicoes.map((el) => (el.id === eleicaoId ? { ...el, fase: 'HOMOLOGADA' } : el)) }));
    avisar({ tipo: 'ok', titulo: 'Eleição homologada', texto: 'Decorrido o prazo de impugnação sem reclamações, o acto tornou-se definitivo.', base: 'art33' });
  }, [set, avisar]);

  const anularEleicao = useCallback((eleicaoId: string, motivo: string) => {
    set((prev) => ({ ...prev, eleicoes: prev.eleicoes.map((el) => (el.id === eleicaoId ? { ...el, fase: 'ANULADA', observacoes: motivo } : el)) }));
    avisar({ tipo: 'lei', titulo: 'Eleição anulada', texto: motivo, base: 'art33' });
  }, [set, avisar]);

  // ─────────────────────── Comunicação e documentos ─────────────────────────

  const enviarMensagem = useCallback((p: { canais: Canal[]; segmento: Segmento; destinatarios: string[]; assunto: string; corpo: string; tipo: 'CONVOCATORIA' | 'AVISO_QUOTA' | 'ANIVERSARIO' | 'ELEITORAL' | 'LIVRE' }) => {
    const custoUnit = (p.canais.includes('SMS') ? 1.5 : 0) + (p.canais.includes('WHATSAPP') ? 0.6 : 0) + (p.canais.includes('EMAIL') ? 0 : 0);
    const custo = Math.round(p.destinatarios.length * Math.max(custoUnit, 0.2));
    set((prev) => ({
      ...prev,
      mensagens: [{ id: uid('ms'), celulaId: prev.celula.id, enviadaEm: prev.hoje, custoEstimado: custo, ...p }, ...prev.mensagens],
    }));
    avisar({ tipo: 'ok', titulo: `Mensagem enviada a ${p.destinatarios.length} membro(s)`, texto: `Canais: ${p.canais.join(', ')}. Custo estimado: ${custo} MT.` });
  }, [set, avisar]);

  const arquivarDocumento = useCallback((dcm: Omit<Documento, 'id'>) => {
    set((prev) => ({ ...prev, documentos: [{ id: uid('dc'), ...dcm }, ...prev.documentos] }));
    avisar({ tipo: 'ok', titulo: 'Documento arquivado', texto: dcm.titulo });
  }, [set, avisar]);

  const valor = useMemo<Ctx>(() => ({
    e, lente, setLente, vista, irPara, params, toasts, avisar, fecharToast, repor,
    sessao, entrar, sair,
    guardarMembro, novoMembro, mudarEstadoMembro, definirCargo,
    registarQuota, anularQuota, registarMovimento,
    agendarReuniao, enviarConvocatoria, marcarPresenca, concluirReuniao, anexarActa, aprovarActa, addDecisao, toggleDecisao, cancelarReuniao,
    criarEleicao, gerarCaderno, alternarCaderno, abrirCandidaturas, addCandidatura, aceitarCandidatura, retirarCandidatura, abrirEscrutinio, registarVotos, fecharVolta, homologar, anularEleicao,
    enviarMensagem, arquivarDocumento,
  }), [
    e, lente, vista, params, toasts, irPara, avisar, fecharToast, repor,
    sessao, entrar, sair,
    guardarMembro, novoMembro, mudarEstadoMembro, definirCargo,
    registarQuota, anularQuota, registarMovimento,
    agendarReuniao, enviarConvocatoria, marcarPresenca, concluirReuniao, anexarActa, aprovarActa, addDecisao, toggleDecisao, cancelarReuniao,
    criarEleicao, gerarCaderno, alternarCaderno, abrirCandidaturas, addCandidatura, aceitarCandidatura, retirarCandidatura, abrirEscrutinio, registarVotos, fecharVolta, homologar, anularEleicao,
    enviarMensagem, arquivarDocumento,
  ]);

  return <StoreCtx.Provider value={valor}>{children}</StoreCtx.Provider>;
};

export function useStore(): Ctx {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore fora do Provider');
  return ctx;
}

/** Atalho para o valor de referência da quota de um membro. */
export { quotaReferencia };
export { mesDe };
