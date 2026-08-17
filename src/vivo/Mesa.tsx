/* ===========================================================================
   A mesa da assembleia.

   Dirige o acto: constitui as candidaturas, abre e encerra a urna, apura,
   manda para segunda volta e proclama. Vê a afluência ao segundo, mas nunca vê
   o sentido de voto de ninguém — nem enquanto a urna está aberta.
   ========================================================================= */

import React, { useMemo, useRef, useState } from 'react';
import { CARGOS_ELEITORAIS, METODOS_VOTACAO } from '../lib/estatutos';
import { normalizar } from '../lib/format';
import {
  ErroServidor, horas, voltaEmCurso, type Assembleia, type EstadoLigacao, type Sessao, type VotacaoVivo,
} from '../lib/vivo';
import {
  Abas, Alerta, Avatar, Btn, Campo, Card, Escolha, Input, Interruptor, Lei, Modal, Pill, Select, Stat, Tabela,
} from '../ui/primitives';
import {
  IcAviso, IcCheck, IcDescarregar, IcFechar, IcImprimir, IcLei, IcMais, IcMembros, IcOlho, IcRelogio, IcSair, IcUrna,
} from '../ui/icons';
import { Afluencia, BarraCandidato, CabecalhoVivo, CodigoSala, PillFase, QR, SinalLigacao } from './comuns';

type Accao = (nome: string, dados?: Record<string, unknown>) => Promise<any>;

/* ═════════════════════════════════ Utilitários ═════════════════════════════ */

function ligacaoDaSala(codigo: string): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#/votar/${codigo}`;
}

function useErro(): [string | null, (fn: () => Promise<unknown>) => Promise<void>, () => void] {
  const [erro, setErro] = useState<string | null>(null);
  const correr = async (fn: () => Promise<unknown>) => {
    setErro(null);
    try {
      await fn();
    } catch (ex) {
      setErro(ex instanceof ErroServidor ? ex.message : 'Acção recusada pelo servidor.');
    }
  };
  return [erro, correr, () => setErro(null)];
}

/* ══════════════════════════════ Nova votação ═══════════════════════════════ */

const NovaVotacao: React.FC<{ aberto: boolean; onFechar: () => void; sala: Assembleia; accao: Accao }> = ({
  aberto, onFechar, sala, accao,
}) => {
  const aptos = sala.membros.filter((m) => m.podeVotar).length;
  const [cargo, setCargo] = useState('SECRETARIO_CELULA');
  const [titulo, setTitulo] = useState(CARGOS_ELEITORAIS.SECRETARIO_CELULA.titulo);
  const [vagas, setVagas] = useState(1);
  const [metodo, setMetodo] = useState('SECRETO');
  const [efectividade, setEfectividade] = useState(aptos);
  const [exigeAceitacao, setExige] = useState(true);
  const [directo, setDirecto] = useState(false);
  const [erro, correr] = useErro();

  const meta = CARGOS_ELEITORAIS[cargo];

  const escolherCargo = (c: string) => {
    setCargo(c);
    if (c === 'OUTRO') { setTitulo(''); return; }
    setTitulo(CARGOS_ELEITORAIS[c].titulo);
    setVagas(CARGOS_ELEITORAIS[c].vagasSugeridas);
  };

  const criar = () =>
    correr(async () => {
      await accao('votacao.criar', {
        titulo,
        cargo,
        vagas,
        metodo,
        efectividade,
        exigeAceitacao,
        resultadosEmDirecto: directo,
        quorumRegra: meta?.quorum,
        base: meta?.base ?? [],
      });
      onFechar();
    });

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo="Convocar votação"
      sub="O acto fica em candidaturas até a mesa abrir a urna."
      largura="max-w-2xl"
      rodape={
        <>
          <Btn variante="fantasma" onClick={onFechar}>Cancelar</Btn>
          <Btn variante="primaria" onClick={criar} disabled={titulo.trim().length < 3}>Convocar</Btn>
        </>
      }
    >
      <div className="space-y-4">
        <Campo rotulo="Cargo a eleger">
          <Select value={cargo} onChange={(ev) => escolherCargo(ev.target.value)}>
            {Object.entries(CARGOS_ELEITORAIS).map(([id, c]) => (
              <option key={id} value={id}>{c.titulo}</option>
            ))}
            <option value="OUTRO">Outra deliberação</option>
          </Select>
        </Campo>

        {meta && (
          <div className="rounded-xl bg-ink-50 border border-ink-100 p-3">
            <p className="text-[12.5px] text-ink-500 leading-relaxed">{meta.descricao}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {meta.base.map((b) => <Lei key={b} id={b} />)}
            </div>
          </div>
        )}

        <Campo rotulo="Título do acto" obrigatorio>
          <Input value={titulo} onChange={(ev) => setTitulo(ev.target.value)} />
        </Campo>

        <div className="grid grid-cols-2 gap-4">
          <Campo rotulo="Vagas a preencher" nota="Cada eleitor assinala até este número de candidatos.">
            <Input type="number" min={1} max={30} value={vagas} onChange={(ev) => setVagas(Math.max(1, Number(ev.target.value) || 1))} />
          </Campo>
          <Campo
            rotulo="Membros em efectividade"
            nota={`Base da maioria absoluta: ${Math.floor(efectividade / 2) + 1} votos à 1.ª volta.`}
          >
            <Input type="number" min={1} value={efectividade} onChange={(ev) => setEfectividade(Math.max(1, Number(ev.target.value) || 1))} />
          </Campo>
        </div>

        <Campo rotulo="Forma de votação">
          <Escolha
            valor={metodo}
            onMudar={setMetodo}
            itens={Object.entries(METODOS_VOTACAO).map(([id, m]) => ({ id, rotulo: m.titulo, nota: m.nota }))}
          />
        </Campo>

        <div className="rounded-2xl border border-ink-100 bg-ink-50/60 p-4 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold text-ink">Consulta prévia aos candidatos</p>
              <p className="text-[12px] text-ink-400 mt-0.5 leading-snug">
                A candidatura só é admitida depois de o camarada a aceitar no telemóvel (Art. 22).
              </p>
            </div>
            <Interruptor activo={exigeAceitacao} onMudar={setExige} />
          </div>
          <div className="flex items-start justify-between gap-4 pt-3 border-t border-ink-100">
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold text-ink">Apuramento em directo</p>
              <p className="text-[12px] text-ink-400 mt-0.5 leading-snug">
                Desligado, ninguém vê votos enquanto a urna está aberta — nem a mesa. É o recomendado: um apuramento
                à vista influencia quem ainda não votou.
              </p>
            </div>
            <Interruptor activo={directo} onMudar={setDirecto} />
          </div>
        </div>

        {erro && <Alerta tom="brand" titulo="Não foi possível convocar">{erro}</Alerta>}
      </div>
    </Modal>
  );
};

/* ════════════════════════════════ Candidaturas ═════════════════════════════ */

const Candidaturas: React.FC<{ sala: Assembleia; vt: VotacaoVivo; accao: Accao }> = ({ sala, vt, accao }) => {
  const [membroId, setMembroId] = useState('');
  const [propostoPor, setPropostoPor] = useState('');
  const [erro, correr] = useErro();

  const elegiveis = sala.membros.filter((m) => m.podeSerEleito && !vt.candidatos.some((c) => c.membroId === m.id));
  const aceites = vt.candidatos.filter((c) => c.aceitou === true).length;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {vt.candidatos.map((c) => {
          const m = sala.membros.find((x) => x.id === c.membroId);
          return (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-ink-100 bg-white">
              <Avatar nome={c.nome} tamanho={36} />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-ink truncate">{c.nome}</p>
                <p className="text-[11.5px] text-ink-400 truncate">
                  {c.propostoPor ? `proposto por ${c.propostoPor}` : 'proposto pela mesa'}
                  {m && !m.ligado && ' · ainda não entrou na sala'}
                </p>
              </div>
              {c.aceitou === true && <Pill tom="verde" ponto>aceitou</Pill>}
              {c.aceitou === false && <Pill tom="brand">recusou</Pill>}
              {c.aceitou === null && <Pill tom="gold" ponto>consulta prévia</Pill>}
              <button
                onClick={() => void correr(() => accao('votacao.candidato.remover', { votacaoId: vt.id, candidatoId: c.id }))}
                className="w-8 h-8 rounded-lg grid place-items-center text-ink-300 hover:text-brand-600 hover:bg-brand-50 flex-none"
                title="Retirar candidatura"
              >
                <IcFechar className="w-4 h-4" />
              </button>
            </div>
          );
        })}
        {vt.candidatos.length === 0 && (
          <p className="text-[13px] text-ink-400 text-center py-4">
            Sem candidaturas. Proponha os camaradas — cada um recebe a consulta prévia no telemóvel.
          </p>
        )}
      </div>

      <div className="rounded-xl bg-ink-50 border border-ink-100 p-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <Select value={membroId} onChange={(ev) => setMembroId(ev.target.value)}>
          <option value="">Propor candidato…</option>
          {elegiveis.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
        </Select>
        <Input value={propostoPor} onChange={(ev) => setPropostoPor(ev.target.value)} placeholder="Proposto por (opcional)" />
        <Btn
          variante="escura"
          icone={<IcMais className="w-4 h-4" />}
          disabled={!membroId}
          onClick={() =>
            void correr(async () => {
              await accao('votacao.candidato.add', { votacaoId: vt.id, membroId, propostoPor });
              setMembroId('');
              setPropostoPor('');
            })
          }
        >
          Propor
        </Btn>
      </div>

      {erro && <Alerta tom="brand" titulo="Recusado">{erro}</Alerta>}

      {vt.candidatos.length > 0 && aceites === 0 && (
        <Alerta tom="gold" titulo="Nenhuma candidatura aceite ainda" base="art22">
          A urna só abre com pelo menos uma aceitação. Os camaradas propostos vêem o pedido no telemóvel assim que
          entrarem na sala.
        </Alerta>
      )}
    </div>
  );
};

/* ═════════════════════════════ Painel do escrutínio ════════════════════════ */

const PainelVotacao: React.FC<{ sala: Assembleia; vt: VotacaoVivo; accao: Accao }> = ({ sala, vt, accao }) => {
  const [erro, correr, limpar] = useErro();
  const [confirmarAbrir, setConfirmarAbrir] = useState(false);
  const [motivoAnular, setMotivoAnular] = useState<string | null>(null);

  const volta = voltaEmCurso(vt);
  const aptos = sala.membros.filter((m) => m.podeVotar);
  const presentes = aptos.filter((m) => m.presente).length;
  const exigido = vt.quorumRegra === 'DOIS_TERCOS'
    ? Math.ceil((vt.efectividade * 2) / 3)
    : Math.floor(vt.efectividade / 2) + 1;
  const temQuorum = presentes >= exigido;
  const ap = volta?.apuramento ?? null;

  const votaram = new Set(volta?.votantes ?? []);
  const porVotar = volta ? aptos.filter((m) => !votaram.has(m.id)) : [];

  return (
    <Card
      titulo={<span className="flex items-center gap-2">{vt.titulo} <PillFase estado={vt.estado} /></span>}
      sub={
        <>
          {vt.vagas} vaga(s) · {METODOS_VOTACAO[vt.metodo]?.titulo ?? vt.metodo} · maioria absoluta:{' '}
          <strong className="text-ink-500">{Math.floor(vt.efectividade / 2) + 1}</strong> de {vt.efectividade}
          {volta && ` · ${volta.numero}.ª volta`}
        </>
      }
      accao={
        vt.estado !== 'PROCLAMADA' && vt.estado !== 'ANULADA' ? (
          <Btn tamanho="sm" variante="fantasma" onClick={() => setMotivoAnular('')}>Anular</Btn>
        ) : null
      }
      destaque={vt.estado === 'ABERTA'}
    >
      {erro && <div className="mb-3"><Alerta tom="brand" titulo="Recusado" accao={<Btn tamanho="sm" variante="fantasma" onClick={limpar}>ok</Btn>}>{erro}</Alerta></div>}

      {/* ── fase 1: candidaturas ────────────────────────────────────────── */}
      {vt.estado === 'PREPARACAO' && (
        <div className="space-y-4">
          <Candidaturas sala={sala} vt={vt} accao={accao} />

          <div className={`rounded-xl border p-3.5 flex items-center gap-4 ${temQuorum ? 'border-verde-200 bg-verde-100/50' : 'border-gold-300/70 bg-gold-100/60'}`}>
            <span className="text-[26px] font-extrabold tnum text-ink leading-none flex-none">{presentes}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-ink leading-snug">
                {temQuorum ? 'Quórum verificado' : 'Quórum por verificar'}
              </p>
              <p className="text-[12px] text-ink-500 leading-snug">
                Presentes de {vt.efectividade} membros em efectividade; exigidos {exigido}
                {vt.quorumRegra === 'DOIS_TERCOS' ? ' (dois terços)' : ' (mais de metade)'}.
              </p>
            </div>
            <Lei id={vt.quorumRegra === 'DOIS_TERCOS' ? 'art30n1' : 'art30'} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={() => void correr(() => accao('votacao.resultados-directo', { votacaoId: vt.id }))}
              className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-ink-400 hover:text-ink"
            >
              <IcOlho className="w-4 h-4" />
              Apuramento em directo: <strong>{vt.resultadosEmDirecto ? 'ligado' : 'desligado'}</strong>
            </button>
            <Btn
              variante="primaria"
              tamanho="lg"
              icone={<IcUrna className="w-5 h-5" />}
              onClick={() => (temQuorum ? void correr(() => accao('votacao.abrir', { votacaoId: vt.id })) : setConfirmarAbrir(true))}
              disabled={vt.candidatos.filter((c) => c.aceitou === true).length === 0}
            >
              Abrir a urna
            </Btn>
          </div>
        </div>
      )}

      {/* ── fase 2: urna aberta ─────────────────────────────────────────── */}
      {vt.estado === 'ABERTA' && volta && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <Afluencia votaram={volta.votantes.length} aptos={aptos.length} tamanho={128} />
            <div className="min-w-0 flex-1 w-full">
              <p className="text-[13px] font-bold text-ink">
                {volta.votantes.length === aptos.length
                  ? 'Todos os eleitores votaram.'
                  : `Faltam ${aptos.length - volta.votantes.length} eleitores.`}
              </p>
              <p className="text-[12px] text-ink-400 mt-0.5">
                Urna aberta às {horas(volta.abertaEm)} · {presentes} presentes na sala
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {porVotar.map((m) => (
                  <span
                    key={m.id}
                    className={`text-[11.5px] font-semibold px-2 py-1 rounded-lg border ${
                      m.ligado ? 'border-gold-300 bg-gold-100/70 text-gold-700' : 'border-ink-100 bg-ink-50 text-ink-300'
                    }`}
                    title={m.ligado ? 'no sistema, ainda não votou' : 'ainda não entrou'}
                  >
                    {m.nome}
                  </span>
                ))}
                {porVotar.length === 0 && <Pill tom="verde">urna completa</Pill>}
              </div>
            </div>
          </div>

          {vt.resultadosEmDirecto && ap && (
            <div className="space-y-2">
              {ap.linhas.map((l) => (
                <BarraCandidato key={l.candidatoId} nome={l.nome} votos={l.votos} maximo={Math.max(1, ...ap.linhas.map((x) => x.votos))} />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-[11.5px] text-ink-400 leading-snug max-w-md">
              {vt.resultadosEmDirecto
                ? 'O apuramento está visível para toda a sala.'
                : 'Ninguém vê votos enquanto a urna estiver aberta — nem esta mesa.'}
            </p>
            <Btn
              variante="escura"
              tamanho="lg"
              onClick={() => void correr(() => accao('votacao.encerrar', { votacaoId: vt.id }))}
            >
              Encerrar a urna
            </Btn>
          </div>
        </div>
      )}

      {/* ── fase 3: apuramento ──────────────────────────────────────────── */}
      {vt.estado === 'ENCERRADA' && ap && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Stat rotulo="Boletins" valor={ap.expressos} />
            <Stat rotulo="Válidos" valor={ap.validos} tom="verde" />
            <Stat rotulo="Brancos" valor={ap.brancos} />
            <Stat rotulo="Nulos" valor={ap.nulos} tom="brand" />
          </div>

          <div className="space-y-2">
            {ap.linhas.map((l) => (
              <BarraCandidato
                key={l.candidatoId}
                nome={l.nome}
                votos={l.votos}
                maximo={Math.max(1, ...ap.linhas.map((x) => x.votos))}
                eleito={l.eleito}
                linha={`${l.pctExpressos.toFixed(1).replace('.', ',')}% dos expressos · ${l.pctEfectividade.toFixed(1).replace('.', ',')}% da efectividade`}
              />
            ))}
          </div>

          {ap.precisaSegundaVolta ? (
            <Alerta
              tom="gold"
              titulo="Segunda volta necessária"
              base="art25n4"
              accao={
                <Btn variante="primaria" onClick={() => void correr(() => accao('votacao.segunda-volta', { votacaoId: vt.id }))}>
                  Abrir segunda volta
                </Btn>
              }
            >
              Nenhum candidato alcançou a maioria absoluta ({ap.maioriaExigida} votos dos {ap.efectividade} membros em
              efectividade). Concorrem os {ap.candidatosSegundaVolta.length} mais votados; é eleito quem obtiver o maior
              número de votos expressos.
            </Alerta>
          ) : (
            <div className="flex items-center justify-end gap-2">
              <Btn variante="sucesso" tamanho="lg" icone={<IcCheck className="w-4 h-4" />} onClick={() => void correr(() => accao('votacao.proclamar', { votacaoId: vt.id }))}>
                Proclamar o resultado
              </Btn>
            </div>
          )}
        </div>
      )}

      {/* ── fase 4: proclamada ──────────────────────────────────────────── */}
      {vt.estado === 'PROCLAMADA' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-verde-100/60 border border-verde-200 p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-verde-800">Eleitos</p>
            {vt.eleitos.filter((x) => !x.suplente).map((x) => (
              <p key={x.nome} className="text-[19px] font-extrabold text-verde-900 mt-1 leading-tight">
                {x.nome} <span className="text-[13px] font-bold text-verde-700">· {x.votos} votos</span>
              </p>
            ))}
            {vt.eleitos.some((x) => x.suplente) && (
              <p className="text-[12.5px] text-verde-800/80 mt-2.5 leading-relaxed">
                <strong>Suplentes, pela ordem de eleição:</strong>{' '}
                {vt.eleitos.filter((x) => x.suplente).map((x, i) => `${i + 1}.º ${x.nome}`).join('; ')}.
              </p>
            )}
          </div>

          <Alerta tom="neutro" titulo="Prazo de impugnação em curso" base="art33">
            Trinta dias a contar da prática do acto — até{' '}
            {vt.prazoImpugnacao ? new Date(vt.prazoImpugnacao).toLocaleDateString('pt-PT') : '—'}.
          </Alerta>

          {vt.acta && (
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-400">Acta de eleição</p>
                <div className="flex gap-2">
                  <Btn tamanho="sm" icone={<IcDescarregar className="w-3.5 h-3.5" />} onClick={() => descarregarActa(vt)}>
                    Descarregar
                  </Btn>
                  <Btn tamanho="sm" icone={<IcImprimir className="w-3.5 h-3.5" />} onClick={() => window.print()}>
                    Imprimir
                  </Btn>
                </div>
              </div>
              <pre className="print-sheet text-[12px] leading-relaxed font-mono whitespace-pre-wrap bg-white border border-ink-100 rounded-xl p-4 max-h-80 overflow-y-auto text-ink-600">
                {vt.acta}
              </pre>
            </div>
          )}
        </div>
      )}

      {vt.estado === 'ANULADA' && <Alerta tom="neutro" titulo="Votação anulada">{vt.motivoAnulacao}</Alerta>}

      {/* abrir sem quórum */}
      <Modal
        aberto={confirmarAbrir}
        onFechar={() => setConfirmarAbrir(false)}
        titulo="Abrir a urna sem quórum?"
        largura="max-w-md"
        rodape={
          <>
            <Btn variante="fantasma" onClick={() => setConfirmarAbrir(false)}>Esperar</Btn>
            <Btn
              variante="perigo"
              onClick={() => { setConfirmarAbrir(false); void correr(() => accao('votacao.abrir', { votacaoId: vt.id, forcar: true })); }}
            >
              Abrir mesmo assim
            </Btn>
          </>
        }
      >
        <Alerta tom="brand" titulo={`${presentes} presentes; exigidos ${exigido}`} base={vt.quorumRegra === 'DOIS_TERCOS' ? 'art30n1' : 'art30'}>
          O órgão não pode deliberar validamente sem quórum. Se abrir, a falta fica registada no livro de bordo e na
          acta — é a mesa que assume a decisão.
        </Alerta>
      </Modal>

      {/* anular */}
      <Modal
        aberto={motivoAnular !== null}
        onFechar={() => setMotivoAnular(null)}
        titulo="Anular a votação"
        largura="max-w-md"
        rodape={
          <>
            <Btn variante="fantasma" onClick={() => setMotivoAnular(null)}>Cancelar</Btn>
            <Btn
              variante="perigo"
              onClick={() => { void correr(() => accao('votacao.anular', { votacaoId: vt.id, motivo: motivoAnular })); setMotivoAnular(null); }}
            >
              Anular
            </Btn>
          </>
        }
      >
        <Campo rotulo="Fundamento" obrigatorio>
          <Input value={motivoAnular ?? ''} onChange={(ev) => setMotivoAnular(ev.target.value)} placeholder="ex.: erro na composição do caderno eleitoral" />
        </Campo>
      </Modal>
    </Card>
  );
};

function descarregarActa(vt: VotacaoVivo) {
  const blob = new Blob([vt.acta ?? ''], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `acta-eleicao-${normalizar(vt.titulo).replace(/[^a-z0-9]+/g, '-')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ═════════════════════════════════ Caderno ═════════════════════════════════ */

const Caderno: React.FC<{ sala: Assembleia; accao: Accao }> = ({ sala, accao }) => {
  const [nome, setNome] = useState('');
  const [funcao, setFuncao] = useState('');
  const [erro, correr] = useErro();

  return (
    <Card
      titulo="Caderno eleitoral"
      sub={`${sala.membros.filter((m) => m.podeVotar).length} com capacidade activa · ${sala.membros.filter((m) => m.ligado).length} ligados agora`}
      pad={false}
    >
      {erro && <div className="p-4 pb-0"><Alerta tom="brand" titulo="Recusado">{erro}</Alerta></div>}
      <Tabela>
        <thead>
          <tr>
            <th>Camarada</th>
            <th className="w-24">Sala</th>
            <th className="w-20 text-center">Vota</th>
            <th className="w-24 text-center">Elegível</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {sala.membros.map((m) => (
            <tr key={m.id}>
              <td>
                <div className="flex items-center gap-2.5">
                  <Avatar nome={m.nome} tamanho={32} />
                  <div className="min-w-0">
                    <p className="font-bold text-ink truncate text-[13.5px]">{m.nome}</p>
                    {m.funcao && <p className="text-[11.5px] text-ink-400 truncate">{m.funcao}</p>}
                  </div>
                </div>
              </td>
              <td>
                {m.ligado ? <Pill tom="verde" ponto>ligado</Pill> : m.presente ? <Pill tom="neutro">presente</Pill> : <span className="text-[12px] text-ink-300">—</span>}
              </td>
              <td className="text-center">
                <input
                  type="checkbox"
                  className="sgc mx-auto"
                  checked={m.podeVotar}
                  onChange={() => void correr(() => accao('membro.capacidade', { membroId: m.id, campo: 'podeVotar' }))}
                />
              </td>
              <td className="text-center">
                <input
                  type="checkbox"
                  className="sgc mx-auto"
                  checked={m.podeSerEleito}
                  onChange={() => void correr(() => accao('membro.capacidade', { membroId: m.id, campo: 'podeSerEleito' }))}
                />
              </td>
              <td>
                <button
                  onClick={() => void correr(() => accao('membro.remover', { membroId: m.id }))}
                  className="w-7 h-7 rounded-lg grid place-items-center text-ink-300 hover:text-brand-600 hover:bg-brand-50"
                  title="Retirar do caderno"
                >
                  <IcFechar className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </Tabela>

      <div className="p-4 border-t border-ink-100 bg-ink-50/60 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <Input value={nome} onChange={(ev) => setNome(ev.target.value)} placeholder="Nome completo do camarada" />
        <Input value={funcao} onChange={(ev) => setFuncao(ev.target.value)} placeholder="Função (opcional)" />
        <Btn
          variante="escura"
          icone={<IcMais className="w-4 h-4" />}
          disabled={nome.trim().length < 3}
          onClick={() => void correr(async () => { await accao('membro.add', { nome, funcao }); setNome(''); setFuncao(''); })}
        >
          Inscrever
        </Btn>
      </div>
    </Card>
  );
};

/* ═══════════════════════════════ Credenciais ═══════════════════════════════ */

const Credenciais: React.FC<{ sala: Assembleia; accao: Accao }> = ({ sala, accao }) => {
  const ligacao = ligacaoDaSala(sala.codigo);
  const [copia, setCopia] = useState<'parado' | 'feito' | 'manual'>('parado');
  const endereco = useRef<HTMLParagraphElement>(null);
  const [, correr] = useErro();

  /* Em rede local o endereço é http://, e aí o navegador não dá acesso à área
     de transferência. Nesse caso seleccionamos o texto para um Ctrl C. */
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(ligacao);
      setCopia('feito');
      setTimeout(() => setCopia('parado'), 2000);
    } catch {
      setCopia('manual');
      const alvo = endereco.current;
      if (alvo) {
        const intervalo = document.createRange();
        intervalo.selectNodeContents(alvo);
        const seleccao = window.getSelection();
        seleccao?.removeAllRanges();
        seleccao?.addRange(intervalo);
      }
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      <Card titulo="Como entram os camaradas" className="no-print">
        <div className="flex flex-col items-center text-center">
          <QR texto={ligacao} tamanho={190} />
          <p className="text-[12px] text-ink-400 mt-3 leading-relaxed">
            Apontem a câmara do telemóvel. Ou abram o endereço e escrevam o código:
          </p>
          <div className="mt-3"><CodigoSala codigo={sala.codigo} tamanho="lg" /></div>
          <p ref={endereco} className="text-[11.5px] font-mono text-ink-400 mt-3 break-all select-all">{ligacao}</p>
          <Btn tamanho="sm" className="mt-3" onClick={copiar}>
            {copia === 'feito' ? 'Endereço copiado' : copia === 'manual' ? 'Seleccionado — Ctrl C' : 'Copiar endereço'}
          </Btn>
        </div>

        <div className="mt-5 pt-4 border-t border-ink-100 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-ink">Código pessoal obrigatório</p>
              <p className="text-[11.5px] text-ink-400 leading-snug">Garante que o voto é pessoal.</p>
            </div>
            <Interruptor activo={sala.pinObrigatorio} onMudar={(v) => void correr(() => accao('assembleia.config', { pinObrigatorio: v }))} />
          </div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-ink">Inscrição na hora</p>
              <p className="text-[11.5px] text-ink-400 leading-snug">Quem não está no caderno inscreve-se sozinho.</p>
            </div>
            <Interruptor activo={sala.registoAberto} onMudar={(v) => void correr(() => accao('assembleia.config', { registoAberto: v }))} />
          </div>
        </div>
      </Card>

      <Card
        titulo="Códigos pessoais"
        sub="Recorte e entregue a cada camarada. Só a mesa vê esta lista."
        accao={<Btn tamanho="sm" icone={<IcImprimir className="w-3.5 h-3.5" />} onClick={() => window.print()}>Imprimir</Btn>}
        pad={false}
      >
        <div className="print-sheet grid grid-cols-2 sm:grid-cols-3 gap-2 p-4">
          {sala.membros.map((m) => (
            <div key={m.id} className="rounded-xl border border-dashed border-ink-200 p-3">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-ink-300">{sala.codigo}</p>
              <p className="text-[13px] font-bold text-ink leading-tight mt-1 truncate">{m.nome}</p>
              <p className="text-[26px] font-mono font-extrabold tracking-[0.2em] text-brand-600 mt-1.5">{m.pin ?? '····'}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

/* ═══════════════════════════════ Livro de bordo ════════════════════════════ */

const LivroDeBordo: React.FC<{ sala: Assembleia }> = ({ sala }) => (
  <Card titulo="Livro de bordo" sub="Tudo o que aconteceu na assembleia, pela ordem inversa." pad={false}>
    <ul className="divide-y divide-ink-100">
      {sala.eventos.map((ev) => (
        <li key={ev.id} className="px-5 py-3 flex items-start gap-3">
          <span className="text-[11.5px] font-mono text-ink-300 tnum flex-none w-12 pt-0.5">{horas(ev.em)}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] text-ink leading-snug">{ev.texto}</span>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-ink-300">{ev.tipo}</span>
          </span>
        </li>
      ))}
      {sala.eventos.length === 0 && <li className="px-5 py-8 text-center text-sm text-ink-300">Ainda sem registos.</li>}
    </ul>
  </Card>
);

/* ══════════════════════════════════ Mesa ═══════════════════════════════════ */

export const Mesa: React.FC<{
  sala: Assembleia;
  sessao: Sessao;
  estado: EstadoLigacao;
  accao: Accao;
  ir: (r: string) => void;
  onSair: () => void;
}> = ({ sala, estado, accao, ir, onSair }) => {
  const [aba, setAba] = useState('escrutinio');
  const [nova, setNova] = useState(false);

  const aptos = sala.membros.filter((m) => m.podeVotar);
  const presentes = aptos.filter((m) => m.presente).length;
  const ligados = sala.membros.filter((m) => m.ligado).length;
  const abertas = sala.votacoes.filter((v) => v.estado === 'ABERTA' || v.estado === 'ENCERRADA').length;

  const ordenadas = useMemo(() => {
    const peso: Record<string, number> = { ABERTA: 0, ENCERRADA: 1, PREPARACAO: 2, PROCLAMADA: 3, ANULADA: 4 };
    return [...sala.votacoes].sort((a, b) => peso[a.estado] - peso[b.estado] || b.criadaEm.localeCompare(a.criadaEm));
  }, [sala.votacoes]);

  return (
    <div className="min-h-screen canvas-bg pb-12">
      <CabecalhoVivo
        titulo={sala.nome}
        sub={`${sala.orgao}${sala.local ? ` · ${sala.local}` : ''}`}
        direita={
          <>
            <SinalLigacao estado={estado} />
            <CodigoSala codigo={sala.codigo} />
            <Btn tamanho="sm" variante="contorno" icone={<IcOlho className="w-4 h-4" />} onClick={() => ir(`#/votar/${sala.codigo}/projeccao`)}>
              Projectar
            </Btn>
            <button onClick={onSair} title="Fechar a mesa neste dispositivo" className="w-9 h-9 rounded-xl grid place-items-center text-ink-400 hover:text-brand-600 hover:bg-brand-50">
              <IcSair className="w-4 h-4" />
            </button>
          </>
        }
      />

      <main className="px-4 sm:px-6 py-5 max-w-[1320px] mx-auto space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 no-print">
          <Stat rotulo="No caderno" valor={sala.membros.length} icone={<IcMembros className="w-4 h-4" />} nota={`${aptos.length} com capacidade activa`} />
          <Stat rotulo="Ligados agora" valor={ligados} tom="verde" icone={<IcRelogio className="w-4 h-4" />} nota="telemóveis na sala" />
          <Stat rotulo="Presentes" valor={presentes} icone={<IcCheck className="w-4 h-4" />} nota="marcados no acto de entrada" />
          <Stat rotulo="Actos em curso" valor={abertas} tom="brand" icone={<IcUrna className="w-4 h-4" />} nota={`${sala.votacoes.length} no total`} />
        </div>

        <div className="flex items-center justify-between gap-3 no-print">
          <Abas
            activo={aba}
            onMudar={setAba}
            itens={[
              { id: 'escrutinio', rotulo: 'Escrutínio', contagem: sala.votacoes.length },
              { id: 'caderno', rotulo: 'Caderno', contagem: sala.membros.length },
              { id: 'credenciais', rotulo: 'Credenciais' },
              { id: 'bordo', rotulo: 'Livro de bordo' },
            ]}
          />
          {aba === 'escrutinio' && (
            <Btn variante="primaria" icone={<IcMais className="w-4 h-4" />} onClick={() => setNova(true)}>
              Convocar votação
            </Btn>
          )}
        </div>

        {aba === 'escrutinio' && (
          <div className="space-y-4">
            {ordenadas.map((vt) => <PainelVotacao key={vt.id} sala={sala} vt={vt} accao={accao} />)}
            {ordenadas.length === 0 && (
              <Card>
                <div className="text-center py-8">
                  <span className="w-14 h-14 rounded-2xl bg-ink-50 text-ink-300 grid place-items-center mx-auto mb-4">
                    <IcUrna className="w-6 h-6" />
                  </span>
                  <p className="font-bold text-ink">Assembleia constituída</p>
                  <p className="text-sm text-ink-400 mt-1 max-w-md mx-auto leading-relaxed">
                    Os camaradas já podem entrar com o código <strong className="text-ink">{sala.codigo}</strong>.
                    Convoque a primeira votação quando a sala estiver composta.
                  </p>
                  <div className="mt-4 flex justify-center gap-2">
                    <Btn variante="primaria" icone={<IcMais className="w-4 h-4" />} onClick={() => setNova(true)}>Convocar votação</Btn>
                    <Btn onClick={() => setAba('credenciais')}>Ver credenciais</Btn>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {aba === 'caderno' && <Caderno sala={sala} accao={accao} />}
        {aba === 'credenciais' && <Credenciais sala={sala} accao={accao} />}
        {aba === 'bordo' && <LivroDeBordo sala={sala} />}

        {estado === 'A_RELIGAR' && (
          <Alerta tom="gold" titulo="A religar ao servidor" icone={<IcAviso className="w-4 h-4" />}>
            Os votos já depositados estão guardados no servidor. Assim que a ligação voltar, o ecrã actualiza-se.
          </Alerta>
        )}

        <p className="text-[11px] text-ink-300 text-center pt-2 flex items-center justify-center gap-1.5 no-print">
          <IcLei className="w-3.5 h-3.5" />
          O sistema guarda o boletim e o descarregamento do voto em registos separados — nem esta mesa consegue ligar
          um voto a um camarada.
        </p>
      </main>

      <NovaVotacao aberto={nova} onFechar={() => setNova(false)} sala={sala} accao={accao} />
    </div>
  );
};
