/* ===========================================================================
   Peças partilhadas pelos três ecrãs da votação em directo: a mesa, o
   telemóvel do camarada e o ecrã de projecção da sala.
   ========================================================================= */

import React, { useMemo } from 'react';
import qrcode from 'qrcode-generator';
import { Emblema, FaixaBandeira, Pill } from '../ui/primitives';
import { IcCheck, IcRaio } from '../ui/icons';
import type { EstadoLigacao, VotacaoVivo } from '../lib/vivo';

/* ═════════════════════════════════ Moldura ═════════════════════════════════ */

export const MolduraEscura: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`relative min-h-screen hero-bg text-white flex flex-col overflow-hidden ${className}`}>
    <FaixaBandeira altura={5} />
    <div className="absolute inset-0 grid-paper opacity-[0.06] pointer-events-none" />
    <div className="faixa-diagonal absolute -top-20 -right-24 w-80 h-52 opacity-[0.13] rotate-12 pointer-events-none" />
    <div className="relative flex-1 flex flex-col">{children}</div>
  </div>
);

export const CabecalhoVivo: React.FC<{
  titulo: string;
  sub?: React.ReactNode;
  direita?: React.ReactNode;
}> = ({ titulo, sub, direita }) => (
  <header className="sticky top-0 z-30 bg-white/92 backdrop-blur-xl border-b border-ink-100 no-print">
    <FaixaBandeira altura={3} />
    <div className="px-4 sm:px-6 py-3 flex items-center gap-3 max-w-[1520px] mx-auto">
      <Emblema tamanho={34} />
      <div className="min-w-0 flex-1">
        <h1 className="text-[15.5px] sm:text-[17px] font-extrabold text-ink tracking-tight truncate leading-tight">{titulo}</h1>
        {sub && <p className="text-[11.5px] text-ink-400 truncate">{sub}</p>}
      </div>
      {direita && <div className="flex items-center gap-2 flex-none">{direita}</div>}
    </div>
  </header>
);

/* ══════════════════════════════ Sinal da ligação ═══════════════════════════ */

export const SinalLigacao: React.FC<{ estado: EstadoLigacao; compacto?: boolean }> = ({ estado, compacto }) => {
  const mapa: Record<EstadoLigacao, { cor: string; texto: string; pulsa: boolean }> = {
    A_LIGAR: { cor: 'bg-ink-300', texto: 'a ligar…', pulsa: true },
    LIGADO: { cor: 'bg-verde-600', texto: 'em directo', pulsa: true },
    A_RELIGAR: { cor: 'bg-gold-500', texto: 'a religar…', pulsa: true },
    SEM_SERVIDOR: { cor: 'bg-gold-600', texto: 'sem servidor', pulsa: true },
    SEM_SESSAO: { cor: 'bg-brand-600', texto: 'sessão terminada', pulsa: false },
  };
  const s = mapa[estado];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-ink-400"
      title={`Ligação ao servidor: ${s.texto}`}
    >
      <span className="relative flex w-2 h-2">
        {s.pulsa && <span className={`absolute inline-flex w-full h-full rounded-full ${s.cor} opacity-60 animate-ping`} />}
        <span className={`relative inline-flex w-2 h-2 rounded-full ${s.cor}`} />
      </span>
      {!compacto && s.texto}
    </span>
  );
};

/* ══════════════════════════════════ Código ═════════════════════════════════ */

export const CodigoSala: React.FC<{ codigo: string; tamanho?: 'md' | 'lg' }> = ({ codigo, tamanho = 'md' }) => (
  <span
    className={`font-mono font-extrabold tracking-[0.28em] text-ink bg-ink-50 border border-ink-200 rounded-xl ${
      tamanho === 'lg' ? 'text-[30px] px-5 py-2.5' : 'text-[15px] px-3 py-1.5'
    }`}
  >
    {codigo}
  </span>
);

/* ════════════════════════════════════ QR ═══════════════════════════════════ */

/** Código QR do endereço de entrada — a sala aponta a câmara e entra. */
export const QR: React.FC<{ texto: string; tamanho?: number; className?: string }> = ({
  texto, tamanho = 168, className = '',
}) => {
  const { caminho, lado } = useMemo(() => {
    const q = qrcode(0, 'M');
    q.addData(texto);
    q.make();
    const n = q.getModuleCount();
    let d = '';
    for (let linha = 0; linha < n; linha++) {
      for (let coluna = 0; coluna < n; coluna++) {
        if (q.isDark(linha, coluna)) d += `M${coluna} ${linha}h1v1h-1z`;
      }
    }
    return { caminho: d, lado: n };
  }, [texto]);

  return (
    <svg
      viewBox={`-2 -2 ${lado + 4} ${lado + 4}`}
      width={tamanho}
      height={tamanho}
      shapeRendering="crispEdges"
      className={`rounded-lg ${className}`}
      role="img"
      aria-label={`Código QR para ${texto}`}
    >
      <rect x={-2} y={-2} width={lado + 4} height={lado + 4} fill="#ffffff" />
      <path d={caminho} fill="#1A1717" />
    </svg>
  );
};

/* ═══════════════════════════════ Fase da votação ═══════════════════════════ */

export const FASES: Record<VotacaoVivo['estado'], { rotulo: string; tom: 'neutro' | 'brand' | 'verde' | 'gold' | 'ink' }> = {
  PREPARACAO: { rotulo: 'Candidaturas', tom: 'gold' },
  ABERTA: { rotulo: 'Urna aberta', tom: 'brand' },
  ENCERRADA: { rotulo: 'Em apuramento', tom: 'ink' },
  PROCLAMADA: { rotulo: 'Proclamada', tom: 'verde' },
  ANULADA: { rotulo: 'Anulada', tom: 'neutro' },
};

export const PillFase: React.FC<{ estado: VotacaoVivo['estado'] }> = ({ estado }) => (
  <Pill tom={FASES[estado].tom} ponto={estado === 'ABERTA'}>{FASES[estado].rotulo}</Pill>
);

/* ═══════════════════════════════ Afluência ═════════════════════════════════ */

export const Afluencia: React.FC<{ votaram: number; aptos: number; tamanho?: number }> = ({
  votaram, aptos, tamanho = 120,
}) => {
  const pct = aptos ? (votaram / aptos) * 100 : 0;
  const r = (tamanho - 12) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: tamanho, height: tamanho }}>
      <svg width={tamanho} height={tamanho} className="-rotate-90">
        <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke="#EDE9E9" strokeWidth={12} />
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={r}
          fill="none"
          stroke={pct >= 100 ? '#00A34F' : '#E61923'}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (Math.min(pct, 100) / 100) * c}
          style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.22,1,.36,1), stroke .3s' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-[26px] font-extrabold tnum text-ink">{votaram}</span>
        <span className="text-[11px] font-bold text-ink-400 mt-0.5">de {aptos}</span>
      </div>
    </div>
  );
};

/* ═════════════════════════════ Barra de resultado ══════════════════════════ */

export const BarraCandidato: React.FC<{
  nome: string;
  votos: number;
  maximo: number;
  eleito?: boolean;
  linha?: React.ReactNode;
  destaque?: boolean;
  escuro?: boolean;
}> = ({ nome, votos, maximo, eleito, linha, destaque, escuro }) => {
  const pct = maximo ? (votos / maximo) * 100 : 0;
  return (
    <div className={`rounded-xl border p-3 transition-all ${
      escuro
        ? eleito ? 'border-verde-500/60 bg-verde-600/10' : 'border-white/10 bg-white/[0.04]'
        : eleito ? 'border-verde-300 bg-verde-100/50' : destaque ? 'border-brand-200 bg-brand-50/40' : 'border-ink-100 bg-white'
    }`}>
      <div className="flex items-baseline justify-between gap-3">
        <p className={`text-[14px] font-bold truncate ${escuro ? 'text-white' : 'text-ink'}`}>
          {eleito && <IcCheck className="w-3.5 h-3.5 inline-block mr-1 text-verde-600" />}
          {nome}
        </p>
        <p className={`text-[17px] font-extrabold tnum flex-none ${eleito ? 'text-verde-700' : escuro ? 'text-white' : 'text-ink'}`}>
          {votos}
        </p>
      </div>
      <div className={`mt-2 h-2 rounded-full overflow-hidden ${escuro ? 'bg-white/10' : 'bg-ink-100'}`}>
        <div
          className={`h-2 rounded-full transition-all duration-700 ease-swift ${eleito ? 'bg-verde-600' : 'bg-brand-600'}`}
          style={{ width: `${Math.max(pct, votos > 0 ? 4 : 0)}%` }}
        />
      </div>
      {linha && <p className={`text-[11.5px] mt-1.5 ${escuro ? 'text-white/50' : 'text-ink-400'}`}>{linha}</p>}
    </div>
  );
};

/* ═════════════════════════════ Aviso de servidor ═══════════════════════════ */

export const ServidorEmFalta: React.FC<{ mensagem?: string; onTentar?: () => void }> = ({ mensagem, onTentar }) => (
  <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
    <div className="flex items-start gap-3">
      <span className="w-9 h-9 rounded-xl bg-white text-brand-600 grid place-items-center flex-none border border-brand-200">
        <IcRaio className="w-4.5 h-4.5" />
      </span>
      <div className="min-w-0">
        <p className="text-[14px] font-extrabold text-brand-900">Servidor da votação indisponível</p>
        <p className="text-[12.5px] text-brand-800/80 mt-1 leading-relaxed">
          {mensagem ??
            'A votação em directo precisa do servidor a correr — é ele que sincroniza todos os telemóveis da sala.'}
        </p>
        <pre className="mt-3 text-[12px] font-mono bg-white border border-brand-200 rounded-xl px-3 py-2 text-ink-600 overflow-x-auto">
          npm run servidor
        </pre>
        {onTentar && (
          <button
            onClick={onTentar}
            className="mt-3 text-[12.5px] font-bold text-brand-700 hover:text-brand-900 link-underline"
          >
            Tentar de novo
          </button>
        )}
      </div>
    </div>
  </div>
);
