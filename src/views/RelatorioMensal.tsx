import React, { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import {
  assiduidadeDe, alertasCotizacao, cotizacaoDoMes, membrosDaCelula, reunioesGerais, saldoCelula,
} from '../lib/selectors';
import { dataLonga, dataMedia, mesDe, mt, nomeMes, num, pct, ultimosMeses } from '../lib/format';
import { Alerta, Btn, Card, Emblema, FaixaBandeira, Lei, Pill, Select } from '../ui/primitives';
import { IcCheck, IcDescarregar, IcImprimir, IcRelatorio, IcSeta } from '../ui/icons';

export const RelatorioMensal: React.FC = () => {
  const { e, arquivarDocumento, enviarMensagem, avisar } = useStore();
  const meses = useMemo(() => ultimosMeses(e.hoje, 8).reverse(), [e.hoje]);
  const [mes, setMes] = useState(ultimosMeses(e.hoje, 2)[0]);
  const [enviado, setEnviado] = useState(false);

  const cot = useMemo(() => cotizacaoDoMes(e, mes), [e, mes]);
  const saldo = useMemo(() => saldoCelula(e), [e]);
  const doMes = e.reunioes.filter((r) => mesDe(r.data) === mes && r.estado === 'REALIZADA');
  const rg = doMes.filter((r) => r.tipo === 'REUNIAO_GERAL' || r.tipo === 'REUNIAO_GERAL_EXTRA');
  const sec = doMes.filter((r) => r.tipo === 'SECRETARIADO');
  const act = doMes.filter((r) => ['ESTUDO_POLITICO', 'AUSCULTACAO', 'CULTURAL', 'SOLIDARIEDADE'].includes(r.tipo));
  const movimentos = e.movimentos.filter((m) => mesDe(m.data) === mes);
  const receitas = movimentos.filter((m) => m.tipo === 'RECEITA');
  const despesas = movimentos.filter((m) => m.tipo === 'DESPESA');
  const atrasos = alertasCotizacao(e);
  const membros = membrosDaCelula(e);
  const secretaria = e.membros.find((m) => m.cargo === 'SECRETARIO')
    ?? e.membros.find((m) => m.cargo === 'ASSISTENTE')
    ?? e.membros[0];
  const aniversariantes = membros.filter((m) => m.dataNascimento?.slice(5, 7) === mes.slice(5, 7));

  const presencasRG = rg.length
    ? rg.map((r) => {
        const vals = Object.values(r.presencas);
        return {
          reuniao: r,
          presentes: vals.filter((v) => v === 'PRESENTE').length,
          justificados: vals.filter((v) => v === 'JUSTIFICADO').length,
          injustificados: vals.filter((v) => v === 'INJUSTIFICADO').length,
          total: vals.length,
        };
      })
    : [];

  const jaExiste = e.documentos.some((d) => d.categoria === 'RELATORIO' && d.titulo.includes(mes));

  const gerar = () => {
    arquivarDocumento({
      titulo: `Relatório Mensal ao Círculo — ${mes}`,
      categoria: 'RELATORIO',
      escopo: 'CELULA',
      data: e.hoje,
      paginas: 4,
      tamanhoKb: 268,
    });
    enviarMensagem({
      canais: ['EMAIL', 'WHATSAPP'],
      segmento: 'SECRETARIADO',
      destinatarios: membros.filter((m) => m.cargo !== 'MEMBRO').map((m) => m.id),
      assunto: `Relatório mensal de ${nomeMes(mes)} enviado ao Comité de Círculo`,
      corpo: `O Secretariado da ${e.celula.nome} submeteu ao Comité do Círculo n.º 12 o relatório de ${nomeMes(mes)}, com a situação política, as actividades realizadas, o estado da cotização e o relatório de contas.`,
      tipo: 'LIVRE',
    });
    setEnviado(true);
    avisar({
      tipo: 'ok',
      titulo: 'Relatório submetido ao Comité de Círculo',
      texto: 'Arquivado nos documentos da Célula e comunicado ao Secretariado.',
      base: 'manual_relatorio',
    });
  };

  const Bloco: React.FC<{ n: string; titulo: string; children: React.ReactNode }> = ({ n, titulo, children }) => (
    <section className="mt-6">
      <h3 className="text-[13px] font-extrabold text-ink uppercase tracking-[0.1em] flex items-baseline gap-2 pb-1.5 border-b border-ink-200">
        <span className="text-brand-600">{n}</span>
        {titulo}
      </h3>
      <div className="mt-3 text-[13.5px] text-ink-600 leading-relaxed space-y-2">{children}</div>
    </section>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center no-print">
        <Select value={mes} onChange={(ev) => { setMes(ev.target.value); setEnviado(false); }} className="!w-auto">
          {meses.map((m) => (<option key={m} value={m}>{nomeMes(m)}</option>))}
        </Select>
        <Pill tom={jaExiste || enviado ? 'verde' : 'brand'} ponto>
          {jaExiste || enviado ? 'entregue ao Círculo' : 'por entregar'}
        </Pill>
        <span className="flex-1" />
        <Btn variante="contorno" icone={<IcImprimir className="w-4 h-4" />} onClick={() => window.print()}>Imprimir</Btn>
        <Btn variante="primaria" icone={<IcSeta className="w-4 h-4" />} disabled={jaExiste || enviado} onClick={gerar}>
          Submeter ao Comité de Círculo
        </Btn>
      </div>

      {!jaExiste && !enviado && (
        <div className="no-print">
          <Alerta tom="gold" titulo={`O relatório de ${nomeMes(mes)} ainda não foi entregue`} base="manual_relatorio">
            O Secretariado envia mensalmente ao Comité de Círculo um relatório com o máximo de cinco páginas. O documento
            abaixo é montado automaticamente a partir dos dados já registados no sistema.
          </Alerta>
        </div>
      )}

      {/* ─────────────── folha do relatório ─────────────── */}
      <div className="print-sheet bg-white rounded-2xl border border-ink-100 shadow-card overflow-hidden max-w-[900px] mx-auto">
        <FaixaBandeira altura={6} />
        <div className="p-7 sm:p-10">
        <header className="flex items-start justify-between gap-6 pb-5 border-b-2 border-ink">
          <div className="flex items-start gap-4">
            <Emblema tamanho={62} selo={false} />
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-brand-600">
                Frente de Libertação de Moçambique
              </p>
              <h1 className="text-[22px] font-extrabold text-ink tracking-tight mt-1 leading-tight">
                Relatório Mensal da Célula ao Comité de Círculo
              </h1>
              <p className="text-[13px] text-ink-400 mt-1">{nomeMes(mes)}</p>
            </div>
          </div>
          <div className="text-right text-[11.5px] text-ink-400 leading-relaxed flex-none">
            <p className="font-bold text-ink">{e.celula.nome}</p>
            <p>{e.circulo.nome}</p>
            <p>{e.celula.bairro}, {e.celula.distrito}</p>
            <p>{e.celula.provincia}</p>
          </div>
        </header>

        <Bloco n="1." titulo="Introdução">
          <p>
            O Secretariado da {e.celula.nome}, do {e.circulo.nome}, apresenta o relatório das actividades desenvolvidas
            no mês de {nomeMes(mes)}, nos termos do ponto 1.9 do Manual da Célula.
          </p>
          <p>
            A Célula conta actualmente com {membros.filter((m) => m.estado === 'EFECTIVO').length} membros efectivos,{' '}
            {membros.filter((m) => m.estado === 'CANDIDATO').length} candidatos em apreciação e{' '}
            {membros.filter((m) => m.estado === 'SUSPENSO').length} membro(s) com direitos suspensos, totalizando{' '}
            {membros.length} camaradas inscritos na base de dados.
          </p>
          <p>
            <strong>Saúde dos quadros:</strong> não se registaram situações de doença grave comunicadas ao Secretariado.
            {aniversariantes.length > 0 && (
              <> Foram celebrados os aniversários dos camaradas {aniversariantes.map((m) => m.nome).join(', ')}.</>
            )}
          </p>
          <p>
            <strong>Situação política:</strong> ambiente de normalidade na área de jurisdição da Célula, com participação
            dos membros nas iniciativas do Partido e contacto permanente com a comunidade do bairro.
          </p>
        </Bloco>

        <Bloco n="2." titulo="Actividades realizadas">
          <p>
            Realizaram-se no mês {rg.length} Reunião/Reuniões Geral(is), {sec.length} sessão/sessões do Secretariado e{' '}
            {act.length} outra(s) actividade(s) da Célula.
          </p>
          {doMes.length === 0 && <p className="italic text-ink-400">Não se registaram sessões realizadas neste mês.</p>}
          <ul className="space-y-2 mt-2">
            {doMes.map((r) => {
              const vals = Object.values(r.presencas);
              return (
                <li key={r.id} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-2 flex-none" />
                  <span>
                    <strong>{dataMedia(r.data)}</strong> — {r.titulo}, em {r.local}
                    {vals.length > 0 && ` (${vals.filter((v) => v === 'PRESENTE').length} presentes de ${vals.length})`}
                    {r.duracaoMin && `, com a duração de ${r.duracaoMin} minutos`}.
                    {r.resumo && <span className="text-ink-500"> {r.resumo}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </Bloco>

        <Bloco n="3." titulo="Participação, ausências e justificações">
          {presencasRG.length === 0 ? (
            <p className="italic text-ink-400">Sem Reunião Geral realizada no mês.</p>
          ) : (
            presencasRG.map((p) => (
              <div key={p.reuniao.id} className="mb-3">
                <p className="font-bold text-ink">{p.reuniao.titulo} — {dataMedia(p.reuniao.data)}</p>
                <p>
                  Presentes: {p.presentes} · Ausências justificadas: {p.justificados} · Ausências não justificadas:{' '}
                  {p.injustificados} · Taxa de presença: {pct((p.presentes / Math.max(1, p.total)) * 100)}.
                </p>
                {p.injustificados > 0 && (
                  <p className="text-ink-500">
                    Ausentes sem justificação:{' '}
                    {Object.entries(p.reuniao.presencas)
                      .filter(([, v]) => v === 'INJUSTIFICADO')
                      .map(([k]) => e.membros.find((m) => m.id === k)?.nome)
                      .filter(Boolean)
                      .join(', ')}
                    .
                  </p>
                )}
              </div>
            ))
          )}
          {membros.filter((m) => assiduidadeDe(e, m.id).risco !== 'OK').length > 0 && (
            <p>
              <strong>Situações a acompanhar:</strong>{' '}
              {membros
                .filter((m) => assiduidadeDe(e, m.id).risco !== 'OK')
                .map((m) => `${m.nome} (${Math.round(assiduidadeDe(e, m.id).taxaInjustificada)}% de faltas não justificadas)`)
                .join('; ')}
              . Nos termos do n.º 6 do Artigo 27 dos Estatutos, faltas injustificadas de 25% ou 50% fazem cessar o mandato
              dos membros de órgãos.
            </p>
          )}
        </Bloco>

        <Bloco n="4." titulo="Situação da cotização">
          <p>
            Total de membros obrigados à cotização: {cot.obrigados.length}. Pagaram {cot.pagos.length} membros, o que
            corresponde a {pct(cot.taxa)}. Ficaram em falta {cot.emFalta.length} membros.
          </p>
          <p>
            Valor cobrado no mês: <strong>{mt(cot.total)}</strong>. Valor de referência esperado: {mt(cot.esperado)}.
            Repartição nos termos do ponto 1.8.3 do Manual da Célula: <strong>{mt(cot.retidoCelula)}</strong> retidos na
            Célula (60%) e <strong>{mt(cot.paraEscalao)}</strong> a encaminhar ao escalão superior (40%).
          </p>
          {cot.emFalta.length > 0 && (
            <p className="text-ink-500">
              Membros em falta neste mês: {cot.emFalta.map((m) => m.nome).join(', ')}.
            </p>
          )}
          {atrasos.filter((a) => a.suspensivel).length > 0 && (
            <p>
              <strong>Casos para decisão:</strong>{' '}
              {atrasos.filter((a) => a.suspensivel).map((a) => `${a.membro.nome} (${a.meses} meses)`).join('; ')} —
              atingiram doze meses de incumprimento sem motivo justificado, com suspensão de direitos por um ano nos termos
              do n.º 4 do Artigo 16 dos Estatutos, até à regularização.
            </p>
          )}
        </Bloco>

        <Bloco n="5." titulo="Situação de fundos">
          <table className="w-full text-[13px] mt-1">
            <tbody>
              <tr className="border-b border-ink-100">
                <td className="py-1.5">Quotas retidas na Célula (60%)</td>
                <td className="py-1.5 text-right tnum font-bold">{mt(cot.retidoCelula)}</td>
              </tr>
              {receitas.map((m) => (
                <tr key={m.id} className="border-b border-ink-100">
                  <td className="py-1.5">{m.categoria} — {m.descricao}</td>
                  <td className="py-1.5 text-right tnum font-bold">{mt(m.valor)}</td>
                </tr>
              ))}
              {despesas.map((m) => (
                <tr key={m.id} className="border-b border-ink-100">
                  <td className="py-1.5 text-brand-700">
                    {m.categoria} — {m.descricao}
                    {m.comprovativo && <span className="text-ink-300"> (comprovativo: {m.comprovativo})</span>}
                  </td>
                  <td className="py-1.5 text-right tnum font-bold text-brand-700">− {mt(m.valor)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-ink">
                <td className="py-2 font-extrabold">Saldo acumulado da Célula</td>
                <td className="py-2 text-right tnum font-extrabold">{mt(saldo.saldo)}</td>
              </tr>
            </tbody>
          </table>
          <p className="text-[12px] text-ink-400 mt-2">
            Comprovativos: {despesas.filter((d) => d.comprovativo).length} de {despesas.length} despesas do mês com
            comprovativo anexado.
          </p>
        </Bloco>

        <Bloco n="6." titulo="Vida orgânica e órgãos da Célula">
          <p>
            Secretariado em funções:{' '}
            {membros.filter((m) => m.cargo !== 'MEMBRO').map((m) => `${m.nome} (${m.cargo === 'SECRETARIO' ? 'Secretária/o' : m.cargo === 'ASSISTENTE' ? 'Assistente' : 'Elemento de Ligação'})`).join('; ')}.
          </p>
          {e.mandatos.some((md) => md.estado === 'VAGO') && (
            <p>
              Encontra-se vago o cargo de Elemento de Ligação, por renúncia apresentada por escrito. Foi convocada eleição
              para preenchimento da vaga, com escrutínio secreto, nos termos dos Artigos 21 e 25 dos Estatutos.
            </p>
          )}
          {e.eleicoes.filter((el) => !['HOMOLOGADA', 'ANULADA'].includes(el.fase)).map((el) => (
            <p key={el.id}>
              <strong>Processo eleitoral:</strong> {el.titulo} — fase actual: {el.fase.toLowerCase().replace('_', ' ')};
              escrutínio previsto para {dataMedia(el.dataEscrutinio)}.
            </p>
          ))}
        </Bloco>

        <Bloco n="7." titulo="Considerações finais">
          <p>
            O Secretariado propõe-se, no mês seguinte, dar continuidade à cobrança de quotas com visitas domiciliárias aos
            membros em atraso, concluir o processo eleitoral em curso, prosseguir o Estudo Político e reforçar o contacto
            permanente com a comunidade do bairro, nos termos do Artigo 36 dos Estatutos.
          </p>
        </Bloco>

        <Bloco n="8." titulo="Anexos">
          <ul className="space-y-1">
            {e.documentos.filter((d) => d.categoria === 'ACTA' || d.categoria === 'CONTAS').slice(0, 4).map((d) => (
              <li key={d.id} className="flex items-center gap-2">
                <IcRelatorio className="w-3.5 h-3.5 text-ink-300 flex-none" />
                {d.titulo} ({d.paginas} páginas)
              </li>
            ))}
          </ul>
        </Bloco>

        <footer className="mt-9 pt-5 border-t border-ink-200 flex items-end justify-between gap-6">
          <div className="text-[12.5px] text-ink-500">
            <p>{e.celula.bairro}, {dataLonga(e.hoje)}</p>
            <p className="mt-8 pt-1 border-t border-ink-400 inline-block min-w-[240px] font-bold text-ink">
              {secretaria.nome}
            </p>
            <p className="text-[11.5px] text-ink-400">Secretária da {e.celula.nome}</p>
          </div>
          <div className="text-right text-[11px] text-ink-300 leading-relaxed">
            <p className="font-extrabold text-brand-600 tracking-[0.16em] uppercase text-[9.5px]">A Luta Continua</p>
            <p className="mt-1">Documento gerado pelo SGC</p>
            <p>4 páginas · limite de 5 (Manual da Célula, 1.9)</p>
          </div>
        </footer>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto no-print">
        <Card>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <span className="w-10 h-10 rounded-xl bg-verde-100 text-verde-700 grid place-items-center flex-none">
              <IcCheck className="w-5 h-5" />
            </span>
            <div className="flex-1">
              <p className="text-[13.5px] font-bold text-ink">Tudo o que consta acima veio do trabalho já registado</p>
              <p className="text-[12.5px] text-ink-400 mt-0.5 leading-relaxed">
                Presenças, cotização, movimento de fundos, processos eleitorais e órgãos em funções. O Secretariado não
                reescreve nada: revê, ajusta o texto das considerações e submete.
                <Lei id="manual_relatorio" className="ml-1.5" />
              </p>
            </div>
            <Btn variante="contorno" icone={<IcDescarregar className="w-4 h-4" />} onClick={() => window.print()}>
              Guardar em PDF
            </Btn>
          </div>
        </Card>
      </div>
    </div>
  );
};
