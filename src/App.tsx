import React, { useEffect, useState } from 'react';
import { Provider, useStore } from './lib/store';
import { Shell } from './layout/Shell';
import { CommandPalette } from './layout/CommandPalette';
import { Emblema, FaixaBandeira, Lei, Lema, Pill, Rotulo, Seta } from './ui/primitives';
import { IcCheck, IcFechar, IcLei, IcRaio } from './ui/icons';

import { PainelCelula } from './views/PainelCelula';
import { Membros } from './views/Membros';
import { Cotas } from './views/Cotas';
import { Reunioes } from './views/Reunioes';
import { Eleicoes } from './views/Eleicoes';
import { Delegados } from './views/Delegados';
import { Comunicacao } from './views/Comunicacao';
import { Documentos } from './views/Documentos';
import { RelatorioMensal } from './views/RelatorioMensal';
import { Conformidade } from './views/Conformidade';
import { PainelCirculo } from './views/PainelCirculo';
import { PainelNacional } from './views/PainelNacional';
import { PainelMembro } from './views/PainelMembro';
import { AppVivo } from './vivo/AppVivo';

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
          <div key={t.id} className={`relative ${s.fundo} rounded-[22px] shadow-alta ring-1 ring-areia-200 overflow-hidden a-scale`}>
            <span className={`absolute left-0 top-0 bottom-0 w-1 ${s.barra}`} />
            <div className="pl-5 pr-3 py-4 flex items-start gap-3">
              <span className="w-8 h-8 rounded-xl bg-areia-100 grid place-items-center flex-none">{s.icone}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold text-ink leading-snug">{t.titulo}</p>
                {t.texto && <p className="text-[12.5px] text-ink-400 mt-1 leading-relaxed">{t.texto}</p>}
                {t.base && <div className="mt-2.5"><Lei id={t.base} /></div>}
              </div>
              <button onClick={() => fecharToast(t.id)} className="w-7 h-7 rounded-full grid place-items-center text-ink-300 hover:text-white hover:bg-ink flex-none transition-colors">
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

  /* A primeira é a porta principal — entra maior e mais escura. As outras
     três são desvios legítimos, mas mais silenciosos. */
  const lentes = [
    {
      id: 'CELULA',
      t: 'Secretário da Célula',
      d: 'Membros, cotas, reuniões, actas, eleições, comunicação e o relatório mensal ao Círculo.',
      v: 'painel',
    },
    { id: 'CIRCULO', t: 'Comité de Círculo', d: 'As Células subordinadas, uma a uma', v: 'circulo' },
    { id: 'NACIONAL', t: 'Administração Central', d: 'Consolidação de todo o País', v: 'nacional' },
    { id: 'MEMBRO', t: 'Painel do Membro', d: 'As minhas cotas e as próximas reuniões', v: 'membro' },
  ] as const;

  const [principal, ...outras] = lentes;

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row bg-areia-100">
      {/* ───────────────────────────── O campo vermelho ─────────────────────
          O vermelho da capa do Manual, sem mais nada em cima: a identidade
          encosta ao topo, o título ao fundo, e o espaço entre os dois é que
          dá a pausa.                                                      */}
      <section className="relative campo-manual vinheta text-white overflow-hidden flex flex-col lg:w-[52%] xl:w-[54%] flex-none min-h-[56vh] lg:min-h-0">
        <div className="absolute inset-0 grid-paper opacity-[0.05] pointer-events-none" />

        {/* identidade, em cima */}
        <div className="relative z-10 flex items-center gap-3 px-6 sm:px-10 pt-8 lg:pt-10">
          <Emblema tamanho={40} />
          <div className="leading-none">
            <p className="text-[19px] font-extrabold tracking-[-0.04em]">SGC</p>
            <p className="text-[8.5px] font-extrabold uppercase tracking-[0.22em] text-white/50 mt-1.5">
              Sistema de Gestão da Célula
            </p>
          </div>
        </div>

        {/* O título encosta ao fundo e entra linha a linha, de trás de uma
            máscara. O lema fecha a sequência, e a bandeira é hasteada por fim. */}
        <div className="relative z-10 mt-auto px-6 sm:px-10 pt-14 pb-8 lg:pb-12">
          <p className="rotulo text-white/50 mb-5 a-fade d1">Frente de Libertação de Moçambique</p>
          <h1 className="display text-white text-[clamp(38px,6.6vw,76px)]">
            <span className="block a-revelar d2">Sistema</span>
            <span className="block a-revelar d3">de Gestão</span>
            <span className="block a-revelar d4 text-white/60">da Célula</span>
          </h1>
          <p className="hidden sm:block text-white/60 text-[14px] mt-6 max-w-md leading-relaxed a-rise d5">
            Membros, cotas, reuniões, documentação — e a democracia interna, da Célula ao escalão nacional. Ancorado
            nos Estatutos da FRELIMO e no Manual da Célula.
          </p>
          <Lema completo className="mt-7 sm:mt-8 a-rise d6" />
        </div>

        <FaixaBandeira altura={5} animada className="relative z-10 d7" />
      </section>

      {/* ───────────────────────────── A entrada ──────────────────────────── */}
      <section className="flex-1 min-w-0 flex flex-col lg:overflow-y-auto">
        <div className="flex items-center justify-between px-6 sm:px-10 pt-8">
          <Pill tom="neutro">Protótipo funcional</Pill>
          {/* Só a inicial: `capitalize` poria maiúscula também no «de». */}
          <p className="text-[11.5px] text-ink-300 first-letter:uppercase">
            {new Date().toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 py-10 max-w-[560px] w-full mx-auto lg:mx-0">
          <Rotulo className="mb-1">Entrar como</Rotulo>
          <p className="text-[15px] text-ink-400 mb-7 leading-relaxed">
            O sistema é o mesmo; muda o que cada perfil pode ver e fazer.
          </p>

          {/* a porta principal */}
          <button
            onClick={() => entrar(principal.id as any, principal.v)}
            className="group text-left w-full rounded-[26px] bg-ink text-white p-6 hover:bg-brand-600 transition-all duration-300 ease-swift a-rise"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[21px] font-extrabold tracking-[-0.03em] leading-tight">{principal.t}</p>
                <p className="text-[13px] text-white/55 group-hover:text-white/80 mt-2.5 leading-relaxed">
                  {principal.d}
                </p>
              </div>
              <Seta tom="claro" tamanho={40} />
            </div>
          </button>

          {/* os desvios */}
          <div className="mt-2.5 space-y-2 stagger">
            {outras.map((l) => (
              <button
                key={l.id}
                onClick={() => entrar(l.id as any, l.v)}
                className="group text-left w-full rounded-[22px] bg-white shadow-card p-4 pl-5 flex items-center justify-between gap-4 hover:bg-gold-500 hover:shadow-soft transition-all duration-300 ease-swift"
              >
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-ink tracking-[-0.02em] leading-tight">{l.t}</p>
                  <p className="text-[12.5px] text-ink-400 group-hover:text-ink-700 mt-1 leading-snug">{l.d}</p>
                </div>
                <Seta tamanho={32} />
              </button>
            ))}
          </div>

          {/* a urna — não é um perfil, é uma sala; por isso vem separada */}
          <div className="mt-8 pt-7 border-t border-areia-300">
            <a
              href="#/votar"
              className="group block rounded-[26px] bg-brand-50 p-6 hover:bg-brand-600 transition-all duration-300 ease-swift"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <span className="relative flex w-2 h-2">
                      <span className="absolute inset-0 rounded-full bg-brand-600 opacity-70 animate-ping" />
                      <span className="relative w-2 h-2 rounded-full bg-brand-600 group-hover:bg-white" />
                    </span>
                    <Rotulo className="!text-brand-700 group-hover:!text-white/70">Em tempo real</Rotulo>
                  </div>
                  <p className="text-[19px] font-extrabold text-ink group-hover:text-white tracking-[-0.03em] leading-tight">
                    Votação em directo
                  </p>
                  <p className="text-[12.5px] text-ink-500 group-hover:text-white/70 mt-2 leading-relaxed">
                    Cada camarada vota do seu telemóvel, a mesa acompanha a afluência ao segundo e o resultado é
                    apurado e proclamado na hora. Não precisa de perfil — basta o código da sala.
                  </p>
                </div>
                <Seta tom="brand" tamanho={40} />
              </div>
            </a>
          </div>
        </div>
      </section>
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
    case 'delegados': return <Delegados />;
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
