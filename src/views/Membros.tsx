import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import {
  assiduidadeDe, completudeFicha, cotizacaoDoMes, mesesEmAtraso, prazoCandidatura, quotaReferencia,
} from '../lib/selectors';
import {
  anos, dataMedia, mesDe, mt, nomeMes, nomeCurto, normalizar, pct, relativo, telefone, ultimosMeses,
} from '../lib/format';
import {
  Alerta, Avatar, Barra, Btn, Campo, Card, Emblema, Escolha, FaixaBandeira, Gaveta, Input,
  Interruptor, Lei, Linha, Modal, Pill, Segmentado, Select, Tabela, Textarea, Vazio,
} from '../ui/primitives';
import {
  IcAviso, IcBusca, IcCartao, IcCheck, IcEmail, IcFiltro, IcMais, IcMembros, IcMoeda, IcSms,
  IcWhatsapp,
} from '../ui/icons';
import type { Canal, EstadoFiliacao, Membro } from '../lib/types';

const ESTADO_TOM: Record<EstadoFiliacao, 'verde' | 'gold' | 'brand' | 'neutro'> = {
  EFECTIVO: 'verde',
  CANDIDATO: 'gold',
  SUSPENSO: 'brand',
  CESSADO: 'neutro',
};

const ESTADO_ROTULO: Record<EstadoFiliacao, string> = {
  EFECTIVO: 'Efectivo',
  CANDIDATO: 'Candidato',
  SUSPENSO: 'Suspenso',
  CESSADO: 'Cessado',
};

const CARGO_ROTULO: Record<string, string> = {
  SECRETARIO: 'Secretária/o da Célula',
  ASSISTENTE: 'Assistente',
  ELEMENTO_LIGACAO: 'Elemento de Ligação',
  MEMBRO: 'Membro',
};

const IconeCanal: React.FC<{ canal: Canal; className?: string }> = ({ canal, className = 'w-4 h-4' }) =>
  canal === 'WHATSAPP' ? <IcWhatsapp className={className} /> : canal === 'SMS' ? <IcSms className={className} /> : <IcEmail className={className} />;

/* ════════════════════════════ Cartão de membro ═════════════════════════════ */

const CartaoMembro: React.FC<{ m: Membro; celula: string }> = ({ m, celula }) => (
  <div
    className="card-sheen relative rounded-2xl text-white overflow-hidden shadow-lift"
    style={{ background: 'linear-gradient(125deg,#3D0A0E 0%,#1A1717 46%,#241F1F 100%)' }}
  >
    <FaixaBandeira altura={5} />
    <span className="absolute top-2 right-0 w-28 h-28 rounded-full bg-brand-600/25 blur-2xl" />
    <span className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-verde-600/20 blur-2xl" />
    <div className="relative p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-brand-300">FRELIMO</p>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-white/40 mt-0.5">Cartão de Membro</p>
        </div>
        <Emblema tamanho={38} />
      </div>
      <p className="text-[17px] font-extrabold mt-5 leading-tight">{m.nome}</p>
      <p className="text-[11.5px] text-white/45 mt-0.5">{celula}</p>
      <div className="flex items-end justify-between gap-4 mt-4">
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-white/35">N.º de cartão</p>
          <p className="font-mono text-[14px] font-bold tracking-wider text-white/90">{m.cartao}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-white/35">Desde</p>
          <p className="font-mono text-[14px] font-bold text-white/90">{m.dataAdmissao.slice(0, 4)}</p>
        </div>
      </div>
    </div>
  </div>
);

/* ═════════════════════════════ Gaveta da ficha ═════════════════════════════ */

const FichaMembro: React.FC<{ m: Membro; onFechar: () => void }> = ({ m, onFechar }) => {
  const { e, irPara, guardarMembro, mudarEstadoMembro, registarQuota } = useStore();
  const [aba, setAba] = useState<'ficha' | 'cotas' | 'assiduidade'>('ficha');
  const [edicao, setEdicao] = useState(false);
  const [rascunho, setRascunho] = useState<Membro>(m);
  const [confirmar, setConfirmar] = useState<null | { estado: EstadoFiliacao; motivo: string }>(null);

  useEffect(() => { setRascunho(m); setEdicao(false); }, [m]);

  const assid = assiduidadeDe(e, m.id);
  const atraso = mesesEmAtraso(e, m.id, e.hoje);
  const refQuota = quotaReferencia(m);
  const prazo = prazoCandidatura(m, e.hoje);
  const idade = anos(m.dataNascimento, e.hoje);
  const historico = ultimosMeses(e.hoje, 12).map((mes) => ({
    mes,
    quota: e.quotas.find((q) => q.membroId === m.id && q.mes === mes),
  }));
  const mandato = e.mandatos.find((x) => x.membroId === m.id && x.estado === 'ACTIVO');

  return (
    <Gaveta
      aberto
      onFechar={onFechar}
      largura="max-w-xl"
      titulo={
        <span className="flex items-center gap-3">
          <Avatar nome={m.nome} tamanho={40} />
          <span className="min-w-0">
            <span className="block truncate">{m.nome}</span>
            <span className="block text-[12px] font-semibold text-ink-400">{CARGO_ROTULO[m.cargo]}</span>
          </span>
        </span>
      }
      rodape={
        <div className="flex items-center gap-2 w-full">
          {edicao ? (
            <>
              <Btn variante="primaria" onClick={() => { guardarMembro(rascunho); setEdicao(false); }}>Guardar ficha</Btn>
              <Btn variante="fantasma" onClick={() => { setRascunho(m); setEdicao(false); }}>Cancelar</Btn>
            </>
          ) : (
            <>
              <Btn variante="contorno" onClick={() => setEdicao(true)}>Editar ficha</Btn>
              {m.estado === 'CANDIDATO' && (
                <Btn variante="sucesso" icone={<IcCheck className="w-4 h-4" />} onClick={() => { mudarEstadoMembro(m.id, 'EFECTIVO'); onFechar(); }}>
                  Admitir na Reunião Geral
                </Btn>
              )}
              {m.estado === 'EFECTIVO' && (
                <Btn variante="perigo" onClick={() => setConfirmar({ estado: 'SUSPENSO', motivo: 'Falta de pagamento de quotas sem motivo justificado' })}>
                  Suspender direitos
                </Btn>
              )}
              {m.estado === 'SUSPENSO' && (
                <Btn variante="sucesso" onClick={() => { mudarEstadoMembro(m.id, 'EFECTIVO'); onFechar(); }}>Reactivar (regularizou)</Btn>
              )}
              <span className="ml-auto" />
              <Btn variante="fantasma" onClick={() => setConfirmar({ estado: 'CESSADO', motivo: '' })}>Cessar filiação</Btn>
            </>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        <CartaoMembro m={m} celula={e.celula.nome} />

        <div className="flex flex-wrap items-center gap-2">
          <Pill tom={ESTADO_TOM[m.estado]} ponto>{ESTADO_ROTULO[m.estado]}</Pill>
          {mandato && <Pill tom="ink">mandato até {mandato.fim.slice(0, 4)}</Pill>}
          {atraso > 0 && <Pill tom={atraso >= 12 ? 'brand' : 'gold'}>{atraso} meses em atraso</Pill>}
          {m.recenseado ? <Pill tom="verde">recenseado</Pill> : <Pill tom="gold">sem cartão de eleitor</Pill>}
          {assid.risco !== 'OK' && <Pill tom="brand">{Math.round(assid.taxaInjustificada)}% faltas injustificadas</Pill>}
        </div>

        {prazo && (
          <Alerta
            tom={prazo.expirado ? 'brand' : prazo.dias <= 20 ? 'gold' : 'azul'}
            titulo={prazo.expirado ? 'Prazo de decisão esgotado' : `${prazo.dias} dias para a Reunião Geral deliberar`}
            base="art8"
          >
            A candidatura foi apresentada em {dataMedia(m.dataAdmissao)}; o prazo máximo de cento e vinte dias termina em {dataMedia(prazo.limite)}.
            A data de ingresso será a data da deliberação.
          </Alerta>
        )}

        {assid.risco === 'CESSACAO' && (
          <Alerta tom="brand" titulo="Risco de cessação de mandato" base="art27n6">
            {assid.injustificado} faltas não justificadas em {assid.convocado} sessões — 50% ou mais implica cessação do mandato dos membros de órgãos.
          </Alerta>
        )}

        <Segmentado
          itens={[
            { id: 'ficha', rotulo: 'Ficha' },
            { id: 'cotas', rotulo: 'Cotização' },
            { id: 'assiduidade', rotulo: 'Assiduidade' },
          ]}
          activo={aba}
          onMudar={(v) => setAba(v as any)}
        />

        {aba === 'ficha' && (
          edicao ? (
            <div className="grid grid-cols-2 gap-3">
              <Campo rotulo="Nome completo" className="col-span-2" obrigatorio>
                <Input value={rascunho.nome} onChange={(ev) => setRascunho({ ...rascunho, nome: ev.target.value })} />
              </Campo>
              <Campo rotulo="Telefone" obrigatorio>
                <Input value={rascunho.telefone} onChange={(ev) => setRascunho({ ...rascunho, telefone: ev.target.value })} />
              </Campo>
              <Campo rotulo="Canal preferido" obrigatorio>
                <Select value={rascunho.canal} onChange={(ev) => setRascunho({ ...rascunho, canal: ev.target.value as Canal })}>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="SMS">SMS</option>
                  <option value="EMAIL">Email</option>
                </Select>
              </Campo>
              <Campo rotulo="Data de nascimento">
                <Input type="date" value={rascunho.dataNascimento ?? ''} onChange={(ev) => setRascunho({ ...rascunho, dataNascimento: ev.target.value })} />
              </Campo>
              <Campo rotulo="Sexo">
                <Select value={rascunho.sexo ?? ''} onChange={(ev) => setRascunho({ ...rascunho, sexo: (ev.target.value || undefined) as any })}>
                  <option value="">—</option>
                  <option value="F">Feminino</option>
                  <option value="M">Masculino</option>
                </Select>
              </Campo>
              <Campo rotulo="Bilhete de Identidade">
                <Input value={rascunho.bi ?? ''} onChange={(ev) => setRascunho({ ...rascunho, bi: ev.target.value })} />
              </Campo>
              <Campo rotulo="NUIT">
                <Input value={rascunho.nuit ?? ''} onChange={(ev) => setRascunho({ ...rascunho, nuit: ev.target.value })} />
              </Campo>
              <Campo rotulo="Profissão / ocupação" className="col-span-2">
                <Input value={rascunho.profissao ?? ''} onChange={(ev) => setRascunho({ ...rascunho, profissao: ev.target.value })} />
              </Campo>
              <Campo rotulo="Rendimento mensal (MT)" nota="Base do cálculo de referência da quota — 1%">
                <Input type="number" value={rascunho.rendimento ?? ''} onChange={(ev) => setRascunho({ ...rascunho, rendimento: Number(ev.target.value) })} />
              </Campo>
              <Campo rotulo="Quarteirão">
                <Input value={rascunho.quarteirao ?? ''} onChange={(ev) => setRascunho({ ...rascunho, quarteirao: ev.target.value })} />
              </Campo>
              <Campo rotulo="Cartão de eleitor">
                <Input value={rascunho.cartaoEleitor ?? ''} onChange={(ev) => setRascunho({ ...rascunho, cartaoEleitor: ev.target.value })} />
              </Campo>
              <div className="flex items-end pb-2">
                <Interruptor activo={!!rascunho.recenseado} onMudar={(v) => setRascunho({ ...rascunho, recenseado: v })} rotulo="Recenseado" />
              </div>
              <Campo rotulo="Notas" className="col-span-2">
                <Textarea value={rascunho.notas ?? ''} onChange={(ev) => setRascunho({ ...rascunho, notas: ev.target.value })} />
              </Campo>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-400">
                    Completude da ficha <Lei id="manual_bd" discreto className="ml-1" />
                  </span>
                  <span className="text-[13px] font-extrabold tnum text-ink">{completudeFicha(m)}%</span>
                </div>
                <Barra valor={completudeFicha(m)} tom={completudeFicha(m) >= 80 ? 'bg-verde-600' : 'bg-gold-500'} />
              </div>
              <Linha rotulo="N.º de cartão">{m.cartao}</Linha>
              <Linha rotulo="Telefone">
                <span className="inline-flex items-center gap-1.5">
                  <IconeCanal canal={m.canal} className="w-3.5 h-3.5 text-ink-300" />
                  {telefone(m.telefone)}
                </span>
              </Linha>
              <Linha rotulo="Canal preferido">{m.canal === 'WHATSAPP' ? 'WhatsApp' : m.canal === 'SMS' ? 'SMS' : 'Email'}</Linha>
              {m.email && <Linha rotulo="Email">{m.email}</Linha>}
              <Linha rotulo="Data de admissão">{dataMedia(m.dataAdmissao)}</Linha>
              <Linha rotulo="Idade">{idade ? `${idade} anos` : '—'}</Linha>
              <Linha rotulo="Sexo">{m.sexo === 'F' ? 'Feminino' : m.sexo === 'M' ? 'Masculino' : '—'}</Linha>
              <Linha rotulo="Bilhete de Identidade">{m.bi ?? '—'}</Linha>
              <Linha rotulo="NUIT">{m.nuit ?? '—'}</Linha>
              <Linha rotulo="Cartão de eleitor">
                {m.cartaoEleitor ? `${m.cartaoEleitor} · válido até ${m.validadeCartaoEleitor ?? '—'}` : 'não recenseado'}
              </Linha>
              <Linha rotulo="Morada">{[m.bairro, m.quarteirao].filter(Boolean).join(', ') || '—'}</Linha>
              <Linha rotulo="Profissão">{m.profissao ?? '—'}</Linha>
              <Linha rotulo="Rendimento declarado">{m.rendimento ? mt(m.rendimento) : '—'}</Linha>
              <Linha rotulo="Quota de referência (1%)">
                <span className="text-brand-700">{mt(refQuota)}</span>
              </Linha>
              {m.suspensoDesde && <Linha rotulo="Suspenso desde">{dataMedia(m.suspensoDesde)}</Linha>}
              {m.motivoSuspensao && <Linha rotulo="Motivo">{m.motivoSuspensao}</Linha>}
              {m.cessadoEm && <Linha rotulo="Cessou em">{dataMedia(m.cessadoEm)}</Linha>}
              {m.motivoCessacao && <Linha rotulo="Motivo da cessação">{m.motivoCessacao}</Linha>}
              {m.notas && (
                <div className="mt-4 p-3 rounded-xl bg-ink-50 border border-ink-100">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-400 mb-1">Notas do Secretariado</p>
                  <p className="text-[13px] text-ink-600 leading-relaxed">{m.notas}</p>
                </div>
              )}
            </div>
          )
        )}

        {aba === 'cotas' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-ink-100 p-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-ink-400">Quota de referência</p>
                <p className="text-[18px] font-extrabold tnum text-ink mt-1">{mt(refQuota)}</p>
              </div>
              <div className="rounded-xl border border-ink-100 p-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-ink-400">Meses em atraso</p>
                <p className={`text-[18px] font-extrabold tnum mt-1 ${atraso >= 12 ? 'text-brand-600' : atraso > 0 ? 'text-gold-600' : 'text-verde-700'}`}>{atraso}</p>
              </div>
              <div className="rounded-xl border border-ink-100 p-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-ink-400">Pago em 12 meses</p>
                <p className="text-[18px] font-extrabold tnum text-ink mt-1">
                  {mt(historico.reduce((a, h) => a + (h.quota?.valor ?? 0), 0))}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-400 mb-2">Últimos doze meses</p>
              <div className="grid grid-cols-6 gap-1.5">
                {historico.map((h) => (
                  <div
                    key={h.mes}
                    title={h.quota ? `${nomeMes(h.mes)}: ${mt(h.quota.valor)} (${h.quota.modalidade === 'ESPECIE' ? 'em espécie' : 'numerário'})` : `${nomeMes(h.mes)}: sem pagamento`}
                    className={`h-11 rounded-lg grid place-items-center text-[10px] font-extrabold border ${
                      h.quota
                        ? h.quota.modalidade === 'ESPECIE'
                          ? 'bg-gold-100 border-gold-300/60 text-gold-700'
                          : 'bg-verde-100 border-verde-200 text-verde-800'
                        : 'bg-brand-50 border-brand-100 text-brand-400'
                    }`}
                  >
                    {h.mes.slice(5)}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-2">
                <span className="text-[10.5px] text-ink-400 flex items-center gap-1"><span className="w-2 h-2 rounded bg-verde-500" />numerário</span>
                <span className="text-[10.5px] text-ink-400 flex items-center gap-1"><span className="w-2 h-2 rounded bg-gold-500" />espécie</span>
                <span className="text-[10.5px] text-ink-400 flex items-center gap-1"><span className="w-2 h-2 rounded bg-brand-300" />sem pagamento</span>
              </div>
            </div>

            {!e.quotas.some((q) => q.membroId === m.id && q.mes === mesDe(e.hoje)) && m.estado !== 'CESSADO' && (
              <Btn
                largo
                variante="primaria"
                icone={<IcMoeda className="w-4 h-4" />}
                onClick={() => registarQuota({ membroId: m.id, mes: mesDe(e.hoje), valor: refQuota, modalidade: 'NUMERARIO' })}
              >
                Registar quota de {nomeMes(mesDe(e.hoje))} — {mt(refQuota)}
              </Btn>
            )}
          </div>
        )}

        {aba === 'assiduidade' && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {[
                { r: 'Convocado', v: assid.convocado, c: 'text-ink' },
                { r: 'Presente', v: assid.presente, c: 'text-verde-700' },
                { r: 'Justificada', v: assid.justificado, c: 'text-gold-600' },
                { r: 'Não justif.', v: assid.injustificado, c: 'text-brand-600' },
              ].map((x) => (
                <div key={x.r} className="rounded-xl border border-ink-100 p-3 text-center">
                  <p className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-ink-400">{x.r}</p>
                  <p className={`text-[20px] font-extrabold tnum mt-0.5 ${x.c}`}>{x.v}</p>
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-400">Taxa de presença</span>
                <span className="text-[13px] font-extrabold tnum text-ink">{pct(assid.taxa)}</span>
              </div>
              <Barra valor={assid.taxa} tom={assid.taxa >= 75 ? 'bg-verde-600' : assid.taxa >= 50 ? 'bg-gold-500' : 'bg-brand-600'} />
            </div>
            <div className="rounded-xl bg-ink-50 border border-ink-100 p-3">
              <p className="text-[12px] text-ink-500 leading-relaxed">
                Faltas não justificadas de 25% implicam aviso; 50% implicam cessação do mandato dos membros de órgãos.
                Actual: <strong className="text-ink">{pct(assid.taxaInjustificada)}</strong>.
                <Lei id="art27n6" className="ml-1.5" />
              </p>
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-400 mb-2">Sessão a sessão</p>
              <ul className="space-y-1">
                {e.reunioes
                  .filter((r) => (r.tipo === 'REUNIAO_GERAL' || r.tipo === 'REUNIAO_GERAL_EXTRA') && r.estado === 'REALIZADA')
                  .slice(0, 8)
                  .map((r) => {
                    const p = r.presencas[m.id];
                    const cor = p === 'PRESENTE' ? 'bg-verde-600' : p === 'JUSTIFICADO' ? 'bg-gold-500' : p === 'INJUSTIFICADO' ? 'bg-brand-600' : 'bg-ink-200';
                    return (
                      <li key={r.id} className="flex items-center gap-2.5 text-[12.5px]">
                        <span className={`w-2 h-2 rounded-full flex-none ${cor}`} />
                        <span className="text-ink-500 flex-1 truncate">{r.titulo}</span>
                        <span className="text-ink-300 tnum">{r.data}</span>
                        <span className="text-ink-400 font-semibold w-20 text-right">
                          {p === 'PRESENTE' ? 'presente' : p === 'JUSTIFICADO' ? 'justificada' : p === 'INJUSTIFICADO' ? 'não justif.' : '—'}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            </div>
          </div>
        )}
      </div>

      <Modal
        aberto={!!confirmar}
        onFechar={() => setConfirmar(null)}
        titulo={confirmar?.estado === 'SUSPENSO' ? 'Suspender direitos do membro' : 'Cessar a qualidade de membro'}
        sub={confirmar?.estado === 'SUSPENSO' ? 'Art. 16 n.º 4 dos Estatutos' : 'Art. 9 dos Estatutos'}
        rodape={
          <>
            <Btn variante="fantasma" onClick={() => setConfirmar(null)}>Cancelar</Btn>
            <Btn
              variante="primaria"
              onClick={() => {
                if (confirmar) mudarEstadoMembro(m.id, confirmar.estado, confirmar.motivo);
                setConfirmar(null);
                onFechar();
              }}
            >
              Confirmar
            </Btn>
          </>
        }
      >
        <div className="space-y-4">
          <Alerta tom="gold" titulo={confirmar?.estado === 'SUSPENSO' ? 'Suspensão por um ano, até à regularização' : 'A cessação é registada com a respectiva causa'} base={confirmar?.estado === 'SUSPENSO' ? 'art16n4' : 'art9'}>
            {confirmar?.estado === 'SUSPENSO'
              ? 'Enquanto suspenso, o membro perde capacidade eleitoral activa e passiva. O sistema exclui-o automaticamente dos cadernos eleitorais.'
              : 'Morte, renúncia, expulsão, filiação em outro partido, candidatura por outro partido ou outra causa impeditiva.'}
          </Alerta>
          <Campo rotulo="Motivo" obrigatorio>
            <Textarea
              value={confirmar?.motivo ?? ''}
              onChange={(ev) => setConfirmar((c) => (c ? { ...c, motivo: ev.target.value } : c))}
              placeholder="Descreva o fundamento da decisão da Reunião Geral…"
            />
          </Campo>
        </div>
      </Modal>
    </Gaveta>
  );
};

/* ═══════════════════════════════ Novo membro ═══════════════════════════════ */

const NovoMembro: React.FC<{ aberto: boolean; onFechar: () => void }> = ({ aberto, onFechar }) => {
  const { novoMembro, e } = useStore();
  const [f, setF] = useState({
    nome: '', telefone: '', canal: 'WHATSAPP' as Canal, dataAdmissao: e.hoje,
    estado: 'CANDIDATO' as EstadoFiliacao, dataNascimento: '', sexo: '', profissao: '',
    rendimento: '', quarteirao: '', recenseado: false, notas: '',
  });
  const idade = f.dataNascimento ? anos(f.dataNascimento, e.hoje) : null;
  const menor = idade !== null && idade < 18;
  const valido = f.nome.trim().length > 3 && f.telefone.replace(/\D/g, '').length >= 9 && !menor;

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      largura="max-w-2xl"
      titulo="Ficha de Membro da Célula"
      sub="Campos essenciais obrigatórios; os adicionais podem ser preenchidos gradualmente"
      rodape={
        <>
          <Btn variante="fantasma" onClick={onFechar}>Cancelar</Btn>
          <Btn
            variante="primaria"
            disabled={!valido}
            onClick={() => {
              novoMembro({
                nome: f.nome,
                telefone: f.telefone,
                canal: f.canal,
                temWhatsapp: f.canal === 'WHATSAPP',
                dataAdmissao: f.dataAdmissao,
                estado: f.estado,
                dataNascimento: f.dataNascimento || undefined,
                sexo: (f.sexo || undefined) as any,
                profissao: f.profissao || undefined,
                rendimento: f.rendimento ? Number(f.rendimento) : undefined,
                bairro: e.celula.bairro,
                quarteirao: f.quarteirao || undefined,
                recenseado: f.recenseado,
                notas: f.notas || undefined,
              });
              onFechar();
            }}
          >
            Registar na base de dados
          </Btn>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Campo rotulo="Nome completo" obrigatorio className="sm:col-span-2">
            <Input value={f.nome} onChange={(ev) => setF({ ...f, nome: ev.target.value })} placeholder="Nome como consta no Bilhete de Identidade" />
          </Campo>
          <Campo rotulo="Contacto telefónico" obrigatorio>
            <Input value={f.telefone} onChange={(ev) => setF({ ...f, telefone: ev.target.value })} placeholder="+258 84 000 0000" />
          </Campo>
          <Campo rotulo="Canal de comunicação preferido" obrigatorio>
            <Select value={f.canal} onChange={(ev) => setF({ ...f, canal: ev.target.value as Canal })}>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="SMS">SMS</option>
              <option value="EMAIL">Email</option>
            </Select>
          </Campo>
        </div>

        <Campo rotulo="Situação de filiação" obrigatorio nota="Uma nova candidatura abre o prazo estatutário de cento e vinte dias para deliberação da Reunião Geral.">
          <Escolha
            colunas={2}
            valor={f.estado}
            onMudar={(v) => setF({ ...f, estado: v as EstadoFiliacao })}
            itens={[
              { id: 'CANDIDATO', rotulo: 'Candidato a membro', nota: 'Pedido apresentado pelo próprio' },
              { id: 'EFECTIVO', rotulo: 'Membro efectivo', nota: 'Transferência de outra Célula ou registo histórico' },
            ]}
          />
        </Campo>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Campo rotulo={f.estado === 'CANDIDATO' ? 'Data da candidatura' : 'Data de admissão'} obrigatorio>
            <Input type="date" value={f.dataAdmissao} onChange={(ev) => setF({ ...f, dataAdmissao: ev.target.value })} />
          </Campo>
          <Campo rotulo="Data de nascimento" nota={menor ? 'Idade mínima de 18 anos (Art. 7).' : undefined}>
            <Input type="date" value={f.dataNascimento} onChange={(ev) => setF({ ...f, dataNascimento: ev.target.value })} className={menor ? '!border-brand-500' : ''} />
          </Campo>
          <Campo rotulo="Sexo">
            <Select value={f.sexo} onChange={(ev) => setF({ ...f, sexo: ev.target.value })}>
              <option value="">—</option>
              <option value="F">Feminino</option>
              <option value="M">Masculino</option>
            </Select>
          </Campo>
          <Campo rotulo="Profissão / ocupação" className="sm:col-span-2">
            <Input value={f.profissao} onChange={(ev) => setF({ ...f, profissao: ev.target.value })} />
          </Campo>
          <Campo rotulo="Rendimento mensal (MT)" nota={f.rendimento ? `Quota de referência: ${mt(Math.max(50, Math.round((Number(f.rendimento) * 0.01) / 5) * 5))}` : '1% do rendimento'}>
            <Input type="number" value={f.rendimento} onChange={(ev) => setF({ ...f, rendimento: ev.target.value })} />
          </Campo>
          <Campo rotulo="Quarteirão">
            <Input value={f.quarteirao} onChange={(ev) => setF({ ...f, quarteirao: ev.target.value })} placeholder="Q. 14" />
          </Campo>
          <div className="flex items-end pb-2 sm:col-span-2">
            <Interruptor activo={f.recenseado} onMudar={(v) => setF({ ...f, recenseado: v })} rotulo="Portador de cartão de eleitor actualizado" />
          </div>
        </div>

        <Campo rotulo="Notas / observações">
          <Textarea value={f.notas} onChange={(ev) => setF({ ...f, notas: ev.target.value })} placeholder="Quem propôs, elementos relevantes para a apreciação…" />
        </Campo>

        {menor && <Alerta tom="brand" titulo="Idade inferior a 18 anos" base="art7">Só pode ser membro quem for maior de 18 anos e estiver no pleno gozo de direitos civis e políticos.</Alerta>}
      </div>
    </Modal>
  );
};

/* ═══════════════════════════════ Vista lista ═══════════════════════════════ */

export const Membros: React.FC = () => {
  const { e, params, irPara } = useStore();
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState<'TODOS' | EstadoFiliacao | 'SECRETARIADO' | 'ATRASO'>('TODOS');
  const [ordem, setOrdem] = useState<'nome' | 'admissao' | 'assiduidade' | 'atraso'>('nome');
  const [modo, setModo] = useState<'tabela' | 'cartoes'>('tabela');
  const [novo, setNovo] = useState(false);
  const [selecionado, setSelecionado] = useState<string | null>(null);

  useEffect(() => {
    if (params.acao === 'novo') setNovo(true);
    if (params.membro) setSelecionado(params.membro);
  }, [params]);

  const mesActual = mesDe(e.hoje);
  const cot = cotizacaoDoMes(e, mesActual);

  const lista = useMemo(() => {
    const nq = normalizar(q);
    let out = e.membros.filter((m) => {
      if (nq && !normalizar(`${m.nome} ${m.cartao} ${m.telefone} ${m.profissao ?? ''} ${m.quarteirao ?? ''}`).includes(nq)) return false;
      if (filtro === 'TODOS') return true;
      if (filtro === 'SECRETARIADO') return m.cargo !== 'MEMBRO';
      if (filtro === 'ATRASO') return mesesEmAtraso(e, m.id, e.hoje) > 0;
      return m.estado === filtro;
    });
    out = [...out].sort((a, b) => {
      if (ordem === 'nome') return a.nome.localeCompare(b.nome);
      if (ordem === 'admissao') return a.dataAdmissao < b.dataAdmissao ? 1 : -1;
      if (ordem === 'assiduidade') return assiduidadeDe(e, b.id).taxa - assiduidadeDe(e, a.id).taxa;
      return mesesEmAtraso(e, b.id, e.hoje) - mesesEmAtraso(e, a.id, e.hoje);
    });
    return out;
  }, [e, q, filtro, ordem]);

  const membro = selecionado ? e.membros.find((m) => m.id === selecionado) : undefined;

  const contagem = {
    TODOS: e.membros.length,
    EFECTIVO: e.membros.filter((m) => m.estado === 'EFECTIVO').length,
    CANDIDATO: e.membros.filter((m) => m.estado === 'CANDIDATO').length,
    SUSPENSO: e.membros.filter((m) => m.estado === 'SUSPENSO').length,
    CESSADO: e.membros.filter((m) => m.estado === 'CESSADO').length,
    SECRETARIADO: e.membros.filter((m) => m.cargo !== 'MEMBRO').length,
    ATRASO: e.membros.filter((m) => mesesEmAtraso(e, m.id, e.hoje) > 0).length,
  };

  const activos = e.membros.filter((m) => m.estado === 'EFECTIVO' || m.estado === 'SUSPENSO').length;

  return (
    <div className="space-y-5">
      {/* barra de dimensão estatutária */}
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center gap-5">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-ink-400">
                Dimensão da Célula <Lei id="art35" className="ml-1" />
              </p>
              <p className="text-[13px] font-bold text-ink">
                <span className="tnum text-[18px]">{activos}</span>
                <span className="text-ink-300"> / 15 membros</span>
              </p>
            </div>
            <div className="relative h-3 bg-ink-100 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-brand-100" style={{ width: `${(5 / 15) * 100}%` }} />
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-swift"
                style={{
                  width: `${(activos / 15) * 100}%`,
                  background: activos < 5 || activos > 15 ? '#E61923' : activos >= 14 ? '#F5D400' : 'linear-gradient(90deg,#00A34F,#0FB85E)',
                }}
              />
              <div className="absolute inset-y-0 left-[33.3%] w-px bg-white/70" />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10.5px] font-bold text-ink-300">mínimo 5</span>
              <span className="text-[10.5px] font-bold text-ink-300">máximo 15</span>
            </div>
          </div>
          <div className="flex gap-3">
            {[
              { r: 'Efectivos', v: contagem.EFECTIVO, c: 'text-verde-700' },
              { r: 'Candidatos', v: contagem.CANDIDATO, c: 'text-gold-600' },
              { r: 'Suspensos', v: contagem.SUSPENSO, c: 'text-brand-600' },
              { r: 'Cessados', v: contagem.CESSADO, c: 'text-ink-300' },
            ].map((x) => (
              <div key={x.r} className="text-center px-3">
                <p className={`text-[24px] font-extrabold tnum leading-none ${x.c}`}>{x.v}</p>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-ink-400 mt-1">{x.r}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="relative flex-1 min-w-0">
          <IcBusca className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            value={q}
            onChange={(ev) => setQ(ev.target.value)}
            placeholder="Procurar por nome, cartão, telefone, profissão ou quarteirão…"
            className="w-full bg-white border border-ink-200 rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filtro} onChange={(ev) => setFiltro(ev.target.value as any)} className="!w-auto !py-2">
            <option value="TODOS">Todos ({contagem.TODOS})</option>
            <option value="EFECTIVO">Efectivos ({contagem.EFECTIVO})</option>
            <option value="CANDIDATO">Candidatos ({contagem.CANDIDATO})</option>
            <option value="SUSPENSO">Suspensos ({contagem.SUSPENSO})</option>
            <option value="CESSADO">Cessados ({contagem.CESSADO})</option>
            <option value="SECRETARIADO">Secretariado ({contagem.SECRETARIADO})</option>
            <option value="ATRASO">Em atraso ({contagem.ATRASO})</option>
          </Select>
          <Select value={ordem} onChange={(ev) => setOrdem(ev.target.value as any)} className="!w-auto !py-2">
            <option value="nome">Ordenar por nome</option>
            <option value="admissao">Admissão mais recente</option>
            <option value="assiduidade">Maior assiduidade</option>
            <option value="atraso">Maior atraso</option>
          </Select>
          <Segmentado
            itens={[{ id: 'tabela', rotulo: 'Tabela' }, { id: 'cartoes', rotulo: 'Cartões' }]}
            activo={modo}
            onMudar={(v) => setModo(v as any)}
          />
          <Btn variante="primaria" icone={<IcMais className="w-4 h-4" />} onClick={() => setNovo(true)}>Novo membro</Btn>
        </div>
      </div>

      {/* conteúdo */}
      {lista.length === 0 ? (
        <Card><Vazio titulo="Sem resultados" texto="Ajuste a procura ou o filtro." icone={<IcFiltro className="w-6 h-6" />} /></Card>
      ) : modo === 'tabela' ? (
        <Card pad={false}>
          <Tabela>
            <thead>
              <tr>
                <th>Membro</th>
                <th>Situação</th>
                <th>Contacto</th>
                <th>Quota {mesActual.slice(5)}</th>
                <th>Assiduidade</th>
                <th>Ficha</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((m) => {
                const a = assiduidadeDe(e, m.id);
                const atraso = mesesEmAtraso(e, m.id, e.hoje);
                const pagou = cot.pagouIds.has(m.id);
                const compl = completudeFicha(m);
                return (
                  <tr key={m.id} className="cursor-pointer" onClick={() => setSelecionado(m.id)}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar nome={m.nome} tamanho={34} />
                        <div className="min-w-0">
                          <p className="font-bold text-ink truncate">{m.nome}</p>
                          <p className="text-[11.5px] text-ink-400 font-mono">{m.cartao}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1 items-start">
                        <Pill tom={ESTADO_TOM[m.estado]} ponto>{ESTADO_ROTULO[m.estado]}</Pill>
                        {m.cargo !== 'MEMBRO' && <span className="text-[11px] font-bold text-ink-500">{CARGO_ROTULO[m.cargo]}</span>}
                      </div>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 text-ink-500">
                        <IconeCanal canal={m.canal} className="w-3.5 h-3.5 text-ink-300" />
                        <span className="tnum text-[12.5px]">{telefone(m.telefone)}</span>
                      </span>
                    </td>
                    <td>
                      {m.estado === 'CANDIDATO' || m.estado === 'CESSADO' ? (
                        <span className="text-ink-300">—</span>
                      ) : pagou ? (
                        <Pill tom="verde"><IcCheck className="w-3 h-3" />paga</Pill>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Pill tom={atraso >= 12 ? 'brand' : 'gold'}>em falta</Pill>
                          {atraso > 1 && <span className="text-[11px] text-ink-400">{atraso}m</span>}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="w-28">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold tnum text-ink-500">{Math.round(a.taxa)}%</span>
                          {a.risco !== 'OK' && <IcAviso className="w-3.5 h-3.5 text-brand-500" />}
                        </div>
                        <Barra valor={a.taxa} alt="h-1.5" tom={a.taxa >= 75 ? 'bg-verde-600' : a.taxa >= 50 ? 'bg-gold-500' : 'bg-brand-600'} />
                      </div>
                    </td>
                    <td>
                      <span className={`text-[12px] font-bold tnum ${compl >= 80 ? 'text-verde-700' : compl >= 60 ? 'text-gold-600' : 'text-ink-300'}`}>{compl}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Tabela>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
          {lista.map((m) => {
            const a = assiduidadeDe(e, m.id);
            const atraso = mesesEmAtraso(e, m.id, e.hoje);
            return (
              <button key={m.id} onClick={() => setSelecionado(m.id)} className="text-left">
                <Card className="h-full lift hover:shadow-lift">
                  <div className="flex items-start gap-3">
                    <Avatar nome={m.nome} tamanho={44} />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-ink leading-tight truncate">{m.nome}</p>
                      <p className="text-[11.5px] text-ink-400 mt-0.5">{CARGO_ROTULO[m.cargo]}</p>
                    </div>
                    <Pill tom={ESTADO_TOM[m.estado]}>{ESTADO_ROTULO[m.estado]}</Pill>
                  </div>
                  <div className="mt-3.5 space-y-2">
                    <div className="flex items-center gap-2 text-[12px] text-ink-500">
                      <IconeCanal canal={m.canal} className="w-3.5 h-3.5 text-ink-300" />
                      <span className="tnum">{telefone(m.telefone)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-ink-400">
                      <IcCartao className="w-3.5 h-3.5 text-ink-300" />
                      <span className="font-mono">{m.cartao}</span>
                      <span className="ml-auto">desde {m.dataAdmissao.slice(0, 4)}</span>
                    </div>
                  </div>
                  <div className="mt-3.5 pt-3 border-t border-ink-100 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-ink-400">Assiduidade</p>
                      <p className="text-[15px] font-extrabold tnum text-ink">{Math.round(a.taxa)}%</p>
                    </div>
                    <div>
                      <p className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-ink-400">Quotas</p>
                      <p className={`text-[15px] font-extrabold tnum ${atraso === 0 ? 'text-verde-700' : atraso >= 12 ? 'text-brand-600' : 'text-gold-600'}`}>
                        {atraso === 0 ? 'em dia' : `${atraso}m`}
                      </p>
                    </div>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      <p className="text-[11.5px] text-ink-300 text-center">
        {lista.length} de {e.membros.length} membros · a base de dados é actualizada regularmente pelo Secretariado
        <Lei id="manual_bd" discreto className="ml-1.5" />
      </p>

      {membro && <FichaMembro m={membro} onFechar={() => { setSelecionado(null); irPara('membros'); }} />}
      <NovoMembro aberto={novo} onFechar={() => { setNovo(false); irPara('membros'); }} />
    </div>
  );
};
