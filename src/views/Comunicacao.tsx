import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { alertasCotizacao, membrosDaCelula, proximaReuniao, reunioesGerais } from '../lib/selectors';
import { dataMedia, mt, nomeCurto, num, relativo, telefone } from '../lib/format';
import {
  Alerta, Avatar, Btn, Campo, Card, Input, Lei, Modal, Pill, Segmentado, Select, Stat, Textarea, Vazio,
} from '../ui/primitives';
import { IcCheck, IcEmail, IcMegafone, IcSeta, IcSms, IcWhatsapp } from '../ui/icons';
import type { Canal, Segmento } from '../lib/types';

const SEGMENTOS: { id: Segmento; rotulo: string; nota: string }[] = [
  { id: 'TODOS', rotulo: 'Todos os membros', nota: 'Efectivos e candidatos' },
  { id: 'EM_ATRASO', rotulo: 'Membros em atraso', nota: 'Com quota pendente' },
  { id: 'AUSENTES_ULTIMA', rotulo: 'Ausentes na última sessão', nota: 'Justificados e não justificados' },
  { id: 'CANDIDATOS', rotulo: 'Candidatos a membro', nota: 'Em prazo de apreciação' },
  { id: 'ANIVERSARIANTES', rotulo: 'Aniversariantes do mês', nota: 'Primeiro ponto da agenda-tipo' },
  { id: 'SECRETARIADO', rotulo: 'Secretariado', nota: 'Secretário, assistentes e ligação' },
  { id: 'NAO_RECENSEADOS', rotulo: 'Sem cartão de eleitor', nota: 'Dever de militância' },
];

const MODELOS: { id: string; rotulo: string; assunto: string; corpo: (ctx: any) => string; tipo: any; segmento: Segmento }[] = [
  {
    id: 'convocatoria',
    rotulo: 'Convocatória de Reunião Geral',
    assunto: 'Convocatória — Reunião Geral da Célula',
    tipo: 'CONVOCATORIA',
    segmento: 'TODOS',
    corpo: (c) => `Camaradas, convoca-se a Reunião Geral Ordinária da ${c.celula} para ${c.data}, às ${c.hora}, em ${c.local}.\n\nAgenda:\n${c.agenda}\n\nContamos com a presença de todos. O Secretariado.`,
  },
  {
    id: 'quota',
    rotulo: 'Aviso de regularização de quotas',
    assunto: 'Regularização da sua quota',
    tipo: 'AVISO_QUOTA',
    segmento: 'EM_ATRASO',
    corpo: () => 'Camarada, o Secretariado informa que a sua quota se encontra em atraso. As quotas são a principal fonte de receita do Partido e 60% do valor fica na Célula. A regularização pode ser feita junto do Secretariado, em numerário ou em espécie. Contamos consigo.',
  },
  {
    id: 'aniversario',
    rotulo: 'Felicitação de aniversário',
    assunto: 'Parabéns, camarada!',
    tipo: 'ANIVERSARIO',
    segmento: 'ANIVERSARIANTES',
    corpo: () => 'A Célula deseja-lhe um feliz aniversário, muita saúde e continuada dedicação ao Partido e à comunidade.',
  },
  {
    id: 'eleitoral',
    rotulo: 'Abertura de candidaturas',
    assunto: 'Eleição — abertura de candidaturas',
    tipo: 'ELEITORAL',
    segmento: 'TODOS',
    corpo: () => 'Camaradas, estão abertas candidaturas ao cargo em eleição. Qualquer membro pode propor candidatos; o camarada proposto tem de aceitar expressamente. As propostas são entregues ao Secretariado até à data indicada.',
  },
  {
    id: 'recenseamento',
    rotulo: 'Mobilização para o recenseamento',
    assunto: 'Recenseamento eleitoral',
    tipo: 'LIVRE',
    segmento: 'NAO_RECENSEADOS',
    corpo: () => 'Camarada, ser portador de cartão de eleitor actualizado é dever de militância. O posto de recenseamento está aberto no bairro. Conte com o apoio da Célula para o acompanhamento.',
  },
  {
    id: 'ausencia',
    rotulo: 'Acompanhamento de ausências',
    assunto: 'Sentimos a sua falta na última sessão',
    tipo: 'LIVRE',
    segmento: 'AUSENTES_ULTIMA',
    corpo: () => 'Camarada, registámos a sua ausência na última Reunião Geral. A participação nas reuniões da Célula é dever de militância e a sua voz conta nas decisões. Se houver dificuldade, o Secretariado está disponível para ajudar.',
  },
];

const CANAL_META: Record<Canal, { rotulo: string; icone: React.ReactNode; custo: number; nota: string }> = {
  WHATSAPP: { rotulo: 'WhatsApp', icone: <IcWhatsapp className="w-4 h-4" />, custo: 0.6, nota: '~0,01–0,08 USD por conversa' },
  SMS: { rotulo: 'SMS', icone: <IcSms className="w-4 h-4" />, custo: 1.5, nota: '~1–2 MT por mensagem' },
  EMAIL: { rotulo: 'Email', icone: <IcEmail className="w-4 h-4" />, custo: 0, nota: 'sem custo por envio' },
};

export const Comunicacao: React.FC = () => {
  const { e, params, irPara, enviarMensagem } = useStore();
  const [aberto, setAberto] = useState(false);
  const [segmento, setSegmento] = useState<Segmento>('TODOS');
  const [canais, setCanais] = useState<Canal[]>(['WHATSAPP', 'SMS']);
  const [assunto, setAssunto] = useState('');
  const [corpo, setCorpo] = useState('');
  const [tipo, setTipo] = useState<any>('LIVRE');
  const [aba, setAba] = useState<'novo' | 'historico'>('novo');

  useEffect(() => {
    if (params.acao === 'nova') { setAberto(true); if (params.segmento) setSegmento(params.segmento as Segmento); }
  }, [params]);

  const ultima = reunioesGerais(e)[0];
  const atrasos = alertasCotizacao(e).map((a) => a.membro.id);

  const destinatariosDe = (s: Segmento): string[] => {
    const todos = membrosDaCelula(e);
    switch (s) {
      case 'TODOS': return todos.filter((m) => m.estado === 'EFECTIVO' || m.estado === 'CANDIDATO').map((m) => m.id);
      case 'EM_ATRASO': return atrasos;
      case 'AUSENTES_ULTIMA': return ultima ? Object.entries(ultima.presencas).filter(([, v]) => v !== 'PRESENTE').map(([k]) => k) : [];
      case 'CANDIDATOS': return todos.filter((m) => m.estado === 'CANDIDATO').map((m) => m.id);
      case 'ANIVERSARIANTES': return todos.filter((m) => m.dataNascimento?.slice(5, 7) === e.hoje.slice(5, 7)).map((m) => m.id);
      case 'SECRETARIADO': return todos.filter((m) => m.cargo !== 'MEMBRO').map((m) => m.id);
      case 'NAO_RECENSEADOS': return todos.filter((m) => !m.recenseado && m.estado !== 'CESSADO').map((m) => m.id);
      default: return [];
    }
  };

  const destinatarios = useMemo(() => destinatariosDe(segmento), [segmento, e]); // eslint-disable-line react-hooks/exhaustive-deps
  const custo = destinatarios.length * canais.reduce((a, c) => a + CANAL_META[c].custo, 0);

  const aplicarModelo = (id: string) => {
    const mod = MODELOS.find((x) => x.id === id)!;
    const prox = proximaReuniao(e, 'REUNIAO_GERAL');
    setAssunto(mod.assunto);
    setCorpo(mod.corpo({
      celula: e.celula.nome,
      data: prox ? dataMedia(prox.data) : '—',
      hora: prox?.hora ?? '15:00',
      local: prox?.local ?? 'Sede da Célula',
      agenda: (prox?.agenda ?? []).map((p) => `${p.ordem}. ${p.titulo}`).join('\n'),
    }));
    setSegmento(mod.segmento);
    setTipo(mod.tipo);
    setAberto(true);
  };

  const porCanal = (['WHATSAPP', 'SMS', 'EMAIL'] as Canal[]).map((c) => ({
    canal: c,
    membros: membrosDaCelula(e).filter((m) => m.canal === c).length,
  }));

  const totalCusto = e.mensagens.reduce((a, m) => a + m.custoEstimado, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <Stat rotulo="Mensagens enviadas" valor={num(e.mensagens.length)} icone={<IcMegafone className="w-5 h-5" />} nota="Histórico completo por membro" />
        <Stat rotulo="Custo acumulado" valor={mt(totalCusto)} nota="SMS é o maior custo variável" />
        <Stat rotulo="Preferem WhatsApp" valor={num(porCanal[0].membros)} tom="verde" nota={`${porCanal[1].membros} SMS · ${porCanal[2].membros} email`} />
        <Stat rotulo="Última comunicação" valor={e.mensagens[0] ? relativo(e.mensagens[0].enviadaEm, e.hoje) : '—'} nota={e.mensagens[0]?.assunto} />
      </div>

      <Card titulo="Modelos prontos" sub="Cada modelo já traz o segmento e o texto adequados" accao={<Lei id="manual_convocatoria" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {MODELOS.map((m) => (
            <button
              key={m.id}
              onClick={() => aplicarModelo(m.id)}
              className="text-left p-3.5 rounded-xl border border-ink-200 hover:border-brand-300 hover:bg-brand-50/40 transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13.5px] font-bold text-ink leading-snug">{m.rotulo}</p>
                <IcSeta className="w-4 h-4 text-ink-200 group-hover:text-brand-500 flex-none mt-0.5" />
              </div>
              <p className="text-[11.5px] text-ink-400 mt-1">
                {SEGMENTOS.find((s) => s.id === m.segmento)?.rotulo} · {destinatariosDe(m.segmento).length} destinatários
              </p>
            </button>
          ))}
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Segmentado
          itens={[{ id: 'novo', rotulo: 'Audiências' }, { id: 'historico', rotulo: `Histórico (${e.mensagens.length})` }]}
          activo={aba}
          onMudar={(v) => setAba(v as any)}
        />
        <span className="flex-1" />
        <Btn variante="primaria" icone={<IcMegafone className="w-4 h-4" />} onClick={() => setAberto(true)}>Nova mensagem</Btn>
      </div>

      {aba === 'novo' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card titulo="Audiências disponíveis" sub="Calculadas em tempo real a partir dos dados da Célula" pad={false}>
            <ul className="divide-y divide-ink-100">
              {SEGMENTOS.map((s) => {
                const d = destinatariosDe(s.id);
                return (
                  <li key={s.id}>
                    <button
                      onClick={() => { setSegmento(s.id); setAberto(true); }}
                      className="w-full text-left px-5 py-3.5 flex items-center gap-3 hover:bg-ink-50/50"
                      disabled={d.length === 0}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-bold text-ink">{s.rotulo}</p>
                        <p className="text-[11.5px] text-ink-400">{s.nota}</p>
                      </div>
                      <div className="flex -space-x-2 flex-none">
                        {d.slice(0, 4).map((id) => {
                          const m = e.membros.find((x) => x.id === id)!;
                          return <Avatar key={id} nome={m.nome} tamanho={26} anel />;
                        })}
                      </div>
                      <Pill tom={d.length ? 'neutro' : 'verde'}>{d.length}</Pill>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card titulo="Canal preferido de cada membro" sub="A convocatória segue automaticamente pelo canal certo">
            <div className="space-y-4">
              {porCanal.map((c) => (
                <div key={c.canal}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-2 text-[13px] font-bold text-ink-600">
                      {CANAL_META[c.canal].icone}
                      {CANAL_META[c.canal].rotulo}
                    </span>
                    <span className="text-[12px] text-ink-400">{c.membros} membros · {CANAL_META[c.canal].nota}</span>
                  </div>
                  <div className="w-full h-2 bg-ink-100 rounded-full overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-700"
                      style={{
                        width: `${(c.membros / Math.max(1, membrosDaCelula(e).length)) * 100}%`,
                        background: c.canal === 'WHATSAPP' ? '#00A34F' : c.canal === 'SMS' ? '#E61923' : '#3B82F6',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-ink-100">
              <ul className="space-y-2">
                {membrosDaCelula(e).slice(0, 6).map((m) => (
                  <li key={m.id} className="flex items-center gap-2.5 text-[12.5px]">
                    <Avatar nome={m.nome} tamanho={24} />
                    <span className="text-ink-600 flex-1 truncate">{nomeCurto(m.nome)}</span>
                    <span className="text-ink-300 tnum text-[11.5px]">{telefone(m.telefone)}</span>
                    <span className="text-ink-400">{CANAL_META[m.canal].icone}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      )}

      {aba === 'historico' && (
        <Card pad={false} titulo="Histórico de comunicações" sub="Registo automático por membro">
          <ul className="divide-y divide-ink-100">
            {e.mensagens.map((m) => (
              <li key={m.id} className="px-5 py-4">
                <div className="flex items-start gap-3.5">
                  <span className="w-9 h-9 rounded-xl bg-ink-50 text-ink-400 grid place-items-center flex-none">
                    {CANAL_META[m.canais[0]].icone}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13.5px] font-bold text-ink">{m.assunto}</p>
                      <Pill tom={m.tipo === 'CONVOCATORIA' ? 'brand' : m.tipo === 'ELEITORAL' ? 'roxo' : 'neutro'}>{m.tipo.toLowerCase().replace('_', ' ')}</Pill>
                    </div>
                    <p className="text-[12.5px] text-ink-500 mt-1 leading-relaxed line-clamp-2">{m.corpo}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11.5px] text-ink-400">
                      <span>{dataMedia(m.enviadaEm)}</span>
                      <span>· {m.destinatarios.length} destinatários</span>
                      <span>· {m.canais.join(', ')}</span>
                      <span>· custo estimado {mt(m.custoEstimado)}</span>
                    </div>
                  </div>
                  <div className="flex -space-x-2 flex-none">
                    {m.destinatarios.slice(0, 3).map((id) => {
                      const mm = e.membros.find((x) => x.id === id);
                      return mm ? <Avatar key={id} nome={mm.nome} tamanho={26} anel /> : null;
                    })}
                  </div>
                </div>
              </li>
            ))}
            {e.mensagens.length === 0 && <li><Vazio titulo="Sem mensagens" /></li>}
          </ul>
        </Card>
      )}

      {/* compositor */}
      <Modal
        aberto={aberto}
        onFechar={() => { setAberto(false); irPara('comunicacao'); }}
        largura="max-w-3xl"
        titulo="Nova mensagem aos membros"
        sub="Envio individual ou em massa a partir do mesmo ecrã"
        rodape={
          <>
            <span className="text-[12px] text-ink-400 mr-auto">
              {destinatarios.length} destinatários · custo estimado <strong className="text-ink">{mt(custo)}</strong>
            </span>
            <Btn variante="fantasma" onClick={() => { setAberto(false); irPara('comunicacao'); }}>Cancelar</Btn>
            <Btn
              variante="primaria"
              disabled={!assunto || !corpo || destinatarios.length === 0 || canais.length === 0}
              icone={<IcCheck className="w-4 h-4" />}
              onClick={() => {
                enviarMensagem({ canais, segmento, destinatarios, assunto, corpo, tipo });
                setAberto(false);
                setAssunto(''); setCorpo('');
                irPara('comunicacao');
              }}
            >
              Enviar agora
            </Btn>
          </>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 space-y-4">
            <Campo rotulo="Audiência" obrigatorio>
              <Select value={segmento} onChange={(ev) => setSegmento(ev.target.value as Segmento)}>
                {SEGMENTOS.map((s) => (
                  <option key={s.id} value={s.id}>{s.rotulo} ({destinatariosDe(s.id).length})</option>
                ))}
              </Select>
            </Campo>

            <Campo rotulo="Canais" obrigatorio nota="Cada membro recebe pelo canal que indicou como preferido, quando disponível.">
              <div className="flex gap-2">
                {(['WHATSAPP', 'SMS', 'EMAIL'] as Canal[]).map((c) => {
                  const on = canais.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() => setCanais((prev) => (on ? prev.filter((x) => x !== c) : [...prev, c]))}
                      className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-[13px] font-bold transition-all ${
                        on ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-400 hover:border-ink-300'
                      }`}
                    >
                      {CANAL_META[c].icone}
                      {CANAL_META[c].rotulo}
                    </button>
                  );
                })}
              </div>
            </Campo>

            <Campo rotulo="Assunto" obrigatorio>
              <Input value={assunto} onChange={(ev) => setAssunto(ev.target.value)} placeholder="Convocatória — Reunião Geral da Célula" />
            </Campo>

            <Campo rotulo="Mensagem" obrigatorio nota={`${corpo.length} caracteres · ${Math.max(1, Math.ceil(corpo.length / 160))} SMS por destinatário`}>
              <Textarea value={corpo} onChange={(ev) => setCorpo(ev.target.value)} className="min-h-[160px]" placeholder="Camaradas, …" />
            </Campo>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-400 mb-2">Pré-visualização</p>
              <div className="rounded-2xl bg-[#0B141A] p-3 space-y-2">
                <div className="rounded-xl rounded-tl-sm bg-[#005C4B] text-white p-3 ml-4">
                  <p className="text-[12px] font-bold mb-1">{assunto || 'Assunto'}</p>
                  <p className="text-[12px] leading-relaxed whitespace-pre-line opacity-90">{corpo || 'A mensagem aparece aqui…'}</p>
                  <p className="text-[10px] text-white/40 text-right mt-1.5">{e.hoje.slice(8)}/{e.hoje.slice(5, 7)} ✓✓</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-ink-100 p-3">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-400 mb-2">Destinatários</p>
              <ul className="space-y-1.5 max-h-[180px] overflow-y-auto">
                {destinatarios.map((id) => {
                  const m = e.membros.find((x) => x.id === id);
                  if (!m) return null;
                  return (
                    <li key={id} className="flex items-center gap-2 text-[12px]">
                      <Avatar nome={m.nome} tamanho={22} />
                      <span className="text-ink-600 flex-1 truncate">{nomeCurto(m.nome)}</span>
                      <span className="text-ink-300">{CANAL_META[m.canal].icone}</span>
                    </li>
                  );
                })}
                {destinatarios.length === 0 && <li className="text-[12px] text-ink-300">Nenhum membro neste segmento.</li>}
              </ul>
            </div>

            {canais.includes('SMS') && (
              <Alerta tom="gold" titulo="SMS é o maior custo variável">
                Estimativa de 1 a 2 MT por mensagem. Para audiências grandes, privilegie o WhatsApp.
              </Alerta>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
