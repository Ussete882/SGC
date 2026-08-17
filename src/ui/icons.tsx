import React from 'react';

type P = { className?: string; size?: number };

const S: React.FC<P & { children: React.ReactNode }> = ({ className = 'w-5 h-5', size, children }) => (
  <svg
    className={size ? undefined : className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const IcPainel: React.FC<P> = (p) => (
  <S {...p}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></S>
);
export const IcMembros: React.FC<P> = (p) => (
  <S {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></S>
);
export const IcMoeda: React.FC<P> = (p) => (
  <S {...p}><circle cx="12" cy="12" r="9" /><path d="M15 9.5a3.5 3 0 0 0-3-1.5c-1.7 0-3 .9-3 2s1.3 2 3 2 3 .9 3 2-1.3 2-3 2a3.5 3 0 0 1-3-1.5" /><path d="M12 6v12" /></S>
);
export const IcCalendario: React.FC<P> = (p) => (
  <S {...p}><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M8 3v4M16 3v4M3 10h18" /><path d="M8 14h3M8 17.5h6" /></S>
);
export const IcUrna: React.FC<P> = (p) => (
  <S {...p}><path d="M3 10.5 12 7l9 3.5-9 3.5-9-3.5Z" /><path d="M5 12.5V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6.5" /><path d="M12 14v5" /><path d="M9 3.5h6v3H9z" /></S>
);
export const IcMegafone: React.FC<P> = (p) => (
  <S {...p}><path d="M3 11v2a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1Z" /><path d="M14 8.5a4 4 0 0 1 0 7" /><path d="M17 6a7.5 7.5 0 0 1 0 12" /></S>
);
export const IcPasta: React.FC<P> = (p) => (
  <S {...p}><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.2a2 2 0 0 1 1.5.7l1 1.2a2 2 0 0 0 1.5.6h5.8A2.5 2.5 0 0 1 21 10v7.5A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5Z" /></S>
);
export const IcRelatorio: React.FC<P> = (p) => (
  <S {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h4" /></S>
);
export const IcEscudo: React.FC<P> = (p) => (
  <S {...p}><path d="M12 3 5 6v6c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6Z" /><path d="m9 12 2 2 4-4" /></S>
);
export const IcMapa: React.FC<P> = (p) => (
  <S {...p}><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" /><path d="M9 4v14M15 6v14" /></S>
);
export const IcRede: React.FC<P> = (p) => (
  <S {...p}><circle cx="12" cy="5" r="2.5" /><circle cx="5" cy="19" r="2.5" /><circle cx="19" cy="19" r="2.5" /><path d="M12 7.5V12M12 12 6.5 16.8M12 12l5.5 4.8" /></S>
);
export const IcBusca: React.FC<P> = (p) => (
  <S {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.4-3.4" /></S>
);
export const IcSino: React.FC<P> = (p) => (
  <S {...p}><path d="M18 8a6 6 0 0 0-12 0c0 7-2.5 8-2.5 8h17S18 15 18 8" /><path d="M13.7 20a2 2 0 0 1-3.4 0" /></S>
);
export const IcMais: React.FC<P> = (p) => (<S {...p}><path d="M12 5v14M5 12h14" /></S>);
export const IcFechar: React.FC<P> = (p) => (<S {...p}><path d="M6 6l12 12M18 6 6 18" /></S>);
export const IcCheck: React.FC<P> = (p) => (<S {...p}><path d="m4 12.5 5 5L20 6.5" /></S>);
export const IcSeta: React.FC<P> = (p) => (<S {...p}><path d="M5 12h14M13 6l6 6-6 6" /></S>);
export const IcSetaEsq: React.FC<P> = (p) => (<S {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></S>);
export const IcChevron: React.FC<P> = (p) => (<S {...p}><path d="m9 6 6 6-6 6" /></S>);
export const IcChevronBaixo: React.FC<P> = (p) => (<S {...p}><path d="m6 9 6 6 6-6" /></S>);
export const IcAviso: React.FC<P> = (p) => (
  <S {...p}><path d="M10.3 4.3 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 16.5h.01" /></S>
);
export const IcInfo: React.FC<P> = (p) => (<S {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5h.01" /></S>);
export const IcLei: React.FC<P> = (p) => (
  <S {...p}><path d="M12 3v18" /><path d="M5 7h14" /><path d="M7 7 4 14h6L7 7Z" /><path d="M17 7l-3 7h6l-3-7Z" /><path d="M8 21h8" /></S>
);
export const IcWhatsapp: React.FC<P> = (p) => (
  <S {...p}><path d="M20.5 11.6a8.4 8.4 0 0 1-12.4 7.4L3.5 20.5l1.6-4.4A8.4 8.4 0 1 1 20.5 11.6Z" /><path d="M8.8 9.2c.4 2.4 2.6 4.6 5 5 .8.1 1.4-.5 1.4-1.2l-1.7-.7-.9.8c-1-.5-1.8-1.3-2.3-2.3l.8-.9-.7-1.7c-.7 0-1.3.5-1.6 1Z" /></S>
);
export const IcSms: React.FC<P> = (p) => (
  <S {...p}><path d="M21 12a8 8 0 0 1-8 8H8l-4 2 1-4a8 8 0 1 1 16-6Z" /><path d="M9 12h.01M12.5 12h.01M16 12h.01" /></S>
);
export const IcEmail: React.FC<P> = (p) => (
  <S {...p}><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m3.5 7 8.5 6 8.5-6" /></S>
);
export const IcRelogio: React.FC<P> = (p) => (<S {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 2" /></S>);
export const IcLocal: React.FC<P> = (p) => (
  <S {...p}><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" /><circle cx="12" cy="10" r="2.6" /></S>
);
export const IcImprimir: React.FC<P> = (p) => (
  <S {...p}><path d="M7 8V3h10v5" /><rect x="3" y="8" width="18" height="8" rx="2" /><path d="M7 14h10v7H7z" /></S>
);
export const IcDescarregar: React.FC<P> = (p) => (<S {...p}><path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M4 20h16" /></S>);
export const IcEditar: React.FC<P> = (p) => (
  <S {...p}><path d="M4 20h4l10-10a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m14.5 5.5 4 4" /></S>
);
export const IcTeclado: React.FC<P> = (p) => (
  <S {...p}><rect x="2.5" y="6" width="19" height="12" rx="2.5" /><path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M6 14h12" /></S>
);
export const IcRaio: React.FC<P> = (p) => (<S {...p}><path d="M13 3 5 13.5h5L10 21l8-10.5h-5L13 3Z" /></S>);
export const IcAlvo: React.FC<P> = (p) => (
  <S {...p}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" /></S>
);
export const IcRepor: React.FC<P> = (p) => (
  <S {...p}><path d="M3.5 12a8.5 8.5 0 1 0 2.8-6.3" /><path d="M3 4v5h5" /></S>
);
export const IcSair: React.FC<P> = (p) => (
  <S {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></S>
);
export const IcOlho: React.FC<P> = (p) => (
  <S {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></S>
);
export const IcMenu: React.FC<P> = (p) => (<S {...p}><path d="M4 7h16M4 12h16M4 17h16" /></S>);
export const IcEstrela: React.FC<P> = (p) => (
  <S {...p}><path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1.1 5.8L12 16.9l-5.3 2.7 1.1-5.8-4.3-4.1 5.9-.8L12 3.5Z" /></S>
);
export const IcBalanca: React.FC<P> = IcLei;
export const IcTrocar: React.FC<P> = (p) => (
  <S {...p}><path d="M4 8h13l-3-3M20 16H7l3 3" /></S>
);
export const IcAnexo: React.FC<P> = (p) => (
  <S {...p}><path d="M20 11.5 12.5 19a4.6 4.6 0 0 1-6.5-6.5l7.8-7.8a3.2 3.2 0 0 1 4.5 4.5l-7.8 7.8a1.8 1.8 0 0 1-2.5-2.5l7-7" /></S>
);
export const IcCartao: React.FC<P> = (p) => (
  <S {...p}><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 10h19" /><path d="M6 14.5h4" /></S>
);
export const IcFiltro: React.FC<P> = (p) => (<S {...p}><path d="M3 6h18l-7 8v6l-4-2v-4L3 6Z" /></S>);
