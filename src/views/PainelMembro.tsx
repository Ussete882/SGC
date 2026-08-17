import React, { useMemo } from 'react';
import { useStore } from '../lib/store';
import { assiduidadeDe, mesesEmAtraso, quotaReferencia } from '../lib/selectors';
import {
  dataLonga, dataMedia, mesDe, mt, nomeMes, primeiroNome, relativo, ultimosMeses,
} from '../lib/format';
import {
  Alerta, Anel, Avatar, Barra, Btn, Card, Contador, Emblema, FaixaBandeira, Lei, Linha, Pill, Stat,
} from '../ui/primitives';
import {
  IcCalendario, IcCartao, IcCheck, IcDescarregar, IcLocal, IcMegafone, IcMoeda, IcRelogio, IcUrna,
} from '../ui/icons';

export const PainelMembro: React.FC = () => {
  const { e } = useStore();
  // O painel do membro é demonstrado com a camarada Beatriz Manjate.
  const eu = e.membros.find((m) => m.nome.includes('Beatriz')) ?? e.membros[7];

  const assid = useMemo(() => assiduidadeDe(e, eu.id), [e, eu.id]);
  const atraso = mesesEmAtraso(e, eu.id, e.hoje);
  const ref = quotaReferencia(eu);
  const historico = ultimosMeses(e.hoje, 12).map((mes) => ({
    mes,
    quota: e.quotas.find((q) => q.membroId === eu.id && q.mes === mes),
  }));
  const pagoAno = historico.reduce((a, h) => a + (h.quota?.valor ?? 0), 0);
  const proximas = e.reunioes
    .filter((r) => r.estado === 'AGENDADA' && r.data >= e.hoje)
    .sort((a, b) => (a.data > b.data ? 1 : -1))
    .slice(0, 4);
  const minhasMensagens = e.mensagens.filter((m) => m.destinatarios.includes(eu.id)).slice(0, 5);
  const docs = e.documentos.filter((d) => d.escopo === 'CENTRAL' || (d.categoria === 'ACTA' && d.escopo === 'CELULA')).slice(0, 6);
  const eleicoesAbertas = e.eleicoes.filter((el) => ['CANDIDATURAS', 'ESCRUTINIO', 'CADERNO', 'SEGUNDA_VOLTA'].includes(el.fase) && el.escopo === 'CELULA');
  const podeVotar = eu.estado === 'EFECTIVO';

  return (
    <div className="space-y-5">
      {/* cabeçalho */}
      <section className="rounded-3xl hero-bg text-white overflow-hidden shadow-rail relative">
        <FaixaBandeira altura={4} />
        <div className="absolute inset-0 grid-paper opacity-[0.06]" />
        <div className="faixa-diagonal absolute -top-14 -right-20 w-56 h-36 opacity-[0.14] rotate-12" />
        <div className="relative p-6 sm:p-8 flex flex-col lg:flex-row gap-8 lg:items-center">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Avatar nome={eu.nome} tamanho={64} />
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-300">Painel do Membro</p>
              <h2 className="text-[24px] sm:text-[28px] font-extrabold tracking-tight leading-tight mt-1">
                Bem-vinda, camarada {primeiroNome(eu.nome)}.
              </h2>
              <p className="text-white/50 text-[13.5px] mt-1.5">
                {e.celula.nome} · {e.circulo.nome} · membro desde {eu.dataAdmissao.slice(0, 4)}
              </p>
            </div>
          </div>
          <div className="flex-none card-sheen rounded-2xl p-4 bg-white/[0.06] border border-white/12 min-w-[230px]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[9.5px] font-extrabold uppercase tracking-[0.18em] text-white/40">Cartão de membro</p>
              <Emblema tamanho={30} />
            </div>
            <p className="font-mono text-[16px] font-bold tracking-wider mt-2">{eu.cartao}</p>
            <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-white/40">Situação</span>
              <span className="font-bold text-verde-300">{eu.estado === 'EFECTIVO' ? 'Membro efectivo' : eu.estado.toLowerCase()}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <Stat
          rotulo="A minha cotização"
          valor={atraso === 0 ? 'Em dia' : `${atraso} ${atraso === 1 ? 'mês' : 'meses'}`}
          tom={atraso === 0 ? 'verde' : 'brand'}
          icone={<IcMoeda className="w-5 h-5" />}
          nota={`Quota de referência ${mt(ref)} por mês`}
        />
        <Stat
          rotulo="Pago nos últimos 12 meses"
          valor={mt(pagoAno)}
          nota={`${historico.filter((h) => h.quota).length} de 12 meses`}
        />
        <Stat
          rotulo="A minha assiduidade"
          valor={<Contador valor={assid.taxa} sufixo="%" />}
          tom={assid.taxa >= 75 ? 'verde' : 'gold'}
          nota={`${assid.presente} presenças em ${assid.convocado} Reuniões Gerais`}
        />
        <Stat
          rotulo="Próxima reunião"
          valor={proximas[0] ? dataMedia(proximas[0].data).slice(0, 6) : '—'}
          icone={<IcCalendario className="w-5 h-5" />}
          nota={proximas[0] ? `${relativo(proximas[0].data, e.hoje)} · ${proximas[0].hora}` : 'sem sessão agendada'}
        />
      </div>

      {atraso > 0 && (
        <Alerta
          tom={atraso >= 12 ? 'brand' : 'gold'}
          titulo={atraso >= 12 ? 'A sua quota está em atraso há um ano' : `A sua quota está em atraso há ${atraso} ${atraso === 1 ? 'mês' : 'meses'}`}
          base="art16n4"
        >
          As quotas são a principal fonte de receita do Partido e 60% do valor cobrado fica na sua Célula. A regularização
          pode ser feita junto do Secretariado, em numerário ou em espécie.
        </Alerta>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* próximas actividades */}
        <Card className="xl:col-span-2" titulo="Próximas reuniões e actividades da Célula" sub="Convocatórias recebidas pelo meu canal preferido" pad={false}>
          <ul className="divide-y divide-ink-100">
            {proximas.map((r) => (
              <li key={r.id} className="px-5 py-4 flex items-start gap-4">
                <div className="text-center flex-none w-12">
                  <p className="text-[20px] font-extrabold tnum text-ink leading-none">{r.data.slice(8)}</p>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-ink-400 mt-1">{r.data.slice(5, 7)}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold text-ink leading-snug">{r.titulo}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                    <span className="flex items-center gap-1.5 text-[12px] text-ink-400"><IcRelogio className="w-3.5 h-3.5 text-ink-300" />{r.hora}</span>
                    <span className="flex items-center gap-1.5 text-[12px] text-ink-400"><IcLocal className="w-3.5 h-3.5 text-ink-300" />{r.local}</span>
                  </div>
                  {r.agenda.length > 1 && (
                    <details className="mt-2">
                      <summary className="text-[12px] font-bold text-brand-700 cursor-pointer link-underline inline-block">Ver agenda</summary>
                      <ol className="mt-2 space-y-1">
                        {r.agenda.map((p) => (
                          <li key={p.id} className="text-[12px] text-ink-500 flex gap-2">
                            <span className="text-ink-300 font-bold">{p.ordem}.</span>{p.titulo}
                          </li>
                        ))}
                      </ol>
                    </details>
                  )}
                </div>
                <Pill tom="neutro">{relativo(r.data, e.hoje)}</Pill>
              </li>
            ))}
            {proximas.length === 0 && <li className="px-5 py-10 text-center text-sm text-ink-300">Nada agendado para já.</li>}
          </ul>
        </Card>

        {/* cotização */}
        <Card titulo="A minha cotização" sub="Últimos doze meses" accao={<Lei id="manual_quota" />}>
          <div className="flex items-center gap-5 mb-4">
            <Anel
              valor={(historico.filter((h) => h.quota).length / 12) * 100}
              tamanho={86}
              cor={atraso === 0 ? '#00A34F' : '#F5D400'}
              centro={
                <>
                  <span className="text-[19px] font-extrabold tnum text-ink leading-none">{historico.filter((h) => h.quota).length}/12</span>
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-ink-400 mt-1">meses</span>
                </>
              }
            />
            <div className="min-w-0">
              <p className="text-[13px] text-ink-500 leading-relaxed">
                A quota corresponde a 1% do rendimento. Pode ser paga em numerário ou em espécie.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {historico.map((h) => (
              <div
                key={h.mes}
                title={h.quota ? `${nomeMes(h.mes)}: ${mt(h.quota.valor)}` : `${nomeMes(h.mes)}: sem pagamento`}
                className={`h-10 rounded-lg grid place-items-center text-[10px] font-extrabold border ${
                  h.quota ? 'bg-verde-100 border-verde-200 text-verde-800' : 'bg-brand-50 border-brand-100 text-brand-400'
                }`}
              >
                {h.mes.slice(5)}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-ink-100">
            <Linha rotulo="Quota de referência">{mt(ref)}</Linha>
            <Linha rotulo="Mês corrente">
              {e.quotas.some((q) => q.membroId === eu.id && q.mes === mesDe(e.hoje))
                ? <span className="text-verde-700">paga</span>
                : <span className="text-brand-600">em falta</span>}
            </Linha>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* direitos eleitorais */}
        <Card titulo="Os meus direitos eleitorais" sub="Eleger e ser eleito para os órgãos do Partido" accao={<Lei id="art14" />}>
          <div className="space-y-3">
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${podeVotar ? 'bg-verde-100/50 border-verde-200' : 'bg-brand-50 border-brand-100'}`}>
              <span className={`w-8 h-8 rounded-lg grid place-items-center flex-none ${podeVotar ? 'bg-verde-600 text-white' : 'bg-brand-600 text-white'}`}>
                {podeVotar ? <IcCheck className="w-4 h-4" /> : <IcUrna className="w-4 h-4" />}
              </span>
              <div>
                <p className="text-[13px] font-bold text-ink">{podeVotar ? 'Posso votar e ser eleita' : 'Direitos eleitorais limitados'}</p>
                <p className="text-[11.5px] text-ink-400">Capacidade eleitoral activa e passiva</p>
              </div>
            </div>
            <Linha rotulo="Cartão de eleitor">
              {eu.recenseado ? <span className="text-verde-700">recenseada · válido até {eu.validadeCartaoEleitor}</span> : <span className="text-gold-600">não recenseada</span>}
            </Linha>
            <Linha rotulo="Faltas não justificadas">{Math.round(assid.taxaInjustificada)}%</Linha>
          </div>

          {eleicoesAbertas.length > 0 && (
            <div className="mt-4 pt-4 border-t border-ink-100">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-400 mb-2">Eleições em curso na Célula</p>
              <ul className="space-y-2">
                {eleicoesAbertas.map((el) => (
                  <li key={el.id} className="flex items-start gap-2.5">
                    <IcUrna className="w-4 h-4 text-brand-500 flex-none mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-bold text-ink leading-snug">{el.titulo}</p>
                      <p className="text-[11.5px] text-ink-400">escrutínio a {dataMedia(el.dataEscrutinio)} · {el.candidaturas.filter((c) => !c.retirada).length} candidatos</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* avisos */}
        <Card titulo="Avisos do Secretariado" sub="Comunicações que recebi" pad={false}>
          <ul className="divide-y divide-ink-100">
            {minhasMensagens.map((m) => (
              <li key={m.id} className="px-5 py-3.5 flex items-start gap-3">
                <span className="w-8 h-8 rounded-xl bg-ink-50 text-ink-400 grid place-items-center flex-none">
                  <IcMegafone className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-ink leading-snug">{m.assunto}</p>
                  <p className="text-[12px] text-ink-400 mt-0.5 leading-relaxed line-clamp-2">{m.corpo}</p>
                  <p className="text-[11px] text-ink-300 mt-1">{dataMedia(m.enviadaEm)} · {m.canais.join(', ')}</p>
                </div>
              </li>
            ))}
            {minhasMensagens.length === 0 && <li className="px-5 py-8 text-center text-sm text-ink-300">Sem comunicações.</li>}
          </ul>
        </Card>

        {/* documentos */}
        <Card titulo="Documentos partilhados" sub="Actas aprovadas e normativos do Partido" pad={false}>
          <ul className="divide-y divide-ink-100">
            {docs.map((d) => (
              <li key={d.id} className="px-5 py-3 flex items-center gap-3">
                <span className={`w-8 h-8 rounded-xl grid place-items-center flex-none ${d.escopo === 'CENTRAL' ? 'bg-ink text-gold-400' : 'bg-ink-50 text-ink-400'}`}>
                  <IcCartao className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-bold text-ink truncate">{d.titulo}</p>
                  <p className="text-[11px] text-ink-400">{d.paginas} páginas · {dataMedia(d.data)}</p>
                </div>
                <Btn tamanho="sm" variante="fantasma" icone={<IcDescarregar className="w-3.5 h-3.5" />} />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <span className="w-10 h-10 rounded-xl bg-ink-50 text-ink-400 grid place-items-center flex-none">
            <IcCheck className="w-5 h-5" />
          </span>
          <div className="flex-1">
            <p className="text-[13.5px] font-bold text-ink">Este painel é apenas de consulta</p>
            <p className="text-[12.5px] text-ink-400 mt-0.5 leading-relaxed">
              Não inclui funções administrativas. O objectivo é o envolvimento: um membro informado participa mais e paga as
              quotas com maior regularidade. O acesso faz-se por credenciais individuais ou por ligação segura enviada por WhatsApp.
            </p>
          </div>
          <p className="text-[11.5px] text-ink-300 flex-none">{dataLonga(e.hoje)}</p>
        </div>
      </Card>
    </div>
  );
};
