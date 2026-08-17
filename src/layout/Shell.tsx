import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { avisos as calcAvisos, calcularIVO, membrosDaCelula, totaisNacionais } from '../lib/selectors';
import { compacto, dataLonga, nomeCurto } from '../lib/format';
import { Avatar, Btn, Emblema, FaixaBandeira, Lei, Marca, Pill } from '../ui/primitives';
import {
  IcAviso, IcBusca, IcCalendario, IcEscudo, IcFechar, IcMapa, IcMegafone, IcMembros, IcMenu,
  IcMoeda, IcPainel, IcPasta, IcRaio, IcRede, IcRelatorio, IcRepor, IcSair, IcSino, IcTeclado, IcUrna,
} from '../ui/icons';
import type { Lente } from '../lib/types';

export interface ItemNav {
  id: string;
  rotulo: string;
  icone: React.ReactNode;
  grupo: string;
  params?: Record<string, string>;
  badge?: number;
}

export const LENTES: { id: Lente; rotulo: string; curto: string; nota: string }[] = [
  { id: 'CELULA', rotulo: 'Secretário da Célula', curto: 'Célula', nota: 'Gestão completa da sua Célula' },
  { id: 'CIRCULO', rotulo: 'Comité de Círculo', curto: 'Círculo', nota: 'Supervisão das Células subordinadas' },
  { id: 'NACIONAL', rotulo: 'Administração Central', curto: 'Nacional', nota: 'Consolidação de todo o País' },
  { id: 'MEMBRO', rotulo: 'Painel do Membro', curto: 'Membro', nota: 'Consulta, sem funções administrativas' },
];

export function navPara(lente: Lente, contagens: Record<string, number>): ItemNav[] {
  if (lente === 'CELULA') {
    return [
      { id: 'painel', rotulo: 'Painel da Célula', icone: <IcPainel className="w-5 h-5" />, grupo: 'Direcção' },
      { id: 'conformidade', rotulo: 'Conformidade', icone: <IcEscudo className="w-5 h-5" />, grupo: 'Direcção', badge: contagens.desconforme },
      { id: 'membros', rotulo: 'Membros', icone: <IcMembros className="w-5 h-5" />, grupo: 'Vida orgânica', badge: contagens.membros },
      { id: 'cotas', rotulo: 'Cotas e contas', icone: <IcMoeda className="w-5 h-5" />, grupo: 'Vida orgânica', badge: contagens.emFalta },
      { id: 'reunioes', rotulo: 'Reuniões e actas', icone: <IcCalendario className="w-5 h-5" />, grupo: 'Vida orgânica' },
      { id: 'eleicoes', rotulo: 'Eleições e mandatos', icone: <IcUrna className="w-5 h-5" />, grupo: 'Democracia interna', badge: contagens.eleicoes },
      { id: 'vivo', rotulo: 'Votação em directo', icone: <IcRaio className="w-5 h-5" />, grupo: 'Democracia interna' },
      { id: 'comunicacao', rotulo: 'Comunicação', icone: <IcMegafone className="w-5 h-5" />, grupo: 'Apoio' },
      { id: 'documentos', rotulo: 'Documentos', icone: <IcPasta className="w-5 h-5" />, grupo: 'Apoio' },
      { id: 'relatorio', rotulo: 'Relatório mensal', icone: <IcRelatorio className="w-5 h-5" />, grupo: 'Apoio' },
    ];
  }
  if (lente === 'CIRCULO') {
    return [
      { id: 'circulo', rotulo: 'Painel do Círculo', icone: <IcRede className="w-5 h-5" />, grupo: 'Círculo n.º 12' },
      { id: 'circulo-celulas', rotulo: 'Células subordinadas', icone: <IcMembros className="w-5 h-5" />, grupo: 'Círculo n.º 12', params: { tab: 'celulas' } },
      { id: 'eleicoes', rotulo: 'Eleições do escalão', icone: <IcUrna className="w-5 h-5" />, grupo: 'Círculo n.º 12' },
      { id: 'vivo', rotulo: 'Votação em directo', icone: <IcRaio className="w-5 h-5" />, grupo: 'Círculo n.º 12' },
      { id: 'documentos', rotulo: 'Documentos', icone: <IcPasta className="w-5 h-5" />, grupo: 'Apoio' },
    ];
  }
  if (lente === 'NACIONAL') {
    return [
      { id: 'nacional', rotulo: 'Síntese nacional', icone: <IcMapa className="w-5 h-5" />, grupo: 'Do Rovuma ao Maputo' },
      { id: 'nacional-reunioes', rotulo: 'Reuniões no País', icone: <IcCalendario className="w-5 h-5" />, grupo: 'Do Rovuma ao Maputo', params: { tab: 'reunioes' } },
      { id: 'nacional-provincias', rotulo: 'Províncias', icone: <IcRede className="w-5 h-5" />, grupo: 'Do Rovuma ao Maputo', params: { tab: 'provincias' } },
      { id: 'nacional-adopcao', rotulo: 'Adopção do sistema', icone: <IcEscudo className="w-5 h-5" />, grupo: 'Do Rovuma ao Maputo', params: { tab: 'adopcao' } },
      { id: 'documentos', rotulo: 'Documentos normativos', icone: <IcPasta className="w-5 h-5" />, grupo: 'Apoio' },
    ];
  }
  return [{ id: 'membro', rotulo: 'O meu painel', icone: <IcPainel className="w-5 h-5" />, grupo: 'Membro da Célula n.º 7' }];
}

/* ══════════════════════════════════ Rail ═══════════════════════════════════ */

const Rail: React.FC<{ aberto: boolean; onFechar: () => void }> = ({ aberto, onFechar }) => {
  const { e, lente, setLente, vista, irPara, repor, sair } = useStore();
  const av = useMemo(() => calcAvisos(e), [e]);
  const ivo = useMemo(() => calcularIVO(e), [e]);

  const contagens = {
    membros: membrosDaCelula(e).length,
    emFalta: e.membros.filter((m) => m.estado === 'EFECTIVO').length - e.quotas.filter((q) => q.mes === e.hoje.slice(0, 7)).length,
    eleicoes: e.eleicoes.filter((x) => !['HOMOLOGADA', 'ANULADA'].includes(x.fase)).length,
    desconforme: av.filter((a) => a.nivel === 'CRITICO').length,
  };

  const itens = navPara(lente, contagens);
  const grupos = itens.reduce<Record<string, ItemNav[]>>((acc, i) => {
    (acc[i.grupo] ??= []).push(i);
    return acc;
  }, {});

  const perfil = LENTES.find((l) => l.id === lente)!;

  return (
    <>
      {aberto && <div className="fixed inset-0 bg-ink/50 z-40 lg:hidden a-fade" onClick={onFechar} />}
      <aside
        className={`fixed z-50 top-0 left-0 h-full w-[262px] rail-bg text-white flex flex-col transition-transform duration-300 ease-swift ${
          aberto ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* topo */}
        <FaixaBandeira altura={4} />
        <div className="px-4 pt-4 pb-3 flex items-center justify-between">
          <Marca />
          <button onClick={onFechar} className="lg:hidden w-8 h-8 rounded-full grid place-items-center text-white/60 hover:bg-white/10">
            <IcFechar className="w-4 h-4" />
          </button>
        </div>

        {/* selector de lente */}
        <div className="px-3 pb-3">
          <p className="text-[9.5px] font-extrabold uppercase tracking-[0.16em] text-white/30 px-1 mb-1.5">Perfil de acesso</p>
          <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-1 grid grid-cols-2 gap-1">
            {LENTES.map((l) => (
              <button
                key={l.id}
                onClick={() => { setLente(l.id); irPara(navPara(l.id, contagens)[0].id, navPara(l.id, contagens)[0].params); onFechar(); }}
                title={l.nota}
                className={`text-[11.5px] font-bold py-1.5 rounded-xl transition-all ${
                  lente === l.id ? 'bg-white text-ink shadow-sm' : 'text-white/55 hover:text-white hover:bg-white/10'
                }`}
              >
                {l.curto}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-white/35 px-1 mt-2 leading-snug">{perfil.rotulo} — {perfil.nota}</p>
        </div>

        {/* navegação */}
        <nav className="flex-1 overflow-y-auto rail-scroll px-3 pb-3">
          {Object.entries(grupos).map(([grupo, lista]) => (
            <div key={grupo} className="mb-4">
              <p className="text-[9.5px] font-extrabold uppercase tracking-[0.16em] text-white/25 px-2 mb-1.5">{grupo}</p>
              <ul className="space-y-0.5">
                {lista.map((i) => {
                  const on = vista === i.id;
                  return (
                    <li key={i.id}>
                      <button
                        onClick={() => {
                          // A votação em directo é outra superfície da aplicação.
                          if (i.id === 'vivo') { window.location.hash = '#/votar'; onFechar(); return; }
                          irPara(i.id, i.params);
                          onFechar();
                        }}
                        className={`group w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13.5px] font-semibold transition-all duration-200 ${
                          on ? 'bg-white text-ink shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
                        }`}
                      >
                        <span className={on ? 'text-brand-600' : 'text-white/40 group-hover:text-white/70'}>{i.icone}</span>
                        <span className="flex-1 text-left truncate">{i.rotulo}</span>
                        {!!i.badge && (
                          <span className={`text-[10px] tnum font-extrabold px-1.5 py-0.5 rounded-full ${on ? 'bg-ink-100 text-ink-500' : 'bg-white/10 text-white/60'}`}>
                            {i.badge}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* rodapé */}
        <div className="px-3 pb-4 pt-3 border-t border-white/10">
          {lente === 'CELULA' && (
            <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/40">Vitalidade orgânica</p>
                <span className="text-[15px] font-extrabold tnum text-white">{ivo.total}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-1.5 rounded-full transition-all duration-700"
                  style={{
                    width: `${ivo.total}%`,
                    background: ivo.total >= 70 ? 'linear-gradient(90deg,#0FB85E,#45CE86)' : 'linear-gradient(90deg,#F0303A,#F5D400)',
                  }}
                />
              </div>
              <button onClick={() => { irPara('painel'); onFechar(); }} className="text-[11px] text-white/40 hover:text-white mt-2 link-underline">
                Ver decomposição do índice
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 px-1">
            <Avatar nome={lente === 'MEMBRO' ? 'Beatriz Salomão Manjate' : e.membros[0].nome} tamanho={32} />
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-bold text-white truncate">
                {lente === 'MEMBRO' ? 'Beatriz Manjate' : nomeCurto(e.membros[0].nome)}
              </p>
              <p className="text-[10.5px] text-white/40 truncate">{perfil.rotulo}</p>
            </div>
            <button
              onClick={repor}
              title="Repor o cenário de demonstração"
              className="w-8 h-8 rounded-xl grid place-items-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <IcRepor className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => { onFechar(); sair(); }}
            className="mt-2.5 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold text-white/60 border border-white/10 hover:text-white hover:bg-brand-600 hover:border-brand-600 transition-all duration-200"
          >
            <IcSair className="w-4 h-4" />
            Terminar sessão
          </button>
        </div>
      </aside>
    </>
  );
};

/* ═════════════════════════════════ Topbar ══════════════════════════════════ */

const TITULOS: Record<string, { t: string; s: string }> = {
  painel: { t: 'Painel da Célula', s: 'O essencial do dia-a-dia num só ecrã' },
  conformidade: { t: 'Conformidade estatutária', s: 'O que os Estatutos e o Manual exigem, verificado automaticamente' },
  membros: { t: 'Membros da Célula', s: 'Ficha digital, ciclo de filiação e assiduidade' },
  cotas: { t: 'Cotas e contas', s: 'Cobrança, repartição 60/40 e relatório de contas' },
  reunioes: { t: 'Reuniões e actas', s: 'Convocatórias, presenças, decisões e arquivo' },
  eleicoes: { t: 'Eleições e mandatos', s: 'Democracia interna da Célula e do Círculo' },
  comunicacao: { t: 'Comunicação com os membros', s: 'WhatsApp, SMS e email a partir do mesmo ecrã' },
  documentos: { t: 'Documentos', s: 'Actas, relatórios e normativos do Partido' },
  relatorio: { t: 'Relatório mensal ao Círculo', s: 'Gerado a partir dos dados do mês' },
  circulo: { t: 'Painel do Círculo n.º 12', s: 'Onze Células subordinadas' },
  'circulo-celulas': { t: 'Células do Círculo n.º 12', s: 'Velar pelo funcionamento das Células subordinadas' },
  nacional: { t: 'Síntese nacional', s: 'Do Rovuma ao Maputo — consolidação da estrutura celular' },
  'nacional-reunioes': { t: 'Reuniões de Célula no País', s: 'Contagem consolidada de toda a estrutura' },
  'nacional-provincias': { t: 'Províncias', s: 'Desempenho comparado por província' },
  'nacional-adopcao': { t: 'Adopção do sistema', s: 'Implementação faseada, Célula a Célula' },
  membro: { t: 'O meu painel', s: 'Actividades, cotas e avisos da minha Célula' },
};

const Topbar: React.FC<{ onMenu: () => void; onBusca: () => void }> = ({ onMenu, onBusca }) => {
  const { e, vista, lente, irPara } = useStore();
  const [notifAberto, setNotifAberto] = useState(false);
  const av = useMemo(() => calcAvisos(e), [e]);
  const criticos = av.filter((a) => a.nivel === 'CRITICO' || a.nivel === 'ALTO').length;
  const meta = TITULOS[vista] ?? { t: 'SGC', s: '' };
  const nac = useMemo(() => totaisNacionais(e), [e]);

  useEffect(() => {
    if (!notifAberto) return;
    const f = () => setNotifAberto(false);
    window.addEventListener('click', f);
    return () => window.removeEventListener('click', f);
  }, [notifAberto]);

  return (
    <header className="sticky top-0 z-30 bg-white/88 backdrop-blur-xl border-b border-ink-100">
      <FaixaBandeira altura={3} />
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
        <button onClick={onMenu} className="lg:hidden w-9 h-9 rounded-xl grid place-items-center text-ink-500 hover:bg-ink-50">
          <IcMenu className="w-5 h-5" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-[17px] sm:text-[19px] font-extrabold text-ink tracking-tight truncate">{meta.t}</h1>
            {lente === 'MEMBRO' && <Pill tom="azul">apenas consulta</Pill>}
          </div>
          <p className="text-[12px] text-ink-400 truncate hidden sm:block">{meta.s}</p>
        </div>

        {lente === 'NACIONAL' && (
          <div className="hidden xl:flex items-center gap-4 px-4 py-1.5 rounded-2xl bg-ink-50 border border-ink-100">
            <div className="text-right">
              <p className="text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-ink-400">Células no sistema</p>
              <p className="text-[15px] font-extrabold tnum text-ink">{compacto(nac.celulasAderentes)}</p>
            </div>
            <span className="w-px h-7 bg-ink-200" />
            <div className="text-right">
              <p className="text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-ink-400">Reuniões este mês</p>
              <p className="text-[15px] font-extrabold tnum text-verde-700">{compacto(nac.reunioesMes)}</p>
            </div>
          </div>
        )}

        <button
          onClick={onBusca}
          className="hidden md:flex items-center gap-2 pl-3 pr-2 py-2 rounded-xl bg-ink-50 border border-ink-100 text-ink-400 hover:border-ink-200 hover:text-ink-600 transition-all min-w-[190px]"
        >
          <IcBusca className="w-4 h-4" />
          <span className="text-[13px] font-semibold flex-1 text-left">Procurar…</span>
          <kbd className="text-[10px] font-mono font-bold bg-white border border-ink-200 rounded px-1.5 py-0.5 text-ink-400">Ctrl K</kbd>
        </button>
        <button onClick={onBusca} className="md:hidden w-9 h-9 rounded-xl grid place-items-center text-ink-500 hover:bg-ink-50">
          <IcBusca className="w-5 h-5" />
        </button>

        <div className="relative">
          <button
            onClick={(ev) => { ev.stopPropagation(); setNotifAberto((v) => !v); }}
            className="relative w-9 h-9 rounded-xl grid place-items-center text-ink-500 hover:bg-ink-50"
          >
            <IcSino className="w-5 h-5" />
            {criticos > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-brand-600 text-white text-[10px] font-extrabold grid place-items-center a-ping">
                {criticos}
              </span>
            )}
          </button>
          {notifAberto && (
            <div
              className="absolute right-0 top-full mt-2 w-[352px] max-w-[92vw] bg-white rounded-2xl shadow-lift border border-ink-100 overflow-hidden a-scale"
              onClick={(ev) => ev.stopPropagation()}
            >
              <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between bg-ink-50/60">
                <p className="text-[13px] font-extrabold text-ink">Avisos do sistema</p>
                <Pill tom={criticos ? 'brand' : 'verde'}>{av.length} activos</Pill>
              </div>
              <div className="max-h-[62vh] overflow-y-auto divide-y divide-ink-100">
                {av.length === 0 && <p className="px-4 py-8 text-center text-sm text-ink-300">Sem avisos pendentes.</p>}
                {av.map((a) => {
                  const cor = a.nivel === 'CRITICO' ? 'text-brand-600 bg-brand-50' : a.nivel === 'ALTO' ? 'text-gold-600 bg-gold-100' : a.nivel === 'MEDIO' ? 'text-sky-600 bg-sky-50' : 'text-ink-400 bg-ink-50';
                  return (
                    <button
                      key={a.id}
                      onClick={() => { if (a.vista) irPara(a.vista); setNotifAberto(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-ink-50/60 flex items-start gap-3"
                    >
                      <span className={`w-7 h-7 rounded-lg grid place-items-center flex-none ${cor}`}>
                        <IcAviso className="w-4 h-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-bold text-ink leading-snug">{a.titulo}</span>
                        <span className="block text-[12px] text-ink-400 mt-0.5 leading-relaxed">{a.texto}</span>
                        {a.base && <span className="inline-block mt-1.5"><Lei id={a.base} /></span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

/* ══════════════════════════════════ Shell ══════════════════════════════════ */

export const Shell: React.FC<{ children: React.ReactNode; onBusca: () => void }> = ({ children, onBusca }) => {
  const { e } = useStore();
  const [menu, setMenu] = useState(false);

  return (
    <div className="min-h-screen canvas-bg">
      <Rail aberto={menu} onFechar={() => setMenu(false)} />
      <div className="lg:pl-[262px]">
        <Topbar onMenu={() => setMenu(true)} onBusca={onBusca} />
        <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1520px] mx-auto">{children}</main>
        <footer className="px-4 sm:px-6 lg:px-8 pb-8 pt-2 max-w-[1520px] mx-auto">
          <FaixaBandeira altura={3} arredondada className="opacity-80" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4">
            <div className="flex items-start gap-3">
              <Emblema tamanho={34} />
              <div className="text-[11.5px] text-ink-300 leading-relaxed">
                <p className="font-extrabold text-ink-500 tracking-[0.16em] uppercase text-[10px]">
                  Frente de Libertação de Moçambique · A Luta Continua
                </p>
                <p className="flex items-center gap-1.5 mt-0.5">
                  <IcTeclado className="w-3.5 h-3.5" />
                  Protótipo funcional — dados de demonstração em memória, sem base de dados. Cenário a{' '}
                  <strong className="text-ink-400">{dataLonga(e.hoje)}</strong>.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-none">
              <Lei id="art35" texto="Estatutos" />
              <Lei id="manual_agenda" texto="Manual da Célula" />
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export { Btn };
