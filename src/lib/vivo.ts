/* ===========================================================================
   Cliente da votação em directo.

   Fala com o servidor `servidor/index.mjs`: lê por SSE (o estado da assembleia
   chega sozinho, sem sondagem) e escreve por POST. Se o servidor não estiver
   de pé, o módulo diz-lo com todas as letras em vez de ficar à espera.
   ========================================================================= */

import { useCallback, useEffect, useRef, useState } from 'react';

/** Permite servir a aplicação num sítio e o servidor de votação noutro. */
const BASE = (import.meta.env.VITE_SGC_API ?? '').replace(/\/$/, '');

/* ═══════════════════════════════════ Tipos ═════════════════════════════════ */

export type Papel = 'MESA' | 'VOTANTE';

export type EstadoVotacao = 'PREPARACAO' | 'ABERTA' | 'ENCERRADA' | 'PROCLAMADA' | 'ANULADA';

export interface MembroVivo {
  id: string;
  nome: string;
  funcao: string;
  podeVotar: boolean;
  podeSerEleito: boolean;
  presente: boolean;
  ligado: boolean;
  /** Só chega à mesa — é ela que distribui os códigos pessoais. */
  pin?: string;
}

export interface CandidatoVivo {
  id: string;
  membroId: string;
  nome: string;
  /** `null` enquanto o camarada não respondeu à consulta prévia (Art. 22). */
  aceitou: boolean | null;
  propostoPor: string;
  incumbente: boolean;
}

export interface LinhaApuramento {
  candidatoId: string;
  membroId: string | null;
  nome: string;
  votos: number;
  pctExpressos: number;
  pctEfectividade: number;
  eleito: boolean;
}

export interface Apuramento {
  volta: 1 | 2;
  expressos: number;
  validos: number;
  brancos: number;
  nulos: number;
  efectividade: number;
  maioriaExigida: number;
  quorum: { exigido: number; atingido: boolean; presentes: number; universo: number; regra: string };
  linhas: LinhaApuramento[];
  eleitosAgora: string[];
  precisaSegundaVolta: boolean;
  candidatosSegundaVolta: string[];
  vagasRestantes: number;
}

export interface VoltaVivo {
  numero: 1 | 2;
  candidatos: string[];
  abertaEm: string | null;
  fechadaEm: string | null;
  presentesNaAbertura: number;
  votantes: string[];
  totalVotos: number;
  /** Só é revelado depois de a urna fechar — ou se a mesa ligar o directo. */
  apuramento: Apuramento | null;
}

export interface VotacaoVivo {
  id: string;
  titulo: string;
  cargo: string;
  vagas: number;
  metodo: string;
  base: string[];
  estado: EstadoVotacao;
  criadaEm: string;
  quorumRegra: 'METADE' | 'DOIS_TERCOS';
  efectividade: number;
  resultadosEmDirecto: boolean;
  exigeAceitacao: boolean;
  motivoAnulacao: string | null;
  candidatos: CandidatoVivo[];
  voltas: VoltaVivo[];
  eleitos: { membroId: string | null; nome: string; votos: number; ordem: number; suplente: boolean }[];
  proclamadaEm: string | null;
  prazoImpugnacao: string | null;
  acta: string | null;
}

export interface EventoVivo {
  id: string;
  em: string;
  tipo: string;
  texto: string;
}

export interface Assembleia {
  codigo: string;
  nome: string;
  escopo: 'CELULA' | 'CIRCULO' | 'CONFERENCIA';
  orgao: string;
  local: string;
  mesa: string;
  criadaEm: string;
  pinObrigatorio: boolean;
  registoAberto: boolean;
  chaveMesa?: string;
  membros: MembroVivo[];
  votacoes: VotacaoVivo[];
  eventos: EventoVivo[];
  agora: string;
}

export interface Sessao {
  codigo: string;
  token: string;
  papel: Papel;
  membroId: string | null;
  nome?: string;
  chaveMesa?: string;
}

/* ════════════════════════════════ Transporte ═══════════════════════════════ */

export class ErroServidor extends Error {
  estatuto: number;
  constructor(mensagem: string, estatuto = 0) {
    super(mensagem);
    this.estatuto = estatuto;
  }
}

async function pedir<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  let r: Response;
  try {
    r = await fetch(`${BASE}${caminho}`, {
      ...opcoes,
      headers: { 'Content-Type': 'application/json', ...(opcoes.headers ?? {}) },
    });
  } catch {
    throw new ErroServidor(
      'Não foi possível falar com o servidor da votação. Confirme que está a correr (npm run servidor).',
    );
  }
  const corpo = await r.json().catch(() => ({}));
  if (!r.ok) throw new ErroServidor((corpo as any)?.erro ?? `Erro ${r.status}.`, r.status);
  return corpo as T;
}

export interface ResumoSala {
  codigo: string;
  nome: string;
  orgao: string;
  local: string;
  pinObrigatorio: boolean;
  registoAberto: boolean;
  membros: { id: string; nome: string; funcao: string; presente: boolean }[];
}

export const api = {
  saude: () => pedir<{ ok: boolean; assembleias: number }>('/api/saude'),

  criarAssembleia: (dados: {
    nome: string;
    escopo: string;
    local?: string;
    mesa?: string;
    membros: { nome: string; funcao?: string }[];
    pinObrigatorio?: boolean;
    registoAberto?: boolean;
  }) =>
    pedir<{ codigo: string; chaveMesa: string; token: string; membros: { id: string; nome: string; pin: string }[] }>(
      '/api/salas',
      { method: 'POST', body: JSON.stringify(dados) },
    ),

  sala: (codigo: string) => pedir<ResumoSala>(`/api/salas/${codigo}`),

  entrar: (codigo: string, dados: { membroId?: string; nome?: string; pin?: string }) =>
    pedir<{ token: string; papel: Papel; membroId: string; nome: string }>(`/api/salas/${codigo}/entrar`, {
      method: 'POST',
      body: JSON.stringify(dados),
    }),

  entrarMesa: (codigo: string, chaveMesa: string) =>
    pedir<{ token: string; papel: Papel }>(`/api/salas/${codigo}/mesa`, {
      method: 'POST',
      body: JSON.stringify({ chaveMesa }),
    }),

  accao: (codigo: string, token: string, accao: string, dados: Record<string, unknown> = {}) =>
    pedir<{ ok: boolean; resultado: any }>(`/api/salas/${codigo}/accao`, {
      method: 'POST',
      body: JSON.stringify({ token, accao, dados }),
    }),
};

/* ═══════════════════════════════ Sessão local ══════════════════════════════ */

const CHAVE_SESSAO = 'sgc.vivo.sessao';

export function guardarSessao(s: Sessao) {
  try {
    localStorage.setItem(`${CHAVE_SESSAO}.${s.codigo}`, JSON.stringify(s));
    localStorage.setItem(`${CHAVE_SESSAO}.ultima`, s.codigo);
  } catch { /* modo privado — a sessão vive só nesta página */ }
}

export function lerSessao(codigo: string): Sessao | null {
  try {
    const raw = localStorage.getItem(`${CHAVE_SESSAO}.${codigo}`);
    return raw ? (JSON.parse(raw) as Sessao) : null;
  } catch {
    return null;
  }
}

export function esquecerSessao(codigo: string) {
  try {
    localStorage.removeItem(`${CHAVE_SESSAO}.${codigo}`);
  } catch { /* ignorar */ }
}

export function ultimoCodigo(): string | null {
  try {
    return localStorage.getItem(`${CHAVE_SESSAO}.ultima`);
  } catch {
    return null;
  }
}

/* ══════════════════════════════ Ligação ao vivo ════════════════════════════ */

export type EstadoLigacao = 'A_LIGAR' | 'LIGADO' | 'A_RELIGAR' | 'SEM_SESSAO' | 'SEM_SERVIDOR';

/**
 * Mantém a assembleia sincronizada em tempo real. O EventSource religa-se
 * sozinho; o que fazemos aqui é distinguir uma quebra de rede (que passa) de
 * uma sessão inválida (que não passa e obriga a voltar a entrar).
 */
export function useAssembleia(sessao: Sessao | null) {
  const [sala, setSala] = useState<Assembleia | null>(null);
  const [estado, setEstado] = useState<EstadoLigacao>('A_LIGAR');
  const [motivo, setMotivo] = useState<string | null>(null);
  const falhas = useRef(0);
  const aDiagnosticar = useRef(false);

  useEffect(() => {
    if (!sessao) {
      setSala(null);
      setEstado('A_LIGAR');
      return;
    }
    let vivo = true;
    falhas.current = 0;
    aDiagnosticar.current = false;
    setMotivo(null);

    /* O EventSource não deixa ler o motivo da falha — só sabe dizer «erro». Sem
       isto, uma sessão morta era indistinguível de uma quebra de rede, e o ecrã
       ficava eternamente a religar, sem saída. */
    const diagnosticar = async () => {
      if (aDiagnosticar.current) return;
      aDiagnosticar.current = true;
      try {
        const r = await fetch(
          `${BASE}/api/salas/${sessao.codigo}/sessao?token=${encodeURIComponent(sessao.token)}`,
        );
        if (!vivo) return;
        if (r.ok) {
          // Sessão de pé: é o fluxo que está a falhar. Continuar a insistir.
          setEstado('A_RELIGAR');
          return;
        }
        const corpo = await r.json().catch(() => ({} as { erro?: string }));
        setEstado('SEM_SESSAO');
        setMotivo(
          r.status === 404
            ? 'Esta assembleia já não existe no servidor. Se ele foi republicado, é preciso constituí-la de novo.'
            : (corpo as { erro?: string }).erro ?? 'A sua sessão terminou.',
        );
      } catch {
        // Nem sequer chegámos ao servidor: é a rede, e essa volta.
        if (vivo) setEstado('SEM_SERVIDOR');
      } finally {
        aDiagnosticar.current = false;
      }
    };
    const url = `${BASE}/api/salas/${sessao.codigo}/eventos?token=${encodeURIComponent(sessao.token)}`;
    const fonte = new EventSource(url);

    fonte.addEventListener('estado', (ev) => {
      if (!vivo) return;
      falhas.current = 0;
      try {
        setSala(JSON.parse((ev as MessageEvent).data) as Assembleia);
        setEstado('LIGADO');
        setMotivo(null);
      } catch { /* trama truncada — a próxima corrige */ }
    });

    fonte.onopen = () => {
      if (!vivo) return;
      falhas.current = 0;
      setEstado('LIGADO');
      setMotivo(null);
    };

    fonte.onerror = () => {
      if (!vivo) return;
      falhas.current += 1;
      setEstado((actual) => (actual === 'LIGADO' || actual === 'A_LIGAR' ? 'A_RELIGAR' : actual));
      // Duas falhas seguidas: vale a pena perguntar ao servidor o que se passa.
      if (falhas.current >= 2) void diagnosticar();
    };

    return () => {
      vivo = false;
      fonte.close();
    };
    // `sessao` vem de um `useState` do chamador: só muda ao entrar ou ao sair.
  }, [sessao]);

  const accao = useCallback(
    async (nome: string, dados: Record<string, unknown> = {}) => {
      if (!sessao) throw new ErroServidor('Sem sessão aberta.');
      const r = await api.accao(sessao.codigo, sessao.token, nome, dados);
      return r.resultado;
    },
    [sessao],
  );

  return { sala, estado, motivo, accao };
}

/* ═══════════════════════════════ Conveniências ═════════════════════════════ */

export function votacaoActiva(sala: Assembleia | null): VotacaoVivo | null {
  if (!sala) return null;
  return (
    sala.votacoes.find((v) => v.estado === 'ABERTA') ??
    sala.votacoes.find((v) => v.estado === 'ENCERRADA') ??
    sala.votacoes.find((v) => v.estado === 'PREPARACAO') ??
    sala.votacoes[0] ??
    null
  );
}

export function voltaEmCurso(vt: VotacaoVivo | null): VoltaVivo | null {
  if (!vt || !vt.voltas.length) return null;
  return vt.voltas[vt.voltas.length - 1];
}

export function jaVotou(vt: VotacaoVivo | null, membroId: string | null): boolean {
  const v = voltaEmCurso(vt);
  return !!(v && membroId && v.votantes.includes(membroId));
}

/** Hora local curta — os eventos do servidor vêm em ISO com fuso. */
export function horas(instante: string | null | undefined): string {
  if (!instante) return '—';
  const d = new Date(instante);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function horasComSegundos(instante: string | null | undefined): string {
  if (!instante) return '—';
  const d = new Date(instante);
  return `${horas(instante)}:${String(d.getSeconds()).padStart(2, '0')}`;
}
