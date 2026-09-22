/* ===========================================================================
   Ficha de Delegado à Conferência do Comité do Círculo.

   Reproduz o impresso oficial do Partido, mas instruído com o que a Célula já
   sabe de cada camarada — e com os anexos verificados contra os próprios
   registos, em vez de aceites por declaração.
   ========================================================================= */

import React, { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { CARGOS_ELEITORAIS } from '../lib/estatutos';
import {
  anexosDoDelegado, completudeFichaDelegado, membroPorId,
} from '../lib/selectors';
import { dataLonga, dataMedia, nomeMes } from '../lib/format';
import {
  Alerta, Avatar, Barra, Btn, Card, Emblema, Lei, Pill, Secao, Select, Stat, Vazio,
} from '../ui/primitives';
import {
  IcAviso, IcCheck, IcDescarregar, IcFechar, IcImprimir, IcLei, IcMais,
  IcRelatorio, IcSetaEsq, IcUrna,
} from '../ui/icons';
import type { FichaDelegado } from '../lib/types';

/* ══════════════════════════ Campo do impresso ══════════════════════════════ */

const Linha: React.FC<{
  rotulo: string;
  valor: string;
  onMudar: (v: string) => void;
  tipo?: 'text' | 'date' | 'month';
  className?: string;
  rotuloLargo?: boolean;
}> = ({ rotulo, valor, onMudar, tipo = 'text', className = '', rotuloLargo }) => (
  <label className={`flex items-end gap-2 min-w-0 ${className}`}>
    <span
      className={`text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-ink-600 whitespace-nowrap pb-0.5 ${
        rotuloLargo ? '' : 'flex-none'
      }`}
    >
      {rotulo}
    </span>
    <input
      type={tipo}
      value={valor}
      onChange={(ev) => onMudar(ev.target.value)}
      className="flex-1 min-w-0 bg-transparent border-b border-areia-400 focus:border-brand-600 outline-none px-1 pb-0.5 text-[13px] text-ink transition-colors"
    />
  </label>
);

const Escolher: React.FC<{
  pergunta: string;
  valor: 'SIM' | 'NAO';
  onMudar: (v: 'SIM' | 'NAO') => void;
  complemento?: { rotulo: string; valor: string; onMudar: (v: string) => void; tipo?: 'text' | 'date' };
}> = ({ pergunta, valor, onMudar, complemento }) => (
  <div className="py-2.5 border-b border-areia-200 last:border-0">
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <p className="text-[13px] text-ink flex-1 min-w-[16rem]">{pergunta}</p>
      <div className="flex items-center gap-1.5 flex-none">
        {(['SIM', 'NAO'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onMudar(v)}
            className={`px-3 py-1 rounded-lg text-[12px] font-bold border transition-all ${
              valor === v
                ? 'bg-ink text-white border-ink'
                : 'bg-white text-ink-400 border-areia-300 hover:border-areia-400'
            }`}
          >
            {v === 'NAO' ? 'NÃO' : 'SIM'}
          </button>
        ))}
      </div>
    </div>
    {valor === 'SIM' && complemento && (
      <div className="mt-2 pl-0 sm:pl-6">
        <Linha
          rotulo={complemento.rotulo}
          valor={complemento.valor}
          onMudar={complemento.onMudar}
          tipo={complemento.tipo}
        />
      </div>
    )}
  </div>
);

/* ═══════════════════════════ Painel dos anexos ═════════════════════════════ */

const PainelAnexos: React.FC<{ ficha: FichaDelegado; onAlternar: (k: keyof FichaDelegado['anexos']) => void }> = ({
  ficha, onAlternar,
}) => {
  const { e } = useStore();
  const verificacoes = useMemo(() => anexosDoDelegado(e, ficha.membroId), [e, ficha.membroId]);
  const emFalta = verificacoes.filter((v) => v.estado === 'EM_FALTA').length;

  return (
    <Card
      titulo="Anexos exigidos"
      sub="O sistema atesta o que consegue provar pelos seus próprios registos."
      accao={emFalta ? <Pill tom="brand" ponto>{emFalta} por resolver</Pill> : <Pill tom="verde" ponto>completos</Pill>}
      className="no-print"
    >
      <ul className="space-y-2">
        {verificacoes.map((v) => {
          const declarado = ficha.anexos[v.chave];
          const tom = v.estado === 'VERIFICADO' ? 'verde' : v.estado === 'EM_FALTA' ? 'brand' : 'neutro';
          return (
            <li key={v.chave} className="flex items-start gap-3 p-3 rounded-xl border border-areia-200 bg-white">
              <input
                type="checkbox"
                className="sgc mt-0.5"
                checked={declarado}
                onChange={() => onAlternar(v.chave)}
                aria-label={v.rotulo}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold text-ink leading-snug">
                  <span className="text-ink-400 font-mono mr-1">{v.alinea}</span>
                  {v.rotulo}
                </p>
                <p className="text-[12px] text-ink-400 mt-0.5 leading-snug">{v.detalhe}</p>
                {v.base && <div className="mt-1.5"><Lei id={v.base} discreto /></div>}
              </div>
              <Pill tom={tom as any} className="flex-none">
                {v.estado === 'VERIFICADO' ? 'verificado' : v.estado === 'EM_FALTA' ? 'em falta' : 'assinatura'}
              </Pill>
            </li>
          );
        })}
      </ul>
    </Card>
  );
};

/* ═════════════════════════════ Impresso oficial ════════════════════════════ */

const Impresso: React.FC<{ ficha: FichaDelegado; alterar: (p: Partial<FichaDelegado>) => void }> = ({
  ficha, alterar,
}) => {
  const { e } = useStore();
  const c = (k: keyof FichaDelegado) => (v: string) => alterar({ [k]: v } as Partial<FichaDelegado>);

  return (
    <div className="print-sheet bg-white rounded-2xl border border-areia-200 shadow-card mx-auto max-w-[820px] px-8 sm:px-12 py-10">
      {/* ── cabeçalho ── */}
      <div className="flex flex-col items-center text-center">
        <Emblema tamanho={92} />
        <p className="text-[13px] font-extrabold uppercase tracking-[0.1em] text-ink mt-4">
          Partido Frelimo
        </p>
        <p className="text-[12.5px] font-bold uppercase tracking-wide text-ink-600 mt-1">
          Sede da {e.celula.provincia}
        </p>
        <p className="text-[12.5px] font-bold uppercase tracking-wide text-ink-600">
          Conferência de Comité do Círculo
        </p>
      </div>

      <div className="mt-7 grid gap-3 max-w-md">
        <Linha rotulo="Distrito/Zona" valor={ficha.distritoZona} onMudar={c('distritoZona')} />
        <Linha rotulo="Círculo" valor={ficha.circulo} onMudar={c('circulo')} />
      </div>

      {/* ── título e caixa da fotografia ── */}
      <div className="flex items-start justify-between gap-6 mt-8">
        <div className="flex-1 flex justify-center pt-6">
          <h2 className="text-[19px] font-extrabold uppercase tracking-[0.16em] text-ink underline underline-offset-[6px] decoration-2">
            Ficha de Delegado
          </h2>
        </div>
        <div className="w-[104px] h-[132px] border-2 border-ink flex items-center justify-center flex-none">
          <span className="text-[11px] font-bold uppercase tracking-widest text-ink-300">Foto</span>
        </div>
      </div>

      {/* ── identificação ── */}
      <div className="mt-8 grid gap-3.5">
        <Linha rotulo="Nome completo" valor={ficha.nomeCompleto} onMudar={c('nomeCompleto')} />

        <div className="flex items-end gap-6">
          <span className="text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-ink-600 pb-0.5">Sexo</span>
          {(['M', 'F'] as const).map((s) => (
            <label key={s} className="flex items-center gap-1.5 text-[13px] text-ink cursor-pointer">
              <input
                type="radio"
                checked={ficha.sexo === s}
                onChange={() => alterar({ sexo: s })}
                className="accent-brand-600"
              />
              {s}
            </label>
          ))}
        </div>

        <Linha rotulo="Filho de" valor={ficha.filhoDe} onMudar={c('filhoDe')} />
        <Linha rotulo="E de" valor={ficha.eDe} onMudar={c('eDe')} />
        <Linha rotulo="Natural de" valor={ficha.naturalDe} onMudar={c('naturalDe')} />

        <div className="grid sm:grid-cols-2 gap-3.5">
          <Linha rotulo="Distrito de" valor={ficha.distritoDe} onMudar={c('distritoDe')} />
          <Linha rotulo="Província de" valor={ficha.provinciaDe} onMudar={c('provinciaDe')} />
        </div>

        <div className="grid sm:grid-cols-2 gap-3.5">
          <Linha rotulo="Idade" valor={ficha.idade} onMudar={c('idade')} />
          <Linha rotulo="Nascido em" valor={ficha.nascidoEm} onMudar={c('nascidoEm')} tipo="date" />
        </div>

        <div className="grid sm:grid-cols-2 gap-3.5">
          <Linha rotulo="Estado civil" valor={ficha.estadoCivil} onMudar={c('estadoCivil')} />
          <Linha rotulo="Nome do cônjuge" valor={ficha.nomeConjuge ?? ''} onMudar={c('nomeConjuge')} />
        </div>

        <Linha rotulo="Habilitações literárias" valor={ficha.habilitacoesLiterarias} onMudar={c('habilitacoesLiterarias')} />
        <Linha rotulo="Profissão/Ocupação" valor={ficha.profissaoOcupacao} onMudar={c('profissaoOcupacao')} />
        <Linha rotulo="Local de trabalho" valor={ficha.localTrabalho} onMudar={c('localTrabalho')} />
        <Linha rotulo="Local de residência" valor={ficha.localResidencia} onMudar={c('localResidencia')} />

        <div className="grid sm:grid-cols-3 gap-3.5">
          <Linha rotulo="B.I. n.º" valor={ficha.biNumero} onMudar={c('biNumero')} />
          <Linha rotulo="Emitido por" valor={ficha.biEmitidoPor} onMudar={c('biEmitidoPor')} />
          <Linha rotulo="Em" valor={ficha.biDataEmissao} onMudar={c('biDataEmissao')} tipo="date" />
        </div>
      </div>

      {/* ── filiação ── */}
      <p className="text-[12.5px] font-extrabold uppercase tracking-[0.1em] text-ink mt-9 mb-3 pb-1 border-b border-areia-300">
        Partido FRELIMO
      </p>
      <div className="grid gap-3.5">
        <Linha rotulo="Data de ingresso" valor={ficha.dataIngressoFrelimo} onMudar={c('dataIngressoFrelimo')} tipo="date" />
        <div className="grid sm:grid-cols-2 gap-3.5">
          <Linha rotulo="Cartão de membro n.º" valor={ficha.cartaoMembroNum} onMudar={c('cartaoMembroNum')} />
          <Linha rotulo="Data de emissão" valor={ficha.cartaoDataEmissao} onMudar={c('cartaoDataEmissao')} tipo="date" />
        </div>
        <Linha rotulo="Nome da Célula" valor={ficha.nomeCelula} onMudar={c('nomeCelula')} />
        <div className="grid sm:grid-cols-2 gap-3.5">
          <Linha rotulo="Distrito/Cidade" valor={ficha.distritoCidadeCelula} onMudar={c('distritoCidadeCelula')} />
          <Linha rotulo="Quotas até" valor={ficha.pagamentoQuotasAte} onMudar={c('pagamentoQuotasAte')} tipo="month" />
        </div>
      </div>

      {/* ── vida orgânica ── */}
      <div className="mt-8">
        <Escolher
          pergunta="É membro de algum órgão do Partido?"
          valor={ficha.membroOrgaoPartido}
          onMudar={(v) => alterar({ membroOrgaoPartido: v })}
          complemento={{
            rotulo: 'Qual?',
            valor: ficha.membroOrgaoPartidoQual ?? '',
            onMudar: c('membroOrgaoPartidoQual'),
          }}
        />
        <Escolher
          pergunta="É membro de alguma organização social da FRELIMO?"
          valor={ficha.membroOrgSocial}
          onMudar={(v) => alterar({ membroOrgSocial: v })}
          complemento={{
            rotulo: 'Qual?',
            valor: ficha.membroOrgSocialQual ?? '',
            onMudar: c('membroOrgSocialQual'),
          }}
        />
        <Escolher
          pergunta="É combatente da Luta de Libertação Nacional?"
          valor={ficha.combatenteLuta}
          onMudar={(v) => alterar({ combatenteLuta: v })}
          complemento={{
            rotulo: 'Desde quando?',
            valor: ficha.combatenteLutaDesde ?? '',
            onMudar: c('combatenteLutaDesde'),
            tipo: 'date',
          }}
        />
      </div>

      <div className="mt-6 grid gap-4">
        <label className="block">
          <span className="text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-ink-600">
            Actividades políticas
          </span>
          <textarea
            value={ficha.actividadesPoliticas ?? ''}
            onChange={(ev) => alterar({ actividadesPoliticas: ev.target.value })}
            rows={3}
            className="w-full mt-1 bg-transparent border-b border-areia-400 focus:border-brand-600 outline-none px-1 py-1 text-[13px] leading-relaxed resize-y"
          />
        </label>
        <label className="block">
          <span className="text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-ink-600">
            Outras informações que julgar úteis
          </span>
          <textarea
            value={ficha.outrasInformacoes ?? ''}
            onChange={(ev) => alterar({ outrasInformacoes: ev.target.value })}
            rows={3}
            className="w-full mt-1 bg-transparent border-b border-areia-400 focus:border-brand-600 outline-none px-1 py-1 text-[13px] leading-relaxed resize-y"
          />
        </label>
      </div>

      {/* ── assinatura ── */}
      <div className="mt-12 flex flex-col items-center">
        <p className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-ink mb-10">Assinatura</p>
        <div className="w-72 border-b border-ink mb-4" />
        <div className="flex items-end gap-2">
          <input
            value={ficha.localAssinatura}
            onChange={(ev) => alterar({ localAssinatura: ev.target.value })}
            placeholder="Local"
            className="w-40 text-center bg-transparent border-b border-areia-400 focus:border-brand-600 outline-none text-[13px] pb-0.5"
          />
          <span className="text-[13px] pb-0.5">,</span>
          <input
            type="date"
            value={ficha.dataAssinatura}
            onChange={(ev) => alterar({ dataAssinatura: ev.target.value })}
            className="w-40 text-center bg-transparent border-b border-areia-400 focus:border-brand-600 outline-none text-[13px] pb-0.5"
          />
        </div>
      </div>

      {/* ── anexos, na versão impressa ── */}
      <div className="mt-12">
        <p className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-ink mb-3">Anexos</p>
        <ul className="space-y-2">
          {anexosDoDelegado(e, ficha.membroId).map((v) => (
            <li key={v.chave} className="flex items-center gap-3 text-[13px] text-ink">
              <span
                className={`w-4 h-4 border border-ink flex-none grid place-items-center ${
                  ficha.anexos[v.chave] ? 'bg-ink' : ''
                }`}
              >
                {ficha.anexos[v.chave] && <IcCheck className="w-3 h-3 text-white" />}
              </span>
              <span>{v.alinea} {v.rotulo};</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

/* ═════════════════════════════ Ficha em edição ═════════════════════════════ */

const FichaAberta: React.FC<{ ficha: FichaDelegado; onVoltar: () => void }> = ({ ficha, onVoltar }) => {
  const { e, guardarFichaDelegado, entregarFichaDelegado, removerFichaDelegado } = useStore();
  const m = membroPorId(e, ficha.membroId);
  const completude = completudeFichaDelegado(ficha);
  const verificacoes = anexosDoDelegado(e, ficha.membroId);
  const bloqueios = verificacoes.filter((v) => v.estado === 'EM_FALTA');

  const alterar = (p: Partial<FichaDelegado>) => guardarFichaDelegado({ ...ficha, ...p });
  const alternarAnexo = (k: keyof FichaDelegado['anexos']) =>
    guardarFichaDelegado({ ...ficha, anexos: { ...ficha.anexos, [k]: !ficha.anexos[k] } });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <Btn variante="fantasma" icone={<IcSetaEsq className="w-4 h-4" />} onClick={onVoltar}>
          Todas as fichas
        </Btn>
        <div className="flex flex-wrap items-center gap-2">
          <Btn variante="contorno" icone={<IcImprimir className="w-4 h-4" />} onClick={() => window.print()}>
            Imprimir
          </Btn>
          {ficha.entregueEm ? (
            <Pill tom="verde" ponto>entregue a {dataMedia(ficha.entregueEm)}</Pill>
          ) : (
            <Btn
              variante="sucesso"
              icone={<IcCheck className="w-4 h-4" />}
              disabled={completude < 100}
              onClick={() => entregarFichaDelegado(ficha.id)}
            >
              Entregar ao Círculo
            </Btn>
          )}
          <Btn
            variante="perigo"
            icone={<IcFechar className="w-4 h-4" />}
            onClick={() => { removerFichaDelegado(ficha.id); onVoltar(); }}
          >
            Eliminar
          </Btn>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
        <Impresso ficha={ficha} alterar={alterar} />

        <div className="space-y-4 no-print lg:sticky lg:top-24">
          <Card titulo="Instrução da ficha" sub={m?.nome}>
            <div className="flex items-center gap-3 mb-4">
              <Avatar nome={ficha.nomeCompleto || 'Delegado'} tamanho={42} />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-ink truncate">{ficha.nomeCompleto || '—'}</p>
                <p className="text-[12px] text-ink-400">Aberta a {dataMedia(ficha.criadaEm)}</p>
              </div>
            </div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-ink-400">Preenchimento</span>
              <span className="text-[15px] font-extrabold tnum text-ink">{completude}%</span>
            </div>
            <Barra valor={completude} tom={completude === 100 ? 'bg-verde-600' : 'bg-brand-600'} />
            <p className="text-[12px] text-ink-400 mt-2.5 leading-relaxed">
              {completude === 100
                ? 'Todos os campos obrigatórios do impresso estão preenchidos.'
                : 'Faltam campos obrigatórios. O botão de entrega abre quando o impresso estiver completo.'}
            </p>
          </Card>

          <PainelAnexos ficha={ficha} onAlternar={alternarAnexo} />

          {bloqueios.length > 0 && (
            <Alerta tom="brand" titulo={`${bloqueios.length} anexo(s) que o sistema não consegue atestar`}>
              {bloqueios.map((b) => b.detalhe).join('. ')}.
            </Alerta>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════ Lista ═════════════════════════════════════ */

export const Delegados: React.FC = () => {
  const { e, criarFichaDelegado, irPara } = useStore();
  const [aberta, setAberta] = useState<string | null>(null);
  const [escolhido, setEscolhido] = useState('');

  const eleicao = e.eleicoes.find((el) => el.cargo === 'DELEGADOS_CONFERENCIA_CIRCULO');
  const eleitos = eleicao?.eleitos.filter((x) => !x.suplente).map((x) => x.membroId) ?? [];

  const semFicha = e.membros.filter(
    (m) => m.estado === 'EFECTIVO' && !e.fichasDelegado.some((f) => f.membroId === m.id),
  );
  const candidatosNaturais = semFicha.filter((m) => eleitos.includes(m.id));
  const paraEscolher = candidatosNaturais.length ? candidatosNaturais : semFicha;

  const fichaActiva = aberta ? e.fichasDelegado.find((f) => f.id === aberta) : undefined;
  if (fichaActiva) return <FichaAberta ficha={fichaActiva} onVoltar={() => setAberta(null)} />;

  const entregues = e.fichasDelegado.filter((f) => f.entregueEm).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <Stat
          rotulo="Fichas abertas"
          valor={e.fichasDelegado.length}
          icone={<IcRelatorio className="w-5 h-5" />}
          tom="brand"
          nota="Impresso oficial do Partido"
        />
        <Stat rotulo="Entregues ao Círculo" valor={entregues} tom="verde" nota="Arquivadas nos documentos" />
        <Stat
          rotulo="Vagas de delegado"
          valor={eleicao?.vagas ?? 0}
          nota={eleicao ? `Escrutínio a ${dataMedia(eleicao.dataEscrutinio)}` : 'Sem eleição convocada'}
        />
        <Stat
          rotulo="Delegados eleitos"
          valor={eleitos.length}
          nota={eleitos.length ? 'Proclamados pela Reunião Geral' : 'Eleição ainda por concluir'}
        />
      </div>

      <Card>
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-5">
          <div className="w-11 h-11 rounded-xl bg-ink text-gold-400 grid place-items-center flex-none">
            <IcRelatorio className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-bold text-ink">Ficha de Delegado à Conferência do Círculo</p>
            <p className="text-[12.5px] text-ink-400 mt-1 leading-relaxed max-w-3xl">
              O impresso oficial, instruído com o que a Célula já tem registado — nome, filiação, cartão de membro,
              residência, profissão e situação de quotas. Sobram os campos que só o camarada pode responder. Dos cinco
              anexos exigidos, o sistema atesta quatro contra os seus próprios registos.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <Lei id="art35n7" />
              <Lei id="art47" />
            </div>
          </div>
        </div>
      </Card>

      {eleicao && eleicao.fase !== 'PROCLAMADA' && eleicao.fase !== 'HOMOLOGADA' && (
        <Alerta
          tom="gold"
          titulo="A eleição de delegados ainda não foi proclamada"
          base="art35n7"
          accao={
            <Btn variante="contorno" onClick={() => irPara('eleicoes', { eleicao: eleicao.id })}>
              Ver a eleição
            </Btn>
          }
        >
          {eleicao.titulo} — {eleicao.vagas} vagas, escrutínio marcado para{' '}
          {dataLonga(eleicao.dataEscrutinio)}. Pode instruir fichas desde já, mas só os eleitos vão a Conferência.
        </Alerta>
      )}

      <Card titulo="Abrir uma ficha" sub={candidatosNaturais.length ? 'Delegados eleitos sem ficha instruída' : 'Membros efectivos da Célula'}>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <Select value={escolhido} onChange={(ev) => setEscolhido(ev.target.value)}>
            <option value="">Escolher o camarada…</option>
            {paraEscolher.map((m) => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
          </Select>
          <Btn
            variante="primaria"
            icone={<IcMais className="w-4 h-4" />}
            disabled={!escolhido}
            onClick={() => {
              const f = criarFichaDelegado(escolhido, eleicao?.id);
              setEscolhido('');
              setAberta(f.id);
            }}
          >
            Instruir ficha
          </Btn>
        </div>
        {paraEscolher.length === 0 && (
          <p className="text-[12.5px] text-ink-400 mt-3">
            Todos os membros efectivos já têm ficha instruída.
          </p>
        )}
      </Card>

      <Secao titulo="Fichas instruídas" sub={`${e.fichasDelegado.length} no total`} />

      {e.fichasDelegado.length === 0 ? (
        <Card>
          <Vazio
            titulo="Nenhuma ficha instruída"
            texto="Abra a ficha de um delegado eleito. O sistema preenche o que já sabe e verifica os anexos que consegue provar."
            icone={<IcUrna className="w-6 h-6" />}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
          {e.fichasDelegado.map((f) => {
            const completude = completudeFichaDelegado(f);
            const falta = anexosDoDelegado(e, f.membroId).filter((v) => v.estado === 'EM_FALTA').length;
            return (
              <button key={f.id} onClick={() => setAberta(f.id)} className="text-left w-full">
                <Card className="h-full lift hover:shadow-lift">
                  <div className="flex items-start gap-3">
                    <Avatar nome={f.nomeCompleto || 'Delegado'} tamanho={40} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14.5px] font-bold text-ink truncate">{f.nomeCompleto || '—'}</p>
                      <p className="text-[12px] text-ink-400 truncate">{f.nomeCelula}</p>
                    </div>
                    {f.entregueEm
                      ? <Pill tom="verde" ponto>entregue</Pill>
                      : <Pill tom={completude === 100 ? 'gold' : 'neutro'}>{completude === 100 ? 'pronta' : 'em curso'}</Pill>}
                  </div>

                  <div className="mt-4">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-ink-400">Preenchimento</span>
                      <span className="text-[13px] font-extrabold tnum text-ink">{completude}%</span>
                    </div>
                    <Barra valor={completude} tom={completude === 100 ? 'bg-verde-600' : 'bg-brand-600'} alt="h-1.5" />
                  </div>

                  <div className="flex items-center gap-2 mt-3.5">
                    {falta > 0
                      ? <Pill tom="brand"><IcAviso className="w-3 h-3" /> {falta} anexo(s) em falta</Pill>
                      : <Pill tom="verde"><IcCheck className="w-3 h-3" /> anexos completos</Pill>}
                    {f.eleicaoId && <Pill tom="neutro">de eleição</Pill>}
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
