import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { avisos as calcAvisos, calcularIVO, membrosDaCelula, totaisNacionais } from '../lib/selectors';
import { compacto, nomeCurto } from '../lib/format';
import { Avatar, Btn, Emblema, FaixaBandeira, Lei, Lema, Marca, Pill, Rotulo } from '../ui/primitives';
import {
  IcAviso, IcBusca, IcCalendario, IcChevronBaixo, IcEscudo, IcFechar, IcMapa, IcMegafone, IcMembros,
  IcMenu, IcMoeda, IcPainel, IcPasta, IcRaio, IcRede, IcRelatorio, IcRepor, IcSair, IcSino,
  IcTrocar, IcUrna,
} from '../ui/icons';
import type { Lente } from '../lib/types';

export interface ItemNav {
  id: string;
  rotulo: string;
  icone: React.ReactNode;
  grupo: string;
  nota?: string;
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
      { id: 'painel', rotulo: 'Painel da Célula', nota: 'O essencial num só ecrã', icone: <IcPainel className="w-[18px] h-[18px]" />, grupo: 'Direcção' },
      { id: 'conformidade', rotulo: 'Conformidade', nota: 'O que os Estatutos exigem', icone: <IcEscudo className="w-[18px] h-[18px]" />, grupo: 'Direcção', badge: contagens.desconforme },
      { id: 'membros', rotulo: 'Membros', nota: 'Ficha digital e assiduidade', icone: <IcMembros className="w-[18px] h-[18px]" />, grupo: 'Vida orgânica', badge: contagens.membros },
      { id: 'cotas', rotulo: 'Cotas e contas', nota: 'Cobrança e repartição 60/40', icone: <IcMoeda className="w-[18px] h-[18px]" />, grupo: 'Vida orgânica', badge: contagens.emFalta },
      { id: 'reunioes', rotulo: 'Reuniões e actas', nota: 'Convocatórias, presenças, arquivo', icone: <IcCalendario className="w-[18px] h-[18px]" />, grupo: 'Vida orgânica' },
      { id: 'eleicoes', rotulo: 'Eleições e mandatos', nota: 'Candidaturas, escrutínio, posse', icone: <IcUrna className="w-[18px] h-[18px]" />, grupo: 'Democracia interna', badge: contagens.eleicoes },
      { id: 'delegados', rotulo: 'Fichas de Delegado', nota: 'Impresso oficial da Conferência', icone: <IcRelatorio className="w-[18px] h-[18px]" />, grupo: 'Democracia interna', badge: contagens.fichas },
      { id: 'vivo', rotulo: 'Votação em directo', nota: 'A sala inteira, em tempo real', icone: <IcRaio className="w-[18px] h-[18px]" />, grupo: 'Democracia interna' },
      { id: 'comunicacao', rotulo: 'Comunicação', nota: 'WhatsApp, SMS e email', icone: <IcMegafone className="w-[18px] h-[18px]" />, grupo: 'Apoio' },
      { id: 'documentos', rotulo: 'Documentos', nota: 'Actas, relatórios e normativos', icone: <IcPasta className="w-[18px] h-[18px]" />, grupo: 'Apoio' },
      { id: 'relatorio', rotulo: 'Relatório mensal', nota: 'Gerado a partir do mês', icone: <IcRelatorio className="w-[18px] h-[18px]" />, grupo: 'Apoio' },
    ];
  }
  if (lente === 'CIRCULO') {
    return [
      { id: 'circulo', rotulo: 'Painel do Círculo', nota: 'Vista de conjunto', icone: <IcRede className="w-[18px] h-[18px]" />, grupo: 'Círculo' },
      { id: 'circulo-celulas', rotulo: 'Células subordinadas', nota: 'Vitalidade Célula a Célula', icone: <IcMembros className="w-[18px] h-[18px]" />, grupo: 'Círculo', params: { tab: 'celulas' } },
      { id: 'eleicoes', rotulo: 'Eleições do escalão', nota: 'Conferência e mandatos', icone: <IcUrna className="w-[18px] h-[18px]" />, grupo: 'Círculo' },
      { id: 'vivo', rotulo: 'Votação em directo', nota: 'A sala inteira, em tempo real', icone: <IcRaio className="w-[18px] h-[18px]" />, grupo: 'Círculo' },
      { id: 'documentos', rotulo: 'Documentos', nota: 'Normativos do Partido', icone: <IcPasta className="w-[18px] h-[18px]" />, grupo: 'Apoio' },
    ];
  }
  if (lente === 'NACIONAL') {
    return [
      { id: 'nacional', rotulo: 'Síntese nacional', nota: 'Consolidação da estrutura', icone: <IcMapa className="w-[18px] h-[18px]" />, grupo: 'Do Rovuma ao Maputo' },
      { id: 'nacional-reunioes', rotulo: 'Reuniões no País', nota: 'Contagem consolidada', icone: <IcCalendario className="w-[18px] h-[18px]" />, grupo: 'Do Rovuma ao Maputo', params: { tab: 'reunioes' } },
      { id: 'nacional-provincias', rotulo: 'Províncias', nota: 'Desempenho comparado', icone: <IcRede className="w-[18px] h-[18px]" />, grupo: 'Do Rovuma ao Maputo', params: { tab: 'provincias' } },
      { id: 'nacional-adopcao', rotulo: 'Adopção do sistema', nota: 'Implementação faseada', icone: <IcEscudo className="w-[18px] h-[18px]" />, grupo: 'Do Rovuma ao Maputo', params: { tab: 'adopcao' } },
      { id: 'documentos', rotulo: 'Documentos normativos', nota: 'Estatutos e Manual', icone: <IcPasta className="w-[18px] h-[18px]" />, grupo: 'Apoio' },
    ];
  }
  return [{ id: 'membro', rotulo: 'O meu painel', nota: 'Cotas, reuniões e avisos', icone: <IcPainel className="w-[18px] h-[18px]" />, grupo: 'Membro' }];
}

/* Contagens onde um número quer dizer «trate disto», e não apenas «há tantos».
   Só estas acendem o ponto vermelho na pílula do grupo. */
const EXIGEM_ATENCAO = new Set(['conformidade', 'cotas', 'eleicoes', 'delegados']);

const TITULOS: Record<string, { t: string; s: string }> = {
  painel: { t: 'Painel da Célula', s: 'O essencial do dia-a-dia num só ecrã' },
  conformidade: { t: 'Conformidade estatutária', s: 'O que os Estatutos e o Manual exigem, verificado automaticamente' },
  membros: { t: 'Membros da Célula', s: 'Ficha digital, ciclo de filiação e assiduidade' },
  cotas: { t: 'Cotas e contas', s: 'Cobrança, repartição 60/40 e relatório de contas' },
  reunioes: { t: 'Reuniões e actas', s: 'Convocatórias, presenças, decisões e arquivo' },
  eleicoes: { t: 'Eleições e mandatos', s: 'Democracia interna da Célula e do Círculo' },
  delegados: { t: 'Fichas de Delegado', s: 'Impresso oficial para a Conferência do Círculo' },
  comunicacao: { t: 'Comunicação com os membros', s: 'WhatsApp, SMS e email a partir do mesmo ecrã' },
  documentos: { t: 'Documentos', s: 'Actas, relatórios e normativos do Partido' },
  relatorio: { t: 'Relatório mensal ao Círculo', s: 'Gerado a partir dos dados do mês' },
  circulo: { t: 'Painel do Círculo', s: 'Vista de conjunto das Células subordinadas' },
  'circulo-celulas': { t: 'Células subordinadas', s: 'Velar pelo funcionamento de cada Célula' },
  nacional: { t: 'Síntese nacional', s: 'Do Rovuma ao Maputo — consolidação da estrutura celular' },
  'nacional-reunioes': { t: 'Reuniões de Célula no País', s: 'Contagem consolidada de toda a estrutura' },
  'nacional-provincias': { t: 'Províncias', s: 'Desempenho comparado por província' },
  'nacional-adopcao': { t: 'Adopção do sistema', s: 'Implementação faseada, Célula a Célula' },
  membro: { t: 'O meu painel', s: 'Actividades, cotas e avisos da minha Célula' },
};

/** As contagens que alimentam os sinais da navegação. */
function useContagens() {
  const { e } = useStore();
  return useMemo(() => {
    const av = calcAvisos(e);
    return {
      membros: membrosDaCelula(e).length,
      emFalta: e.membros.filter((m) => m.estado === 'EFECTIVO').length - e.quotas.filter((q) => q.mes === e.hoje.slice(0, 7)).length,
      eleicoes: e.eleicoes.filter((x) => !['HOMOLOGADA', 'ANULADA'].includes(x.fase)).length,
      desconforme: av.filter((a) => a.nivel === 'CRITICO').length,
      fichas: e.fichasDelegado.filter((f) => !f.entregueEm).length,
    };
  }, [e]);
}

/** Só um painel aberto de cada vez — o rato fora e o Esc fecham-no. */
function usePainel() {
  const [aberto, setAberto] = useState<string | null>(null);
  useEffect(() => {
    if (!aberto) return;
    const fechar = () => setAberto(null);
    const esc = (ev: KeyboardEvent) => { if (ev.key === 'Escape') setAberto(null); };
    window.addEventListener('click', fechar);
    window.addEventListener('keydown', esc);
    return () => { window.removeEventListener('click', fechar); window.removeEventListener('keydown', esc); };
  }, [aberto]);
  return [aberto, setAberto] as const;
}

/* ═══════════════════════════════ Peças soltas ══════════════════════════════ */

const Painel: React.FC<{ children: React.ReactNode; className?: string; alinhar?: 'esq' | 'dir' | 'centro' }> = ({
  children, className = '', alinhar = 'centro',
}) => (
  <div
    onClick={(ev) => ev.stopPropagation()}
    className={`absolute top-full mt-3 z-50 rounded-[24px] bg-white shadow-alta ring-1 ring-areia-200 p-2 a-scale ${
      alinhar === 'dir' ? 'right-0' : alinhar === 'esq' ? 'left-0' : 'left-1/2 -translate-x-1/2'
    } ${className}`}
  >
    {children}
  </div>
);

const ItemPainel: React.FC<{ item: ItemNav; activo: boolean; onIr: () => void }> = ({ item, activo, onIr }) => (
  <button
    onClick={onIr}
    className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all duration-200 ease-swift ${
      activo ? 'bg-ink text-white' : 'hover:bg-areia-100'
    }`}
  >
    <span
      className={`w-9 h-9 rounded-xl grid place-items-center flex-none transition-colors ${
        activo ? 'bg-white/15 text-white' : 'bg-areia-200 text-ink-500 group-hover:bg-white group-hover:text-brand-600'
      }`}
    >
      {item.icone}
    </span>
    <span className="min-w-0 flex-1">
      <span className={`block text-[13.5px] font-bold leading-tight ${activo ? 'text-white' : 'text-ink'}`}>
        {item.rotulo}
      </span>
      {item.nota && (
        <span className={`block text-[11.5px] mt-0.5 leading-snug ${activo ? 'text-white/55' : 'text-ink-400'}`}>
          {item.nota}
        </span>
      )}
    </span>
    {!!item.badge && (
      <span
        className={`text-[10.5px] font-extrabold tnum px-2 py-0.5 rounded-full flex-none ${
          activo ? 'bg-white/20 text-white'
          : EXIGEM_ATENCAO.has(item.id) ? 'bg-brand-50 text-brand-700'
          : 'bg-areia-200 text-ink-400'
        }`}
      >
        {item.badge}
      </span>
    )}
  </button>
);

/* ═════════════════════════════ Barra do topo ═══════════════════════════════ */

const BarraTopo: React.FC<{ onBusca: () => void; onMenu: () => void }> = ({ onBusca, onMenu }) => {
  const { e, lente, setLente, vista, irPara, repor, sair } = useStore();
  const [aberto, setAberto] = usePainel();
  const contagens = useContagens();

  const av = useMemo(() => calcAvisos(e), [e]);
  const criticos = av.filter((a) => a.nivel === 'CRITICO' || a.nivel === 'ALTO').length;

  const itens = navPara(lente, contagens);
  const grupos = useMemo(() => {
    const m = new Map<string, ItemNav[]>();
    itens.forEach((i) => m.set(i.grupo, [...(m.get(i.grupo) ?? []), i]));
    return [...m.entries()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lente, contagens]);

  const perfil = LENTES.find((l) => l.id === lente)!;
  const eu = lente === 'MEMBRO' ? 'Beatriz Salomão Manjate' : e.membros[0]?.nome ?? 'Secretariado';

  const navegar = (i: ItemNav) => {
    setAberto(null);
    if (i.id === 'vivo') { window.location.hash = '#/votar'; return; }
    irPara(i.id, i.params);
  };

  return (
    <header className="no-print sticky top-0 z-40">
      {/* O conteúdo passa por baixo: este véu impede que se leia através
          dos intervalos da barra flutuante. */}
      <div className="absolute inset-x-0 -top-3 h-[calc(100%+1.5rem)] bg-gradient-to-b from-areia-100 from-60% via-areia-100/92 to-transparent backdrop-blur-[6px] pointer-events-none" />

      <div className="relative px-3 sm:px-5 lg:px-7 pt-3 pb-1.5">
        <div className="mx-auto max-w-[1520px] rounded-full bg-white shadow-soft ring-1 ring-areia-200/80 pl-3 pr-2 py-1.5 flex items-center gap-2">
          <button
            onClick={() => navegar(itens[0])}
            className="flex-none rounded-full pr-2 hover:opacity-75 transition-opacity"
            title="Início"
          >
            <Marca escuro={false} />
          </button>

          <span className="hidden lg:block w-px h-7 bg-areia-200 flex-none" />

          {/* Os grupos são a estrutura do sistema, dita em quatro palavras. */}
          <nav className="hidden lg:flex flex-1 min-w-0 items-center gap-0.5">
            {grupos.map(([nome, lista]) => {
              const activo = lista.some((i) => i.id === vista);
              const alerta = lista.some((i) => EXIGEM_ATENCAO.has(i.id) && !!i.badge);
              const unico = lista.length === 1;
              const id = `nav:${nome}`;
              return (
                <div key={nome} className="relative">
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      if (unico) return navegar(lista[0]);
                      setAberto(aberto === id ? null : id);
                    }}
                    className={`relative flex items-center gap-1.5 px-3 xl:px-4 py-2 rounded-full text-[12.5px] xl:text-[13px] font-bold whitespace-nowrap transition-all duration-200 ease-swift ${
                      activo ? 'bg-ink text-white'
                      : aberto === id ? 'bg-areia-200 text-ink'
                      : 'text-ink-400 hover:text-ink hover:bg-areia-100'
                    }`}
                  >
                    {nome}
                    {!unico && (
                      <IcChevronBaixo
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${aberto === id ? 'rotate-180' : ''} ${
                          activo ? 'text-white/50' : 'text-ink-300'
                        }`}
                      />
                    )}
                    {alerta && !activo && <span className="absolute top-1.5 right-2.5 w-1.5 h-1.5 rounded-full bg-brand-600" />}
                  </button>
                  {aberto === id && (
                    <Painel alinhar="esq" className="w-[316px]">
                      {lista.map((i) => (
                        <ItemPainel key={i.id} item={i} activo={vista === i.id} onIr={() => navegar(i)} />
                      ))}
                    </Painel>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="flex-1 lg:hidden" />
          <span className="hidden lg:block w-4 flex-none" />

          <button
            onClick={onBusca}
            className="hidden xl:flex flex-none items-center gap-2 pl-3.5 pr-2 py-2 rounded-full bg-areia-100 text-ink-400 hover:bg-areia-200 hover:text-ink transition-all"
          >
            <IcBusca className="w-4 h-4" />
            <span className="text-[13px] font-bold">Procurar</span>
            <kbd className="text-[9.5px] font-mono font-bold bg-white rounded-full px-2 py-0.5 text-ink-300">Ctrl K</kbd>
          </button>
          <button onClick={onBusca} title="Procurar (Ctrl K)" className="xl:hidden flex-none w-9 h-9 rounded-full grid place-items-center text-ink-500 hover:bg-areia-100">
            <IcBusca className="w-[18px] h-[18px]" />
          </button>

          {/* avisos */}
          <div className="relative flex-none">
            <button
              onClick={(ev) => { ev.stopPropagation(); setAberto(aberto === 'avisos' ? null : 'avisos'); }}
              className={`relative w-9 h-9 rounded-full grid place-items-center transition-colors ${
                aberto === 'avisos' ? 'bg-ink text-white' : 'text-ink-500 hover:bg-areia-100'
              }`}
              title="Avisos do sistema"
            >
              <IcSino className="w-[18px] h-[18px]" />
              {criticos > 0 && aberto !== 'avisos' && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-brand-600 text-white text-[10px] font-extrabold grid place-items-center a-ping">
                  {criticos}
                </span>
              )}
            </button>
            {aberto === 'avisos' && (
              <Painel alinhar="dir" className="w-[360px] max-w-[92vw] !p-0 overflow-hidden">
                <div className="px-5 pt-4 pb-3 flex items-center justify-between">
                  <p className="text-[15px] font-extrabold text-ink tracking-[-0.02em]">Avisos do sistema</p>
                  <Pill tom={criticos ? 'brand' : 'verde'}>{av.length} activos</Pill>
                </div>
                <div className="max-h-[62vh] overflow-y-auto px-2 pb-2">
                  {av.length === 0 && <p className="px-4 py-10 text-center text-sm text-ink-300">Sem avisos pendentes.</p>}
                  {av.map((a) => {
                    const cor =
                      a.nivel === 'CRITICO' ? 'text-brand-600 bg-brand-50'
                      : a.nivel === 'ALTO' ? 'text-gold-700 bg-gold-100'
                      : a.nivel === 'MEDIO' ? 'text-sky-600 bg-sky-50'
                      : 'text-ink-400 bg-areia-200';
                    return (
                      <button
                        key={a.id}
                        onClick={() => { if (a.vista) irPara(a.vista); setAberto(null); }}
                        className="w-full text-left px-3 py-3 rounded-2xl hover:bg-areia-100 flex items-start gap-3 transition-colors"
                      >
                        <span className={`w-8 h-8 rounded-xl grid place-items-center flex-none ${cor}`}>
                          <IcAviso className="w-4 h-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-bold text-ink leading-snug">{a.titulo}</span>
                          <span className="block text-[12px] text-ink-400 mt-0.5 leading-relaxed">{a.texto}</span>
                          {a.base && <span className="inline-block mt-2"><Lei id={a.base} /></span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Painel>
            )}
          </div>

          {/* Perfil — é aqui que se troca de lente, porque trocar de lente
              é trocar de quem se é dentro do sistema. */}
          <div className="relative flex-none">
            <button
              onClick={(ev) => { ev.stopPropagation(); setAberto(aberto === 'perfil' ? null : 'perfil'); }}
              className={`flex items-center gap-2 rounded-full pl-1 pr-1 sm:pr-3 py-1 transition-colors ${
                aberto === 'perfil' ? 'bg-areia-200' : 'hover:bg-areia-100'
              }`}
            >
              <Avatar nome={eu} tamanho={30} />
              <span className="hidden sm:block text-left leading-none">
                <span className="block text-[12.5px] font-bold text-ink">{nomeCurto(eu)}</span>
                <span className="block text-[10px] font-bold text-ink-300 mt-1">{perfil.curto}</span>
              </span>
              <IcChevronBaixo className={`hidden sm:block w-3.5 h-3.5 text-ink-300 transition-transform ${aberto === 'perfil' ? 'rotate-180' : ''}`} />
            </button>
            {aberto === 'perfil' && (
              <Painel alinhar="dir" className="w-[300px]">
                <div className="px-3 pt-2 pb-3 flex items-center gap-3">
                  <Avatar nome={eu} tamanho={40} />
                  <div className="min-w-0">
                    <p className="text-[14px] font-extrabold text-ink truncate tracking-[-0.02em]">{eu}</p>
                    <p className="text-[11.5px] text-ink-400 truncate">{perfil.rotulo}</p>
                  </div>
                </div>
                <div className="px-3 pb-1.5"><Rotulo>Perfil de acesso</Rotulo></div>
                <div className="space-y-0.5">
                  {LENTES.map((l) => {
                    const on = l.id === lente;
                    return (
                      <button
                        key={l.id}
                        onClick={() => {
                          setAberto(null);
                          setLente(l.id);
                          const primeiro = navPara(l.id, contagens)[0];
                          irPara(primeiro.id, primeiro.params);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-left transition-colors ${
                          on ? 'bg-ink text-white' : 'hover:bg-areia-100'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full flex-none ${on ? 'bg-brand-500' : 'bg-areia-400'}`} />
                        <span className="min-w-0 flex-1">
                          <span className={`block text-[13px] font-bold leading-tight ${on ? 'text-white' : 'text-ink'}`}>{l.rotulo}</span>
                          <span className={`block text-[11px] mt-0.5 leading-snug ${on ? 'text-white/50' : 'text-ink-400'}`}>{l.nota}</span>
                        </span>
                        {on && <IcTrocar className="w-4 h-4 text-white/40 flex-none" />}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 pt-2 border-t border-areia-200 flex items-center gap-2 px-1 pb-1">
                  <Btn
                    variante="suave"
                    tamanho="sm"
                    icone={<IcRepor className="w-3.5 h-3.5" />}
                    onClick={() => { setAberto(null); repor('REAL'); }}
                    className="flex-1"
                    title="Repor a Célula B — livro em branco"
                  >
                    Repor
                  </Btn>
                  <Btn
                    variante="perigo"
                    tamanho="sm"
                    icone={<IcSair className="w-3.5 h-3.5" />}
                    onClick={() => { setAberto(null); sair(); }}
                    className="flex-1"
                  >
                    Sair
                  </Btn>
                </div>
              </Painel>
            )}
          </div>

          <button onClick={onMenu} className="lg:hidden flex-none w-9 h-9 rounded-full grid place-items-center text-ink-500 hover:bg-areia-100">
            <IcMenu className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </header>
  );
};

/* ═════════════════════ Navegação em ecrã estreito ══════════════════════════ */

const Folha: React.FC<{ aberto: boolean; onFechar: () => void }> = ({ aberto, onFechar }) => {
  const { lente, vista, irPara } = useStore();
  const contagens = useContagens();
  const itens = navPara(lente, contagens);
  const grupos = new Map<string, ItemNav[]>();
  itens.forEach((i) => grupos.set(i.grupo, [...(grupos.get(i.grupo) ?? []), i]));

  useEffect(() => {
    if (!aberto) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [aberto]);

  if (!aberto) return null;
  return (
    <div className="no-print fixed inset-0 z-[70] lg:hidden">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[3px] a-fade" onClick={onFechar} />
      <div className="absolute inset-x-2 top-2 bottom-2 rounded-[28px] bg-white shadow-alta flex flex-col a-scale overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-areia-200">
          <Marca escuro={false} />
          <button onClick={onFechar} className="w-9 h-9 rounded-full grid place-items-center bg-areia-100 text-ink-400 hover:bg-ink hover:text-white transition-colors">
            <IcFechar className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-3">
          {[...grupos.entries()].map(([nome, lista]) => (
            <div key={nome} className="mb-3">
              <div className="px-3 pb-1.5"><Rotulo>{nome}</Rotulo></div>
              {lista.map((i) => (
                <ItemPainel
                  key={i.id}
                  item={i}
                  activo={vista === i.id}
                  onIr={() => {
                    onFechar();
                    if (i.id === 'vivo') { window.location.hash = '#/votar'; return; }
                    irPara(i.id, i.params);
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════ Cabeçalho da página ═══════════════════════════ */

/**
 * O primeiro sítio onde o olho pousa: onde estou (rótulo pequeno), o que é
 * este ecrã (título grande) e para onde posso ir a seguir sem sair daqui
 * (pílulas irmãs, à direita).
 */
const Cabecalho: React.FC = () => {
  const { e, lente, vista, irPara } = useStore();
  const contagens = useContagens();
  const meta = TITULOS[vista] ?? { t: 'SGC', s: '' };
  const nac = useMemo(() => totaisNacionais(e), [e]);
  const ivo = useMemo(() => calcularIVO(e), [e]);

  const itens = navPara(lente, contagens);
  const grupo = itens.find((i) => i.id === vista)?.grupo;
  const irmaos = itens.filter((i) => i.grupo === grupo);

  const contexto =
    lente === 'CELULA' || lente === 'MEMBRO'
      ? `${e.celula.nome} · ${e.circulo.nome}`
      : lente === 'CIRCULO'
        ? `${e.circulo.nome} · ${e.circulo.distrito}`
        : 'Frente de Libertação de Moçambique';

  return (
    <div className="pt-8 pb-7">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 mb-4 a-fade">
            <span className="w-5 h-[3px] rounded-full bg-brand-600 flex-none" />
            <Rotulo className="!text-ink-400 truncate">{contexto}</Rotulo>
            {lente === 'MEMBRO' && <Pill tom="azul">apenas consulta</Pill>}
          </div>
          <h1 className="display text-ink text-[clamp(30px,4.4vw,46px)] a-revelar d1">{meta.t}</h1>
          {meta.s && <p className="text-[14px] text-ink-400 mt-3.5 max-w-2xl leading-relaxed a-rise d2">{meta.s}</p>}
        </div>

        <div className="flex flex-col items-start lg:items-end gap-3 flex-none">
          {lente === 'NACIONAL' && (
            <div className="flex items-center gap-5 px-5 py-2.5 rounded-full bg-white shadow-card">
              <div className="text-right">
                <Rotulo>Células</Rotulo>
                <p className="text-[17px] font-extrabold tnum text-ink leading-none mt-1.5">{compacto(nac.celulasAderentes)}</p>
              </div>
              <span className="w-px h-8 bg-areia-200" />
              <div className="text-right">
                <Rotulo>Reuniões/mês</Rotulo>
                <p className="text-[17px] font-extrabold tnum text-verde-700 leading-none mt-1.5">{compacto(nac.reunioesMes)}</p>
              </div>
            </div>
          )}
          {lente === 'CELULA' && (
            <button
              onClick={() => irPara('painel')}
              className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white shadow-card hover:shadow-soft transition-shadow"
              title="Ver a decomposição do índice"
            >
              <div className="text-left">
                <Rotulo>Vitalidade orgânica</Rotulo>
                <div className="flex items-center gap-2.5 mt-1.5">
                  <span className="text-[17px] font-extrabold tnum leading-none text-ink">{ivo.total}</span>
                  <span className="block w-16 h-1.5 rounded-full bg-areia-300 overflow-hidden">
                    <span
                      className="block h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${ivo.total}%`,
                        background: ivo.total >= 70 ? 'linear-gradient(90deg,#0FB85E,#45CE86)' : 'linear-gradient(90deg,#F0303A,#F5D400)',
                      }}
                    />
                  </span>
                </div>
              </div>
            </button>
          )}

          {irmaos.length > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap lg:justify-end">
              {irmaos.map((i) => {
                const on = i.id === vista;
                return (
                  <button
                    key={i.id}
                    onClick={() => {
                      if (i.id === 'vivo') { window.location.hash = '#/votar'; return; }
                      irPara(i.id, i.params);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[12.5px] font-bold whitespace-nowrap transition-all duration-200 ease-swift ${
                      on ? 'bg-ink text-white' : 'bg-white text-ink-500 shadow-card hover:text-ink hover:shadow-soft'
                    }`}
                  >
                    <span className={on ? 'text-white/70' : 'text-ink-300'}>{i.icone}</span>
                    {i.rotulo}
                    {!!i.badge && EXIGEM_ATENCAO.has(i.id) && (
                      <span className={`text-[10px] font-extrabold tnum px-1.5 py-0.5 rounded-full ${on ? 'bg-white/20' : 'bg-brand-50 text-brand-700'}`}>
                        {i.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════ Shell ══════════════════════════════════ */

export const Shell: React.FC<{ children: React.ReactNode; onBusca: () => void }> = ({ children, onBusca }) => {
  const { vista } = useStore();
  const [menu, setMenu] = useState(false);

  return (
    <div className="min-h-screen canvas-bg">
      {/* A assinatura do Partido, a coroar o ecrã inteiro */}
      <FaixaBandeira altura={3} animada className="no-print fixed top-0 inset-x-0 z-[60]" />

      <BarraTopo onBusca={onBusca} onMenu={() => setMenu(true)} />
      <Folha aberto={menu} onFechar={() => setMenu(false)} />

      <main className="px-4 sm:px-6 lg:px-8 pb-10 max-w-[1520px] mx-auto print-largura">
        {/* A chave faz o cabeçalho remontar a cada ecrã, para a entrada
            se repetir — é o que dá a sensação de página nova. */}
        <div className="no-print" key={vista}><Cabecalho /></div>
        {children}
      </main>

      <footer className="no-print px-4 sm:px-6 lg:px-8 pb-10 pt-4 max-w-[1520px] mx-auto">
        <FaixaBandeira altura={3} arredondada className="opacity-70" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pt-5">
          <div className="flex items-start gap-3.5">
            <Emblema tamanho={34} />
            <Lema completo escuro={false} />
          </div>
          <div className="flex items-center gap-2 flex-none">
            <Lei id="art35" texto="Estatutos" />
            <Lei id="manual_agenda" texto="Manual da Célula" />
          </div>
        </div>
      </footer>
    </div>
  );
};

export { Btn };
