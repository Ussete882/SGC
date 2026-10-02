/* ===========================================================================
   Direcção do Círculo — Artigos 39, 53 e 56 dos Estatutos.

   O Círculo não é uma Célula maior. Tem órgãos próprios, uma cadência
   própria — de quarenta e cinco em quarenta e cinco dias — e competências
   que ninguém hoje regista em lado nenhum: o Plano de Actividade e o seu
   cumprimento, as decisões dos órgãos superiores que há que materializar,
   e a análise da situação da área de jurisdição.

   Cada separador deste ecrã serve uma alínea do Artigo 39.
   ========================================================================= */

import React, { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { cadenciaComiteCirculo, decisoesPendentes, execucaoPlano } from '../lib/selectors';
import { REGRAS } from '../lib/estatutos';
import { addDays, dataCurta, dataLonga, relativo } from '../lib/format';
import {
  Abas, Alerta, Barra, Btn, Campo, Card, Escolha, Input, Lei, Linha, Modal,
  Pill, Select, Stat, Tabela, Textarea, Vazio,
} from '../ui/primitives';
import {
  IcAviso, IcCalendario, IcCheck, IcEscudo, IcMais, IcRelatorio,
} from '../ui/icons';
import type { AccaoPlano, AnaliseSituacao, DecisaoSuperior, SessaoCirculo } from '../lib/types';

const ORGAOS: Record<SessaoCirculo['orgao'], string> = {
  COMITE: 'Comité do Círculo',
  SECRETARIADO: 'Secretariado do Comité',
  CONFERENCIA: 'Conferência do Círculo',
};

const AREAS: Record<AccaoPlano['area'], string> = {
  ORGANIZACAO: 'Organização',
  MOBILIZACAO: 'Mobilização',
  FORMACAO: 'Formação',
  FINANCAS: 'Finanças',
  COMUNIDADE: 'Comunidade',
};

const DOMINIOS: Record<AnaliseSituacao['dominio'], string> = {
  POLITICA: 'Política',
  ECONOMICA: 'Económica',
  SOCIOCULTURAL: 'Sócio-cultural',
};

const ESTADO_ACCAO: Record<AccaoPlano['estado'], { rotulo: string; tom: 'neutro' | 'gold' | 'verde' }> = {
  POR_INICIAR: { rotulo: 'Por iniciar', tom: 'neutro' },
  EM_CURSO: { rotulo: 'Em curso', tom: 'gold' },
  CONCLUIDA: { rotulo: 'Concluída', tom: 'verde' },
};

const ESTADO_DECISAO: Record<DecisaoSuperior['estado'], { rotulo: string; tom: 'brand' | 'gold' | 'verde' }> = {
  RECEBIDA: { rotulo: 'Recebida', tom: 'brand' },
  EM_EXECUCAO: { rotulo: 'Em execução', tom: 'gold' },
  MATERIALIZADA: { rotulo: 'Materializada', tom: 'verde' },
};

/* ════════════════════════════ Agendar sessão ═══════════════════════════════ */

const NovaSessao: React.FC<{ aberto: boolean; onFechar: () => void }> = ({ aberto, onFechar }) => {
  const { e, agendarSessaoCirculo } = useStore();
  const cad = useMemo(() => cadenciaComiteCirculo(e), [e]);

  const [orgao, setOrgao] = useState<SessaoCirculo['orgao']>('COMITE');
  const [data, setData] = useState(cad.limite ?? addDays(e.hoje, 7));
  const [hora, setHora] = useState('09:00');
  const [local, setLocal] = useState(e.circulo.nome);
  const [convocados, setConvocados] = useState('25');
  const [extraordinaria, setExtraordinaria] = useState(false);
  const [pontos, setPontos] = useState('Informação do Secretariado\nCumprimento do Plano de Trabalho\nDiversos');

  const guardar = () => {
    agendarSessaoCirculo({
      orgao,
      data,
      hora,
      local,
      extraordinaria,
      convocados: Number(convocados) || 0,
      ordemTrabalhos: pontos.split('\n').map((p) => p.trim()).filter(Boolean),
    });
    onFechar();
  };

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo="Agendar sessão"
      sub="Órgãos do Círculo — Art. 38"
      rodape={
        <>
          <Btn variante="fantasma" onClick={onFechar}>Cancelar</Btn>
          <Btn variante="primaria" onClick={guardar} disabled={!data || !local}>Agendar</Btn>
        </>
      }
    >
      <div className="space-y-4">
        <Campo rotulo="Órgão" obrigatorio>
          <Escolha
            valor={orgao}
            onMudar={(x) => setOrgao(x as SessaoCirculo['orgao'])}
            itens={[
              { id: 'COMITE', rotulo: ORGAOS.COMITE, nota: 'Reúne de 45 em 45 dias (Art. 53 n.º 1 a)' },
              { id: 'SECRETARIADO', rotulo: ORGAOS.SECRETARIADO, nota: 'Assegura a execução e o aparelho (Art. 56)' },
              { id: 'CONFERENCIA', rotulo: ORGAOS.CONFERENCIA, nota: 'De cinco em cinco anos (Art. 50)' },
            ]}
          />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Data" obrigatorio>
            <Input type="date" value={data} onChange={(ev) => setData(ev.target.value)} />
          </Campo>
          <Campo rotulo="Hora">
            <Input type="time" value={hora} onChange={(ev) => setHora(ev.target.value)} />
          </Campo>
        </div>

        <Campo rotulo="Local" obrigatorio>
          <Input value={local} onChange={(ev) => setLocal(ev.target.value)} />
        </Campo>

        <Campo rotulo="Convocados" nota="Número de membros do órgão a convocar.">
          <Input type="number" min={1} value={convocados} onChange={(ev) => setConvocados(ev.target.value)} />
        </Campo>

        <Campo rotulo="Ordem de trabalhos" nota="Um ponto por linha.">
          <Textarea value={pontos} onChange={(ev) => setPontos(ev.target.value)} />
        </Campo>

        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            className="sgc"
            checked={extraordinaria}
            onChange={(ev) => setExtraordinaria(ev.target.checked)}
          />
          <span className="text-[13px] font-semibold text-ink-600">
            Sessão extraordinária — não conta para a cadência ordinária
          </span>
        </label>
      </div>
    </Modal>
  );
};

/* ═══════════════════════════ Realizar sessão ═══════════════════════════════ */

const FecharSessao: React.FC<{ sessao: SessaoCirculo | null; onFechar: () => void }> = ({ sessao, onFechar }) => {
  const { realizarSessaoCirculo } = useStore();
  const [presentes, setPresentes] = useState('');
  const [deliberacoes, setDeliberacoes] = useState('');

  if (!sessao) return null;
  return (
    <Modal
      aberto
      onFechar={onFechar}
      titulo={`${ORGAOS[sessao.orgao]} — sessão n.º ${sessao.numero}`}
      sub={dataLonga(sessao.data)}
      rodape={
        <>
          <Btn variante="fantasma" onClick={onFechar}>Cancelar</Btn>
          <Btn
            variante="sucesso"
            disabled={!presentes}
            onClick={() => {
              realizarSessaoCirculo(sessao.id, {
                presentes: Number(presentes) || 0,
                deliberacoes: deliberacoes.split('\n').map((d) => d.trim()).filter(Boolean),
              });
              onFechar();
            }}
          >
            Registar como realizada
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <Campo rotulo="Presentes" obrigatorio nota={`De ${sessao.convocados} convocados.`}>
          <Input type="number" min={0} max={sessao.convocados} value={presentes} onChange={(ev) => setPresentes(ev.target.value)} />
        </Campo>
        <Campo rotulo="Deliberações" nota="Uma por linha. Ficam no registo da sessão.">
          <Textarea value={deliberacoes} onChange={(ev) => setDeliberacoes(ev.target.value)} placeholder="Aprovado o Relatório do Secretariado&#10;Fixado o calendário de visitas às Células" />
        </Campo>
      </div>
    </Modal>
  );
};

/* ═════════════════════════════ Nova acção ══════════════════════════════════ */

const NovaAccao: React.FC<{ ano: number; aberto: boolean; onFechar: () => void }> = ({ ano, aberto, onFechar }) => {
  const { e, addAccaoPlano } = useStore();
  const [titulo, setTitulo] = useState('');
  const [area, setArea] = useState<AccaoPlano['area']>('ORGANIZACAO');
  const [responsavel, setResponsavel] = useState('');
  const [prazo, setPrazo] = useState(addDays(e.hoje, 30));

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo="Acção do Plano de Actividade"
      sub={`Plano de ${ano} — Art. 39 i)`}
      rodape={
        <>
          <Btn variante="fantasma" onClick={onFechar}>Cancelar</Btn>
          <Btn
            variante="primaria"
            disabled={!titulo.trim() || !responsavel.trim()}
            onClick={() => {
              addAccaoPlano(ano, { titulo: titulo.trim(), area, responsavel: responsavel.trim(), prazo, estado: 'POR_INICIAR' });
              onFechar();
            }}
          >
            Acrescentar
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <Campo rotulo="Acção" obrigatorio>
          <Input value={titulo} onChange={(ev) => setTitulo(ev.target.value)} placeholder="Ex.: Visitar as onze Células e levantar o estado dos cadernos" />
        </Campo>
        <Campo rotulo="Área">
          <Select value={area} onChange={(ev) => setArea(ev.target.value as AccaoPlano['area'])}>
            {Object.entries(AREAS).map(([id, r]) => <option key={id} value={id}>{r}</option>)}
          </Select>
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Responsável" obrigatorio>
            <Input value={responsavel} onChange={(ev) => setResponsavel(ev.target.value)} placeholder="Nome do camarada" />
          </Campo>
          <Campo rotulo="Prazo">
            <Input type="date" value={prazo} onChange={(ev) => setPrazo(ev.target.value)} />
          </Campo>
        </div>
      </div>
    </Modal>
  );
};

/* ═══════════════════════════ Nova decisão ══════════════════════════════════ */

const NovaDecisao: React.FC<{ aberto: boolean; onFechar: () => void }> = ({ aberto, onFechar }) => {
  const { e, registarDecisaoSuperior } = useStore();
  const [origem, setOrigem] = useState('');
  const [referencia, setReferencia] = useState('');
  const [sumario, setSumario] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [prazo, setPrazo] = useState(addDays(e.hoje, 30));

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo="Decisão de órgão superior"
      sub="Compete ao Comité garantir a sua materialização — Art. 39 b)"
      rodape={
        <>
          <Btn variante="fantasma" onClick={onFechar}>Cancelar</Btn>
          <Btn
            variante="primaria"
            disabled={!origem.trim() || !sumario.trim() || !responsavel.trim()}
            onClick={() => {
              registarDecisaoSuperior({
                origem: origem.trim(),
                referencia: referencia.trim(),
                recebidaEm: e.hoje,
                sumario: sumario.trim(),
                responsavel: responsavel.trim(),
                prazo,
              });
              onFechar();
            }}
          >
            Registar
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Órgão de origem" obrigatorio>
            <Input value={origem} onChange={(ev) => setOrigem(ev.target.value)} placeholder="Ex.: Comité Distrital" />
          </Campo>
          <Campo rotulo="Referência" nota="Ofício, acta ou directiva.">
            <Input value={referencia} onChange={(ev) => setReferencia(ev.target.value)} placeholder="Ex.: Ofício 14/CD/2026" />
          </Campo>
        </div>
        <Campo rotulo="O que foi decidido" obrigatorio>
          <Textarea value={sumario} onChange={(ev) => setSumario(ev.target.value)} />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Responsável pela execução" obrigatorio>
            <Input value={responsavel} onChange={(ev) => setResponsavel(ev.target.value)} />
          </Campo>
          <Campo rotulo="Prazo">
            <Input type="date" value={prazo} onChange={(ev) => setPrazo(ev.target.value)} />
          </Campo>
        </div>
      </div>
    </Modal>
  );
};

/* ═══════════════════════════ Nova análise ══════════════════════════════════ */

const NovaAnalise: React.FC<{ aberto: boolean; onFechar: () => void }> = ({ aberto, onFechar }) => {
  const { e, registarAnalise } = useStore();
  const [dominio, setDominio] = useState<AnaliseSituacao['dominio']>('POLITICA');
  const [periodo, setPeriodo] = useState(e.hoje.slice(0, 7));
  const [sintese, setSintese] = useState('');

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo="Análise da situação"
      sub="Área de jurisdição do Círculo — Art. 39 h)"
      rodape={
        <>
          <Btn variante="fantasma" onClick={onFechar}>Cancelar</Btn>
          <Btn
            variante="primaria"
            disabled={!sintese.trim()}
            onClick={() => { registarAnalise({ dominio, periodo, sintese: sintese.trim() }); onFechar(); }}
          >
            Registar
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <Campo rotulo="Domínio">
          <Escolha
            valor={dominio}
            onMudar={(x) => setDominio(x as AnaliseSituacao['dominio'])}
            colunas={3}
            itens={Object.entries(DOMINIOS).map(([id, rotulo]) => ({ id, rotulo }))}
          />
        </Campo>
        <Campo rotulo="Período" nota="Mês a que a análise se refere.">
          <Input type="month" value={periodo} onChange={(ev) => setPeriodo(ev.target.value)} />
        </Campo>
        <Campo rotulo="Síntese" obrigatorio nota="Fica disponível ao Comité entre sessões.">
          <Textarea value={sintese} onChange={(ev) => setSintese(ev.target.value)} className="min-h-[140px]" />
        </Campo>
      </div>
    </Modal>
  );
};

/* ══════════════════════════════ A vista ════════════════════════════════════ */

export const CirculoDireccao: React.FC = () => {
  const { e, params, mudarEstadoAccao, mudarEstadoDecisao, criarPlano, aprovarPlano } = useStore();

  const [aba, setAba] = useState<'sessoes' | 'plano' | 'decisoes' | 'analises'>(
    (params.tab as 'sessoes' | 'plano' | 'decisoes' | 'analises') || 'sessoes',
  );
  const [novaSessao, setNovaSessao] = useState(false);
  const [fechar, setFechar] = useState<SessaoCirculo | null>(null);
  const [novaAccao, setNovaAccao] = useState(false);
  const [novaDecisao, setNovaDecisao] = useState(false);
  const [novaAnalise, setNovaAnalise] = useState(false);

  const cad = useMemo(() => cadenciaComiteCirculo(e), [e]);
  const plano = useMemo(() => execucaoPlano(e), [e]);
  const dec = useMemo(() => decisoesPendentes(e), [e]);

  const sessoes = [...e.sessoesCirculo].sort((a, b) => (a.data > b.data ? -1 : 1));

  return (
    <div className="space-y-5">
      {/* ─────────────────── o estado do Círculo em quatro números ───────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <Stat
          rotulo="Cadência do Comité"
          valor={cad.ultima ? `${cad.diasDesde}d` : '—'}
          tom={cad.emFalta ? 'brand' : cad.aAproximar ? 'gold' : 'verde'}
          nota={
            cad.ultima
              ? `desde a última sessão · limite de ${REGRAS.CADENCIA_COMITE_CIRCULO_DIAS} dias`
              : 'sem sessão ordinária registada'
          }
          icone={<IcCalendario className="w-5 h-5" />}
        />
        <Stat
          rotulo="Plano de Actividade"
          valor={plano.plano ? `${plano.taxa}%` : '—'}
          tom={plano.taxa >= 70 ? 'verde' : plano.taxa > 0 ? 'gold' : 'neutro'}
          nota={plano.plano ? `${plano.concluidas} de ${plano.total} acções concluídas` : `sem Plano para ${plano.ano}`}
          icone={<IcRelatorio className="w-5 h-5" />}
        />
        <Stat
          rotulo="Decisões por materializar"
          valor={dec.abertas.length}
          tom={dec.foraDePrazo.length ? 'brand' : 'neutro'}
          nota={dec.foraDePrazo.length ? `${dec.foraDePrazo.length} fora de prazo` : 'nenhuma fora de prazo'}
          icone={<IcEscudo className="w-5 h-5" />}
        />
        <Stat
          rotulo="Células subordinadas"
          valor={e.celulasCirculo.length}
          nota="cujo funcionamento compete velar"
          icone={<IcCheck className="w-5 h-5" />}
        />
      </div>

      {cad.emFalta && (
        <Alerta
          tom="brand"
          titulo="O Comité do Círculo está fora da cadência ordinária"
          base="art53"
          accao={<Btn tamanho="sm" variante="primaria" onClick={() => setNovaSessao(true)}>Agendar</Btn>}
        >
          A última sessão ordinária foi a {dataCurta(cad.ultima!.data)}, há {cad.diasDesde} dias. Os Estatutos fixam
          quarenta e cinco dias, e não há sessão agendada.
        </Alerta>
      )}
      {cad.aAproximar && (
        <Alerta
          tom="gold"
          titulo="A cadência do Comité aproxima-se do limite"
          base="art53"
          accao={<Btn tamanho="sm" variante="contorno" onClick={() => setNovaSessao(true)}>Agendar</Btn>}
        >
          O prazo de quarenta e cinco dias termina a {dataCurta(cad.limite!)}.
        </Alerta>
      )}

      <Abas
        activo={aba}
        onMudar={(x) => setAba(x as typeof aba)}
        itens={[
          { id: 'sessoes', rotulo: 'Sessões', contagem: sessoes.length },
          { id: 'plano', rotulo: 'Plano de Actividade', contagem: plano.total },
          { id: 'decisoes', rotulo: 'Decisões superiores', contagem: dec.abertas.length },
          { id: 'analises', rotulo: 'Análise da situação', contagem: e.analises.length },
        ]}
      />

      {/* ─────────────────────────────── Sessões ─────────────────────────── */}
      {aba === 'sessoes' && (
        <Card
          titulo="Sessões dos órgãos do Círculo"
          sub="Conferência, Comité e Secretariado — Art. 38"
          accao={<Btn variante="primaria" icone={<IcMais className="w-4 h-4" />} onClick={() => setNovaSessao(true)}>Agendar sessão</Btn>}
          pad={false}
        >
          {sessoes.length === 0 ? (
            <Vazio
              titulo="Sem sessões registadas"
              texto="O Comité do Círculo reúne ordinariamente de quarenta e cinco em quarenta e cinco dias."
              icone={<IcCalendario className="w-6 h-6" />}
              accao={<Btn variante="primaria" onClick={() => setNovaSessao(true)}>Agendar a primeira</Btn>}
            />
          ) : (
            <Tabela>
              <thead>
                <tr>
                  <th>Órgão</th><th>Data</th><th>Ordem de trabalhos</th><th>Presenças</th><th>Estado</th><th />
                </tr>
              </thead>
              <tbody>
                {sessoes.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <p className="font-bold text-ink">{ORGAOS[s.orgao]}</p>
                      <p className="text-[11.5px] text-ink-400">
                        n.º {s.numero}{s.extraordinaria ? ' · extraordinária' : ''}
                      </p>
                    </td>
                    <td>
                      <p className="font-semibold">{dataCurta(s.data)}</p>
                      <p className="text-[11.5px] text-ink-400">{relativo(s.data, e.hoje)} · {s.hora}</p>
                    </td>
                    <td className="text-[12.5px] text-ink-500">
                      {s.ordemTrabalhos.slice(0, 2).join(' · ')}
                      {s.ordemTrabalhos.length > 2 && ` · +${s.ordemTrabalhos.length - 2}`}
                    </td>
                    <td className="tnum">
                      {s.presentes !== undefined ? `${s.presentes}/${s.convocados}` : `— /${s.convocados}`}
                    </td>
                    <td>
                      <Pill tom={s.estado === 'REALIZADA' ? 'verde' : s.estado === 'CANCELADA' ? 'neutro' : 'gold'}>
                        {s.estado === 'REALIZADA' ? 'realizada' : s.estado === 'CANCELADA' ? 'cancelada' : 'agendada'}
                      </Pill>
                    </td>
                    <td className="text-right">
                      {s.estado === 'AGENDADA' && (
                        <Btn tamanho="sm" variante="suave" onClick={() => setFechar(s)}>Registar</Btn>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Tabela>
          )}
        </Card>
      )}

      {/* ──────────────────────── Plano de Actividade ────────────────────── */}
      {aba === 'plano' && (
        <Card
          titulo={`Plano de Actividade de ${plano.ano}`}
          sub="Compete ao Comité elaborá-lo e analisar o seu cumprimento — Art. 39 i) e d)"
          accao={
            plano.plano ? (
              <div className="flex items-center gap-2">
                {!plano.plano.aprovadoEm && (
                  <Btn tamanho="sm" variante="contorno" onClick={() => aprovarPlano(plano.ano)}>Aprovar</Btn>
                )}
                <Btn tamanho="sm" variante="primaria" icone={<IcMais className="w-4 h-4" />} onClick={() => setNovaAccao(true)}>Acção</Btn>
              </div>
            ) : (
              <Btn variante="primaria" onClick={() => criarPlano(plano.ano)}>Criar o Plano</Btn>
            )
          }
          pad={false}
        >
          {!plano.plano ? (
            <Vazio
              titulo={`Sem Plano de Actividade para ${plano.ano}`}
              texto="É competência do Comité do Círculo elaborar o seu Plano de Actividade."
              icone={<IcRelatorio className="w-6 h-6" />}
              accao={<Btn variante="primaria" onClick={() => criarPlano(plano.ano)}>Criar o Plano</Btn>}
            />
          ) : (
            <>
              <div className="px-6 py-5 border-b border-areia-200">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <p className="rotulo text-ink-400">Execução</p>
                  <p className="text-[13px] font-bold text-ink tnum">
                    {plano.concluidas} de {plano.total}
                    {plano.atrasadas.length > 0 && (
                      <span className="text-brand-600"> · {plano.atrasadas.length} em atraso</span>
                    )}
                  </p>
                </div>
                <Barra valor={plano.taxa} tom={plano.taxa >= 70 ? 'bg-verde-600' : 'bg-gold-500'} />
                <div className="mt-3">
                  {plano.plano.aprovadoEm
                    ? <Pill tom="verde">aprovado a {dataCurta(plano.plano.aprovadoEm)}</Pill>
                    : <Pill tom="gold">por aprovar em sessão do Comité</Pill>}
                </div>
              </div>
              {plano.total === 0 ? (
                <Vazio titulo="Plano sem acções" texto="Acrescente as acções, com responsável e prazo." icone={<IcMais className="w-6 h-6" />} />
              ) : (
                <ul className="divide-y divide-areia-200">
                  {plano.plano.accoes.map((a) => {
                    const atrasada = a.estado !== 'CONCLUIDA' && a.prazo < e.hoje;
                    return (
                      <li key={a.id} className="px-6 py-4 flex flex-wrap items-center gap-3">
                        <div className="min-w-0 flex-1 basis-56">
                          <p className="text-[13.5px] font-bold text-ink">{a.titulo}</p>
                          <p className="text-[11.5px] text-ink-400 mt-0.5">
                            {AREAS[a.area]} · {a.responsavel} · prazo {dataCurta(a.prazo)}
                            {atrasada && <span className="text-brand-600 font-bold"> · em atraso</span>}
                          </p>
                        </div>
                        <Pill tom={ESTADO_ACCAO[a.estado].tom}>{ESTADO_ACCAO[a.estado].rotulo}</Pill>
                        <Select
                          value={a.estado}
                          onChange={(ev) => mudarEstadoAccao(plano.ano, a.id, ev.target.value as AccaoPlano['estado'])}
                          className="!w-auto !py-2"
                        >
                          {Object.entries(ESTADO_ACCAO).map(([id, v]) => (
                            <option key={id} value={id}>{v.rotulo}</option>
                          ))}
                        </Select>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </Card>
      )}

      {/* ───────────────────────── Decisões superiores ───────────────────── */}
      {aba === 'decisoes' && (
        <Card
          titulo="Decisões dos órgãos superiores"
          sub="Compete ao Comité garantir a sua materialização — Art. 39 b)"
          accao={<Btn variante="primaria" icone={<IcMais className="w-4 h-4" />} onClick={() => setNovaDecisao(true)}>Registar decisão</Btn>}
          pad={false}
          destaque={dec.foraDePrazo.length > 0}
        >
          {e.decisoesSuperiores.length === 0 ? (
            <Vazio
              titulo="Sem decisões registadas"
              texto="Cada decisão recebida de órgão superior fica aqui, com responsável e prazo, até estar materializada."
              icone={<IcEscudo className="w-6 h-6" />}
              accao={<Btn variante="primaria" onClick={() => setNovaDecisao(true)}>Registar a primeira</Btn>}
            />
          ) : (
            <ul className="divide-y divide-areia-200">
              {e.decisoesSuperiores.map((d) => {
                const fora = d.estado !== 'MATERIALIZADA' && d.prazo < e.hoje;
                return (
                  <li key={d.id} className="px-6 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 basis-64">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="rotulo text-ink-400">{d.origem}</p>
                          {d.referencia && <span className="text-[11px] font-mono text-ink-300">{d.referencia}</span>}
                        </div>
                        <p className="text-[13.5px] text-ink leading-relaxed">{d.sumario}</p>
                        <p className="text-[11.5px] text-ink-400 mt-1.5">
                          {d.responsavel} · prazo {dataCurta(d.prazo)}
                          {fora && <span className="text-brand-600 font-bold"> · fora de prazo</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-none">
                        <Pill tom={ESTADO_DECISAO[d.estado].tom}>{ESTADO_DECISAO[d.estado].rotulo}</Pill>
                        <Select
                          value={d.estado}
                          onChange={(ev) => mudarEstadoDecisao(d.id, ev.target.value as DecisaoSuperior['estado'])}
                          className="!w-auto !py-2"
                        >
                          {Object.entries(ESTADO_DECISAO).map(([id, v]) => (
                            <option key={id} value={id}>{v.rotulo}</option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}

      {/* ───────────────────────── Análise da situação ───────────────────── */}
      {aba === 'analises' && (
        <Card
          titulo="Análise da situação da área de jurisdição"
          sub="Política, económica e sócio-cultural — Art. 39 h)"
          accao={<Btn variante="primaria" icone={<IcMais className="w-4 h-4" />} onClick={() => setNovaAnalise(true)}>Registar análise</Btn>}
          pad={false}
        >
          {e.analises.length === 0 ? (
            <Vazio
              titulo="Sem análises registadas"
              texto="As análises que o Comité faz em sessão ficam aqui, disponíveis entre sessões e para o relatório ao escalão superior."
              icone={<IcAviso className="w-6 h-6" />}
              accao={<Btn variante="primaria" onClick={() => setNovaAnalise(true)}>Registar a primeira</Btn>}
            />
          ) : (
            <ul className="divide-y divide-areia-200">
              {e.analises.map((a) => (
                <li key={a.id} className="px-6 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Pill tom="azul">{DOMINIOS[a.dominio]}</Pill>
                    <span className="text-[11.5px] text-ink-400">{a.periodo}</span>
                    <span className="text-[11.5px] text-ink-300">· registada a {dataCurta(a.registadaEm)}</span>
                  </div>
                  <p className="text-[13.5px] text-ink-600 leading-relaxed whitespace-pre-line">{a.sintese}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <Card titulo="Base normativa deste ecrã" sub="Estatutos da FRELIMO, edição de 6 de Fevereiro de 2023">
        <div className="space-y-0.5">
          <Linha rotulo="Órgãos do Círculo"><Lei id="art38" /></Linha>
          <Linha rotulo="Decisões dos órgãos superiores"><Lei id="art39b" /></Linha>
          <Linha rotulo="Relatório do Secretariado"><Lei id="art39c" /></Linha>
          <Linha rotulo="Cumprimento do Plano de Trabalho"><Lei id="art39d" /></Linha>
          <Linha rotulo="Velar pelas Células subordinadas"><Lei id="art39f" /></Linha>
          <Linha rotulo="Análise da situação"><Lei id="art39h" /></Linha>
          <Linha rotulo="Plano de Actividade"><Lei id="art39i" /></Linha>
          <Linha rotulo="Periodicidade das sessões"><Lei id="art53" /></Linha>
          <Linha rotulo="Competências dos Secretariados"><Lei id="art56" /></Linha>
        </div>
      </Card>

      <NovaSessao aberto={novaSessao} onFechar={() => setNovaSessao(false)} />
      <FecharSessao sessao={fechar} onFechar={() => setFechar(null)} />
      <NovaAccao ano={plano.ano} aberto={novaAccao} onFechar={() => setNovaAccao(false)} />
      <NovaDecisao aberto={novaDecisao} onFechar={() => setNovaDecisao(false)} />
      <NovaAnalise aberto={novaAnalise} onFechar={() => setNovaAnalise(false)} />
    </div>
  );
};
