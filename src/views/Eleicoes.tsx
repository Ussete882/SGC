import React, { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { useStore } from '../lib/store';
import { CARGOS_ELEITORAIS, METODOS_VOTACAO, REGRAS } from '../lib/estatutos';
import { apurar, assiduidadeDe, efectivos, progressoMandato } from '../lib/selectors';
import { MEMBROS_EXTERNOS } from '../lib/seed';
import { addDays, dataLonga, dataMedia, diffDays, nomeCurto, num, pct, relativo } from '../lib/format';
import {
  Alerta, Anel, Avatar, Barra, Btn, Campo, Card, Escolha, Input, Lei, Linha, Modal, Passos, Pill,
  Segmentado, Select, Stat, Tabela, Textarea, Vazio,
} from '../ui/primitives';
import {
  IcAlvo, IcAviso, IcCheck, IcEscudo, IcFechar, IcLei, IcMais, IcSeta, IcSetaEsq, IcUrna,
} from '../ui/icons';
import type { CargoEleitoral, Eleicao, FaseEleicao, MetodoVotacao } from '../lib/types';

const FASES: { id: FaseEleicao; rotulo: string }[] = [
  { id: 'CONVOCADA', rotulo: 'Convocação' },
  { id: 'CADERNO', rotulo: 'Caderno eleitoral' },
  { id: 'CANDIDATURAS', rotulo: 'Candidaturas' },
  { id: 'ESCRUTINIO', rotulo: 'Escrutínio' },
  { id: 'PROCLAMADA', rotulo: 'Proclamação' },
];

const FASE_TOM: Record<FaseEleicao, 'neutro' | 'gold' | 'azul' | 'brand' | 'verde' | 'roxo'> = {
  CONVOCADA: 'neutro',
  CADERNO: 'azul',
  CANDIDATURAS: 'gold',
  ESCRUTINIO: 'brand',
  SEGUNDA_VOLTA: 'brand',
  PROCLAMADA: 'verde',
  HOMOLOGADA: 'verde',
  ANULADA: 'neutro',
};

const FASE_ROTULO: Record<FaseEleicao, string> = {
  CONVOCADA: 'convocada',
  CADERNO: 'caderno eleitoral',
  CANDIDATURAS: 'candidaturas abertas',
  ESCRUTINIO: 'escrutínio em curso',
  SEGUNDA_VOLTA: 'segunda volta',
  PROCLAMADA: 'proclamada',
  HOMOLOGADA: 'homologada',
  ANULADA: 'anulada',
};

function indiceFase(f: FaseEleicao): number {
  if (f === 'SEGUNDA_VOLTA') return 3;
  if (f === 'HOMOLOGADA') return 4;
  const i = FASES.findIndex((x) => x.id === f);
  return i < 0 ? 0 : i;
}

/* ═══════════════════════════ Assistente de convocação ══════════════════════ */

const ConvocarEleicao: React.FC<{ aberto: boolean; onFechar: () => void; onCriada: (id: string) => void }> = ({
  aberto, onFechar, onCriada,
}) => {
  const { e, criarEleicao } = useStore();
  const [cargo, setCargo] = useState<CargoEleitoral>('SECRETARIO_CELULA');
  const [vagas, setVagas] = useState(1);
  const [metodo, setMetodo] = useState<MetodoVotacao>('SECRETO');
  const [data, setData] = useState(addDays(e.hoje, 30));
  const [obs, setObs] = useState('');

  const meta = CARGOS_ELEITORAIS[cargo];

  useEffect(() => {
    if (aberto) {
      setCargo('SECRETARIO_CELULA');
      setVagas(1);
      setMetodo('SECRETO');
      setData(addDays(e.hoje, 30));
      setObs('');
    }
  }, [aberto, e.hoje]);

  useEffect(() => { setVagas(CARGOS_ELEITORAIS[cargo].vagasSugeridas); }, [cargo]);

  const presidiumInvalido = cargo === 'PRESIDIUM_CONFERENCIA' && (vagas < REGRAS.PRESIDIUM_MIN || vagas > REGRAS.PRESIDIUM_MAX);

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      largura="max-w-2xl"
      titulo="Convocar eleição"
      sub="Todos os órgãos e dirigentes do Partido são eleitos democraticamente"
      rodape={
        <>
          <Btn variante="fantasma" onClick={onFechar}>Cancelar</Btn>
          <Btn
            variante="primaria"
            disabled={presidiumInvalido}
            onClick={() => {
              const el = criarEleicao({ cargo, vagas, metodo, dataEscrutinio: data, observacoes: obs || undefined });
              onFechar();
              onCriada(el.id);
            }}
          >
            Convocar e abrir processo
          </Btn>
        </>
      }
    >
      <div className="space-y-5">
        <Campo rotulo="Cargo a eleger" obrigatorio>
          <Select value={cargo} onChange={(ev) => setCargo(ev.target.value as CargoEleitoral)}>
            <optgroup label="Órgãos da Célula">
              <option value="SECRETARIO_CELULA">Secretário da Célula</option>
              <option value="ASSISTENTES_CELULA">Assistentes do Secretariado</option>
              <option value="ELEMENTO_LIGACAO">Elemento de Ligação</option>
              <option value="DELEGADOS_CONFERENCIA_CIRCULO">Delegados à Conferência do Círculo</option>
            </optgroup>
            <optgroup label="Escalão do Círculo">
              <option value="PRIMEIRO_SECRETARIO_CIRCULO">Primeiro Secretário do Comité do Círculo</option>
              <option value="SECRETARIADO_CIRCULO">Secretariado do Comité do Círculo</option>
              <option value="COMITE_VERIFICACAO">Comité de Verificação</option>
            </optgroup>
            <optgroup label="Conferência do Círculo">
              <option value="COMITE_CIRCULO">Comité do Círculo</option>
              <option value="PRESIDIUM_CONFERENCIA">Presidium da Conferência</option>
            </optgroup>
          </Select>
        </Campo>

        <div className="rounded-2xl bg-ink text-white p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <p className="text-[15px] font-extrabold">{meta.titulo}</p>
            <Pill className="!bg-white/10 !text-white/70 !border-white/15">{meta.escopo === 'CELULA' ? 'Célula' : meta.escopo === 'CIRCULO' ? 'Círculo' : 'Conferência'}</Pill>
          </div>
          <p className="text-[12.5px] text-white/60 leading-relaxed">{meta.descricao}</p>
          <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-3 text-[12px]">
            <div>
              <p className="text-white/35 text-[10px] font-extrabold uppercase tracking-[0.12em]">Órgão que elege</p>
              <p className="font-bold mt-0.5">{meta.orgaoEleitor}</p>
            </div>
            <div>
              <p className="text-white/35 text-[10px] font-extrabold uppercase tracking-[0.12em]">Quórum exigido</p>
              <p className="font-bold mt-0.5">{meta.quorum === 'DOIS_TERCOS' ? 'dois terços dos membros' : 'mais de metade dos membros'}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {meta.base.map((b) => (
              <span key={b} className="[&>button]:!bg-white/10 [&>button]:!text-white/70 [&>button]:!border-white/15">
                <Lei id={b} />
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Campo
            rotulo="Número de vagas"
            obrigatorio
            nota={cargo === 'PRESIDIUM_CONFERENCIA' ? 'Três a nove membros, sendo um presidente e dois secretários.' : undefined}
          >
            <Input
              type="number"
              min={1}
              max={30}
              value={vagas}
              onChange={(ev) => setVagas(Number(ev.target.value))}
              className={presidiumInvalido ? '!border-brand-500' : ''}
            />
          </Campo>
          <Campo rotulo="Data do escrutínio" obrigatorio nota={`Mandato de ${REGRAS.MANDATO_ANOS} anos a partir do dia seguinte.`}>
            <Input type="date" value={data} min={e.hoje} onChange={(ev) => setData(ev.target.value)} />
          </Campo>
        </div>

        <Campo rotulo="Forma de votação" obrigatorio>
          <Escolha
            valor={metodo}
            onMudar={(v) => setMetodo(v as MetodoVotacao)}
            itens={Object.entries(METODOS_VOTACAO).map(([id, m]) => ({ id, rotulo: m.titulo, nota: m.nota }))}
          />
        </Campo>

        {!METODOS_VOTACAO[metodo].secreto && (
          <Alerta tom="gold" titulo="A regra geral para eleger órgãos e dirigentes é o voto secreto" base="art21">
            O voto aberto é admissível nos termos do Art. 24 n.º 3, mas a eleição de órgãos e dirigentes deve, em princípio,
            fazer-se por voto secreto, periódico e pessoal.
          </Alerta>
        )}

        <Campo rotulo="Observações do processo">
          <Textarea value={obs} onChange={(ev) => setObs(ev.target.value)} placeholder="Motivo da eleição, contexto, orientações do escalão superior…" />
        </Campo>
      </div>
    </Modal>
  );
};

/* ══════════════════════════════ Escrutínio ═════════════════════════════════ */

const MesaEscrutinio: React.FC<{ el: Eleicao }> = ({ el }) => {
  const { e, registarVotos, fecharVolta } = useStore();
  const volta = el.voltas[el.voltas.length - 1];
  const [votos, setVotos] = useState<Record<string, number>>(volta?.votos ?? {});
  const [brancos, setBrancos] = useState(volta?.brancos ?? 0);
  const [nulos, setNulos] = useState(volta?.nulos ?? 0);
  const [presentes, setPresentes] = useState(volta?.presentes ?? 0);

  useEffect(() => {
    setVotos(volta?.votos ?? {});
    setBrancos(volta?.brancos ?? 0);
    setNulos(volta?.nulos ?? 0);
    setPresentes(volta?.presentes ?? 0);
  }, [el.id, volta?.numero]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!volta) return null;

  const nome = (id: string) => e.membros.find((m) => m.id === id)?.nome ?? MEMBROS_EXTERNOS[id]?.nome ?? id;
  const candidaturas = el.candidaturas.filter((c) => !c.retirada && (el.voltas.length === 1 || Object.keys(volta.votos).includes(c.id)));
  const totalVotos = Object.values(votos).reduce((a, b) => a + b, 0) + brancos + nulos;
  const maioria = Math.floor(volta.efectividade / 2) + 1;
  const excede = totalVotos > presentes;

  const sincronizar = () => registarVotos(el.id, volta.numero, votos, brancos, nulos, presentes);

  return (
    <Card
      titulo={`Mesa de escrutínio — ${volta.numero === 1 ? 'primeira volta' : 'segunda volta'}`}
      sub={METODOS_VOTACAO[el.metodo].titulo}
      accao={<Lei id="art25n4" />}
      destaque
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Campo rotulo="Presentes ao acto">
            <Input type="number" min={0} value={presentes} onChange={(ev) => setPresentes(Number(ev.target.value))} onBlur={sincronizar} />
          </Campo>
          <Campo rotulo="Em efectividade">
            <Input type="number" value={volta.efectividade} disabled className="!bg-ink-50" />
          </Campo>
          <Campo rotulo="Votos em branco">
            <Input type="number" min={0} value={brancos} onChange={(ev) => setBrancos(Number(ev.target.value))} onBlur={sincronizar} />
          </Campo>
          <Campo rotulo="Votos nulos">
            <Input type="number" min={0} value={nulos} onChange={(ev) => setNulos(Number(ev.target.value))} onBlur={sincronizar} />
          </Campo>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-400">Votos por candidato</p>
          {candidaturas.map((c) => {
            const v = votos[c.id] ?? 0;
            const alcancou = v >= maioria;
            return (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-ink-100">
                <Avatar nome={nome(c.membroId)} tamanho={34} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-bold text-ink truncate">{nome(c.membroId)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-ink-100 rounded-full overflow-hidden max-w-[220px]">
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (v / Math.max(1, volta.efectividade)) * 100)}%`, background: alcancou ? '#00A34F' : '#E61923' }}
                      />
                    </div>
                    <span className={`text-[11px] font-bold tnum ${alcancou ? 'text-verde-700' : 'text-ink-400'}`}>
                      {pct((v / Math.max(1, volta.efectividade)) * 100)} dos membros em efectividade
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-none">
                  <button
                    onClick={() => { const n = { ...votos, [c.id]: Math.max(0, v - 1) }; setVotos(n); registarVotos(el.id, volta.numero, n, brancos, nulos, presentes); }}
                    className="w-8 h-8 rounded-lg border border-ink-200 text-ink-500 font-bold hover:border-ink-300"
                  >
                    −
                  </button>
                  <span className="w-12 text-center text-[17px] font-extrabold tnum text-ink">{v}</span>
                  <button
                    onClick={() => { const n = { ...votos, [c.id]: v + 1 }; setVotos(n); registarVotos(el.id, volta.numero, n, brancos, nulos, presentes); }}
                    className="w-8 h-8 rounded-lg bg-ink text-white font-bold hover:bg-ink-700"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-ink-50 border border-ink-100 p-3">
            <p className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-ink-400">Votos apurados</p>
            <p className={`text-[19px] font-extrabold tnum mt-0.5 ${excede ? 'text-brand-600' : 'text-ink'}`}>{totalVotos}</p>
          </div>
          <div className="rounded-xl bg-ink-50 border border-ink-100 p-3">
            <p className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-ink-400">Presentes</p>
            <p className="text-[19px] font-extrabold tnum text-ink mt-0.5">{presentes}</p>
          </div>
          <div className="rounded-xl bg-brand-50 border border-brand-100 p-3">
            <p className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-brand-700">Maioria absoluta</p>
            <p className="text-[19px] font-extrabold tnum text-brand-700 mt-0.5">{volta.numero === 1 ? maioria : '—'}</p>
          </div>
          <div className="rounded-xl bg-ink-50 border border-ink-100 p-3">
            <p className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-ink-400">Quórum</p>
            <p className={`text-[19px] font-extrabold tnum mt-0.5 ${presentes >= maioria ? 'text-verde-700' : 'text-brand-600'}`}>
              {presentes >= maioria ? 'sim' : 'não'}
            </p>
          </div>
        </div>

        {excede && (
          <Alerta tom="brand" titulo="Mais votos apurados do que presentes ao acto">
            Verifique a contagem: {totalVotos} votos para {presentes} presentes. O voto é pessoal.
          </Alerta>
        )}

        {volta.numero === 1 && (
          <Alerta tom="azul" titulo={`À primeira volta é necessária a maioria absoluta: ${maioria} votos`} base="art25n4">
            Não sendo alcançada, o sistema abre automaticamente a segunda volta entre os mais votados, em que basta o maior
            número de votos expressos.
          </Alerta>
        )}

        <Btn largo variante="primaria" tamanho="lg" icone={<IcUrna className="w-5 h-5" />} onClick={() => fecharVolta(el.id)}>
          Fechar {volta.numero === 1 ? 'primeira' : 'segunda'} volta e apurar resultado
        </Btn>
      </div>
    </Card>
  );
};

/* ═════════════════════════════ Detalhe da eleição ══════════════════════════ */

const DetalheEleicao: React.FC<{ el: Eleicao; onVoltar: () => void }> = ({ el, onVoltar }) => {
  const {
    e, gerarCaderno, alternarCaderno, abrirCandidaturas, addCandidatura, aceitarCandidatura,
    retirarCandidatura, abrirEscrutinio, homologar, anularEleicao,
  } = useStore();
  const [novoCand, setNovoCand] = useState('');
  const [proponente, setProponente] = useState(e.membros[0].id);
  const [notaCand, setNotaCand] = useState('');
  const [abrirMesa, setAbrirMesa] = useState(false);
  const [presentes, setPresentes] = useState(0);
  const [anular, setAnular] = useState(false);
  const [motivoAnular, setMotivoAnular] = useState('');

  const meta = CARGOS_ELEITORAIS[el.cargo];
  const externo = el.escopo !== 'CELULA';
  const nome = (id: string) => e.membros.find((m) => m.id === id)?.nome ?? MEMBROS_EXTERNOS[id]?.nome ?? id;

  const efectividade = externo ? 21 : efectivos(e).length;
  useEffect(() => { setPresentes(Math.max(1, Math.round(efectividade * 0.85))); }, [efectividade]);

  const idx = indiceFase(el.fase);
  const aceites = el.candidaturas.filter((c) => c.aceitou && !c.retirada);
  const pendentesAceite = el.candidaturas.filter((c) => !c.aceitou && !c.retirada);
  const apuramento = el.voltas.length ? apurar(el, el.voltas[el.voltas.length - 1].numero) : null;

  const elegiveis = el.caderno.filter((l) => l.passiva);
  const votantes = el.caderno.filter((l) => l.activa);
  const excluidos = el.caderno.filter((l) => !l.activa);

  const mulheres = aceites.filter((c) => e.membros.find((m) => m.id === c.membroId)?.sexo === 'F').length;
  const incumbentes = aceites.filter((c) => c.incumbente).length;

  const diasImpugnacao = el.prazoImpugnacao ? diffDays(el.prazoImpugnacao, e.hoje) : null;

  const dadosResultado = apuramento
    ? apuramento.linhas.map((l) => ({ nome: nomeCurto(nome(l.membroId)), votos: l.votos, eleito: l.eleito }))
    : [];

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <Btn variante="suave" icone={<IcSetaEsq className="w-4 h-4" />} onClick={onVoltar}>Processos</Btn>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tom={FASE_TOM[el.fase]} ponto>{FASE_ROTULO[el.fase]}</Pill>
            <Pill tom="neutro">{el.vagas} {el.vagas === 1 ? 'vaga' : 'vagas'}</Pill>
            <Pill tom="neutro">{METODOS_VOTACAO[el.metodo].titulo}</Pill>
          </div>
          <h2 className="text-[20px] font-extrabold text-ink mt-1.5 tracking-tight">{el.titulo}</h2>
          <p className="text-[13px] text-ink-400 mt-0.5">
            Convocada em {dataMedia(el.convocadaEm)} · escrutínio a {dataMedia(el.dataEscrutinio)} · elege {meta.orgaoEleitor}
          </p>
        </div>
      </div>

      <Card>
        <Passos passos={FASES.map((f) => f.rotulo)} actual={idx} />
        {el.observacoes && <p className="text-[12.5px] text-ink-500 mt-4 pt-4 border-t border-ink-100 leading-relaxed">{el.observacoes}</p>}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {meta.base.map((b) => (<Lei key={b} id={b} />))}
        </div>
      </Card>

      {/* ─────────── Fase: convocação ─────────── */}
      {el.fase === 'CONVOCADA' && (
        <Card titulo="Apurar o caderno eleitoral" sub="Capacidade eleitoral activa e passiva, membro a membro" accao={<Lei id="art28" />}>
          <div className="space-y-4">
            <p className="text-[13.5px] text-ink-500 leading-relaxed">
              O sistema percorre a base de dados da Célula e determina, para cada camarada, se pode votar (capacidade activa)
              e se pode ser eleito (capacidade passiva), indicando o fundamento de cada exclusão. Candidatos a membro e
              membros com direitos suspensos ficam automaticamente de fora.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-ink-100 p-3 text-center">
                <p className="text-[22px] font-extrabold tnum text-ink">{e.membros.filter((m) => m.estado !== 'CESSADO').length}</p>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-ink-400 mt-1">Na base de dados</p>
              </div>
              <div className="rounded-xl border border-verde-200 bg-verde-100/50 p-3 text-center">
                <p className="text-[22px] font-extrabold tnum text-verde-800">{efectivos(e).length}</p>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-verde-700 mt-1">Efectivos</p>
              </div>
              <div className="rounded-xl border border-brand-100 bg-brand-50 p-3 text-center">
                <p className="text-[22px] font-extrabold tnum text-brand-700">
                  {e.membros.filter((m) => m.estado === 'SUSPENSO' || m.estado === 'CANDIDATO').length}
                </p>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-brand-600 mt-1">Sem capacidade</p>
              </div>
            </div>
            <Btn largo variante="primaria" icone={<IcEscudo className="w-4 h-4" />} onClick={() => gerarCaderno(el.id)}>
              Apurar caderno eleitoral
            </Btn>
          </div>
        </Card>
      )}

      {/* ─────────── Fase: caderno ─────────── */}
      {(el.fase === 'CADERNO' || el.fase === 'CANDIDATURAS') && el.caderno.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <Card className="xl:col-span-2" titulo="Caderno eleitoral" sub="Toque para corrigir manualmente, com registo no processo" accao={<Lei id="art28" />} pad={false}>
            <Tabela>
              <thead>
                <tr><th>Camarada</th><th>Situação</th><th>Vota</th><th>Elegível</th><th>Fundamento</th></tr>
              </thead>
              <tbody>
                {el.caderno.map((l) => {
                  const m = e.membros.find((x) => x.id === l.membroId);
                  if (!m) return null;
                  return (
                    <tr key={l.membroId}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <Avatar nome={m.nome} tamanho={28} />
                          <span className="font-bold text-ink">{nomeCurto(m.nome)}</span>
                        </div>
                      </td>
                      <td><Pill tom={m.estado === 'EFECTIVO' ? 'verde' : m.estado === 'SUSPENSO' ? 'brand' : 'gold'}>{m.estado.toLowerCase()}</Pill></td>
                      <td>
                        <button
                          onClick={() => alternarCaderno(el.id, l.membroId, 'activa')}
                          className={`w-7 h-7 rounded-lg grid place-items-center border transition-all ${l.activa ? 'bg-verde-600 border-verde-600 text-white' : 'bg-white border-ink-200 text-ink-200'}`}
                        >
                          {l.activa ? <IcCheck className="w-4 h-4" /> : <IcFechar className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                      <td>
                        <button
                          onClick={() => alternarCaderno(el.id, l.membroId, 'passiva')}
                          className={`w-7 h-7 rounded-lg grid place-items-center border transition-all ${l.passiva ? 'bg-ink border-ink text-white' : 'bg-white border-ink-200 text-ink-200'}`}
                        >
                          {l.passiva ? <IcCheck className="w-4 h-4" /> : <IcFechar className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                      <td>
                        {l.impedimentos.length === 0 ? (
                          <span className="text-ink-300 text-[12px]">—</span>
                        ) : (
                          <div className="space-y-1">
                            {l.impedimentos.map((imp, i) => (
                              <div key={i} className="flex items-start gap-1.5">
                                <span className="text-[11.5px] text-ink-500 leading-snug">{imp.motivo}</span>
                                <Lei id={imp.base} discreto />
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Tabela>
          </Card>

          <div className="space-y-4">
            <Card titulo="Universo eleitoral">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-bold text-ink-500">Capacidade activa (votam)</span>
                    <span className="text-[15px] font-extrabold tnum text-verde-700">{votantes.length}</span>
                  </div>
                  <Barra valor={(votantes.length / Math.max(1, el.caderno.length)) * 100} tom="bg-verde-600" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-bold text-ink-500">Capacidade passiva (elegíveis)</span>
                    <span className="text-[15px] font-extrabold tnum text-ink">{elegiveis.length}</span>
                  </div>
                  <Barra valor={(elegiveis.length / Math.max(1, el.caderno.length)) * 100} tom="bg-ink" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-bold text-ink-500">Excluídos com fundamento</span>
                    <span className="text-[15px] font-extrabold tnum text-brand-600">{excluidos.length}</span>
                  </div>
                  <Barra valor={(excluidos.length / Math.max(1, el.caderno.length)) * 100} tom="bg-brand-600" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-ink-100">
                <Linha rotulo="Maioria absoluta à 1.ª volta">{Math.floor(votantes.length / 2) + 1} votos</Linha>
                <Linha rotulo="Quórum para deliberar">{Math.floor(votantes.length / 2) + 1} presentes</Linha>
              </div>
            </Card>

            {el.fase === 'CADERNO' && (
              <Card titulo="Abrir candidaturas" sub="Voluntariedade e consulta prévia" accao={<Lei id="art22" />}>
                <p className="text-[13px] text-ink-500 leading-relaxed mb-3">
                  Qualquer membro pode propor candidatos. Cada camarada proposto tem de aceitar expressamente a candidatura
                  antes de ir a votos.
                </p>
                <Btn largo variante="primaria" onClick={() => abrirCandidaturas(el.id)}>
                  Abrir fase de candidaturas
                </Btn>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ─────────── Fase: candidaturas ─────────── */}
      {el.fase === 'CANDIDATURAS' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <Card className="xl:col-span-2" titulo={`Candidaturas (${el.candidaturas.filter((c) => !c.retirada).length})`} sub="Aceitação expressa exigida antes do escrutínio" pad={false}>
            <ul className="divide-y divide-ink-100">
              {el.candidaturas.filter((c) => !c.retirada).map((c) => {
                const m = e.membros.find((x) => x.id === c.membroId);
                const assid = m ? assiduidadeDe(e, m.id) : null;
                return (
                  <li key={c.id} className="px-5 py-4 flex items-start gap-3.5">
                    <Avatar nome={nome(c.membroId)} tamanho={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[14px] font-bold text-ink">{nome(c.membroId)}</p>
                        {c.incumbente && <Pill tom="azul">incumbente</Pill>}
                        {c.aceitou ? <Pill tom="verde"><IcCheck className="w-3 h-3" />aceitou</Pill> : <Pill tom="gold">consulta prévia pendente</Pill>}
                      </div>
                      <p className="text-[12px] text-ink-400 mt-0.5">
                        proposto por {nomeCurto(nome(c.propostoPorId))}
                        {m?.profissao && ` · ${m.profissao}`}
                        {assid && ` · assiduidade ${Math.round(assid.taxa)}%`}
                      </p>
                      {c.nota && <p className="text-[12px] text-ink-500 mt-1.5 italic">“{c.nota}”</p>}
                    </div>
                    <div className="flex flex-col gap-1.5 flex-none">
                      {!c.aceitou ? (
                        <Btn tamanho="sm" variante="sucesso" onClick={() => aceitarCandidatura(el.id, c.id, true)}>Aceitar</Btn>
                      ) : (
                        <Btn tamanho="sm" variante="fantasma" onClick={() => aceitarCandidatura(el.id, c.id, false)}>Retirar aceitação</Btn>
                      )}
                      <Btn tamanho="sm" variante="fantasma" onClick={() => retirarCandidatura(el.id, c.id)}>Desistir</Btn>
                    </div>
                  </li>
                );
              })}
              {el.candidaturas.filter((c) => !c.retirada).length === 0 && (
                <li><Vazio titulo="Sem candidaturas" texto="Proponha o primeiro camarada ao cargo." icone={<IcUrna className="w-6 h-6" />} /></li>
              )}
            </ul>

            <div className="px-5 py-4 border-t border-ink-100 bg-ink-50/50 space-y-3">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-400">
                Propor candidatura <Lei id="art14d" discreto className="ml-1" />
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Select value={novoCand} onChange={(ev) => setNovoCand(ev.target.value)}>
                  <option value="">Camarada a propor…</option>
                  {(el.caderno.length ? el.caderno.filter((l) => l.passiva) : []).map((l) => {
                    const m = e.membros.find((x) => x.id === l.membroId)!;
                    const ja = el.candidaturas.some((c) => c.membroId === l.membroId && !c.retirada);
                    return (<option key={l.membroId} value={l.membroId} disabled={ja}>{m.nome}{ja ? ' (já proposto)' : ''}</option>);
                  })}
                </Select>
                <Select value={proponente} onChange={(ev) => setProponente(ev.target.value)}>
                  {el.caderno.filter((l) => l.activa).map((l) => {
                    const m = e.membros.find((x) => x.id === l.membroId)!;
                    return (<option key={l.membroId} value={l.membroId}>proposto por {m.nome}</option>);
                  })}
                </Select>
              </div>
              <Input value={notaCand} onChange={(ev) => setNotaCand(ev.target.value)} placeholder="Fundamento da proposta (opcional)" />
              <Btn
                variante="escura"
                disabled={!novoCand}
                icone={<IcMais className="w-4 h-4" />}
                onClick={() => { addCandidatura(el.id, novoCand, proponente, notaCand || undefined); setNovoCand(''); setNotaCand(''); }}
              >
                Registar candidatura
              </Btn>
            </div>
          </Card>

          <div className="space-y-4">
            <Card titulo="Continuidade e renovação" sub="Princípio a observar na constituição dos órgãos" accao={<Lei id="art29" />}>
              <div className="space-y-3">
                <Linha rotulo="Candidaturas aceites">{aceites.length} para {el.vagas} {el.vagas === 1 ? 'vaga' : 'vagas'}</Linha>
                <Linha rotulo="Incumbentes (continuidade)">{incumbentes}</Linha>
                <Linha rotulo="Novos candidatos (renovação)">{aceites.length - incumbentes}</Linha>
                <Linha rotulo="Camaradas mulheres">{mulheres} de {aceites.length}</Linha>
              </div>
              {aceites.length > 0 && (
                <div className="mt-4">
                  <div className="flex h-2 rounded-full overflow-hidden">
                    <div className="bg-ink" style={{ width: `${(incumbentes / aceites.length) * 100}%` }} />
                    <div className="bg-verde-500" style={{ width: `${((aceites.length - incumbentes) / aceites.length) * 100}%` }} />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10.5px] font-bold text-ink-400">continuidade</span>
                    <span className="text-[10.5px] font-bold text-verde-700">renovação</span>
                  </div>
                </div>
              )}
            </Card>

            {pendentesAceite.length > 0 && (
              <Alerta tom="gold" titulo={`${pendentesAceite.length} candidatura(s) sem aceitação`} base="art22">
                A voluntariedade e a consulta prévia são essenciais: nenhum camarada vai a votos sem aceitar.
              </Alerta>
            )}

            <Card titulo="Abrir escrutínio" sub={`Necessários ${Math.floor(efectividade / 2) + 1} presentes`} accao={<Lei id="art30" />}>
              {aceites.length < 1 ? (
                <p className="text-[13px] text-ink-400">É necessária, no mínimo, uma candidatura aceite.</p>
              ) : (
                <>
                  <p className="text-[13px] text-ink-500 leading-relaxed mb-3">
                    {aceites.length} candidatura(s) aceite(s) para {el.vagas} {el.vagas === 1 ? 'vaga' : 'vagas'}.
                    Confirme a presença no acto eleitoral.
                  </p>
                  <Btn largo variante="primaria" icone={<IcUrna className="w-4 h-4" />} onClick={() => setAbrirMesa(true)}>
                    Abrir mesa de escrutínio
                  </Btn>
                </>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ─────────── Fase: escrutínio ─────────── */}
      {(el.fase === 'ESCRUTINIO' || el.fase === 'SEGUNDA_VOLTA') && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2"><MesaEscrutinio el={el} /></div>
          <div className="space-y-4">
            {el.fase === 'SEGUNDA_VOLTA' && (
              <Alerta tom="brand" titulo="Segunda volta em curso" base="art25n4">
                Nenhum candidato obteve a maioria absoluta dos membros em efectividade de funções. Nesta volta é eleito quem
                obtiver o maior número de votos expressos.
              </Alerta>
            )}
            {el.voltas.filter((v) => v.fechadaEm).map((v) => {
              const ap = apurar(el, v.numero)!;
              return (
                <Card key={v.numero} titulo={`${v.numero === 1 ? 'Primeira' : 'Segunda'} volta — apurada`} sub={`Fechada em ${dataMedia(v.fechadaEm!)}`}>
                  <div className="space-y-2">
                    {ap.linhas.map((l) => (
                      <div key={l.candidaturaId} className="flex items-center gap-2">
                        <span className="text-[12.5px] text-ink-600 flex-1 truncate">{nomeCurto(nome(l.membroId))}</span>
                        <span className="text-[12.5px] font-extrabold tnum text-ink">{l.votos}</span>
                        <span className="text-[11px] text-ink-300 w-12 text-right">{pct(l.pctExpressos)}</span>
                      </div>
                    ))}
                    <div className="pt-2 mt-2 border-t border-ink-100 flex justify-between text-[11.5px] text-ink-400">
                      <span>brancos {v.brancos} · nulos {v.nulos}</span>
                      <span>presentes {v.presentes}/{v.efectividade}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
            <Card titulo="Garantias do processo" accao={<Lei id="art25n2" />}>
              <ul className="space-y-2">
                {['Liberdade de campanha', 'Imparcialidade no tratamento dos candidatos', 'Transparência do escrutínio', 'Justiça nos resultados'].map((g) => (
                  <li key={g} className="flex items-center gap-2 text-[12.5px] text-ink-500">
                    <IcCheck className="w-4 h-4 text-verde-600 flex-none" />{g}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}

      {/* ─────────── Fase: proclamada / homologada ─────────── */}
      {(el.fase === 'PROCLAMADA' || el.fase === 'HOMOLOGADA') && apuramento && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="lg:col-span-2" titulo="Resultado do escrutínio" sub={`Proclamado em ${dataMedia(el.proclamadaEm ?? el.dataEscrutinio)}`} accao={<Lei id="art25n4" />}>
              <div className="h-[210px] -ml-2 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosResultado} layout="vertical" margin={{ top: 0, right: 34, bottom: 0, left: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="nome" width={130} tick={{ fontSize: 12, fill: '#585151', fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <Bar dataKey="votos" radius={[0, 6, 6, 0]} barSize={22}>
                      {dadosResultado.map((d, i) => (<Cell key={i} fill={d.eleito ? '#00A34F' : '#D0CACA'} />))}
                      <LabelList dataKey="votos" position="right" style={{ fontSize: 12, fontWeight: 800, fill: '#1A1717' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-ink-50 border border-ink-100 p-3">
                  <p className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-ink-400">Votos válidos</p>
                  <p className="text-[18px] font-extrabold tnum text-ink mt-0.5">{apuramento.validos}</p>
                </div>
                <div className="rounded-xl bg-ink-50 border border-ink-100 p-3">
                  <p className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-ink-400">Brancos / nulos</p>
                  <p className="text-[18px] font-extrabold tnum text-ink mt-0.5">{apuramento.brancos} / {apuramento.nulos}</p>
                </div>
                <div className="rounded-xl bg-ink-50 border border-ink-100 p-3">
                  <p className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-ink-400">Presentes</p>
                  <p className="text-[18px] font-extrabold tnum text-ink mt-0.5">{apuramento.presentes}/{apuramento.efectividade}</p>
                </div>
                <div className="rounded-xl bg-verde-100/60 border border-verde-200 p-3">
                  <p className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-verde-700">Voltas realizadas</p>
                  <p className="text-[18px] font-extrabold tnum text-verde-800 mt-0.5">{el.voltas.length}</p>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              <Card titulo="Eleitos e suplentes" sub="A ordem de eleição fixa a chamada de suplentes" accao={<Lei id="art32" />} pad={false}>
                <ul className="divide-y divide-ink-100">
                  {el.eleitos.map((x) => (
                    <li key={x.membroId} className="px-5 py-3 flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg grid place-items-center text-[11px] font-extrabold flex-none ${x.suplente ? 'bg-ink-100 text-ink-400' : 'bg-verde-600 text-white'}`}>
                        {x.ordem}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-ink truncate">{nome(x.membroId)}</p>
                        <p className="text-[11px] text-ink-400">{x.votos} votos</p>
                      </div>
                      {x.suplente ? <Pill tom="neutro">suplente</Pill> : <Pill tom="verde">eleito</Pill>}
                    </li>
                  ))}
                </ul>
              </Card>

              {el.mandato && (
                <Card titulo="Mandato" accao={<Lei id="art26" />}>
                  <Linha rotulo="Início">{dataMedia(el.mandato.inicio)}</Linha>
                  <Linha rotulo="Termo">{dataMedia(el.mandato.fim)}</Linha>
                  <Linha rotulo="Duração">{REGRAS.MANDATO_ANOS} anos</Linha>
                  <div className="mt-3">
                    <Barra valor={progressoMandato(el.mandato.inicio, el.mandato.fim, e.hoje)} tom="bg-ink" alt="h-1.5" />
                    <p className="text-[11px] text-ink-400 mt-1.5">
                      {Math.round(progressoMandato(el.mandato.inicio, el.mandato.fim, e.hoje))}% do mandato decorrido
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {el.fase === 'PROCLAMADA' && diasImpugnacao !== null && (
            <Card titulo="Prazo de impugnação" sub="Trinta dias a contar da prática do acto" accao={<Lei id="art33" />} destaque={diasImpugnacao >= 0}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <Anel
                  valor={diasImpugnacao >= 0 ? ((30 - diasImpugnacao) / 30) * 100 : 100}
                  tamanho={92}
                  cor={diasImpugnacao > 7 ? '#3B82F6' : '#F5D400'}
                  centro={
                    <>
                      <span className="text-[22px] font-extrabold tnum text-ink leading-none">{Math.max(0, diasImpugnacao)}</span>
                      <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-ink-400 mt-1">dias</span>
                    </>
                  }
                />
                <div className="flex-1">
                  <p className="text-[13.5px] text-ink-500 leading-relaxed">
                    A impugnação de actos praticados por órgãos do Partido é apresentada junto do Comité de Verificação
                    competente. O acto mantém-se válido enquanto não for decidida a sua anulação. Termo do prazo:{' '}
                    <strong className="text-ink">{dataMedia(el.prazoImpugnacao!)}</strong>.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Btn variante="sucesso" icone={<IcCheck className="w-4 h-4" />} disabled={diasImpugnacao > 0} onClick={() => homologar(el.id)}>
                      {diasImpugnacao > 0 ? `Homologar após ${dataMedia(el.prazoImpugnacao!)}` : 'Homologar resultado'}
                    </Btn>
                    <Btn variante="perigo" onClick={() => setAnular(true)}>Registar impugnação</Btn>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {el.acta && (
            <Card titulo="Acta de eleição" sub="Arquivada automaticamente nos documentos da Célula" accao={<Lei id="art21b" />}>
              <div className="rounded-xl bg-ink-50 border border-ink-100 p-4 font-mono text-[12.5px] text-ink-600 leading-relaxed whitespace-pre-line">
                {el.acta}
                {'\n'}Órgão que elegeu: {meta.orgaoEleitor}.
                {'\n'}Forma de votação: {METODOS_VOTACAO[el.metodo].titulo}.
                {'\n'}Presentes: {apuramento.presentes} de {apuramento.efectividade} membros em efectividade de funções.
                {'\n'}Maioria absoluta exigida à primeira volta: {apuramento.maioriaExigida} votos.
                {'\n'}Resultado: {el.eleitos.filter((x) => !x.suplente).map((x) => `${nome(x.membroId)} (${x.votos} votos)`).join('; ')}.
                {'\n'}Suplentes, pela ordem de eleição: {el.eleitos.filter((x) => x.suplente).map((x) => nome(x.membroId)).join('; ') || 'não há'}.
                {'\n'}Mandato: {el.mandato ? `${dataMedia(el.mandato.inicio)} a ${dataMedia(el.mandato.fim)}` : '—'}.
              </div>
            </Card>
          )}
        </div>
      )}

      {el.fase === 'ANULADA' && (
        <Alerta tom="brand" titulo="Processo anulado" base="art33">{el.observacoes}</Alerta>
      )}

      {/* modais */}
      <Modal
        aberto={abrirMesa}
        onFechar={() => setAbrirMesa(false)}
        titulo="Abrir mesa de escrutínio"
        sub="Verificação de quórum antes da votação"
        rodape={
          <>
            <Btn variante="fantasma" onClick={() => setAbrirMesa(false)}>Cancelar</Btn>
            <Btn
              variante="primaria"
              onClick={() => { abrirEscrutinio(el.id, { presentes, efectividade }); setAbrirMesa(false); }}
            >
              Abrir escrutínio
            </Btn>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Presentes ao acto" obrigatorio>
              <Input type="number" min={0} max={efectividade} value={presentes} onChange={(ev) => setPresentes(Number(ev.target.value))} />
            </Campo>
            <Campo rotulo="Membros em efectividade">
              <Input type="number" value={efectividade} disabled className="!bg-ink-50" />
            </Campo>
          </div>
          <Alerta
            tom={presentes >= Math.floor(efectividade / 2) + 1 ? 'verde' : 'brand'}
            titulo={presentes >= Math.floor(efectividade / 2) + 1 ? 'Quórum verificado' : 'Sem quórum'}
            base={meta.quorum === 'DOIS_TERCOS' ? 'art30n1' : 'art30'}
          >
            {meta.quorum === 'DOIS_TERCOS'
              ? `Comités e Conferências exigem dois terços: ${Math.ceil((efectividade * 2) / 3)} membros.`
              : `Exigidos ${Math.floor(efectividade / 2) + 1} presentes para deliberar validamente.`}
            {' '}Maioria absoluta à primeira volta: {Math.floor(efectividade / 2) + 1} votos.
          </Alerta>
        </div>
      </Modal>

      <Modal
        aberto={anular}
        onFechar={() => setAnular(false)}
        titulo="Registar impugnação"
        sub="Apresentada junto do Comité de Verificação competente"
        rodape={
          <>
            <Btn variante="fantasma" onClick={() => setAnular(false)}>Cancelar</Btn>
            <Btn variante="primaria" disabled={motivoAnular.length < 8} onClick={() => { anularEleicao(el.id, motivoAnular); setAnular(false); }}>
              Registar e anular acto
            </Btn>
          </>
        }
      >
        <div className="space-y-4">
          <Alerta tom="gold" titulo="O acto mantém-se válido enquanto não for decidida a anulação" base="art33" />
          <Campo rotulo="Fundamento da impugnação" obrigatorio>
            <Textarea value={motivoAnular} onChange={(ev) => setMotivoAnular(ev.target.value)} placeholder="Desconformidade com os Estatutos, o Programa, os Regulamentos ou as Directivas…" />
          </Campo>
        </div>
      </Modal>
    </div>
  );
};

/* ═════════════════════════════════ Mandatos ════════════════════════════════ */

const Mandatos: React.FC = () => {
  const { e, irPara } = useStore();
  const nome = (id: string) => e.membros.find((m) => m.id === id)?.nome ?? MEMBROS_EXTERNOS[id]?.nome ?? '—';

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
        {e.mandatos.filter((md) => md.estado !== 'CESSADO').map((md) => {
          const meta = CARGOS_ELEITORAIS[md.cargo];
          const vago = md.estado === 'VAGO';
          const progresso = progressoMandato(md.inicio, md.fim, e.hoje);
          const membro = e.membros.find((m) => m.id === md.membroId);
          const assid = membro ? assiduidadeDe(e, membro.id) : null;
          return (
            <Card key={md.id} className="h-full" destaque={vago}>
              <div className="flex items-start gap-3">
                {vago ? (
                  <div className="w-11 h-11 rounded-full border-2 border-dashed border-brand-300 grid place-items-center flex-none text-brand-400">
                    <IcAviso className="w-5 h-5" />
                  </div>
                ) : (
                  <Avatar nome={nome(md.membroId)} tamanho={44} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold text-ink leading-tight">{vago ? 'Vaga por preencher' : nome(md.membroId)}</p>
                  <p className="text-[12px] text-ink-400 mt-0.5">{meta?.titulo ?? md.cargo}</p>
                </div>
                <Pill tom={vago ? 'brand' : 'verde'} ponto>{vago ? 'vago' : 'em funções'}</Pill>
              </div>

              <p className="text-[11.5px] text-ink-400 mt-3">{md.orgao}</p>

              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-ink-400">{dataMedia(md.inicio)}</span>
                  <span className="text-[11px] font-bold text-ink-400">{dataMedia(md.fim)}</span>
                </div>
                <Barra valor={progresso} tom={vago ? 'bg-brand-300' : progresso > 85 ? 'bg-gold-500' : 'bg-ink'} alt="h-2" />
                <p className="text-[11px] text-ink-400 mt-1.5">
                  {vago ? 'Mandato do órgão em curso' : `${Math.round(progresso)}% decorrido · termina ${relativo(md.fim, e.hoje)}`}
                </p>
              </div>

              {md.notaCessacao && (
                <p className="text-[11.5px] text-ink-500 mt-3 pt-3 border-t border-ink-100 leading-relaxed">{md.notaCessacao}</p>
              )}

              {assid && assid.risco !== 'OK' && (
                <div className="mt-3 pt-3 border-t border-ink-100">
                  <div className="flex items-center gap-2">
                    <IcAviso className={`w-4 h-4 flex-none ${assid.risco === 'CESSACAO' ? 'text-brand-600' : 'text-gold-500'}`} />
                    <p className="text-[11.5px] text-ink-500 leading-snug">
                      {Math.round(assid.taxaInjustificada)}% de faltas não justificadas —{' '}
                      {assid.risco === 'CESSACAO' ? 'o mandato pode cessar' : 'situação a acompanhar'}
                      <Lei id="art27n6" discreto className="ml-1" />
                    </p>
                  </div>
                </div>
              )}

              {vago && (
                <Btn largo variante="primaria" className="mt-3" onClick={() => irPara('eleicoes', { acao: 'convocar' })}>
                  Convocar eleição
                </Btn>
              )}
            </Card>
          );
        })}
      </div>

      <Card titulo="Regras de mandato aplicadas pelo sistema" sub="Cada regra tem a norma de origem" pad={false}>
        <ul className="divide-y divide-ink-100">
          {[
            { t: 'Mandato de cinco anos', d: 'Os órgãos do Partido são eleitos por um mandato de cinco anos, podendo ser antecipado ou adiado por decisão do Comité Central.', b: 'art26' },
            { t: 'Cessação por faltas', d: 'Vinte e cinco por cento de faltas injustificadas consecutivas, ou cinquenta por cento interpoladas, fazem cessar o mandato.', b: 'art27n6' },
            { t: 'Preenchimento de vagas', d: 'Em caso de vacatura é chamado o suplente, pela ordem de eleição.', b: 'art32' },
            { t: 'Designações acima de metade', d: 'Se as designações respeitarem a metade ou mais das vagas, realizam-se eleições na sessão seguinte.', b: 'art32n3' },
            { t: 'Renúncia', d: 'A renúncia ao mandato é apresentada por escrito ao Secretário da Célula e ao órgão a que pertence.', b: 'art9' },
          ].map((r) => (
            <li key={r.t} className="px-5 py-3.5 flex items-start gap-3.5">
              <span className="w-8 h-8 rounded-xl bg-ink-50 text-ink-400 grid place-items-center flex-none"><IcLei className="w-4 h-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-ink">{r.t}</p>
                <p className="text-[12px] text-ink-400 mt-0.5 leading-relaxed">{r.d}</p>
              </div>
              <Lei id={r.b} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

/* ════════════════════════════════ Vista ════════════════════════════════════ */

export const Eleicoes: React.FC = () => {
  const { e, params, irPara, lente } = useStore();
  const [aba, setAba] = useState<'processos' | 'mandatos' | 'arquivo'>('processos');
  const [convocar, setConvocar] = useState(false);
  const [aberta, setAberta] = useState<string | null>(null);

  useEffect(() => {
    if (params.acao === 'convocar') setConvocar(true);
    if (params.eleicao) setAberta(params.eleicao);
  }, [params]);

  const doEscopo = useMemo(
    () => e.eleicoes.filter((el) => (lente === 'CIRCULO' ? el.escopo !== 'CELULA' : true)),
    [e.eleicoes, lente],
  );
  const abertas = doEscopo.filter((el) => !['HOMOLOGADA', 'ANULADA'].includes(el.fase));
  const arquivo = doEscopo.filter((el) => ['HOMOLOGADA', 'ANULADA'].includes(el.fase));
  const el = aberta ? e.eleicoes.find((x) => x.id === aberta) : undefined;

  if (el) return <DetalheEleicao el={el} onVoltar={() => { setAberta(null); irPara('eleicoes'); }} />;

  const CartaoEleicao: React.FC<{ el: Eleicao }> = ({ el }) => {
    const meta = CARGOS_ELEITORAIS[el.cargo];
    const idx = indiceFase(el.fase);
    return (
      <button onClick={() => setAberta(el.id)} className="text-left w-full">
        <Card className="h-full lift hover:shadow-lift">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Pill tom={FASE_TOM[el.fase]} ponto>{FASE_ROTULO[el.fase]}</Pill>
              <p className="text-[15px] font-bold text-ink mt-2 leading-snug">{meta?.titulo ?? el.titulo}</p>
              <p className="text-[12px] text-ink-400 mt-0.5">{meta?.orgaoEleitor}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl grid place-items-center flex-none ${el.fase === 'PROCLAMADA' || el.fase === 'HOMOLOGADA' ? 'bg-verde-100 text-verde-700' : 'bg-brand-50 text-brand-600'}`}>
              <IcUrna className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex gap-1">
              {FASES.map((f, i) => (
                <div key={f.id} className={`h-1.5 flex-1 rounded-full ${i <= idx ? (el.fase === 'PROCLAMADA' || el.fase === 'HOMOLOGADA' ? 'bg-verde-500' : 'bg-brand-500') : 'bg-ink-100'}`} />
              ))}
            </div>
            <p className="text-[11px] text-ink-400 mt-2">{FASES[Math.min(idx, 4)].rotulo} · {el.vagas} {el.vagas === 1 ? 'vaga' : 'vagas'}</p>
          </div>

          <div className="mt-3 pt-3 border-t border-ink-100 flex items-center gap-2 flex-wrap">
            <span className="text-[11.5px] text-ink-400">escrutínio {dataMedia(el.dataEscrutinio)}</span>
            {el.candidaturas.filter((c) => !c.retirada).length > 0 && (
              <Pill tom="neutro">{el.candidaturas.filter((c) => !c.retirada).length} candidatos</Pill>
            )}
            {el.fase === 'PROCLAMADA' && el.prazoImpugnacao && diffDays(el.prazoImpugnacao, e.hoje) >= 0 && (
              <Pill tom="azul">impugnação: {diffDays(el.prazoImpugnacao, e.hoje)} dias</Pill>
            )}
            <IcSeta className="w-4 h-4 text-ink-300 ml-auto" />
          </div>
        </Card>
      </button>
    );
  };

  const totalVotos = e.eleicoes.reduce((a, el) => a + el.voltas.reduce((b, v) => b + Object.values(v.votos).reduce((c, x) => c + x, 0) + v.brancos + v.nulos, 0), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <Stat rotulo="Processos abertos" valor={num(abertas.length)} icone={<IcUrna className="w-5 h-5" />} tom="brand" nota="Da convocação à homologação" />
        <Stat rotulo="Mandatos em funções" valor={num(e.mandatos.filter((m) => m.estado === 'ACTIVO').length)} nota={`${e.mandatos.filter((m) => m.estado === 'VAGO').length} vaga(s) por preencher`} />
        <Stat rotulo="Votos apurados no sistema" valor={num(totalVotos)} nota="Escrutínio secreto, periódico e pessoal" />
        <Stat rotulo="Processos concluídos" valor={num(arquivo.length)} tom="verde" nota="Homologados após o prazo de impugnação" />
      </div>

      <Card>
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-5">
          <div className="w-11 h-11 rounded-xl bg-ink text-gold-400 grid place-items-center flex-none"><IcAlvo className="w-5 h-5" /></div>
          <div className="flex-1">
            <p className="text-[14px] font-bold text-ink">Democracia interna assistida pelo sistema</p>
            <p className="text-[12.5px] text-ink-400 mt-1 leading-relaxed max-w-3xl">
              O módulo eleitoral acompanha as cinco fases de qualquer eleição do Partido — convocação, caderno eleitoral,
              candidaturas, escrutínio e proclamação — aplicando automaticamente o sistema maioritário, a maioria absoluta
              à primeira volta, o quórum do órgão, a ordem de eleição dos suplentes e o prazo de impugnação.
            </p>
          </div>
          <Btn variante="primaria" tamanho="lg" icone={<IcMais className="w-4 h-4" />} onClick={() => setConvocar(true)}>Convocar eleição</Btn>
        </div>
      </Card>

      <a
        href="#/votar"
        className="block rounded-2xl bg-ink text-white p-5 shadow-card hover:shadow-lift transition-all duration-300 ease-swift group relative overflow-hidden"
      >
        <div className="faixa-diagonal absolute -top-8 -right-10 w-52 h-28 opacity-[0.16] rotate-12 pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-brand-600 text-white grid place-items-center flex-none">
            <IcUrna className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-white flex items-center gap-2">
              Votação em directo
              <span className="text-[9.5px] font-extrabold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-full bg-white/15 text-white/70">
                tempo real
              </span>
            </p>
            <p className="text-[12.5px] text-white/50 mt-1 leading-relaxed max-w-3xl">
              O escrutínio dos ecrãs acima é registado pela mesa. Aqui vota-se a sério: cada camarada entra pelo seu
              nome no telemóvel, o boletim aparece quando a urna abre e a afluência e o apuramento chegam ao segundo
              a todos os dispositivos da sala.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 text-[13px] font-bold text-white/70 group-hover:text-white flex-none">
            Abrir assembleia <IcSeta className="w-4 h-4" />
          </span>
        </div>
      </a>

      <Segmentado
        itens={[
          { id: 'processos', rotulo: `Processos (${abertas.length})` },
          { id: 'mandatos', rotulo: `Mandatos (${e.mandatos.filter((m) => m.estado !== 'CESSADO').length})` },
          { id: 'arquivo', rotulo: `Arquivo (${arquivo.length})` },
        ]}
        activo={aba}
        onMudar={(v) => setAba(v as any)}
      />

      {aba === 'processos' && (
        abertas.length === 0 ? (
          <Card><Vazio titulo="Sem processos abertos" texto="Convoque uma eleição para preencher um órgão ou renovar um mandato." icone={<IcUrna className="w-6 h-6" />} accao={<Btn variante="primaria" onClick={() => setConvocar(true)}>Convocar eleição</Btn>} /></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
            {abertas.map((x) => (<CartaoEleicao key={x.id} el={x} />))}
          </div>
        )
      )}

      {aba === 'mandatos' && <Mandatos />}

      {aba === 'arquivo' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {arquivo.map((x) => (<CartaoEleicao key={x.id} el={x} />))}
          {arquivo.length === 0 && <Card className="md:col-span-2 xl:col-span-3"><Vazio titulo="Arquivo vazio" /></Card>}
        </div>
      )}

      <ConvocarEleicao aberto={convocar} onFechar={() => { setConvocar(false); irPara('eleicoes'); }} onCriada={(id) => setAberta(id)} />
    </div>
  );
};
