import React, { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useStore } from '../lib/store';
import {
  alertasCotizacao, cotizacaoDoMes, mesesEmAtraso, quotaReferencia, saldoCelula, serieCotizacao,
} from '../lib/selectors';
import { dataMedia, mesDe, mt, nomeMes, nomeMesCurto, num, pct, ultimosMeses } from '../lib/format';
import {
  Alerta, Avatar, Barra, Btn, Campo, Card, Escolha, Input, Lei, Linha, Modal, Passos, Pill,
  Segmentado, Select, Stat, Tabela, Textarea, Vazio,
} from '../ui/primitives';
import { IcAviso, IcCheck, IcDescarregar, IcMais, IcMoeda, IcSeta } from '../ui/icons';
import type { Membro, Modalidade } from '../lib/types';

/* ══════════════════════ Registo de quota em três passos ════════════════════ */

const RegistarQuota: React.FC<{ aberto: boolean; onFechar: () => void; mes: string; preSelecionado?: string }> = ({
  aberto, onFechar, mes, preSelecionado,
}) => {
  const { e, registarQuota } = useStore();
  const [passo, setPasso] = useState(0);
  const [membroId, setMembroId] = useState(preSelecionado ?? '');
  const [valor, setValor] = useState('');
  const [modalidade, setModalidade] = useState<Modalidade>('NUMERARIO');
  const [descricao, setDescricao] = useState('');

  const cot = cotizacaoDoMes(e, mes);
  const emFalta = cot.emFalta;
  const membro = e.membros.find((m) => m.id === membroId);
  const referencia = membro ? quotaReferencia(membro) : 0;

  useEffect(() => {
    if (aberto) {
      setPasso(preSelecionado ? 1 : 0);
      setMembroId(preSelecionado ?? '');
      setValor('');
      setModalidade('NUMERARIO');
      setDescricao('');
    }
  }, [aberto, preSelecionado]);

  useEffect(() => {
    if (membro) setValor(String(quotaReferencia(membro)));
  }, [membroId]); // eslint-disable-line react-hooks/exhaustive-deps

  const v = Number(valor) || 0;
  const podeAvancar = passo === 0 ? !!membroId : passo === 1 ? v > 0 : modalidade === 'NUMERARIO' || descricao.trim().length > 3;

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      largura="max-w-lg"
      titulo="Registar pagamento de quota"
      sub={`Mês de referência: ${nomeMes(mes)}`}
      rodape={
        <>
          {passo > 0 && <Btn variante="fantasma" onClick={() => setPasso((p) => p - 1)}>Voltar</Btn>}
          <span className="flex-1" />
          {passo < 2 ? (
            <Btn variante="escura" disabled={!podeAvancar} iconeFim={<IcSeta className="w-4 h-4" />} onClick={() => setPasso((p) => p + 1)}>
              Continuar
            </Btn>
          ) : (
            <Btn
              variante="primaria"
              disabled={!podeAvancar}
              icone={<IcCheck className="w-4 h-4" />}
              onClick={() => {
                registarQuota({ membroId, mes, valor: v, modalidade, descricaoEspecie: modalidade === 'ESPECIE' ? descricao : undefined });
                onFechar();
              }}
            >
              Confirmar registo
            </Btn>
          )}
        </>
      }
    >
      <div className="space-y-5">
        <Passos passos={['Membro', 'Valor', 'Modalidade']} actual={passo} onIr={(i) => setPasso(i)} />

        {passo === 0 && (
          <div>
            <p className="text-[12.5px] text-ink-400 mb-3">
              {emFalta.length} membro(s) com quota em falta neste mês.
            </p>
            <div className="space-y-1.5 max-h-[46vh] overflow-y-auto pr-1">
              {[...emFalta, ...cot.obrigados.filter((m) => cot.pagouIds.has(m.id))].map((m) => {
                const pago = cot.pagouIds.has(m.id);
                const atraso = mesesEmAtraso(e, m.id, e.hoje);
                return (
                  <button
                    key={m.id}
                    disabled={pago}
                    onClick={() => { setMembroId(m.id); setPasso(1); }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                      membroId === m.id ? 'border-brand-500 bg-brand-50/60' : pago ? 'border-ink-100 bg-ink-50/50 opacity-60' : 'border-ink-200 hover:border-ink-300 bg-white'
                    }`}
                  >
                    <Avatar nome={m.nome} tamanho={34} />
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block text-[13.5px] font-bold text-ink truncate">{m.nome}</span>
                      <span className="block text-[11.5px] text-ink-400">
                        referência {mt(quotaReferencia(m))}
                        {atraso > 0 && !pago && ` · ${atraso} ${atraso === 1 ? 'mês' : 'meses'} em atraso`}
                      </span>
                    </span>
                    {pago ? <Pill tom="verde">paga</Pill> : atraso >= 12 ? <Pill tom="brand">suspensível</Pill> : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {passo === 1 && membro && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-ink-50 border border-ink-100">
              <Avatar nome={membro.nome} tamanho={38} />
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-ink truncate">{membro.nome}</p>
                <p className="text-[11.5px] text-ink-400">
                  Rendimento declarado {membro.rendimento ? mt(membro.rendimento) : 'não indicado'}
                </p>
              </div>
            </div>
            <Campo
              rotulo="Valor da quota (MT)"
              obrigatorio
              nota={<>Valor de referência: 1% do rendimento = <strong>{mt(referencia)}</strong>. <Lei id="manual_quota" className="ml-1" /></>}
            >
              <Input type="number" value={valor} onChange={(ev) => setValor(ev.target.value)} className="!text-lg !font-bold tnum" />
            </Campo>
            <div className="flex gap-2">
              {[referencia, Math.round(referencia * 0.5), Math.round(referencia * 2), 100].map((x, i) => (
                <button
                  key={i}
                  onClick={() => setValor(String(x))}
                  className="px-3 py-1.5 rounded-lg border border-ink-200 text-[12px] font-bold text-ink-500 hover:border-brand-300 hover:text-brand-700 tnum"
                >
                  {num(x)} MT
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl border border-verde-200 bg-verde-100/60 p-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-verde-800">Retido na Célula (60%)</p>
                <p className="text-[19px] font-extrabold tnum text-verde-800 mt-0.5">{mt(v * 0.6)}</p>
              </div>
              <div className="rounded-xl border border-brand-200 bg-brand-50 p-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-brand-700">Escalão superior (40%)</p>
                <p className="text-[19px] font-extrabold tnum text-brand-700 mt-0.5">{mt(v * 0.4)}</p>
              </div>
            </div>
          </div>
        )}

        {passo === 2 && (
          <div className="space-y-4">
            <Campo rotulo="Modalidade de pagamento" obrigatorio>
              <Escolha
                valor={modalidade}
                onMudar={(x) => setModalidade(x as Modalidade)}
                itens={[
                  { id: 'NUMERARIO', rotulo: 'Numerário', nota: 'Dinheiro entregue ao Secretariado' },
                  { id: 'ESPECIE', rotulo: 'Em espécie', nota: 'Bem ou trabalho de valor equivalente' },
                ]}
              />
            </Campo>
            {modalidade === 'ESPECIE' && (
              <Campo rotulo="Descrição do bem ou serviço" obrigatorio nota="Fica registada para o relatório de contas.">
                <Textarea value={descricao} onChange={(ev) => setDescricao(ev.target.value)} placeholder="Ex.: 2 latas de milho, equivalente a 350 MT" />
              </Campo>
            )}
            <div className="rounded-xl bg-ink text-white p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/40">Resumo do registo</p>
              <p className="text-[15px] font-bold mt-1.5">{e.membros.find((m) => m.id === membroId)?.nome}</p>
              <p className="text-[13px] text-white/60">
                {nomeMes(mes)} · {mt(v)} · {modalidade === 'NUMERARIO' ? 'numerário' : 'espécie'}
              </p>
              <div className="flex gap-4 mt-3 pt-3 border-t border-white/10">
                <span className="text-[12px]"><span className="text-white/40">Célula</span> <strong className="tnum">{mt(v * 0.6)}</strong></span>
                <span className="text-[12px]"><span className="text-white/40">Escalão</span> <strong className="tnum">{mt(v * 0.4)}</strong></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

/* ═══════════════════════════ Movimento de fundos ═══════════════════════════ */

const NovoMovimento: React.FC<{ aberto: boolean; onFechar: () => void }> = ({ aberto, onFechar }) => {
  const { registarMovimento } = useStore();
  const [tipo, setTipo] = useState<'RECEITA' | 'DESPESA'>('DESPESA');
  const [categoria, setCategoria] = useState('Funcionamento');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [comprovativo, setComprovativo] = useState('');

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo="Registar movimento de fundos"
      sub="Entra directamente no relatório de contas do mês"
      rodape={
        <>
          <Btn variante="fantasma" onClick={onFechar}>Cancelar</Btn>
          <Btn
            variante="primaria"
            disabled={!descricao || !Number(valor)}
            onClick={() => {
              registarMovimento({ tipo, categoria, descricao, valor: Number(valor), comprovativo: comprovativo || undefined });
              setDescricao(''); setValor(''); setComprovativo('');
              onFechar();
            }}
          >
            Registar
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <Campo rotulo="Natureza" obrigatorio>
          <Escolha
            colunas={2}
            valor={tipo}
            onMudar={(v) => setTipo(v as any)}
            itens={[
              { id: 'DESPESA', rotulo: 'Despesa', nota: 'Saída de fundos da Célula' },
              { id: 'RECEITA', rotulo: 'Receita', nota: 'Outra entrada, além das quotas' },
            ]}
          />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Categoria" obrigatorio>
            <Select value={categoria} onChange={(ev) => setCategoria(ev.target.value)}>
              <option>Funcionamento</option>
              <option>Comunicação</option>
              <option>Solidariedade</option>
              <option>Actividade cultural</option>
              <option>Estudo político</option>
              <option>Contribuição adicional</option>
              <option>Outros</option>
            </Select>
          </Campo>
          <Campo rotulo="Valor (MT)" obrigatorio>
            <Input type="number" value={valor} onChange={(ev) => setValor(ev.target.value)} />
          </Campo>
        </div>
        <Campo rotulo="Descrição" obrigatorio>
          <Input value={descricao} onChange={(ev) => setDescricao(ev.target.value)} placeholder="Ex.: cadernos de acta e material de escritório" />
        </Campo>
        <Campo rotulo="Comprovativo" nota="No terreno, uma fotografia tirada com o telemóvel basta.">
          <Input value={comprovativo} onChange={(ev) => setComprovativo(ev.target.value)} placeholder="recibo_papelaria.jpg" />
        </Campo>
      </div>
    </Modal>
  );
};

/* ════════════════════════════════ Vista ════════════════════════════════════ */

export const Cotas: React.FC = () => {
  const { e, params, irPara, anularQuota } = useStore();
  const meses = useMemo(() => ultimosMeses(e.hoje, 12).reverse(), [e.hoje]);
  const [mes, setMes] = useState(mesDe(e.hoje));
  const [aba, setAba] = useState<'cotizacao' | 'atrasos' | 'contas'>('cotizacao');
  const [registar, setRegistar] = useState(false);
  const [pre, setPre] = useState<string | undefined>();
  const [movimento, setMovimento] = useState(false);

  useEffect(() => {
    if (params.acao === 'registar') setRegistar(true);
  }, [params]);

  const cot = useMemo(() => cotizacaoDoMes(e, mes), [e, mes]);
  const serie = useMemo(() => serieCotizacao(e, 12), [e]);
  const atrasos = useMemo(() => alertasCotizacao(e), [e]);
  const saldo = useMemo(() => saldoCelula(e), [e]);
  const movimentosMes = e.movimentos.filter((m) => mesDe(m.data) === mes);
  const quotasMes = cot.pagos;

  const dadosBarra = serie.map((s) => ({ ...s, rotulo: nomeMesCurto(s.mes), destaque: s.mes === mes }));

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
        <Select value={mes} onChange={(ev) => setMes(ev.target.value)} className="!w-auto">
          {meses.map((m) => (<option key={m} value={m}>{nomeMes(m)}</option>))}
        </Select>
        <Segmentado
          itens={[
            { id: 'cotizacao', rotulo: 'Cotização do mês' },
            { id: 'atrasos', rotulo: `Atrasos (${atrasos.length})` },
            { id: 'contas', rotulo: 'Relatório de contas' },
          ]}
          activo={aba}
          onMudar={(v) => setAba(v as any)}
        />
        <span className="flex-1" />
        <Btn variante="contorno" icone={<IcMais className="w-4 h-4" />} onClick={() => setMovimento(true)}>Movimento de fundos</Btn>
        <Btn variante="primaria" icone={<IcMoeda className="w-4 h-4" />} onClick={() => { setPre(undefined); setRegistar(true); }}>
          Registar quota
        </Btn>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <Stat
          rotulo="Cobrado no mês"
          valor={mt(cot.total)}
          icone={<IcMoeda className="w-5 h-5" />}
          nota={`${cot.pagos.length} de ${cot.obrigados.length} membros · esperado ${mt(cot.esperado)}`}
        />
        <Stat rotulo="Retido na Célula (60%)" valor={mt(cot.retidoCelula)} tom="verde" nota="Despesas de funcionamento da Célula" />
        <Stat rotulo="Escalão superior (40%)" valor={mt(cot.paraEscalao)} tom="brand" nota="A encaminhar ao Comité de Círculo" />
        <Stat
          rotulo="Taxa de cotização"
          valor={pct(cot.taxa)}
          tom={cot.taxa >= 80 ? 'verde' : cot.taxa >= 50 ? 'gold' : 'brand'}
          nota={`${cot.emFalta.length} em falta neste mês`}
        />
      </div>

      {aba === 'cotizacao' && (
        <>
          <Card titulo="Cobrança mensal" sub="Barra destacada corresponde ao mês selecionado" accao={<Lei id="manual_6040" />}>
            <div className="h-[230px] -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosBarra} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1EDED" vertical={false} />
                  <XAxis dataKey="rotulo" tick={{ fontSize: 11, fill: '#9E9797', fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9E9797' }} axisLine={false} tickLine={false} width={46} tickFormatter={(v: number) => num(v)} />
                  <Tooltip
                    cursor={{ fill: '#F8F6F6' }}
                    contentStyle={{ borderRadius: 12, border: '1px solid #EDE9E9', fontSize: 12, fontWeight: 600 }}
                    formatter={(v: any, n: any) => [mt(Number(v)), n]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11.5, fontWeight: 700 }} />
                  <Bar dataKey="celula" name="Célula (60%)" stackId="a" fill="#00A34F">
                    {dadosBarra.map((d, i) => (<Cell key={i} fillOpacity={d.destaque ? 1 : 0.45} />))}
                  </Bar>
                  <Bar dataKey="escalao" name="Escalão (40%)" stackId="a" fill="#E61923" radius={[5, 5, 0, 0]}>
                    {dadosBarra.map((d, i) => (<Cell key={i} fillOpacity={d.destaque ? 1 : 0.45} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <Card titulo={`Quem já pagou — ${nomeMes(mes)}`} sub={`${quotasMes.length} registos`} pad={false}>
              {quotasMes.length === 0 ? (
                <Vazio titulo="Sem pagamentos neste mês" texto="Use o botão “Registar quota” para lançar o primeiro." />
              ) : (
                <Tabela>
                  <thead>
                    <tr><th>Membro</th><th>Valor</th><th>Modalidade</th><th>Registo</th><th /></tr>
                  </thead>
                  <tbody>
                    {quotasMes.map((q) => {
                      const m = e.membros.find((x) => x.id === q.membroId);
                      return (
                        <tr key={q.id}>
                          <td>
                            <div className="flex items-center gap-2.5">
                              <Avatar nome={m?.nome ?? '?'} tamanho={28} />
                              <span className="font-bold text-ink truncate">{m?.nome}</span>
                            </div>
                          </td>
                          <td className="tnum font-bold">{mt(q.valor)}</td>
                          <td>
                            {q.modalidade === 'ESPECIE' ? (
                              <span className="flex flex-col">
                                <Pill tom="gold">espécie</Pill>
                                <span className="text-[11px] text-ink-400 mt-1">{q.descricaoEspecie}</span>
                              </span>
                            ) : (
                              <Pill tom="verde">numerário</Pill>
                            )}
                          </td>
                          <td className="text-ink-400 tnum text-[12px]">{dataMedia(q.dataRegisto)}</td>
                          <td>
                            <Btn tamanho="sm" variante="fantasma" onClick={() => anularQuota(q.id)}>Anular</Btn>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Tabela>
              )}
            </Card>

            <Card titulo={`Em falta — ${nomeMes(mes)}`} sub={`${cot.emFalta.length} membros`} pad={false} destaque={cot.emFalta.length > 0}>
              {cot.emFalta.length === 0 ? (
                <Vazio titulo="Cotização completa" texto="Todos os membros obrigados pagaram este mês." icone={<IcCheck className="w-6 h-6" />} />
              ) : (
                <ul className="divide-y divide-ink-100">
                  {cot.emFalta.map((m: Membro) => {
                    const atraso = mesesEmAtraso(e, m.id, e.hoje);
                    return (
                      <li key={m.id} className="px-5 py-3 flex items-center gap-3">
                        <Avatar nome={m.nome} tamanho={32} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold text-ink truncate">{m.nome}</p>
                          <p className="text-[11.5px] text-ink-400">
                            referência {mt(quotaReferencia(m))}
                            {atraso > 1 && ` · ${atraso} meses acumulados`}
                          </p>
                        </div>
                        {atraso >= 12 && <Pill tom="brand">Art. 16 n.º 4</Pill>}
                        <Btn tamanho="sm" variante="suave" onClick={() => { setPre(m.id); setRegistar(true); }}>Registar</Btn>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}

      {aba === 'atrasos' && (
        <div className="space-y-5">
          {atrasos.some((a) => a.suspensivel) && (
            <Alerta
              tom="brand"
              titulo="Membros que atingiram doze meses de incumprimento"
              base="art16n4"
              accao={<Btn tamanho="sm" variante="primaria" onClick={() => irPara('membros')}>Ver fichas</Btn>}
            >
              A suspensão de direitos por um ano é a consequência estatutária, até à regularização. A decisão deve ser levada à Reunião Geral e registada em Acta.
            </Alerta>
          )}
          <Card pad={false} titulo="Mapa de atrasos" sub="Meses consecutivos sem pagamento, a contar do mês corrente">
            {atrasos.length === 0 ? (
              <Vazio titulo="Nenhum atraso" texto="A Célula está integralmente em dia." icone={<IcCheck className="w-6 h-6" />} />
            ) : (
              <Tabela>
                <thead>
                  <tr><th>Membro</th><th>Meses</th><th>Desde</th><th>Dívida estimada</th><th>Situação</th><th /></tr>
                </thead>
                <tbody>
                  {atrasos.map((a) => (
                    <tr key={a.membro.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <Avatar nome={a.membro.nome} tamanho={30} />
                          <div>
                            <p className="font-bold text-ink">{a.membro.nome}</p>
                            <p className="text-[11px] text-ink-400">{a.membro.profissao}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="tnum font-extrabold text-[15px]">{a.meses}</span>
                          <div className="w-16"><Barra valor={(a.meses / 12) * 100} alt="h-1.5" tom={a.meses >= 12 ? 'bg-brand-600' : 'bg-gold-500'} /></div>
                        </div>
                      </td>
                      <td className="text-ink-400 tnum text-[12px]">{nomeMes(a.desdeMes)}</td>
                      <td className="tnum font-bold">{mt(a.divida)}</td>
                      <td>
                        {a.membro.estado === 'SUSPENSO' ? (
                          <Pill tom="brand" ponto>já suspenso</Pill>
                        ) : a.suspensivel ? (
                          <Pill tom="brand"><IcAviso className="w-3 h-3" />suspensível</Pill>
                        ) : a.meses >= 6 ? (
                          <Pill tom="gold">a acompanhar</Pill>
                        ) : (
                          <Pill tom="neutro">recente</Pill>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-1.5">
                          <Btn tamanho="sm" variante="suave" onClick={() => { setPre(a.membro.id); setRegistar(true); }}>Registar</Btn>
                          <Btn tamanho="sm" variante="fantasma" onClick={() => irPara('comunicacao', { acao: 'nova', segmento: 'EM_ATRASO' })}>Avisar</Btn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Tabela>
            )}
          </Card>
        </div>
      )}

      {aba === 'contas' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <Card className="xl:col-span-2" titulo={`Relatório de contas — ${nomeMes(mes)}`} sub="Gerado automaticamente, pronto para aprovação na Reunião Geral" accao={<Btn tamanho="sm" variante="contorno" icone={<IcDescarregar className="w-4 h-4" />} onClick={() => window.print()}>Imprimir</Btn>}>
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-400 mb-2">Receitas</p>
                <Linha rotulo={`Quotas cobradas (${cot.pagos.length} membros)`}>{mt(cot.total)}</Linha>
                <Linha rotulo="Parte retida na Célula (60%)"><span className="text-verde-700">{mt(cot.retidoCelula)}</span></Linha>
                {movimentosMes.filter((m) => m.tipo === 'RECEITA').map((m) => (
                  <Linha key={m.id} rotulo={`${m.categoria} — ${m.descricao}`}>{mt(m.valor)}</Linha>
                ))}
                <Linha rotulo="Total de receitas da Célula">
                  <strong>{mt(cot.retidoCelula + movimentosMes.filter((m) => m.tipo === 'RECEITA').reduce((a, m) => a + m.valor, 0))}</strong>
                </Linha>
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-400 mb-2">Despesas</p>
                {movimentosMes.filter((m) => m.tipo === 'DESPESA').length === 0 && (
                  <p className="text-[13px] text-ink-300 py-2">Sem despesas registadas neste mês.</p>
                )}
                {movimentosMes.filter((m) => m.tipo === 'DESPESA').map((m) => (
                  <Linha key={m.id} rotulo={<span>{m.categoria} — {m.descricao} {m.comprovativo && <span className="text-ink-300">({m.comprovativo})</span>}</span>}>
                    {mt(m.valor)}
                  </Linha>
                ))}
                <Linha rotulo="Total de despesas">
                  <strong>{mt(movimentosMes.filter((m) => m.tipo === 'DESPESA').reduce((a, m) => a + m.valor, 0))}</strong>
                </Linha>
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-400 mb-2">A encaminhar ao escalão superior</p>
                <Linha rotulo="40% das quotas cobradas"><span className="text-brand-700">{mt(cot.paraEscalao)}</span></Linha>
              </div>
              <div className="rounded-xl bg-ink text-white p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/40">Saldo acumulado da Célula</p>
                  <p className="text-[24px] font-extrabold tnum mt-0.5">{mt(saldo.saldo)}</p>
                </div>
                <div className="text-right text-[12px] text-white/50">
                  <p>Receitas acumuladas {mt(saldo.receitas)}</p>
                  <p>Despesas acumuladas {mt(saldo.despesas)}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card titulo="Movimento de fundos" sub="Todos os lançamentos" pad={false}>
            <ul className="divide-y divide-ink-100 max-h-[430px] overflow-y-auto">
              {e.movimentos.map((m) => (
                <li key={m.id} className="px-5 py-3 flex items-start gap-3">
                  <span className={`w-8 h-8 rounded-xl grid place-items-center flex-none ${m.tipo === 'RECEITA' ? 'bg-verde-100 text-verde-700' : 'bg-brand-50 text-brand-600'}`}>
                    <IcMoeda className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-ink leading-snug">{m.descricao}</p>
                    <p className="text-[11.5px] text-ink-400 mt-0.5">
                      {m.categoria} · {dataMedia(m.data)}
                      {m.comprovativo && <span className="text-verde-700 font-semibold"> · comprovativo anexado</span>}
                    </p>
                  </div>
                  <span className={`text-[13px] font-extrabold tnum flex-none ${m.tipo === 'RECEITA' ? 'text-verde-700' : 'text-brand-600'}`}>
                    {m.tipo === 'RECEITA' ? '+' : '−'}{mt(m.valor)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      <RegistarQuota aberto={registar} onFechar={() => { setRegistar(false); setPre(undefined); irPara('cotas'); }} mes={mes} preSelecionado={pre} />
      <NovoMovimento aberto={movimento} onFechar={() => setMovimento(false)} />
    </div>
  );
};
