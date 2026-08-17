import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NORMAS } from '../lib/estatutos';
import { clamp, iniciais, num } from '../lib/format';
import { IcAviso, IcCheck, IcFechar, IcInfo, IcLei } from './icons';

/* ═══════════════════════════════════ Cartões ═══════════════════════════════ */

export const Card: React.FC<{
  children: React.ReactNode;
  titulo?: React.ReactNode;
  sub?: React.ReactNode;
  accao?: React.ReactNode;
  className?: string;
  pad?: boolean;
  destaque?: boolean;
}> = ({ children, titulo, sub, accao, className = '', pad = true, destaque }) => (
  <section
    className={`rounded-2xl bg-white border ${destaque ? 'border-brand-200 ring-1 ring-brand-100' : 'border-ink-100'} shadow-card ${className}`}
  >
    {(titulo || accao) && (
      <header className="flex items-start justify-between gap-4 px-5 pt-4 pb-3 border-b border-ink-100">
        <div className="min-w-0">
          {titulo && <h3 className="text-[15px] font-bold text-ink tracking-tight leading-tight">{titulo}</h3>}
          {sub && <p className="text-xs text-ink-400 mt-0.5 leading-snug">{sub}</p>}
        </div>
        {accao && <div className="flex items-center gap-2 flex-none">{accao}</div>}
      </header>
    )}
    <div className={pad ? 'p-5' : ''}>{children}</div>
  </section>
);

export const Secao: React.FC<{ titulo: string; sub?: string; accao?: React.ReactNode; className?: string }> = ({
  titulo, sub, accao, className = '',
}) => (
  <div className={`flex items-end justify-between gap-4 mb-3 ${className}`}>
    <div>
      <h2 className="text-[13px] font-extrabold uppercase tracking-[0.14em] text-ink-400">{titulo}</h2>
      {sub && <p className="text-sm text-ink-500 mt-1">{sub}</p>}
    </div>
    {accao}
  </div>
);

/* ═══════════════════════════════════ Botões ════════════════════════════════ */

type Variante = 'primaria' | 'escura' | 'contorno' | 'fantasma' | 'perigo' | 'sucesso' | 'suave';

const VARIANTES: Record<Variante, string> = {
  primaria: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm active:scale-[.985]',
  escura: 'bg-ink text-white hover:bg-ink-700 shadow-sm active:scale-[.985]',
  contorno: 'bg-white text-ink-700 border border-ink-200 hover:border-ink-300 hover:bg-ink-50',
  fantasma: 'text-ink-500 hover:text-ink hover:bg-ink-50',
  perigo: 'bg-white text-brand-700 border border-brand-200 hover:bg-brand-50',
  sucesso: 'bg-verde-600 text-white hover:bg-verde-700 shadow-sm active:scale-[.985]',
  suave: 'bg-ink-50 text-ink-700 hover:bg-ink-100 border border-transparent',
};

export const Btn: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variante?: Variante;
    tamanho?: 'sm' | 'md' | 'lg';
    icone?: React.ReactNode;
    iconeFim?: React.ReactNode;
    largo?: boolean;
  }
> = ({ variante = 'contorno', tamanho = 'md', icone, iconeFim, largo, children, className = '', ...rest }) => {
  const tam = tamanho === 'sm' ? 'text-[13px] px-3 py-1.5 gap-1.5' : tamanho === 'lg' ? 'text-[15px] px-5 py-3 gap-2' : 'text-sm px-3.5 py-2 gap-2';
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 ease-swift disabled:opacity-40 disabled:pointer-events-none ${VARIANTES[variante]} ${tam} ${largo ? 'w-full' : ''} ${className}`}
    >
      {icone}
      {children && <span className="truncate">{children}</span>}
      {iconeFim}
    </button>
  );
};

/* ════════════════════════════════════ Pílulas ══════════════════════════════ */

type Tom = 'neutro' | 'brand' | 'verde' | 'gold' | 'azul' | 'ink' | 'roxo';

const TONS: Record<Tom, string> = {
  neutro: 'bg-ink-50 text-ink-500 border-ink-100',
  brand: 'bg-brand-50 text-brand-700 border-brand-100',
  verde: 'bg-verde-100 text-verde-800 border-verde-200',
  gold: 'bg-gold-100 text-gold-700 border-gold-300/60',
  azul: 'bg-sky-50 text-sky-700 border-sky-100',
  ink: 'bg-ink text-white border-ink',
  roxo: 'bg-violet-50 text-violet-700 border-violet-100',
};

export const Pill: React.FC<{ children: React.ReactNode; tom?: Tom; className?: string; ponto?: boolean }> = ({
  children, tom = 'neutro', className = '', ponto,
}) => (
  <span
    className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${TONS[tom]} ${className}`}
  >
    {ponto && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
    {children}
  </span>
);

/* ═══════════════════════════════ Contador animado ══════════════════════════ */

export const Contador: React.FC<{ valor: number; dec?: number; sufixo?: string; prefixo?: string; className?: string }> = ({
  valor, dec = 0, sufixo = '', prefixo = '', className = '',
}) => {
  const [v, setV] = useState(0);
  const anterior = useRef(0);
  useEffect(() => {
    const de = anterior.current;
    const para = valor;
    const semAnimacao =
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Em separadores em segundo plano o requestAnimationFrame não corre; nesse
    // caso o valor aparece de imediato, em vez de ficar parado a zero.
    if (semAnimacao || document.visibilityState !== 'visible') {
      anterior.current = para;
      setV(para);
      return;
    }
    const inicio = performance.now();
    const dur = 750;
    let raf = 0;
    const passo = (t: number) => {
      const p = clamp((t - inicio) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(de + (para - de) * eased);
      if (p < 1) raf = requestAnimationFrame(passo);
      else anterior.current = para;
    };
    raf = requestAnimationFrame(passo);
    const rede = window.setTimeout(() => { anterior.current = para; setV(para); }, dur + 300);
    return () => { cancelAnimationFrame(raf); window.clearTimeout(rede); };
  }, [valor]);
  const texto = dec > 0 ? v.toFixed(dec).replace('.', ',') : num(v);
  return <span className={`tnum ${className}`}>{prefixo}{texto}{sufixo}</span>;
};

/* ═══════════════════════════════════ KPIs ══════════════════════════════════ */

export const Stat: React.FC<{
  rotulo: string;
  valor: React.ReactNode;
  nota?: React.ReactNode;
  icone?: React.ReactNode;
  tom?: Tom;
  className?: string;
  onClick?: () => void;
}> = ({ rotulo, valor, nota, icone, tom = 'neutro', className = '', onClick }) => {
  const cor = tom === 'brand' ? 'text-brand-600' : tom === 'verde' ? 'text-verde-700' : tom === 'gold' ? 'text-gold-600' : 'text-ink';
  const Wrap: any = onClick ? 'button' : 'div';
  return (
    <Wrap
      onClick={onClick}
      className={`text-left rounded-2xl bg-white border border-ink-100 shadow-card p-4 lift ${onClick ? 'hover:shadow-lift cursor-pointer' : ''} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-400 leading-tight">{rotulo}</p>
        {icone && <span className={`${cor} opacity-60 flex-none`}>{icone}</span>}
      </div>
      <p className={`mt-2 text-[26px] leading-none font-extrabold tnum ${cor}`}>{valor}</p>
      {nota && <p className="mt-1.5 text-xs text-ink-400 leading-snug">{nota}</p>}
    </Wrap>
  );
};

/* ═══════════════════════════════ Barras e anéis ════════════════════════════ */

export const Barra: React.FC<{ valor: number; tom?: string; alt?: string; fundo?: string }> = ({
  valor, tom = 'bg-brand-600', alt = 'h-2', fundo = 'bg-ink-100',
}) => (
  <div className={`w-full ${alt} ${fundo} rounded-full overflow-hidden`}>
    <div
      className={`${alt} ${tom} rounded-full transition-all duration-700 ease-swift`}
      style={{ width: `${clamp(valor, 0, 100)}%` }}
    />
  </div>
);

export const Anel: React.FC<{
  valor: number;
  tamanho?: number;
  espessura?: number;
  cor?: string;
  centro?: React.ReactNode;
  trilho?: string;
}> = ({ valor, tamanho = 96, espessura = 9, cor = '#E61923', centro, trilho = '#EDE9E9' }) => {
  const r = (tamanho - espessura) / 2;
  const c = 2 * Math.PI * r;
  const [anim, setAnim] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setAnim(valor), 60);
    return () => window.clearTimeout(t);
  }, [valor]);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: tamanho, height: tamanho }}>
      <svg width={tamanho} height={tamanho} className="-rotate-90">
        <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke={trilho} strokeWidth={espessura} />
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={r}
          fill="none"
          stroke={cor}
          strokeWidth={espessura}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (clamp(anim, 0, 100) / 100) * c}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.22,1,.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{centro}</div>
    </div>
  );
};

/* ═══════════════════════════ Chip de base legal ════════════════════════════ */

export const Lei: React.FC<{ id: string; texto?: string; className?: string; discreto?: boolean }> = ({
  id, texto, className = '', discreto,
}) => {
  const n = NORMAS[id];
  const [aberto, setAberto] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!aberto || !btn.current) return;
    const r = btn.current.getBoundingClientRect();
    const largura = 320;
    const left = clamp(r.left + r.width / 2 - largura / 2, 12, window.innerWidth - largura - 12);
    const abaixo = r.bottom + 8;
    const acima = r.top - 8;
    const cabeAbaixo = window.innerHeight - r.bottom > 230;
    setPos({ top: cabeAbaixo ? abaixo : Math.max(12, acima - 210), left });
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    const fechar = (ev: MouseEvent | KeyboardEvent) => {
      if (ev instanceof KeyboardEvent && ev.key !== 'Escape') return;
      setAberto(false);
    };
    window.addEventListener('click', fechar as EventListener, true);
    window.addEventListener('keydown', fechar as EventListener);
    window.addEventListener('scroll', () => setAberto(false), true);
    return () => {
      window.removeEventListener('click', fechar as EventListener, true);
      window.removeEventListener('keydown', fechar as EventListener);
    };
  }, [aberto]);

  if (!n) return null;

  return (
    <>
      <button
        ref={btn}
        type="button"
        onClick={(ev) => { ev.stopPropagation(); setAberto((a) => !a); }}
        title={`${n.epigrafe} — ${n.ref}`}
        className={`inline-flex items-center gap-1 rounded-md font-bold tracking-wide transition-colors ${
          discreto
            ? 'text-[10px] uppercase text-ink-400 hover:text-brand-600'
            : 'text-[10px] uppercase px-1.5 py-0.5 bg-ink-50 text-ink-400 border border-ink-100 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200'
        } ${className}`}
      >
        <IcLei className="w-3 h-3" />
        {texto ?? n.ref}
      </button>
      {aberto && pos && (
        <div
          className="fixed z-[90] w-80 rounded-2xl bg-ink text-white shadow-rail p-4 a-scale"
          style={{ top: pos.top, left: pos.left }}
          onClick={(ev) => ev.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <Pill tom="gold" className="!bg-gold-500/15 !text-gold-300 !border-gold-500/30">
              {n.fonte === 'ESTATUTOS' ? 'Estatutos' : 'Manual da Célula'}
            </Pill>
            <span className="text-[11px] font-mono text-white/50">{n.ref}</span>
          </div>
          <p className="text-[13px] font-bold text-white mb-1.5">{n.epigrafe}</p>
          <p className="text-[12.5px] leading-relaxed text-white/70">{n.texto}</p>
        </div>
      )}
    </>
  );
};

/* ═════════════════════════════════ Modal ═══════════════════════════════════ */

export const Modal: React.FC<{
  aberto: boolean;
  onFechar: () => void;
  titulo: React.ReactNode;
  sub?: React.ReactNode;
  children: React.ReactNode;
  rodape?: React.ReactNode;
  largura?: string;
}> = ({ aberto, onFechar, titulo, sub, children, rodape, largura = 'max-w-xl' }) => {
  useEffect(() => {
    if (!aberto) return;
    const esc = (ev: KeyboardEvent) => { if (ev.key === 'Escape') onFechar(); };
    window.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', esc);
      document.body.style.overflow = '';
    };
  }, [aberto, onFechar]);

  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-[3px] a-fade" onClick={onFechar} />
      <div className={`relative w-full ${largura} bg-white rounded-t-3xl sm:rounded-3xl shadow-lift a-scale max-h-[92vh] flex flex-col`}>
        <header className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-ink-100">
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold text-ink tracking-tight">{titulo}</h3>
            {sub && <p className="text-[13px] text-ink-400 mt-0.5 leading-snug">{sub}</p>}
          </div>
          <button onClick={onFechar} className="flex-none w-8 h-8 rounded-full grid place-items-center text-ink-400 hover:bg-ink-50 hover:text-ink">
            <IcFechar className="w-4 h-4" />
          </button>
        </header>
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
        {rodape && <footer className="px-6 py-4 border-t border-ink-100 bg-ink-50/60 rounded-b-3xl flex items-center justify-end gap-2">{rodape}</footer>}
      </div>
    </div>
  );
};

/* ═════════════════════════════════ Gaveta ══════════════════════════════════ */

export const Gaveta: React.FC<{
  aberto: boolean;
  onFechar: () => void;
  titulo: React.ReactNode;
  sub?: React.ReactNode;
  children: React.ReactNode;
  rodape?: React.ReactNode;
  largura?: string;
}> = ({ aberto, onFechar, titulo, sub, children, rodape, largura = 'max-w-lg' }) => {
  useEffect(() => {
    if (!aberto) return;
    const esc = (ev: KeyboardEvent) => { if (ev.key === 'Escape') onFechar(); };
    window.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [aberto, onFechar]);
  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] a-fade" onClick={onFechar} />
      <aside className={`relative w-full ${largura} h-full bg-white shadow-rail a-drawer flex flex-col`}>
        <header className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-ink-100">
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold text-ink tracking-tight leading-tight">{titulo}</h3>
            {sub && <p className="text-[13px] text-ink-400 mt-0.5">{sub}</p>}
          </div>
          <button onClick={onFechar} className="flex-none w-8 h-8 rounded-full grid place-items-center text-ink-400 hover:bg-ink-50">
            <IcFechar className="w-4 h-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {rodape && <footer className="px-6 py-4 border-t border-ink-100 bg-ink-50/60 flex items-center gap-2">{rodape}</footer>}
      </aside>
    </div>
  );
};

/* ══════════════════════════════ Abas / segmentos ═══════════════════════════ */

export const Abas: React.FC<{
  itens: { id: string; rotulo: string; contagem?: number }[];
  activo: string;
  onMudar: (id: string) => void;
  className?: string;
}> = ({ itens, activo, onMudar, className = '' }) => (
  <div className={`flex items-center gap-1 overflow-x-auto ${className}`}>
    {itens.map((i) => {
      const on = i.id === activo;
      return (
        <button
          key={i.id}
          onClick={() => onMudar(i.id)}
          className={`relative flex items-center gap-2 px-3.5 py-2 text-[13px] font-bold rounded-xl whitespace-nowrap transition-all ${
            on ? 'bg-ink text-white shadow-sm' : 'text-ink-400 hover:text-ink hover:bg-ink-50'
          }`}
        >
          {i.rotulo}
          {i.contagem !== undefined && (
            <span className={`text-[10px] tnum px-1.5 py-0.5 rounded-full ${on ? 'bg-white/20' : 'bg-ink-100 text-ink-400'}`}>
              {i.contagem}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

export const Segmentado: React.FC<{
  itens: { id: string; rotulo: string; icone?: React.ReactNode }[];
  activo: string;
  onMudar: (id: string) => void;
  className?: string;
}> = ({ itens, activo, onMudar, className = '' }) => (
  <div className={`inline-flex items-center p-1 bg-ink-50 rounded-xl border border-ink-100 ${className}`}>
    {itens.map((i) => {
      const on = i.id === activo;
      return (
        <button
          key={i.id}
          onClick={() => onMudar(i.id)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-bold rounded-lg transition-all ${
            on ? 'bg-white text-ink shadow-sm' : 'text-ink-400 hover:text-ink-600'
          }`}
        >
          {i.icone}
          {i.rotulo}
        </button>
      );
    })}
  </div>
);

/* ═════════════════════════════════ Avatar ══════════════════════════════════ */

const PALETA_AVATAR = [
  'bg-brand-600', 'bg-verde-600', 'bg-ink-600', 'bg-sky-700', 'bg-violet-600', 'bg-amber-600', 'bg-rose-600', 'bg-teal-700',
];

export const Avatar: React.FC<{ nome: string; tamanho?: number; className?: string; anel?: boolean }> = ({
  nome, tamanho = 38, className = '', anel,
}) => {
  const idx = Array.from(nome).reduce((a, c) => a + c.charCodeAt(0), 0) % PALETA_AVATAR.length;
  return (
    <div
      className={`${PALETA_AVATAR[idx]} text-white font-bold grid place-items-center rounded-full flex-none ${anel ? 'ring-2 ring-white' : ''} ${className}`}
      style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.36 }}
      title={nome}
    >
      {iniciais(nome)}
    </div>
  );
};

/* ═════════════════════════════════ Vazio ═══════════════════════════════════ */

export const Vazio: React.FC<{ titulo: string; texto?: string; icone?: React.ReactNode; accao?: React.ReactNode }> = ({
  titulo, texto, icone, accao,
}) => (
  <div className="text-center py-12 px-6">
    <div className="w-14 h-14 rounded-2xl bg-ink-50 text-ink-300 grid place-items-center mx-auto mb-4">
      {icone ?? <IcInfo className="w-6 h-6" />}
    </div>
    <p className="font-bold text-ink">{titulo}</p>
    {texto && <p className="text-sm text-ink-400 mt-1 max-w-sm mx-auto leading-relaxed">{texto}</p>}
    {accao && <div className="mt-4 flex justify-center">{accao}</div>}
  </div>
);

/* ═════════════════════════════ Campos de forma ═════════════════════════════ */

export const Campo: React.FC<{
  rotulo: React.ReactNode;
  children: React.ReactNode;
  nota?: React.ReactNode;
  obrigatorio?: boolean;
  className?: string;
}> = ({ rotulo, children, nota, obrigatorio, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="block text-[11px] font-extrabold uppercase tracking-[0.1em] text-ink-400 mb-1.5">
      {rotulo}
      {obrigatorio && <span className="text-brand-600 ml-1">*</span>}
    </span>
    {children}
    {nota && <span className="block text-[11.5px] text-ink-300 mt-1.5 leading-snug">{nota}</span>}
  </label>
);

const baseInput =
  'w-full bg-white border border-ink-200 rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-ink-300 transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none';

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...r }) => (
  <input {...r} className={`${baseInput} ${className}`} />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', children, ...r }) => (
  <select {...r} className={`${baseInput} appearance-none pr-9 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%235C6779%22 stroke-width=%222%22 stroke-linecap=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-no-repeat bg-[right_0.7rem_center] bg-[length:1rem] ${className}`}>
    {children}
  </select>
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = '', ...r }) => (
  <textarea {...r} className={`${baseInput} resize-y min-h-[90px] leading-relaxed ${className}`} />
);

export const Escolha: React.FC<{
  itens: { id: string; rotulo: string; nota?: string; icone?: React.ReactNode }[];
  valor: string;
  onMudar: (id: string) => void;
  colunas?: number;
}> = ({ itens, valor, onMudar, colunas = 1 }) => (
  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))` }}>
    {itens.map((i) => {
      const on = i.id === valor;
      return (
        <button
          key={i.id}
          type="button"
          onClick={() => onMudar(i.id)}
          className={`text-left flex items-start gap-3 p-3 rounded-xl border transition-all ${
            on ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-100' : 'border-ink-200 hover:border-ink-300 bg-white'
          }`}
        >
          <span
            className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-none grid place-items-center ${
              on ? 'border-brand-600' : 'border-ink-200'
            }`}
          >
            {on && <span className="w-2 h-2 rounded-full bg-brand-600" />}
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-[13.5px] font-bold text-ink">{i.icone}{i.rotulo}</span>
            {i.nota && <span className="block text-[12px] text-ink-400 mt-0.5 leading-snug">{i.nota}</span>}
          </span>
        </button>
      );
    })}
  </div>
);

export const Interruptor: React.FC<{ activo: boolean; onMudar: (v: boolean) => void; rotulo?: string }> = ({
  activo, onMudar, rotulo,
}) => (
  <button
    type="button"
    onClick={() => onMudar(!activo)}
    className="inline-flex items-center gap-2.5"
    aria-pressed={activo}
  >
    <span className={`w-10 h-6 rounded-full transition-colors relative flex-none ${activo ? 'bg-verde-600' : 'bg-ink-200'}`}>
      <span
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ease-swift ${activo ? 'left-[1.15rem]' : 'left-0.5'}`}
      />
    </span>
    {rotulo && <span className="text-[13px] font-semibold text-ink-600">{rotulo}</span>}
  </button>
);

/* ═════════════════════════════════ Passos ══════════════════════════════════ */

export const Passos: React.FC<{ passos: string[]; actual: number; onIr?: (i: number) => void }> = ({
  passos, actual, onIr,
}) => (
  <ol className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1">
    {passos.map((p, i) => {
      const feito = i < actual;
      const agora = i === actual;
      return (
        <li key={p} className="flex items-center gap-1 sm:gap-2 flex-none">
          <button
            disabled={!onIr || i > actual}
            onClick={() => onIr?.(i)}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all ${
              agora ? 'bg-ink text-white' : feito ? 'text-verde-700 hover:bg-verde-100' : 'text-ink-300'
            } ${!onIr || i > actual ? 'cursor-default' : ''}`}
          >
            <span
              className={`w-5 h-5 rounded-full grid place-items-center text-[10px] font-extrabold flex-none ${
                agora ? 'bg-white/20 text-white' : feito ? 'bg-verde-600 text-white' : 'bg-ink-100 text-ink-400'
              }`}
            >
              {feito ? <IcCheck className="w-3 h-3" /> : i + 1}
            </span>
            <span className="text-[12.5px] font-bold whitespace-nowrap">{p}</span>
          </button>
          {i < passos.length - 1 && <span className={`w-4 sm:w-6 h-px ${feito ? 'bg-verde-300' : 'bg-ink-100'}`} />}
        </li>
      );
    })}
  </ol>
);

/* ══════════════════════════════ Micro-gráfico ══════════════════════════════ */

export const Micrografico: React.FC<{ dados: number[]; cor?: string; altura?: number; preenchido?: boolean }> = ({
  dados, cor = '#E61923', altura = 34, preenchido = true,
}) => {
  if (!dados.length) return null;
  const max = Math.max(...dados, 1);
  const min = Math.min(...dados, 0);
  const amp = max - min || 1;
  const w = 100;
  const pontos = dados.map((v, i) => {
    const x = (i / (dados.length - 1 || 1)) * w;
    const y = altura - ((v - min) / amp) * (altura - 4) - 2;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${altura}`} preserveAspectRatio="none" className="w-full" style={{ height: altura }}>
      {preenchido && (
        <polygon points={`0,${altura} ${pontos.join(' ')} ${w},${altura}`} fill={cor} opacity="0.1" />
      )}
      <polyline points={pontos.join(' ')} fill="none" stroke={cor} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

/* ════════════════════════════════ Alerta ═══════════════════════════════════ */

export const Alerta: React.FC<{
  tom?: 'brand' | 'gold' | 'verde' | 'neutro' | 'azul';
  titulo: React.ReactNode;
  children?: React.ReactNode;
  icone?: React.ReactNode;
  accao?: React.ReactNode;
  base?: string;
}> = ({ tom = 'gold', titulo, children, icone, accao, base }) => {
  const cores: Record<string, string> = {
    brand: 'bg-brand-50 border-brand-200 text-brand-900',
    gold: 'bg-gold-100/70 border-gold-300/70 text-gold-700',
    verde: 'bg-verde-100 border-verde-200 text-verde-900',
    neutro: 'bg-ink-50 border-ink-100 text-ink-600',
    azul: 'bg-sky-50 border-sky-100 text-sky-900',
  };
  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${cores[tom]}`}>
      <span className="flex-none mt-0.5 opacity-80">{icone ?? <IcAviso className="w-4 h-4" />}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-bold leading-snug">{titulo}</p>
        {children && <div className="text-[12.5px] mt-1 leading-relaxed opacity-90">{children}</div>}
        {base && <div className="mt-2"><Lei id={base} /></div>}
      </div>
      {accao && <div className="flex-none">{accao}</div>}
    </div>
  );
};

/* ════════════════════════════════ Tabela ═══════════════════════════════════ */

export const Tabela: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`overflow-x-auto ${className}`}>
    <table className="sgc">{children}</table>
  </div>
);

/* ══════════════════════════ Identidade do Partido ══════════════════════════ */

/**
 * Emblema oficial da FRELIMO — o batuque e a espiga de milho sobre campo
 * vermelho, com as diagonais da bandeira nacional. Apresentado sobre selo
 * branco, como no original impresso.
 */
/** Proporção do emblema original (1280 × 1542). */
const RACIO_EMBLEMA = 1280 / 1542;

export const Emblema: React.FC<{ tamanho?: number; className?: string; selo?: boolean }> = ({
  tamanho = 36, className = '', selo = true,
}) => {
  const largura = Math.round(tamanho * RACIO_EMBLEMA);
  return (
    <span
      className={`inline-grid place-items-center flex-none overflow-hidden ${selo ? 'selo-emblema rounded-md' : ''} ${className}`}
      style={{ width: largura, height: tamanho, padding: selo ? Math.max(1, Math.round(tamanho * 0.05)) : 0 }}
    >
      <img
        src="/frelimo.webp"
        alt="Emblema da FRELIMO"
        width={largura}
        height={tamanho}
        className="w-full h-full object-contain"
        draggable={false}
      />
    </span>
  );
};

/** Faixa com as cores da bandeira nacional — verde, preto, amarelo, vermelho. */
export const FaixaBandeira: React.FC<{ altura?: number; className?: string; arredondada?: boolean }> = ({
  altura = 4, className = '', arredondada,
}) => (
  <div
    className={`faixa-bandeira w-full ${arredondada ? 'rounded-full' : ''} ${className}`}
    style={{ height: altura }}
    aria-hidden="true"
  />
);

export const Marca: React.FC<{ compacto?: boolean; className?: string; escuro?: boolean }> = ({
  compacto, className = '', escuro = true,
}) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <Emblema tamanho={38} />
    {!compacto && (
      <div className="leading-none min-w-0">
        <p className={`text-[15px] font-extrabold tracking-tight ${escuro ? 'text-white' : 'text-ink'}`}>
          SGC <span className={escuro ? 'text-brand-400' : 'text-brand-600'}>·</span> FRELIMO
        </p>
        <p className={`text-[9.5px] font-bold uppercase tracking-[0.16em] mt-1.5 ${escuro ? 'text-white/40' : 'text-ink-400'}`}>
          Gestão da Célula
        </p>
      </div>
    )}
  </div>
);

/* ═══════════════════════════ Linha de definição ════════════════════════════ */

export const Linha: React.FC<{ rotulo: React.ReactNode; children: React.ReactNode; className?: string }> = ({
  rotulo, children, className = '',
}) => (
  <div className={`flex items-baseline justify-between gap-4 py-2 border-b border-ink-100 last:border-0 ${className}`}>
    <span className="text-[12.5px] text-ink-400 font-semibold flex-none">{rotulo}</span>
    <span className="text-[13.5px] text-ink font-semibold text-right min-w-0">{children}</span>
  </div>
);
