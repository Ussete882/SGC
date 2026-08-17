/* Utilitários de formatação e de datas — em português de Moçambique. */

export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const MESES_CURTO = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

/** Constrói uma data local a partir de 'yyyy-mm-dd' (evita o desvio de fuso do Date(string)). */
export function d(iso: string): Date {
  const [y, m, day] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, day || 1);
}

export function iso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function addDays(isoDate: string, n: number): string {
  const dt = d(isoDate);
  dt.setDate(dt.getDate() + n);
  return iso(dt);
}

export function addMonths(isoDate: string, n: number): string {
  const dt = d(isoDate);
  dt.setMonth(dt.getMonth() + n);
  return iso(dt);
}

export function addYears(isoDate: string, n: number): string {
  const dt = d(isoDate);
  dt.setFullYear(dt.getFullYear() + n);
  return iso(dt);
}

export function diffDays(a: string, b: string): number {
  return Math.round((d(a).getTime() - d(b).getTime()) / 86400000);
}

export function mesDe(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function nomeMes(mes: string): string {
  const [y, m] = mes.split('-').map(Number);
  return `${MESES[m - 1]} de ${y}`;
}

export function nomeMesCurto(mes: string): string {
  const [, m] = mes.split('-').map(Number);
  return MESES_CURTO[m - 1];
}

/** 'sáb, 14 de Março' */
export function dataCurta(isoDate: string): string {
  const dt = d(isoDate);
  return `${dt.getDate()} de ${MESES[dt.getMonth()]}`;
}

export function dataLonga(isoDate: string): string {
  const dt = d(isoDate);
  return `${DIAS[dt.getDay()]}, ${dt.getDate()} de ${MESES[dt.getMonth()]} de ${dt.getFullYear()}`;
}

export function dataMedia(isoDate: string): string {
  const dt = d(isoDate);
  return `${String(dt.getDate()).padStart(2, '0')} ${MESES_CURTO[dt.getMonth()]} ${dt.getFullYear()}`;
}

/** Lista dos últimos n meses (yyyy-mm), terminando no mês de `ref`. */
export function ultimosMeses(ref: string, n: number): string[] {
  const out: string[] = [];
  const [y, m] = ref.slice(0, 7).split('-').map(Number);
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(y, m - 1 - i, 1);
    out.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

export function relativo(isoDate: string, hoje: string): string {
  const n = diffDays(isoDate, hoje);
  if (n === 0) return 'hoje';
  if (n === 1) return 'amanhã';
  if (n === -1) return 'ontem';
  if (n > 0) return `em ${n} dias`;
  const a = Math.abs(n);
  if (a < 30) return `há ${a} dias`;
  const meses = Math.round(a / 30);
  if (meses < 12) return `há ${meses} ${meses === 1 ? 'mês' : 'meses'}`;
  const anos = Math.floor(a / 365);
  return `há ${anos} ${anos === 1 ? 'ano' : 'anos'}`;
}

export function anos(nascimento: string | undefined, hoje: string): number | null {
  if (!nascimento) return null;
  return Math.floor(diffDays(hoje, nascimento) / 365.25);
}

// ─────────────────────────────── Números ────────────────────────────────────

const nf0 = new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function num(v: number): string {
  return nf0.format(Math.round(v));
}

export function mt(v: number, comDecimais = false): string {
  return `${comDecimais ? nf2.format(v) : nf0.format(Math.round(v))} MT`;
}

export function compacto(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1).replace('.', ',')} M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1).replace('.', ',')} mil`;
  return num(v);
}

export function pct(v: number, dec = 0): string {
  return `${v.toFixed(dec).replace('.', ',')}%`;
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter((p) => p.length > 2);
  if (partes.length === 0) return nome.slice(0, 2).toUpperCase();
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0];
}

export function nomeCurto(nome: string): string {
  const p = nome.trim().split(/\s+/);
  if (p.length <= 2) return nome;
  return `${p[0]} ${p[p.length - 1]}`;
}

/** Telefone moçambicano formatado: +258 84 123 4567 */
export function telefone(t: string): string {
  const dig = t.replace(/\D/g, '').replace(/^258/, '');
  if (dig.length !== 9) return t;
  return `+258 ${dig.slice(0, 2)} ${dig.slice(2, 5)} ${dig.slice(5)}`;
}

export function uid(prefixo = 'id'): string {
  return `${prefixo}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Gerador pseudo-aleatório determinístico (mulberry32) — cenário estável. */
export function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Remove acentos — usado na busca. */
const DIACRITICOS = new RegExp('[\\u0300-\\u036f]', 'g');

export function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(DIACRITICOS, '')
    .toLowerCase()
    .trim();
}

export function slug(s: string): string {
  return normalizar(s).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
