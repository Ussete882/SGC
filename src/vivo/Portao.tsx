/* ===========================================================================
   Portão da votação em directo: constituir a assembleia (a mesa) e entrar
   pelo nome (o camarada). É o único ecrã que funciona sem sessão aberta.
   ========================================================================= */

import React, { useEffect, useMemo, useState } from 'react';
import { MEMBROS_EXTERNOS, SECRETARIOS_CIRCULO, criarEstadoInicial } from '../lib/seed';
import { normalizar } from '../lib/format';
import { ErroServidor, api, guardarSessao, type ResumoSala, type Sessao } from '../lib/vivo';
import { Alerta, Avatar, Btn, Campo, Emblema, Escolha, Input, Interruptor, Lei, Pill, Textarea } from '../ui/primitives';
import { IcCheck, IcMembros, IcSeta, IcSetaEsq, IcUrna } from '../ui/icons';
import { CodigoSala, MolduraEscura, ServidorEmFalta } from './comuns';

/* ═══════════════════════════════ Cadernos-tipo ═════════════════════════════ */

/** Listas de arranque, tiradas do cenário de demonstração do protótipo. */
function cadernosTipo() {
  const cel = criarEstadoInicial();
  return {
    CIRCULO: {
      nome: 'Comité do Círculo n.º 12 — Polana Caniço A',
      escopo: 'CIRCULO' as const,
      nota: 'Os onze Secretários de Célula do Círculo e os camaradas do Comité.',
      membros: [
        ...SECRETARIOS_CIRCULO.map((nome, i) => ({ nome, funcao: `Secretário da Célula n.º ${i + 1}` })),
        ...Object.values(MEMBROS_EXTERNOS)
          .filter((m) => !SECRETARIOS_CIRCULO.includes(m.nome))
          .map((m) => ({ nome: m.nome, funcao: m.cargo })),
      ],
    },
    CELULA: {
      nome: 'Célula n.º 7 — Josina Machel',
      escopo: 'CELULA' as const,
      nota: 'Os membros efectivos da Célula do cenário de demonstração.',
      membros: cel.membros
        .filter((m) => m.estado === 'EFECTIVO')
        .map((m) => ({
          nome: m.nome,
          funcao:
            m.cargo === 'SECRETARIO' ? 'Secretária da Célula'
              : m.cargo === 'ASSISTENTE' ? 'Assistente do Secretariado'
                : m.cargo === 'ELEMENTO_LIGACAO' ? 'Elemento de Ligação'
                  : '',
        })),
    },
  };
}

/* ═══════════════════════════════════ Casca ═════════════════════════════════ */

const Casca: React.FC<{ children: React.ReactNode; onVoltar?: () => void; largura?: string }> = ({
  children, onVoltar, largura = 'max-w-2xl',
}) => (
  <MolduraEscura>
    <div className="relative flex-1 flex items-start sm:items-center justify-center px-4 py-8 sm:py-10">
      <div className={`w-full ${largura} a-rise`}>
        {onVoltar && (
          <button
            onClick={onVoltar}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-white/45 hover:text-white mb-4 transition-colors"
          >
            <IcSetaEsq className="w-4 h-4" /> Voltar
          </button>
        )}
        {children}
      </div>
    </div>
    <div className="relative px-6 py-4 border-t border-white/10 flex items-center justify-between gap-4">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/30">A Luta Continua</p>
      <a href="#/" className="text-[11px] text-white/25 hover:text-white/60 transition-colors">Voltar ao SGC</a>
    </div>
  </MolduraEscura>
);

const Painel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`rounded-3xl bg-white shadow-lift p-5 sm:p-7 ${className}`}>{children}</div>
);

/* ═══════════════════════════════ 1. Abertura ═══════════════════════════════ */

const Abertura: React.FC<{ ir: (r: string) => void }> = ({ ir }) => {
  const [codigo, setCodigo] = useState('');

  return (
    <Casca>
      <div className="flex flex-col items-center text-center mb-8">
        <Emblema tamanho={76} />
        <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-brand-300 mt-5">
          Frente de Libertação de Moçambique
        </p>
        <h1 className="text-[28px] sm:text-[36px] font-extrabold tracking-tight mt-2.5 leading-tight">
          Votação em directo
        </h1>
        <p className="text-white/55 text-[14px] mt-3 leading-relaxed max-w-lg">
          Escrutínio secreto, pessoal e em tempo real: cada camarada vota do seu telemóvel e a mesa acompanha a
          afluência e o apuramento à medida que acontece.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => ir('#/votar/novo')}
          className="text-left p-5 rounded-2xl bg-white/[0.06] border border-white/12 hover:bg-white hover:border-white transition-all duration-300 ease-swift group"
        >
          <span className="w-10 h-10 rounded-xl bg-brand-600 text-white grid place-items-center mb-3">
            <IcUrna className="w-5 h-5" />
          </span>
          <p className="text-[15px] font-extrabold text-white group-hover:text-ink flex items-center gap-2">
            Constituir a assembleia
            <IcSeta className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:text-brand-600" />
          </p>
          <p className="text-[12.5px] text-white/45 group-hover:text-ink-400 mt-1.5 leading-relaxed">
            Para a mesa. Cria a Célula ou o órgão de teste, inscreve os camaradas no caderno eleitoral e obtém o
            código da sala.
          </p>
        </button>

        <div className="p-5 rounded-2xl bg-white/[0.06] border border-white/12">
          <span className="w-10 h-10 rounded-xl bg-verde-600 text-white grid place-items-center mb-3">
            <IcMembros className="w-5 h-5" />
          </span>
          <p className="text-[15px] font-extrabold text-white">Entrar com o meu nome</p>
          <p className="text-[12.5px] text-white/45 mt-1.5 leading-relaxed">
            Escreva o código de cinco letras que a mesa anunciou.
          </p>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(ev) => {
              ev.preventDefault();
              if (codigo.trim().length >= 4) ir(`#/votar/${codigo.trim().toUpperCase()}`);
            }}
          >
            <input
              value={codigo}
              onChange={(ev) => setCodigo(ev.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              placeholder="ABCDE"
              autoCapitalize="characters"
              autoComplete="off"
              className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white font-mono font-bold tracking-[0.3em] text-center placeholder:text-white/25 outline-none focus:border-white/60"
            />
            <Btn variante="primaria" type="submit" disabled={codigo.trim().length < 4}>Entrar</Btn>
          </form>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white/[0.05] border border-white/10 p-4 flex items-start gap-3">
        <Pill tom="gold" className="!bg-gold-500/15 !text-gold-300 !border-gold-500/30 flex-none mt-0.5">Art. 21</Pill>
        <p className="text-[11.5px] text-white/45 leading-relaxed">
          «Todos os órgãos do Partido e os seus dirigentes são eleitos democraticamente por voto secreto, periódico e
          pessoal.» O sistema guarda o boletim e o descarregamento do voto em registos separados: sabe-se quem votou,
          nunca em quem.
        </p>
      </div>
    </Casca>
  );
};

/* ══════════════════════════════ 2. Constituir ══════════════════════════════ */

const Constituir: React.FC<{ ir: (r: string) => void; onSessao: (s: Sessao) => void }> = ({ ir, onSessao }) => {
  const cadernos = useMemo(cadernosTipo, []);
  const [escopo, setEscopo] = useState<'CELULA' | 'CIRCULO' | 'CONFERENCIA'>('CIRCULO');
  const [nome, setNome] = useState(cadernos.CIRCULO.nome);
  const [local, setLocal] = useState('');
  const [mesa, setMesa] = useState('');
  const [lista, setLista] = useState(cadernos.CIRCULO.membros.map((m) => `${m.nome}${m.funcao ? ` — ${m.funcao}` : ''}`).join('\n'));
  const [pinObrigatorio, setPin] = useState(true);
  const [registoAberto, setRegisto] = useState(true);
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const membros = useMemo(
    () =>
      lista
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length >= 2)
        .map((l) => {
          const [n, f] = l.split(/\s+[—–-]\s+/);
          return { nome: n.trim(), funcao: (f ?? '').trim() };
        }),
    [lista],
  );

  const comoTexto = (c: { membros: { nome: string; funcao: string }[] }) =>
    c.membros.map((m) => `${m.nome}${m.funcao ? ` — ${m.funcao}` : ''}`).join('\n');

  const aplicarCaderno = (chave: 'CIRCULO' | 'CELULA') => {
    const c = cadernos[chave];
    setEscopo(c.escopo);
    setNome(c.nome);
    setLista(comoTexto(c));
  };

  /**
   * Os membros de uma Célula não são os do Comité do Círculo: o Comité agrupa
   * os Secretários de várias Células, e numa Célula há um só Secretário. Trocar
   * de órgão troca, por isso, o caderno — mas apenas enquanto ele ainda for um
   * dos cadernos-tipo. Se já foi escrito à mão, não se deita fora o trabalho.
   */
  const escolherOrgao = (novo: 'CELULA' | 'CIRCULO' | 'CONFERENCIA') => {
    setEscopo(novo);
    const intacto = lista.trim() === comoTexto(cadernos.CIRCULO).trim()
      || lista.trim() === comoTexto(cadernos.CELULA).trim();
    if (!intacto) return;
    const c = novo === 'CELULA' ? cadernos.CELULA : cadernos.CIRCULO;
    setNome(c.nome);
    setLista(comoTexto(c));
  };

  const criar = async () => {
    setErro(null);
    setAGuardar(true);
    try {
      const r = await api.criarAssembleia({ nome, escopo, local, mesa, membros, pinObrigatorio, registoAberto });
      const s: Sessao = { codigo: r.codigo, token: r.token, papel: 'MESA', membroId: null, chaveMesa: r.chaveMesa };
      guardarSessao(s);
      onSessao(s);
      ir(`#/votar/${r.codigo}`);
    } catch (ex) {
      setErro(ex instanceof ErroServidor ? ex.message : 'Não foi possível constituir a assembleia.');
    } finally {
      setAGuardar(false);
    }
  };

  const semServidor = erro?.includes('servidor da votação');
  const excedeu = escopo === 'CELULA' && membros.length > 15;
  const escassa = escopo === 'CELULA' && membros.length < 5;

  return (
    <Casca onVoltar={() => ir('#/votar')} largura="max-w-3xl">
      <Painel>
        <div className="flex items-start gap-3 mb-6">
          <span className="w-11 h-11 rounded-2xl bg-brand-600 text-white grid place-items-center flex-none">
            <IcUrna className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-[21px] font-extrabold text-ink tracking-tight leading-tight">Constituir a assembleia</h2>
            <p className="text-[13px] text-ink-400 mt-0.5 leading-snug">
              O caderno eleitoral fixa quem vota e quem pode ser eleito. Pode alterá-lo depois, na mesa.
            </p>
          </div>
        </div>

        <div className="mb-5">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-ink-400 mb-2">Caderno de arranque</p>
          <div className="flex flex-wrap gap-2">
            <Btn tamanho="sm" onClick={() => aplicarCaderno('CIRCULO')}>Comité do Círculo n.º 12 ({cadernos.CIRCULO.membros.length})</Btn>
            <Btn tamanho="sm" onClick={() => aplicarCaderno('CELULA')}>Célula n.º 7 ({cadernos.CELULA.membros.length})</Btn>
            <Btn tamanho="sm" variante="fantasma" onClick={() => setLista('')}>Começar em branco</Btn>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Órgão que delibera" className="sm:col-span-2">
            <Escolha
              colunas={3}
              valor={escopo}
              onMudar={(v) => escolherOrgao(v as 'CELULA' | 'CIRCULO' | 'CONFERENCIA')}
              itens={[
                { id: 'CELULA', rotulo: 'Reunião Geral da Célula', nota: 'Quórum: mais de metade · até 15 membros' },
                { id: 'CIRCULO', rotulo: 'Comité do Círculo', nota: 'Quórum: dois terços' },
                { id: 'CONFERENCIA', rotulo: 'Conferência', nota: 'Quórum: dois terços' },
              ]}
            />
          </Campo>

          <Campo rotulo="Designação" obrigatorio className="sm:col-span-2">
            <Input value={nome} onChange={(ev) => setNome(ev.target.value)} placeholder="Célula n.º 7 — Josina Machel" />
          </Campo>

          <Campo rotulo="Local da sessão">
            <Input value={local} onChange={(ev) => setLocal(ev.target.value)} placeholder="Sede do Círculo, Polana Caniço A" />
          </Campo>
          <Campo rotulo="Quem preside à mesa">
            <Input value={mesa} onChange={(ev) => setMesa(ev.target.value)} placeholder="Nome do camarada que dirige" />
          </Campo>

          <Campo
            rotulo={
              <span className="flex items-center gap-2">
                Caderno eleitoral — {membros.length} camarada(s)
                {escopo === 'CELULA' && (
                  <span className={`normal-case tracking-normal font-bold ${excedeu ? 'text-brand-600' : 'text-ink-300'}`}>
                    máximo 15
                  </span>
                )}
              </span>
            }
            obrigatorio
            className="sm:col-span-2"
            nota="Um nome por linha. Para indicar a função, escreva «Nome — Função»."
          >
            <Textarea
              value={lista}
              onChange={(ev) => setLista(ev.target.value)}
              rows={10}
              className="font-mono text-[12.5px] leading-relaxed"
              placeholder={'Teresa Manuel Ubisse — Secretária da Célula n.º 1\nAnastácio Bernardo Nhaca — Primeiro Secretário'}
            />
          </Campo>
        </div>

        {excedeu && (
          <div className="mt-4">
            <Alerta tom="brand" titulo={`Uma Célula não tem ${membros.length} membros`} base="art35">
              O máximo é quinze. Os camaradas do Comité do Círculo são Secretários de Células diferentes — não
              militam todos na mesma Célula, onde há um só Secretário. Se é o Comité que vai deliberar, escolha esse
              órgão acima.
            </Alerta>
          </div>
        )}
        {escassa && (
          <div className="mt-4">
            <Alerta tom="gold" titulo="Menos de cinco membros" base="art35">
              Uma Célula constitui-se com um mínimo de cinco. Para um ensaio não impede nada — é só um aviso.
            </Alerta>
          </div>
        )}

        <div className="mt-5 rounded-2xl border border-ink-100 bg-ink-50/60 p-4 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold text-ink">Código pessoal por camarada</p>
              <p className="text-[12px] text-ink-400 mt-0.5 leading-snug">
                Quatro dígitos, gerados agora e entregues pela mesa. Garantem que o voto é pessoal.
              </p>
            </div>
            <Interruptor activo={pinObrigatorio} onMudar={setPin} />
          </div>
          <div className="flex items-start justify-between gap-4 pt-3 border-t border-ink-100">
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold text-ink">Permitir inscrição na hora</p>
              <p className="text-[12px] text-ink-400 mt-0.5 leading-snug">
                Quem não constar do caderno pode inscrever-se escrevendo o nome. Útil no primeiro teste.
              </p>
            </div>
            <Interruptor activo={registoAberto} onMudar={setRegisto} />
          </div>
        </div>

        {erro && (
          <div className="mt-4">
            {semServidor ? <ServidorEmFalta mensagem={erro} /> : <Alerta tom="brand" titulo="Não foi possível constituir">{erro}</Alerta>}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Lei id="art28" />
            <Lei id="art21" />
          </div>
          <Btn
            variante="primaria"
            tamanho="lg"
            onClick={criar}
            disabled={aGuardar || excedeu || membros.length < 2 || nome.trim().length < 3}
          >
            {aGuardar ? 'A constituir…' : 'Constituir e abrir a sala'}
          </Btn>
        </div>
      </Painel>
    </Casca>
  );
};

/* ════════════════════════════════ 3. Entrada ═══════════════════════════════ */

const Entrada: React.FC<{ codigo: string; ir: (r: string) => void; onSessao: (s: Sessao) => void }> = ({
  codigo, ir, onSessao,
}) => {
  const [sala, setSala] = useState<ResumoSala | null>(null);
  const [erroSala, setErroSala] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [escolhido, setEscolhido] = useState<{ id?: string; nome: string } | null>(null);
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [aEntrar, setAEntrar] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [modoMesa, setModoMesa] = useState(false);
  const [chaveMesa, setChaveMesa] = useState('');

  const carregar = async () => {
    setErroSala(null);
    try {
      setSala(await api.sala(codigo));
    } catch (ex) {
      setErroSala(ex instanceof ErroServidor ? ex.message : 'Não foi possível ler a assembleia.');
    }
  };

  useEffect(() => { void carregar(); /* eslint-disable-next-line */ }, [codigo]);

  const filtrados = useMemo(() => {
    if (!sala) return [];
    const q = normalizar(busca);
    return q ? sala.membros.filter((m) => normalizar(m.nome).includes(q)) : sala.membros;
  }, [sala, busca]);

  const entrar = async () => {
    if (!escolhido) return;
    setErro(null);
    setAEntrar(true);
    try {
      const r = await api.entrar(codigo, { membroId: escolhido.id, nome: escolhido.id ? undefined : escolhido.nome, pin });
      const s: Sessao = { codigo, token: r.token, papel: 'VOTANTE', membroId: r.membroId, nome: r.nome };
      guardarSessao(s);
      onSessao(s);
    } catch (ex) {
      setErro(ex instanceof ErroServidor ? ex.message : 'Não foi possível entrar.');
    } finally {
      setAEntrar(false);
    }
  };

  const entrarMesa = async () => {
    setErro(null);
    setAEntrar(true);
    try {
      const r = await api.entrarMesa(codigo, chaveMesa.trim());
      const s: Sessao = { codigo, token: r.token, papel: 'MESA', membroId: null, chaveMesa: chaveMesa.trim() };
      guardarSessao(s);
      onSessao(s);
    } catch (ex) {
      setErro(ex instanceof ErroServidor ? ex.message : 'Chave inválida.');
    } finally {
      setAEntrar(false);
    }
  };

  if (erroSala) {
    return (
      <Casca onVoltar={() => ir('#/votar')}>
        <Painel>
          {erroSala.includes('servidor da votação')
            ? <ServidorEmFalta mensagem={erroSala} onTentar={() => void carregar()} />
            : (
              <Alerta tom="brand" titulo={`Assembleia ${codigo} não encontrada`}>
                {erroSala} Confirme o código com a mesa — são cinco letras, sem espaços.
              </Alerta>
            )}
        </Painel>
      </Casca>
    );
  }

  if (!sala) {
    return (
      <Casca>
        <Painel><p className="text-center text-ink-400 py-8 text-sm">A abrir a assembleia {codigo}…</p></Painel>
      </Casca>
    );
  }

  return (
    <Casca onVoltar={() => ir('#/votar')}>
      <Painel>
        <div className="text-center mb-6">
          <Emblema tamanho={54} className="mx-auto" />
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-brand-600 mt-4">{sala.orgao}</p>
          <h2 className="text-[21px] font-extrabold text-ink tracking-tight mt-1 leading-tight">{sala.nome}</h2>
          {sala.local && <p className="text-[12.5px] text-ink-400 mt-1">{sala.local}</p>}
          <div className="mt-3 flex justify-center"><CodigoSala codigo={sala.codigo} /></div>
        </div>

        {modoMesa ? (
          <div className="space-y-3">
            <Campo rotulo="Chave da mesa" nota="A chave longa que apareceu quando a assembleia foi constituída.">
              <Input value={chaveMesa} onChange={(ev) => setChaveMesa(ev.target.value)} placeholder="cole aqui a chave" className="font-mono text-[12px]" />
            </Campo>
            {erro && <Alerta tom="brand" titulo="Não foi possível entrar">{erro}</Alerta>}
            <div className="flex gap-2">
              <Btn variante="fantasma" onClick={() => { setModoMesa(false); setErro(null); }}>Voltar</Btn>
              <Btn variante="escura" largo onClick={entrarMesa} disabled={aEntrar || chaveMesa.trim().length < 10}>
                Entrar como mesa
              </Btn>
            </div>
          </div>
        ) : escolhido ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-ink-50 border border-ink-100">
              <Avatar nome={escolhido.nome} tamanho={44} />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-extrabold text-ink truncate">{escolhido.nome}</p>
                <p className="text-[12px] text-ink-400">{escolhido.id ? 'Inscrito no caderno eleitoral' : 'Nova inscrição'}</p>
              </div>
              <Btn tamanho="sm" variante="fantasma" onClick={() => { setEscolhido(null); setPin(''); setErro(null); }}>Trocar</Btn>
            </div>

            {sala.pinObrigatorio && (
              <Campo rotulo="O seu código pessoal" nota="Quatro dígitos entregues pela mesa.">
                <input
                  value={pin}
                  onChange={(ev) => setPin(ev.target.value.replace(/\D/g, '').slice(0, 4))}
                  inputMode="numeric"
                  autoFocus
                  placeholder="0000"
                  onKeyDown={(ev) => { if (ev.key === 'Enter' && pin.length === 4) void entrar(); }}
                  className="w-full bg-white border border-ink-200 rounded-2xl px-4 py-4 text-center text-[30px] font-mono font-extrabold tracking-[0.4em] text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </Campo>
            )}

            {erro && <Alerta tom="brand" titulo="Não foi possível entrar">{erro}</Alerta>}

            <Btn
              variante="primaria"
              tamanho="lg"
              largo
              onClick={entrar}
              disabled={aEntrar || (sala.pinObrigatorio && pin.length !== 4)}
              icone={<IcCheck className="w-4 h-4" />}
            >
              {aEntrar ? 'A entrar…' : 'Entrar na assembleia'}
            </Btn>
          </div>
        ) : (
          <div>
            <Campo rotulo="Encontre o seu nome">
              <Input
                value={busca}
                onChange={(ev) => setBusca(ev.target.value)}
                placeholder="escreva as primeiras letras"
                autoFocus
              />
            </Campo>

            <div className="mt-3 max-h-[46vh] overflow-y-auto -mx-1 px-1 space-y-1.5">
              {filtrados.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setEscolhido({ id: m.id, nome: m.nome })}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-ink-100 bg-white hover:border-brand-300 hover:bg-brand-50/40 transition-all text-left"
                >
                  <Avatar nome={m.nome} tamanho={34} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-bold text-ink truncate">{m.nome}</span>
                    {m.funcao && <span className="block text-[11.5px] text-ink-400 truncate">{m.funcao}</span>}
                  </span>
                  {m.presente && <Pill tom="verde">já entrou</Pill>}
                  <IcSeta className="w-4 h-4 text-ink-200 flex-none" />
                </button>
              ))}
              {filtrados.length === 0 && (
                <p className="text-center text-[13px] text-ink-400 py-6">Nenhum nome corresponde a «{busca}».</p>
              )}
            </div>

            {sala.registoAberto && (
              <div className="mt-4 pt-4 border-t border-ink-100">
                <p className="text-[12.5px] font-bold text-ink mb-2">Não está na lista?</p>
                <div className="flex gap-2">
                  <Input
                    value={novoNome}
                    onChange={(ev) => setNovoNome(ev.target.value)}
                    placeholder="Escreva o seu nome completo"
                  />
                  <Btn
                    variante="contorno"
                    onClick={() => setEscolhido({ nome: novoNome.trim() })}
                    disabled={novoNome.trim().length < 3}
                  >
                    Inscrever
                  </Btn>
                </div>
              </div>
            )}
          </div>
        )}

        {!modoMesa && (
          <p className="text-center mt-5">
            <button onClick={() => setModoMesa(true)} className="text-[11.5px] text-ink-300 hover:text-ink-500 link-underline">
              Sou da mesa da assembleia
            </button>
          </p>
        )}
      </Painel>
    </Casca>
  );
};

/* ═══════════════════════════════════ Portão ════════════════════════════════ */

export const Portao: React.FC<{
  codigo: string;
  ir: (r: string) => void;
  onSessao: (s: Sessao) => void;
  /** Motivo por que a sessão anterior caiu, quando houve uma. */
  aviso?: string | null;
}> = ({ codigo, ir, onSessao, aviso }) => {
  const barra = aviso ? (
    <div className="fixed inset-x-0 top-0 z-50 bg-brand-600 text-white px-4 py-2.5 text-center a-fade">
      <p className="text-[12.5px] font-semibold leading-snug max-w-2xl mx-auto">{aviso}</p>
    </div>
  ) : null;

  return (
    <>
      {barra}
      <div className={aviso ? 'pt-10' : ''}>
        {!codigo ? <Abertura ir={ir} />
          : codigo === 'NOVO' ? <Constituir ir={ir} onSessao={onSessao} />
            : <Entrada codigo={codigo} ir={ir} onSessao={onSessao} />}
      </div>
    </>
  );
};
