import React, { useEffect, useState } from 'react';
import { Provider, useStore } from './lib/store';
import { Shell } from './layout/Shell';
import { CommandPalette } from './layout/CommandPalette';
import { Emblema, FaixaBandeira, Lei, Pill } from './ui/primitives';
import { IcCheck, IcFechar, IcLei, IcRaio, IcSeta } from './ui/icons';

import { PainelCelula } from './views/PainelCelula';
import { Membros } from './views/Membros';
import { Cotas } from './views/Cotas';
import { Reunioes } from './views/Reunioes';
import { Eleicoes } from './views/Eleicoes';
import { Comunicacao } from './views/Comunicacao';
import { Documentos } from './views/Documentos';
import { RelatorioMensal } from './views/RelatorioMensal';
import { Conformidade } from './views/Conformidade';
import { PainelCirculo } from './views/PainelCirculo';
import { PainelNacional } from './views/PainelNacional';
import { PainelMembro } from './views/PainelMembro';
import { AppVivo } from './vivo/AppVivo';
import { IcUrna } from './ui/icons';

/* ══════════════════════════════════ Toasts ═════════════════════════════════ */

const Toasts: React.FC = () => {
  const { toasts, fecharToast } = useStore();
  const estilos: Record<string, { barra: string; icone: React.ReactNode; fundo: string }> = {
    ok: { barra: 'bg-verde-600', fundo: 'bg-white', icone: <IcCheck className="w-4 h-4 text-verde-600" /> },
    erro: { barra: 'bg-brand-600', fundo: 'bg-white', icone: <IcFechar className="w-4 h-4 text-brand-600" /> },
    info: { barra: 'bg-ink-400', fundo: 'bg-white', icone: <IcRaio className="w-4 h-4 text-ink-400" /> },
    lei: { barra: 'bg-gold-500', fundo: 'bg-white', icone: <IcLei className="w-4 h-4 text-gold-600" /> },
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2.5 w-[min(380px,calc(100vw-2rem))] no-print">
      {toasts.map((t) => {
        const s = estilos[t.tipo];
        return (
          <div key={t.id} className={`relative ${s.fundo} rounded-2xl shadow-lift border border-ink-100 overflow-hidden a-scale`}>
            <span className={`absolute left-0 top-0 bottom-0 w-1 ${s.barra}`} />
            <div className="pl-4 pr-3 py-3.5 flex items-start gap-3">
              <span className="w-7 h-7 rounded-lg bg-ink-50 grid place-items-center flex-none">{s.icone}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold text-ink leading-snug">{t.titulo}</p>
                {t.texto && <p className="text-[12.5px] text-ink-400 mt-0.5 leading-relaxed">{t.texto}</p>}
                {t.base && <div className="mt-2"><Lei id={t.base} /></div>}
              </div>
              <button onClick={() => fecharToast(t.id)} className="w-6 h-6 rounded-md grid place-items-center text-ink-300 hover:text-ink hover:bg-ink-50 flex-none">
                <IcFechar className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ═════════════════════════════ Ecrã de entrada ═════════════════════════════ */

const Entrada: React.FC = () => {
  const { entrar } = useStore();

  const lentes = [
    { id: 'CELULA', t: 'Secretário da Célula', d: 'Membros, cotas, reuniões, actas, eleições, comunicação e o relatório mensal ao Círculo.', v: 'painel' },
    { id: 'CIRCULO', t: 'Comité de Círculo', d: 'Onze Células subordinadas, com vitalidade, cotização e alertas de cada uma.', v: 'circulo' },
    { id: 'NACIONAL', t: 'Administração Central', d: 'Consolidação de todo o País: reuniões realizadas, cotização e adopção do sistema.', v: 'nacional' },
    { id: 'MEMBRO', t: 'Painel do Membro', d: 'Consulta simples: as minhas cotas, as próximas reuniões e os avisos do Secretariado.', v: 'membro' },
  ] as const;

  return (
    <div className="relative min-h-screen hero-bg text-white flex flex-col overflow-hidden">
      <FaixaBandeira altura={5} />
      <div className="absolute inset-0 grid-paper opacity-[0.06] pointer-events-none" />
      <div className="faixa-diagonal absolute -top-20 -right-24 w-80 h-52 opacity-[0.13] rotate-12 pointer-events-none" />

      <div className="relative flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl a-rise">
          <div className="flex flex-col items-center text-center">
            <Emblema tamanho={82} />
            <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-brand-300 mt-5">
              Frente de Libertação de Moçambique
            </p>
            <h1 className="text-[30px] sm:text-[38px] font-extrabold tracking-tight mt-3 leading-tight">
              Sistema de Gestão da Célula
            </h1>
            <p className="text-white/55 text-[14.5px] mt-3 leading-relaxed max-w-xl">
              Membros, cotas, comunicação, reuniões, documentação — e a democracia interna, da Célula ao escalão
              nacional. Ancorado nos Estatutos da FRELIMO e no Manual da Célula.
            </p>
          </div>

          <div className="mt-9">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/35 mb-3 text-center">
              Escolha o perfil de acesso
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lentes.map((l) => (
                <button
                  key={l.id}
                  onClick={() => entrar(l.id as any, l.v)}
                  className="text-left p-4 rounded-2xl bg-white/[0.06] border border-white/12 hover:bg-white hover:border-white transition-all duration-300 ease-swift group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[14.5px] font-bold text-white group-hover:text-ink">{l.t}</p>
                    <IcSeta className="w-4 h-4 text-white/30 group-hover:text-brand-600 flex-none mt-0.5" />
                  </div>
                  <p className="text-[12px] text-white/45 group-hover:text-ink-400 mt-1.5 leading-relaxed">{l.d}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <a
              href="#/votar"
              className="block p-4 rounded-2xl bg-brand-600/15 border border-brand-500/40 hover:bg-brand-600 hover:border-brand-600 transition-all duration-300 ease-swift group"
            >
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-brand-600 group-hover:bg-white text-white group-hover:text-brand-600 grid place-items-center flex-none transition-colors">
                  <IcUrna className="w-5 h-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-bold text-white flex items-center gap-2">
                    Votação em directo
                    <span className="text-[9.5px] font-extrabold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-full bg-white/15 text-white/70">
                      em tempo real
                    </span>
                  </p>
                  <p className="text-[12px] text-white/50 group-hover:text-white/80 mt-1 leading-relaxed">
                    Escrutínio verdadeiro com a sala inteira: cada camarada vota do seu telemóvel, a mesa acompanha a
                    afluência ao segundo e o resultado é apurado e proclamado na hora.
                  </p>
                </div>
                <IcSeta className="w-4 h-4 text-white/30 group-hover:text-white flex-none" />
              </div>
            </a>
          </div>

          <div className="mt-6 rounded-2xl bg-white/[0.05] border border-white/10 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Pill tom="gold" className="!bg-gold-500/15 !text-gold-300 !border-gold-500/30 flex-none">Protótipo funcional</Pill>
            <p className="text-[11.5px] text-white/45 leading-relaxed flex-1">
              Sem base de dados: o cenário de demonstração vive neste navegador e pode ser reposto a qualquer momento.
              Dentro do sistema, use{' '}
              <kbd className="font-mono font-bold bg-white/10 border border-white/15 rounded px-1.5 py-0.5 text-[10.5px] text-white/70">Ctrl K</kbd>{' '}
              para procurar membros, ecrãs e acções.
            </p>
          </div>
        </div>
      </div>

      <div className="relative px-6 py-4 border-t border-white/10 flex items-center justify-between gap-4">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/30">A Luta Continua</p>
        <p className="text-[11px] text-white/25">Agosto de 2026</p>
      </div>
    </div>
  );
};

/* ═══════════════════════════════ Encaminhador ══════════════════════════════ */

const Vistas: React.FC = () => {
  const { vista, lente } = useStore();

  if (lente === 'MEMBRO') return <PainelMembro />;

  switch (vista) {
    case 'painel': return <PainelCelula />;
    case 'conformidade': return <Conformidade />;
    case 'membros': return <Membros />;
    case 'cotas': return <Cotas />;
    case 'reunioes': return <Reunioes />;
    case 'eleicoes': return <Eleicoes />;
    case 'comunicacao': return <Comunicacao />;
    case 'documentos': return <Documentos />;
    case 'relatorio': return <RelatorioMensal />;
    case 'circulo':
    case 'circulo-celulas':
      return <PainelCirculo />;
    case 'nacional':
    case 'nacional-reunioes':
    case 'nacional-provincias':
    case 'nacional-adopcao':
      return <PainelNacional />;
    case 'membro': return <PainelMembro />;
    default:
      return lente === 'CIRCULO' ? <PainelCirculo /> : lente === 'NACIONAL' ? <PainelNacional /> : <PainelCelula />;
  }
};

const Aplicacao: React.FC = () => {
  const { sessao } = useStore();
  const [busca, setBusca] = useState(false);

  useEffect(() => {
    const tecla = (ev: KeyboardEvent) => {
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
        ev.preventDefault();
        setBusca((v) => !v);
      }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, []);

  if (!sessao) {
    return (
      <>
        <Entrada />
        <Toasts />
      </>
    );
  }

  return (
    <>
      <Shell onBusca={() => setBusca(true)}>
        <Vistas />
      </Shell>
      <CommandPalette aberto={busca} onFechar={() => setBusca(false)} />
      <Toasts />
    </>
  );
};

/* A votação em directo é uma superfície à parte: dados reais, vindos do
   servidor, e não o cenário de demonstração. Vive em `#/votar…`. */
const ehVotacaoVivo = () => window.location.hash.startsWith('#/votar');

const App: React.FC = () => {
  const [vivo, setVivo] = useState(ehVotacaoVivo);

  useEffect(() => {
    const mudou = () => setVivo(ehVotacaoVivo());
    window.addEventListener('hashchange', mudou);
    return () => window.removeEventListener('hashchange', mudou);
  }, []);

  if (vivo) return <AppVivo />;

  return (
    <Provider>
      <Aplicacao />
    </Provider>
  );
};

export default App;
