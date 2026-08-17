# -*- coding: utf-8 -*-
"""
Gera o dossier técnico do SGC — Sistema de Gestão da Célula (FRELIMO).
Identidade visual retirada do emblema oficial do Partido.
"""
import os
import re
import sys
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, Image, KeepTogether, ListFlowable, ListItem,
    NextPageTemplate, PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle,
)
from reportlab.platypus.flowables import Flowable, HRFlowable

RAIZ = Path(r"C:\Users\Ussete\Desktop\FRELIMO - OCR\prototipo-sgc")
EMBLEMA_WEBP = RAIZ / "public" / "frelimo.webp"
SAIDA = RAIZ / "SGC_Dossier_Tecnico.pdf"
TMP = Path(os.environ.get("TEMP", ".")) / "sgc_dossier"
TMP.mkdir(parents=True, exist_ok=True)

# ───────────────────────────── Identidade ──────────────────────────────
BRAND = colors.HexColor("#E61923")
BRAND_ESC = colors.HexColor("#A10E16")
VERDE = colors.HexColor("#00A34F")
VERDE_ESC = colors.HexColor("#007038")
AMARELO = colors.HexColor("#FFF000")
GOLD = colors.HexColor("#836E00")
PRETO = colors.HexColor("#211E1E")
INK = colors.HexColor("#1A1717")
INK7 = colors.HexColor("#2E2A2A")
INK5 = colors.HexColor("#585151")
INK4 = colors.HexColor("#726B6B")
INK3 = colors.HexColor("#9E9797")
INK2 = colors.HexColor("#D0CACA")
INK1 = colors.HexColor("#EDE9E9")
INK05 = colors.HexColor("#F8F6F6")
BRANCO = colors.white

# ───────────────────────────── Tipografia ──────────────────────────────
FONTES = Path(r"C:\Windows\Fonts")


def registar_fonte(nome, ficheiros):
    for f in ficheiros:
        p = FONTES / f
        if p.exists():
            pdfmetrics.registerFont(TTFont(nome, str(p)))
            return True
    return False


OK = registar_fonte("SGC", ["segoeui.ttf", "arial.ttf", "calibri.ttf"])
registar_fonte("SGC-Bold", ["segoeuib.ttf", "arialbd.ttf", "calibrib.ttf"])
registar_fonte("SGC-It", ["segoeuii.ttf", "ariali.ttf"])
F = "SGC" if OK else "Helvetica"
FB = "SGC-Bold" if OK else "Helvetica-Bold"
try:
    pdfmetrics.getFont("SGC-It")
    FI = "SGC-It"
except Exception:
    FI = F
pdfmetrics.registerFontFamily(F, normal=F, bold=FB, italic=FI, boldItalic=FB)

# ───────────────────────── Emblema em PNG ──────────────────────────────
from PIL import Image as PILImage  # noqa: E402

EMBLEMA = TMP / "emblema.png"
if not EMBLEMA.exists():
    PILImage.open(EMBLEMA_WEBP).convert("RGBA").save(EMBLEMA)
EMB_W, EMB_H = PILImage.open(EMBLEMA).size
EMB_RACIO = EMB_W / EMB_H

# ───────────────────────────── Estilos ─────────────────────────────────
def est(nome, **kw):
    base = dict(name=nome, fontName=F, fontSize=9.6, leading=14.4, textColor=INK7)
    base.update(kw)
    return ParagraphStyle(**base)


S = {
    "corpo": est("corpo", alignment=TA_JUSTIFY),
    "corpo_c": est("corpo_c", alignment=TA_CENTER),
    "lead": est("lead", fontSize=11, leading=16.5, textColor=INK5, alignment=TA_JUSTIFY),
    "h1": est("h1", fontName=FB, fontSize=19, leading=23, textColor=INK, spaceBefore=0, spaceAfter=2),
    "h1num": est("h1num", fontName=FB, fontSize=9, leading=11, textColor=BRAND),
    "h2": est("h2", fontName=FB, fontSize=12.5, leading=16, textColor=INK, spaceBefore=13, spaceAfter=3),
    "h3": est("h3", fontName=FB, fontSize=10.2, leading=13, textColor=BRAND_ESC, spaceBefore=9, spaceAfter=2),
    "peq": est("peq", fontSize=8.4, leading=11.6, textColor=INK4),
    "peq_c": est("peq_c", fontSize=8.4, leading=11.6, textColor=INK4, alignment=TA_CENTER),
    "nota": est("nota", fontSize=8.2, leading=11.4, textColor=INK4, alignment=TA_JUSTIFY),
    "th": est("th", fontName=FB, fontSize=7.6, leading=9.8, textColor=BRANCO),
    "td": est("td", fontSize=8.4, leading=11.4, textColor=INK7),
    "td_b": est("td_b", fontName=FB, fontSize=8.4, leading=11.4, textColor=INK),
    "td_r": est("td_r", fontSize=8.4, leading=11.4, textColor=INK7, alignment=TA_RIGHT),
    "td_rb": est("td_rb", fontName=FB, fontSize=8.4, leading=11.4, textColor=INK, alignment=TA_RIGHT),
    "cita": est("cita", fontName=FI, fontSize=8.6, leading=12.4, textColor=INK5, leftIndent=8),
    "capa_t": est("capa_t", fontName=FB, fontSize=31, leading=35, textColor=BRANCO, alignment=TA_CENTER),
    "capa_s": est("capa_s", fontSize=12.5, leading=18, textColor=colors.HexColor("#BFB6B6"), alignment=TA_CENTER),
    "capa_k": est("capa_k", fontName=FB, fontSize=8.6, leading=12, textColor=colors.HexColor("#F89CA1"), alignment=TA_CENTER),
    "kpi_n": est("kpi_n", fontName=FB, fontSize=17, leading=19, textColor=INK, alignment=TA_CENTER),
    "kpi_r": est("kpi_r", fontName=FB, fontSize=6.6, leading=8.6, textColor=INK4, alignment=TA_CENTER),
}

LARGURA_UTIL = A4[0] - 40 * mm


# ─────────────────────── Elementos gráficos ────────────────────────────
class Faixa(Flowable):
    """Faixa com as cores da bandeira: verde, preto, amarelo, vermelho."""

    def __init__(self, largura=LARGURA_UTIL, altura=3.2, espaco_antes=0, espaco_depois=0):
        Flowable.__init__(self)
        self.largura, self.altura = largura, altura
        self._ea, self._ed = espaco_antes, espaco_depois

    def wrap(self, *a):
        return self.largura, self.altura + self._ea + self._ed

    def draw(self):
        c = self.canv
        w = self.largura / 4.0
        for i, cor in enumerate((VERDE, PRETO, AMARELO, BRAND)):
            c.setFillColor(cor)
            c.rect(i * w, self._ed, w, self.altura, stroke=0, fill=1)


class BarrasH(Flowable):
    """Gráfico de barras horizontais com valor de referência."""

    def __init__(self, dados, largura=LARGURA_UTIL, alt_barra=11, gap=5.4,
                 rotulo_w=86, cor=BRAND, cor_ref=INK1, sufixo=""):
        Flowable.__init__(self)
        self.dados = dados
        self.largura = largura
        self.ab, self.gap, self.rw = alt_barra, gap, rotulo_w
        self.cor, self.cor_ref, self.sufixo = cor, cor_ref, sufixo

    def wrap(self, *a):
        return self.largura, len(self.dados) * (self.ab + self.gap) + 6

    def draw(self):
        c = self.canv
        maxv = max([max(d[1], d[2] if len(d) > 2 else 0) for d in self.dados]) or 1
        area = self.largura - self.rw - 54
        y = len(self.dados) * (self.ab + self.gap)
        for d in self.dados:
            rotulo, valor = d[0], d[1]
            ref = d[2] if len(d) > 2 else None
            y -= self.ab + self.gap
            c.setFont(F, 7.6)
            c.setFillColor(INK5)
            c.drawString(0, y + 2.6, rotulo[:26])
            if ref:
                c.setFillColor(self.cor_ref)
                c.roundRect(self.rw, y, max(1.0, area * ref / maxv), self.ab, 1.6, stroke=0, fill=1)
            c.setFillColor(self.cor)
            c.roundRect(self.rw, y, max(1.0, area * valor / maxv), self.ab, 1.6, stroke=0, fill=1)
            c.setFont(FB, 7.6)
            c.setFillColor(INK)
            c.drawRightString(self.largura, y + 2.6, f"{valor:,}".replace(",", " ") + self.sufixo)


class Fases(Flowable):
    """Diagrama das cinco fases do processo eleitoral."""

    ALTURA = 96

    def __init__(self, fases, largura=LARGURA_UTIL):
        Flowable.__init__(self)
        self.fases = fases
        self.largura = largura

    def wrap(self, *a):
        return self.largura, self.ALTURA

    def draw(self):
        c = self.canv
        n = len(self.fases)
        gap = 9.0
        w = (self.largura - gap * (n - 1)) / n
        caixa_h = self.ALTURA - 8
        interior = w - 12          # margem interior de 6pt de cada lado
        for i, (titulo, sub, base) in enumerate(self.fases):
            x = i * (w + gap)
            # caixa
            c.setFillColor(INK05)
            c.setStrokeColor(INK1)
            c.setLineWidth(0.6)
            c.roundRect(x, 0, w, caixa_h, 4, stroke=1, fill=1)
            # topo vermelho
            c.setFillColor(BRAND)
            c.roundRect(x, caixa_h - 3.4, w, 3.4, 1.4, stroke=0, fill=1)
            # número
            topo = caixa_h - 17
            c.setFillColor(BRAND)
            c.circle(x + 12, topo, 6.4, stroke=0, fill=1)
            c.setFillColor(BRANCO)
            c.setFont(FB, 7.6)
            c.drawCentredString(x + 12, topo - 2.6, str(i + 1))
            # título, possivelmente em duas linhas
            c.setFillColor(INK)
            c.setFont(FB, 7.8)
            lin_tit = _quebrar_largura(titulo, FB, 7.8, interior - 16)
            for j, ln in enumerate(lin_tit[:2]):
                c.drawString(x + 22, topo - 2.6 - j * 9, ln)
            # descrição
            y = topo - 13 - (len(lin_tit[:2]) - 1) * 9
            c.setFillColor(INK4)
            c.setFont(F, 6.7)
            for ln in _quebrar_largura(sub, F, 6.7, interior)[:4]:
                y -= 8.4
                c.drawString(x + 6, y, ln)
            # base legal, fixada no fundo da caixa
            c.setFillColor(GOLD)
            c.setFont(FB, 6.2)
            c.drawString(x + 6, 7, base)
            # ligação entre caixas
            if i < n - 1:
                c.setStrokeColor(INK2)
                c.setLineWidth(0.9)
                c.line(x + w + 1.6, caixa_h / 2, x + w + gap - 3.2, caixa_h / 2)
                c.setFillColor(INK2)
                c.circle(x + w + gap - 2.2, caixa_h / 2, 1.6, stroke=0, fill=1)


class Paleta(Flowable):
    """Amostras da paleta extraída do emblema."""

    def __init__(self, cores, largura=LARGURA_UTIL):
        Flowable.__init__(self)
        self.cores = cores
        self.largura = largura

    def wrap(self, *a):
        return self.largura, 48

    def draw(self):
        c = self.canv
        n = len(self.cores)
        gap = 7.0
        w = (self.largura - gap * (n - 1)) / n
        for i, (nome, hexv, cor) in enumerate(self.cores):
            x = i * (w + gap)
            c.setFillColor(cor)
            c.setStrokeColor(INK1)
            c.roundRect(x, 18, w, 28, 3, stroke=1, fill=1)
            c.setFillColor(INK)
            c.setFont(FB, 7.4)
            c.drawString(x, 9, nome)
            c.setFillColor(INK4)
            c.setFont(F, 6.8)
            c.drawString(x, 1.5, hexv)


def _quebrar_largura(texto, fonte, tam, largura):
    """Divide o texto em linhas que caibam na largura dada, medindo a fonte real."""
    palavras, linhas, actual = texto.split(), [], ""
    for p in palavras:
        tentativa = (actual + " " + p).strip()
        if pdfmetrics.stringWidth(tentativa, fonte, tam) <= largura or not actual:
            actual = tentativa
        else:
            linhas.append(actual)
            actual = p
    if actual:
        linhas.append(actual)
    return linhas


# ─────────────────────────── Tabelas ───────────────────────────────────
def tabela(cabecalho, linhas, larguras, alinhar_dir=(), destaque_ultima=False, fonte=8.4):
    dados = [[Paragraph(h, S["th"]) for h in cabecalho]]
    for ln in linhas:
        fila = []
        for i, cel in enumerate(ln):
            estilo = S["td_r"] if i in alinhar_dir else S["td"]
            if isinstance(cel, tuple):
                cel, negrito = cel
                estilo = S["td_rb"] if i in alinhar_dir else S["td_b"]
            fila.append(Paragraph(str(cel), estilo))
        dados.append(fila)
    t = Table(dados, colWidths=larguras, repeatRows=1, hAlign="LEFT")
    cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("TEXTCOLOR", (0, 0), (-1, 0), BRANCO),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4.4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4.4),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (0, 1), (-1, -2), 0.4, INK1),
        ("LINEBELOW", (0, 0), (-1, 0), 0.9, BRAND),
    ]
    for i in range(1, len(dados)):
        if i % 2 == 0:
            cmds.append(("BACKGROUND", (0, i), (-1, i), INK05))
    if destaque_ultima:
        cmds += [
            ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#FDE7E9")),
            ("LINEABOVE", (0, -1), (-1, -1), 0.9, BRAND),
        ]
    t.setStyle(TableStyle(cmds))
    return t


def caixa(titulo, texto, cor=BRAND, fundo=colors.HexColor("#FEF4F5")):
    conteudo = [
        Paragraph(f'<font name="{FB}" color="#{cor.hexval()[2:]}">{titulo}</font>', S["td"]),
        Paragraph(texto, S["nota"]),
    ]
    t = Table([[conteudo]], colWidths=[LARGURA_UTIL], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), fundo),
        ("LINEBEFORE", (0, 0), (0, -1), 2.4, cor),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
    ]))
    return t


def kpis(itens, cols=4):
    filas = []
    for i in range(0, len(itens), cols):
        bloco = itens[i:i + cols]
        while len(bloco) < cols:
            bloco.append(("", ""))
        filas.append([
            [Paragraph(v, S["kpi_n"]), Paragraph(r.upper(), S["kpi_r"])] for v, r in bloco
        ])
    w = LARGURA_UTIL / cols
    t = Table(filas, colWidths=[w] * cols, hAlign="LEFT")
    cmds = [
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("BOX", (0, 0), (-1, -1), 0.5, INK1),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, INK1),
        ("BACKGROUND", (0, 0), (-1, -1), INK05),
    ]
    t.setStyle(TableStyle(cmds))
    return t


def h1(numero, titulo):
    return KeepTogether([
        Spacer(1, 4),
        Paragraph(numero.upper(), S["h1num"]),
        Paragraph(titulo, S["h1"]),
        Spacer(1, 3),
        HRFlowable(width="100%", thickness=1.4, color=BRAND, spaceAfter=9),
    ])


def lista(itens, estilo="corpo"):
    return ListFlowable(
        [ListItem(Paragraph(i, S[estilo]), leftIndent=12, value="circle") for i in itens],
        bulletType="bullet", bulletColor=BRAND, bulletFontSize=5.4,
        leftIndent=13, spaceBefore=2, spaceAfter=2,
    )


# ───────────────── Normas extraídas de estatutos.ts ────────────────────
def ler_normas():
    src = (RAIZ / "src" / "lib" / "estatutos.ts").read_text(encoding="utf-8")
    bloco = re.findall(
        r"ref:\s*'([^']+)',\s*fonte:\s*'(\w+)',\s*epigrafe:\s*'([^']*)',\s*texto:\s*\n?\s*'([^']*)'",
        src)
    out = []
    for ref, fonte, epi, txt in bloco:
        out.append((ref, "Estatutos" if fonte == "ESTATUTOS" else "Manual da Célula",
                    epi.replace("\\'", "'"), txt.replace("\\'", "'")))
    return out


NORMAS = ler_normas()

# ────────────────────── Dados reais do protótipo ───────────────────────
PROV = [
    ("Niassa", 461, 3120, 4843, 387, 3933, 74, 82),
    ("Cabo Delgado", 531, 4180, 6688, 405, 3958, 73, 74),
    ("Nampula", 1116, 7640, 11870, 880, 8670, 72, 79),
    ("Zambézia", 940, 6980, 11730, 704, 6867, 75, 76),
    ("Tete", 621, 4310, 7211, 474, 4539, 75, 78),
    ("Manica", 465, 3040, 4370, 369, 3594, 76, 81),
    ("Sofala", 705, 4520, 8113, 592, 5826, 80, 81),
    ("Inhambane", 631, 3860, 7928, 513, 5037, 81, 81),
    ("Gaza", 622, 3410, 6750, 554, 5449, 82, 83),
    ("Província de Maputo", 517, 2980, 5770, 441, 4325, 81, 85),
    ("Cidade de Maputo", 411, 2240, 4928, 354, 3390, 83, 88),
    ("Diáspora", 40, 310, 397, 31, 296, 67, 75),
]
NAC = dict(cel=7060, tot=46590, memb=80598, rm=5704, ra=55884, vm=21430953)


def n(v):
    return f"{v:,}".replace(",", " ")


def pc(v, dec=1):
    """Percentagem com vírgula decimal, como se escreve em português."""
    return f"{v:.{dec}f}".replace(".", ",") + "%"


# ─────────────────────────── Documento ─────────────────────────────────
def _largura(texto, fonte, tam, espaco=0.0):
    return pdfmetrics.stringWidth(texto, fonte, tam) + espaco * max(0, len(texto) - 1)


def _espacado(c, x, y, texto, fonte, tam, cor, espaco=0.0, centrado=False):
    """Escreve texto com espaçamento entre caracteres (o canvas não o suporta)."""
    if centrado:
        x = x - _largura(texto, fonte, tam, espaco) / 2
    t = c.beginText(x, y)
    t.setFont(fonte, tam)
    t.setFillColor(cor)
    if espaco:
        t.setCharSpace(espaco)
    t.textOut(texto)
    if espaco:
        t.setCharSpace(0)   # o estado de texto persiste no fluxo do PDF
    c.drawText(t)


def _texto_centrado(c, y, texto, fonte, tam, cor, espaco=0):
    if espaco:
        _espacado(c, A4[0] / 2, y, texto, fonte, tam, cor, espaco, centrado=True)
        return
    c.setFont(fonte, tam)
    c.setFillColor(cor)
    c.drawCentredString(A4[0] / 2, y, texto)


def _faixa(c, x, y, largura, altura, sobre_escuro=False):
    """Sobre fundo escuro, o preto da bandeira é substituído por branco, para a
    faixa não parecer interrompida."""
    segundo = BRANCO if sobre_escuro else PRETO
    w = largura / 4.0
    for i, cor in enumerate((VERDE, segundo, AMARELO, BRAND)):
        c.setFillColor(cor)
        c.rect(x + i * w, y, w, altura, stroke=0, fill=1)


def capa(c, doc):
    """Capa desenhada integralmente no canvas, para controlo total da composição."""
    c.saveState()
    L, H = A4
    # fundo em gradiente vertical
    passos = 120
    for i in range(passos):
        t = i / (passos - 1)
        r = 0.118 + (0.070 - 0.118) * t
        g = 0.094 + (0.055 - 0.094) * t
        b = 0.094 + (0.055 - 0.094) * t
        c.setFillColorRGB(r, g, b)
        c.rect(0, H * i / passos, L, H / passos + 1, stroke=0, fill=1)

    # brilhos suaves, por camadas de opacidade
    for i in range(26):
        c.setFillColor(BRAND, alpha=0.016)
        c.circle(L * 0.88, H * 0.90, 40 + i * 7.5, stroke=0, fill=1)
    for i in range(22):
        c.setFillColor(VERDE, alpha=0.012)
        c.circle(L * 0.10, H * 0.16, 36 + i * 7.0, stroke=0, fill=1)
    c.setFillAlpha(1)

    # faixa da bandeira no topo e no fundo
    _faixa(c, 0, H - 8, L, 8)
    _faixa(c, 0, 0, L, 5)

    # emblema em selo branco
    eh = 122
    ew = eh * EMB_RACIO
    ey = H - 258
    c.setFillColor(BRANCO)
    c.roundRect(L / 2 - ew / 2 - 7, ey - 7, ew + 14, eh + 14, 6, stroke=0, fill=1)
    c.drawImage(str(EMBLEMA), L / 2 - ew / 2, ey, ew, eh, mask="auto")

    # identificação
    _texto_centrado(c, ey - 34, "FRENTE DE LIBERTAÇÃO DE MOÇAMBIQUE", FB, 8.4,
                    colors.HexColor("#F4666D"), espaco=2.6)

    # título
    _texto_centrado(c, ey - 84, "Sistema de Gestão", FB, 33, BRANCO)
    _texto_centrado(c, ey - 120, "da Célula", FB, 33, BRANCO)

    # subtítulo
    _texto_centrado(c, ey - 152, "Membros, cotas, comunicação, reuniões, documentação",
                    F, 12, colors.HexColor("#C4BCBC"))
    _texto_centrado(c, ey - 170, "e democracia interna — da Célula ao escalão nacional",
                    F, 12, colors.HexColor("#C4BCBC"))

    # faixa central
    _faixa(c, L / 2 - 46, ey - 198, 92, 3.6, sobre_escuro=True)

    # base normativa
    _texto_centrado(c, ey - 232, "Ancorado nos Estatutos da FRELIMO, de 6 de Fevereiro de 2023,",
                    F, 10, colors.HexColor("#8F8585"))
    _texto_centrado(c, ey - 249, "e no Manual da Célula, de 23 de Agosto de 2023.",
                    F, 10, colors.HexColor("#8F8585"))

    # cartão inferior
    cx, cy, cw, ch = 20 * mm, 34, L - 40 * mm, 66
    c.setFillColor(colors.HexColor("#221C1C"))
    c.roundRect(cx, cy, cw, ch, 6, stroke=0, fill=1)
    c.setFillColor(BRAND)
    c.roundRect(cx, cy, 3.2, ch, 1.6, stroke=0, fill=1)
    _espacado(c, cx + 16, cy + ch - 24, "A LUTA CONTINUA", FB, 8.2, BRANCO, 2.2)
    c.setFont(F, 8.6)
    c.setFillColor(colors.HexColor("#8F8585"))
    c.drawString(cx + 16, cy + ch - 40, "Protótipo funcional em funcionamento · Draft para apreciação dos órgãos do Partido")
    c.drawString(cx + 16, cy + ch - 54, "Documento gerado a partir do próprio sistema · Agosto de 2026")
    c.setFont(FB, 20)
    c.setFillColor(colors.HexColor("#3A3232"))
    c.drawRightString(cx + cw - 16, cy + 22, "SGC")
    c.restoreState()


def pagina(c, doc):
    c.saveState()
    # cabeçalho
    eh = 15
    ew = eh * EMB_RACIO
    c.drawImage(str(EMBLEMA), 20 * mm, A4[1] - 20 * mm - 4, ew, eh, mask="auto")
    c.setFont(FB, 7.2)
    c.setFillColor(INK4)
    c.drawString(20 * mm + ew + 6, A4[1] - 20 * mm + 1.4, "SGC · SISTEMA DE GESTÃO DA CÉLULA")
    c.setFont(F, 7.2)
    c.setFillColor(INK3)
    c.drawRightString(A4[0] - 20 * mm, A4[1] - 20 * mm + 1.4, "Dossier técnico · Agosto de 2026")
    w = (A4[0] - 40 * mm) / 4
    for i, cor in enumerate((VERDE, PRETO, AMARELO, BRAND)):
        c.setFillColor(cor)
        c.rect(20 * mm + i * w, A4[1] - 20 * mm - 5.5, w, 1.6, stroke=0, fill=1)
    # rodapé
    c.setFillColor(INK1)
    c.rect(20 * mm, 14 * mm, A4[0] - 40 * mm, 0.5, stroke=0, fill=1)
    c.setFont(F, 7)
    c.setFillColor(INK3)
    c.drawString(20 * mm, 10 * mm, "Frente de Libertação de Moçambique · A Luta Continua")
    c.setFont(FB, 8)
    c.setFillColor(INK4)
    c.drawRightString(A4[0] - 20 * mm, 10 * mm, str(doc.page))
    c.restoreState()


doc = BaseDocTemplate(
    str(SAIDA), pagesize=A4,
    leftMargin=20 * mm, rightMargin=20 * mm, topMargin=24 * mm, bottomMargin=20 * mm,
    title="SGC — Sistema de Gestão da Célula · Dossier técnico",
    author="Protótipo funcional",
    subject="Gestão de membros, cotas, reuniões, documentação e democracia interna ao nível da Célula",
    creator="SGC",
)
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
doc.addPageTemplates([
    PageTemplate(id="capa", frames=[frame], onPage=capa),
    PageTemplate(id="normal", frames=[frame], onPage=pagina),
])

E = []
A = E.append


def par(t, estilo="corpo"):
    A(Paragraph(t, S[estilo]))


def esp(h=6):
    A(Spacer(1, h))


# ═════════════════════════════ CAPA ════════════════════════════════════
# A capa é desenhada integralmente em capa(), no canvas. A página 1 não leva
# flowables: passa-se logo ao modelo das páginas interiores.
A(NextPageTemplate("normal"))
A(PageBreak())

# ═══════════════════════════ ÍNDICE ════════════════════════════════════
A(h1("Índice", "O que este documento contém"))
indice = [
    ("1", "Sumário executivo", "O que é, para quem é, o que resolve"),
    ("2", "Âmbito: o pedido e a entrega", "Confronto entre a proposta e o protótipo"),
    ("3", "Fundamento normativo", "Como o sistema se explica pelos Estatutos"),
    ("4", "Os quatro perfis de acesso", "Célula, Círculo, Nacional e Membro"),
    ("5", "Módulos do sistema", "Os oito ecrãs do dia-a-dia da Célula"),
    ("6", "Módulo eleitoral", "As cinco fases, nove cargos e o apuramento"),
    ("7", "Índice de Vitalidade Orgânica", "Medir a saúde da Célula em cinco pilares"),
    ("8", "Consolidação no Círculo", "Velar pelas Células subordinadas"),
    ("9", "Consolidação nacional", "Reuniões de Célula em todo o País"),
    ("10", "Regras numéricas aplicadas", "Cada limiar e a sua norma de origem"),
    ("11", "Arquitectura técnica e identidade", "Como está feito e com que cores"),
    ("12", "Cenário de demonstração", "Os dados que acompanham o protótipo"),
    ("13", "Limites e caminho para produção", "O que falta antes do piloto"),
    ("A", "Anexo A — Normas citadas", f"As {len(NORMAS)} normas que o sistema aplica"),
    ("B", "Anexo B — Estrutura de ficheiros", "Onde está cada coisa"),
]
A(tabela(
    ["", "Secção", "Conteúdo"],
    [[(i, True), (t, True), d] for i, t, d in indice],
    [16, 150, LARGURA_UTIL - 166],
))
esp(14)
A(caixa(
    "Natureza deste protótipo",
    "Trata-se de uma aplicação em funcionamento, navegável, e não de uma maqueta. Todas as regras descritas "
    "neste documento estão implementadas e produzem resultados a partir de dados. O protótipo <b>não tem base "
    "de dados nem servidor</b>: o cenário de demonstração vive no navegador de cada utilizador e pode ser "
    "reposto a qualquer momento, o que o torna seguro para apresentação e discussão.",
    cor=VERDE_ESC, fundo=colors.HexColor("#E7F9EF"),
))
A(PageBreak())

# ══════════════════════ 1. SUMÁRIO EXECUTIVO ═══════════════════════════
A(h1("Secção 1", "Sumário executivo"))
par(
    "A Célula é a organização de base do Partido. É onde se admitem membros, se cobram quotas, se reúne "
    "mensalmente, se elege o Secretariado e se mantém o contacto permanente com a comunidade. É também o "
    "escalão com menos meios técnicos: um Secretariado com poucos recursos, muitas vezes em zonas de "
    "conectividade limitada, a gerir fichas de papel, cadernos de presenças e livros de actas.",
    "lead")
esp(4)
par(
    "Este protótipo demonstra um sistema informático desenhado para esse escalão. Cada tarefa do dia-a-dia — "
    "registar uma quota, difundir uma convocatória, marcar presenças, anexar uma acta — faz-se em poucos "
    "passos e num telemóvel. E cada regra que o sistema aplica está ancorada nos Estatutos ou no Manual da "
    "Célula, com o artigo à vista de quem usa.")
esp(8)
A(Paragraph("O que o sistema resolve", S["h2"]))
A(tabela(
    ["Problema actual", "O que o sistema faz"],
    [
        ["Registos em papel, sem cópia de segurança, com risco de perda",
         "Ficha digital de cada membro, com cópias de segurança automáticas e histórico completo"],
        ["Dificuldade em saber quem está em atraso com as quotas",
         "Lista permanente de quem pagou e quem falta, com a dívida acumulada e o alerta de suspensão ao 12.º mês"],
        ["Repartição da cotização feita à mão, com risco de erro",
         "Repartição automática 60% Célula / 40% escalão superior em cada registo"],
        ["Comunicação lenta e pouco fiável com os membros",
         "Envio por WhatsApp, SMS e email pelo canal preferido de cada membro, com estimativa de custo"],
        ["Convocatórias fora do prazo estatutário",
         "Contagem da antecedência mínima de dois dias, com aviso antes de o prazo terminar"],
        ["Relatório mensal ao Círculo elaborado manualmente",
         "Relatório montado a partir dos dados já registados, pronto a revistar e submeter"],
        ["Eleições internas documentadas de forma desigual",
         "Processo eleitoral em cinco fases, com caderno eleitoral, apuramento, suplentes e prazo de impugnação"],
        ["Escalões superiores sem visão do que se passa nas Células",
         "Consolidação automática no Círculo e à escala nacional, sem pedir nada ao Secretariado"],
    ],
    [LARGURA_UTIL * 0.4, LARGURA_UTIL * 0.6],
))
esp(12)
A(Paragraph("O protótipo em números", S["h2"]))
A(kpis([
    ("12", "ecrãs completos"),
    ("4", "perfis de acesso"),
    (str(len(NORMAS)), "normas aplicadas"),
    ("9", "cargos eleitorais"),
    ("5", "fases por eleição"),
    ("8", "verificações de conformidade"),
    ("5", "pilares de vitalidade"),
    ("12", "províncias consolidadas"),
], cols=4))
esp(10)
A(caixa(
    "A ideia central",
    "O software não substitui o modo de trabalho definido pelo Partido — serve-o. Sempre que o sistema "
    "calcula, avisa ou impede algo, mostra o artigo dos Estatutos ou o ponto do Manual em que se apoia. "
    "A decisão continua a ser dos órgãos; o sistema apenas garante que ninguém decide sem saber o que a "
    "norma exige.",
))
A(PageBreak())

# ══════════════════ 2. ÂMBITO: PEDIDO E ENTREGA ════════════════════════
A(h1("Secção 2", "Âmbito: o pedido e a entrega"))
par(
    "A proposta de criação do sistema define, na secção 2, um conjunto mínimo de funções para a Versão 1. "
    "O quadro seguinte confronta cada função pedida com o que o protótipo entrega.")
esp(8)
A(tabela(
    ["Função da Versão 1", "Estado", "Como está implementada"],
    [
        ["Painel do Secretário", ("Completo", True),
         "Estado da filiação, cotização do mês com repartição 60/40, próxima reunião, avisos pendentes e cinco atalhos"],
        ["Registo de membros", ("Completo", True),
         "Ficha com os campos do Anexo A, ciclo candidato → efectivo → suspenso → cessado e prazo de 120 dias"],
        ["Cotas e contribuições", ("Completo", True),
         "Registo em três passos, numerário ou espécie, mapa de atrasos e relatório de contas mensal"],
        ["Comunicação com os membros", ("Completo", True),
         "WhatsApp, SMS e email, sete audiências calculadas, seis modelos e histórico por membro"],
        ["Reuniões e eventos", ("Completo", True),
         "Convocatória com validação de prazo, agenda-tipo, presenças com quórum, decisões e arquivo de actas"],
        ["Documentos e contactos", ("Completo", True),
         "Repositório da Célula e normativos centrais mantidos numa única versão"],
        ["Painel do Membro", ("Completo", True),
         "Consulta das próprias cotas, próximas reuniões, avisos e documentos partilhados"],
        ["Relatório mensal ao Círculo", ("Completo", True),
         "Gerado a partir dos dados registados, com a estrutura do ponto 1.9 e limite de cinco páginas"],
    ],
    [LARGURA_UTIL * 0.26, LARGURA_UTIL * 0.13, LARGURA_UTIL * 0.61],
))
esp(12)
A(Paragraph("Funções acrescentadas a partir dos Estatutos", S["h2"]))
par(
    "A proposta adia expressamente algumas funcionalidades para fases posteriores. O protótipo antecipa "
    "quatro delas, porque são as que melhor demonstram o valor do sistema aos órgãos do Partido e porque "
    "decorrem directamente do articulado.")
esp(6)
A(tabela(
    ["Extensão", "Base normativa", "Porque foi antecipada"],
    [
        ["Módulo eleitoral completo", "Art. 21, 22, 24, 25, 28, 29, 30, 32, 33, 35, 39, 47, 51",
         "A eleição do Secretário e dos delegados é competência própria da Reunião Geral. Sem este módulo o sistema não cobre a vida orgânica da Célula"],
        ["Quadro de mandatos", "Art. 26, 27, 32",
         "O mandato de cinco anos, as vagas e a cessação por faltas são regras com consequências práticas imediatas"],
        ["Conformidade estatutária", "Art. 12, 35, 16; Manual 1.6, 1.9",
         "Transforma o articulado numa lista verificável, em vez de um dever de memória do Secretariado"],
        ["Consolidação hierárquica", "Art. 21 n.º 1 b), 39 f) e g)",
         "Compete ao Círculo velar pelo funcionamento das Células. A consolidação nasce dos mesmos dados, sem trabalho adicional"],
    ],
    [LARGURA_UTIL * 0.22, LARGURA_UTIL * 0.26, LARGURA_UTIL * 0.52],
))
esp(10)
A(caixa(
    "O que continua fora do âmbito",
    "Plano de Actividades anual estruturado; processos disciplinares e módulo do Elemento de Ligação; apoio "
    "ao recenseamento e mobilização eleitoral; elaboração estruturada de actas dentro do sistema (hoje a acta "
    "é anexada como ficheiro); aplicação móvel com modo offline. O protótipo mostra estas funções como "
    "planeadas para a fase 4, no ecrã de adopção.",
    cor=GOLD, fundo=colors.HexColor("#FFFBD9"),
))
A(PageBreak())

# ═══════════════════ 3. FUNDAMENTO NORMATIVO ═══════════════════════════
A(h1("Secção 3", "Fundamento normativo"))
par(
    "O protótipo trata o articulado do Partido como requisito funcional, não como pano de fundo. "
    f"Estão declaradas {len(NORMAS)} normas — dos Estatutos e do Manual da Célula — cada uma com a sua "
    "epígrafe, referência e texto. Em toda a aplicação, as etiquetas com a referência do artigo são "
    "clicáveis e abrem o texto da norma no próprio ecrã.", "lead")
esp(8)
A(Paragraph("Três consequências práticas deste desenho", S["h2"]))
A(lista([
    "<b>O sistema justifica-se.</b> Quando o painel avisa que uma convocatória tem de sair até uma certa "
    "data, mostra o ponto do Manual que fixa a antecedência mínima de dois dias. O Secretariado não tem de "
    "acreditar no software.",
    "<b>As regras são auditáveis.</b> Todos os limiares numéricos estão num único ficheiro, com a norma de "
    "origem ao lado. Uma revisão dos Estatutos traduz-se numa alteração localizada, não numa caça ao número "
    "espalhado pelo código.",
    "<b>O sistema forma quem o usa.</b> Um Secretário que use a aplicação durante um ano terá lido, em "
    "contexto e a propósito de decisões concretas, as normas que regem a Célula.",
]))
esp(10)
A(Paragraph("Distribuição das normas aplicadas", S["h2"]))
_est = len([x for x in NORMAS if x[1] == "Estatutos"])
_man = len(NORMAS) - _est
A(kpis([
    (str(len(NORMAS)), "normas declaradas"),
    (str(_est), "artigos dos Estatutos"),
    (str(_man), "pontos do Manual da Célula"),
    ("18", "regras numéricas derivadas"),
], cols=4))
esp(12)
A(Paragraph("Exemplos de aplicação directa", S["h2"]))
A(tabela(
    ["Norma", "O que o sistema faz com ela"],
    [
        ["Art. 8 n.º 3 — admissão em 120 dias",
         "Conta os dias desde a apresentação da candidatura na Reunião Geral e escala o aviso a 45, 20 e 0 dias"],
        ["Art. 16 n.º 4 — suspensão por falta de quotas",
         "Ao 12.º mês consecutivo sem pagamento, gera aviso crítico e propõe a suspensão de direitos por um ano"],
        ["Art. 25 n.º 4 — maioria absoluta",
         "Calcula a maioria dos membros em efectividade de funções e abre a segunda volta quando não é alcançada"],
        ["Art. 27 n.º 6 — cessação por faltas",
         "Mede as faltas injustificadas de cada titular de cargo e avisa aos 25%, sinalizando cessação aos 50%"],
        ["Art. 30 — quórum",
         "Distingue os órgãos que deliberam com mais de metade dos membros dos Comités e Conferências, que exigem dois terços"],
        ["Art. 32 n.º 1 — preenchimento de vagas",
         "Guarda a ordem de eleição e apresenta a lista de suplentes pela ordem correcta"],
        ["Art. 33 n.º 1 — impugnação",
         "Abre um prazo de trinta dias após a proclamação e só permite a homologação depois de ele decorrer"],
        ["Art. 35 n.º 3 — dimensão da Célula",
         "Mostra a lotação face ao mínimo de cinco e ao máximo de quinze membros, e assinala o desvio"],
        ["Manual 1.8.3 — repartição da cotização",
         "Divide cada pagamento em 60% retidos na Célula e 40% para o escalão superior, no acto do registo"],
        ["Manual 1.9 — relatório mensal",
         "Monta o relatório com a estrutura exigida e avisa enquanto o do mês anterior não for entregue"],
    ],
    [LARGURA_UTIL * 0.32, LARGURA_UTIL * 0.68],
))
A(PageBreak())

# ═════════════════════ 4. PERFIS DE ACESSO ═════════════════════════════
A(h1("Secção 4", "Os quatro perfis de acesso"))
par(
    "A mesma base de dados vista de quatro alturas diferentes. O selector no topo da barra lateral troca o "
    "perfil e muda toda a navegação, sem duplicar informação.", "lead")
esp(8)
A(tabela(
    ["Perfil", "Quem", "O que vê", "Base"],
    [
        ["Secretário da Célula", "Eleito pela Reunião Geral",
         "Gestão completa: painel, membros, cotas e contas, reuniões e actas, eleições e mandatos, comunicação, documentos, relatório mensal e conformidade",
         "Art. 35 n.º 8"],
        ["Comité de Círculo", "Primeiro Secretário e Secretariado",
         "Síntese do Círculo, as onze Células subordinadas com vitalidade, cotização, assiduidade e alertas de cada uma, e as eleições do escalão",
         "Art. 39 f) g)"],
        ["Administração Central", "Equipa técnica designada",
         "Consolidação de todo o País: reuniões realizadas, cotização, adopção faseada e desempenho comparado das doze províncias",
         "Art. 21 n.º 1 b)"],
        ["Membro da Célula", "Membros efectivos",
         "Apenas consulta: as suas cotas, as próximas reuniões e actividades, os avisos do Secretariado, os documentos partilhados e os seus direitos eleitorais",
         "Secção 2.7 da proposta"],
    ],
    [LARGURA_UTIL * 0.17, LARGURA_UTIL * 0.17, LARGURA_UTIL * 0.52, LARGURA_UTIL * 0.14],
))
esp(12)
A(caixa(
    "Porque o Painel do Membro não tem funções administrativas",
    "O objectivo é o envolvimento, não a delegação de tarefas. Um membro informado participa mais e paga as "
    "quotas com maior regularidade. O acesso faz-se por credenciais individuais ou por ligação segura "
    "enviada por WhatsApp, e o painel mostra ao membro exactamente aquilo que lhe diz respeito — incluindo "
    "se tem capacidade eleitoral activa e passiva no momento.",
    cor=colors.HexColor("#1F6FBF"), fundo=colors.HexColor("#EFF6FF"),
))
esp(12)
A(Paragraph("Navegação e produtividade", S["h2"]))
A(lista([
    "<b>Paleta de comandos</b> (Ctrl K): procura membros, ecrãs e acções a partir de qualquer ponto — "
    "escrever «quota» leva ao registo de pagamento, escrever um nome abre a ficha do camarada.",
    "<b>Cinco atalhos fixos</b> no painel, correspondentes às cinco tarefas do dia-a-dia identificadas na "
    "proposta: registar quota, enviar mensagem, marcar reunião, registar membro e — acrescentado — convocar eleição.",
    "<b>Avisos accionáveis</b>: cada aviso tem um botão que leva ao ecrã onde a situação se resolve, em vez "
    "de deixar ao Secretariado a tarefa de descobrir onde agir.",
]))
A(PageBreak())

# ═══════════════════════ 5. MÓDULOS ════════════════════════════════════
A(h1("Secção 5", "Módulos do sistema"))

modulos = [
    ("5.1", "Painel da Célula",
     "O ecrã de abertura do Secretário. Reúne o estado da filiação, a cotização do mês com a repartição "
     "60/40 já calculada, a próxima Reunião Geral com o estado da convocatória, a assiduidade média e o "
     "Índice de Vitalidade Orgânica.",
     ["Lista de avisos ordenada por gravidade — crítico, alto, médio, informativo — cada um com a norma e o atalho para resolver",
      "Gráfico da cotização dos últimos doze meses, com as parcelas da Célula e do escalão superior separadas",
      "Presenças nas últimas seis Reuniões Gerais, distinguindo presente, ausência justificada e não justificada",
      "Candidaturas em apreciação com a barra do prazo de 120 dias a esgotar-se",
      "Próximas actividades e resumo da conformidade estatutária"]),
    ("5.2", "Membros",
     "A base de dados da Célula, cuja actualização regular é atribuição expressa do Secretariado. Cada "
     "membro tem uma ficha com os campos essenciais do Anexo A e os campos adicionais de preenchimento gradual.",
     ["Barra de lotação face ao mínimo de cinco e ao máximo de quinze membros",
      "Ciclo de filiação completo: candidato, efectivo, suspenso e cessado, com o motivo e a data de cada transição",
      "Cartão de membro digital com o emblema do Partido, número de cartão e ano de ingresso",
      "Assiduidade individual sessão a sessão e percentagem de faltas injustificadas",
      "Histórico de cotização de doze meses, distinguindo numerário de espécie",
      "Indicador de completude da ficha, para orientar o preenchimento gradual"]),
    ("5.3", "Cotas e contas",
     "As quotas são a principal fonte de receita do Partido, fixadas em 1% do rendimento do membro e "
     "podendo ser pagas em espécie. O registo faz-se em três passos: escolher o membro, indicar o valor, "
     "indicar a modalidade.",
     ["Repartição automática de 60% para a Célula e 40% para o escalão superior, mostrada antes de confirmar",
      "Valor de referência sugerido a partir do rendimento declarado, com atalhos de meio, dobro e valor livre",
      "Mapa de atrasos com meses acumulados, dívida estimada e assinalação dos casos que atingem o 12.º mês",
      "Registo de outras receitas e despesas, com comprovativo — no terreno, uma fotografia do telemóvel",
      "Relatório de contas do mês gerado automaticamente, pronto para aprovação na Reunião Geral"]),
    ("5.4", "Reuniões e actas",
     "O ciclo mensal da Reunião Geral e as sessões quinzenais do Secretariado, geridas num calendário único "
     "que inclui também o Estudo Político, a auscultação da comunidade e as actividades culturais e de solidariedade.",
     ["Convocatória com validação da antecedência mínima de dois dias e envio pelos canais de cada membro",
      "Agenda-tipo pré-preenchida com os pontos fixos do Manual, incluindo o ponto específico do momento",
      "Registo de presenças em três estados, com verificação de quórum em tempo real",
      "Controlo da duração face ao limite de noventa minutos da Reunião Geral",
      "Decisões com responsável e prazo, verificadas na sessão seguinte",
      "Arquivo da acta e registo da sua leitura e aprovação na reunião seguinte"]),
    ("5.5", "Comunicação",
     "Reconhecendo as diferentes condições de acesso dos membros, o sistema privilegia o WhatsApp e o SMS, "
     "com o email como canal complementar para comunicações formais.",
     ["Sete audiências calculadas em tempo real: todos, em atraso, ausentes na última sessão, candidatos, aniversariantes do mês, Secretariado e membros sem cartão de eleitor",
      "Seis modelos prontos, cada um com o segmento e o texto adequados",
      "Pré-visualização da mensagem como o membro a receberá",
      "Estimativa de custo por envio, com o SMS identificado como o maior custo variável",
      "Registo automático do histórico de mensagens de cada membro"]),
    ("5.6", "Documentos",
     "Um repositório organizado como pasta partilhada, que separa o que é da Célula do que é normativo central.",
     ["Actas, relatórios mensais e relatórios de contas da Célula",
      "Estatutos, Manual da Célula, Programa do Partido e directiva eleitoral, mantidos centralmente na versão em vigor",
      "Actas de eleição arquivadas automaticamente no fim de cada processo eleitoral"]),
    ("5.7", "Relatório mensal ao Círculo",
     "O documento que a Célula deve enviar mensalmente ao Comité de Círculo, com o máximo de cinco páginas. "
     "É montado a partir do que já foi registado, e não reescrito.",
     ["Oito blocos, na estrutura do ponto 1.9 do Manual: introdução, actividades realizadas, participação e ausências, situação da cotização, situação de fundos, vida orgânica, considerações finais e anexos",
      "Nomes concretos onde a norma exige nomes: quem faltou sem justificação, quem está em atraso, quem atingiu o 12.º mês",
      "Cabeçalho e assinatura institucional, pronto a imprimir ou a guardar em PDF"]),
    ("5.8", "Conformidade estatutária",
     "Oito verificações permanentes sobre os dados reais da Célula. Nenhuma bloqueia o trabalho do "
     "Secretariado: o sistema informa, fundamenta e propõe a correcção.",
     ["Dimensão da Célula, cadência mensal da Reunião Geral, convocatória da próxima sessão, actas aprovadas",
      "Relatório mensal entregue, cotização do mês, órgãos constituídos, recenseamento eleitoral dos membros",
      "Grau de conformidade global e citação integral da norma em cada verificação"]),
]
for num, titulo, intro, pontos in modulos:
    A(KeepTogether([
        Paragraph(f"{num} · {titulo}", S["h2"]),
        Paragraph(intro, S["corpo"]),
        Spacer(1, 3),
        lista(pontos, "peq"),
    ]))
    esp(3)
A(PageBreak())

# ═══════════════════ 6. MÓDULO ELEITORAL ═══════════════════════════════
A(h1("Secção 6", "Módulo eleitoral"))
par(
    "Todos os órgãos do Partido e os seus dirigentes são eleitos democraticamente por voto secreto, "
    "periódico e pessoal. Compete à Reunião Geral da Célula eleger o Secretário e os seus assistentes e os "
    "delegados à Conferência do Círculo; compete ao Comité do Círculo eleger, de entre os seus membros, o "
    "Primeiro Secretário e o Secretariado. O módulo eleitoral acompanha qualquer destes processos em cinco "
    "fases.", "lead")
esp(10)
A(Fases([
    ("Convocação", "Cargo, vagas, data e forma de votação. Mandato de cinco anos calculado.", "Art. 21 · 26"),
    ("Caderno eleitoral", "Capacidade activa e passiva apuradas membro a membro, com fundamento.", "Art. 28"),
    ("Candidaturas", "Propostas por qualquer membro, com aceitação expressa do camarada.", "Art. 14 · 22"),
    ("Escrutínio", "Quórum verificado, maioria absoluta e segunda volta automática.", "Art. 25 · 30"),
    ("Proclamação", "Eleitos e suplentes, acta e prazo de impugnação.", "Art. 32 · 33"),
]))
esp(14)
A(Paragraph("6.1 · Os nove cargos suportados", S["h2"]))
A(tabela(
    ["Cargo", "Órgão que elege", "Quórum", "Base"],
    [
        ["Secretário da Célula", "Reunião Geral da Célula", "mais de metade", "Art. 35 n.º 7 a)"],
        ["Assistentes do Secretariado", "Reunião Geral da Célula", "mais de metade", "Art. 35 n.º 7 a)"],
        ["Elemento de Ligação", "Reunião Geral da Célula", "mais de metade", "Art. 35 n.º 4 c)"],
        ["Delegados à Conferência do Círculo", "Reunião Geral da Célula", "mais de metade", "Art. 35 n.º 7 c)"],
        ["Primeiro Secretário do Círculo", "Comité do Círculo", "dois terços", "Art. 39 a)"],
        ["Secretariado do Comité do Círculo", "Comité do Círculo", "dois terços", "Art. 39 a) · 51 a)"],
        ["Comité de Verificação", "Comité do Círculo", "dois terços", "Art. 51 b)"],
        ["Comité do Círculo", "Conferência do Círculo", "dois terços", "Art. 47 n.º 2 e)"],
        ["Presidium da Conferência", "Conferência do Círculo", "dois terços", "Art. 47 n.º 2 d)"],
    ],
    [LARGURA_UTIL * 0.34, LARGURA_UTIL * 0.28, LARGURA_UTIL * 0.16, LARGURA_UTIL * 0.22],
))
esp(6)
par(
    "Para o Presidium, o sistema exige entre três e nove membros, sendo um presidente e dois secretários, "
    "como manda o Art. 47. Para os cargos dos órgãos da Célula, ninguém acumula dois cargos: quem exerce a "
    "função de Secretário fica excluído da capacidade passiva para Assistente, com o fundamento visível no "
    "caderno.", "nota")
esp(12)
A(Paragraph("6.2 · O caderno eleitoral", S["h2"]))
par(
    "O sistema percorre a base de dados e determina, para cada camarada, se pode votar (capacidade activa) "
    "e se pode ser eleito (capacidade passiva), registando o fundamento de cada exclusão. As exclusões "
    "automáticas são três:")
esp(4)
A(tabela(
    ["Situação", "Consequência", "Norma"],
    [
        ["Candidato a membro, admissão ainda não deliberada", "Sem capacidade activa nem passiva", "Art. 8 n.º 3"],
        ["Direitos suspensos por falta de pagamento de quotas", "Sem capacidade activa nem passiva", "Art. 16 n.º 4"],
        ["Menor de dezoito anos", "Sem capacidade activa nem passiva", "Art. 7"],
        ["Membro que já exerce outro cargo nos órgãos da Célula", "Sem capacidade passiva para o cargo em eleição", "Art. 35 n.º 4"],
    ],
    [LARGURA_UTIL * 0.42, LARGURA_UTIL * 0.38, LARGURA_UTIL * 0.20],
))
esp(6)
par(
    "O caderno é corrigível manualmente — a directiva eleitoral aprovada pelo Comité Central pode fixar "
    "condições que o sistema não conhece. Cada correcção fica registada no processo.", "nota")
esp(12)
A(Paragraph("6.3 · O apuramento", S["h2"]))
A(tabela(
    ["Momento", "Regra aplicada pelo sistema"],
    [
        ["Abertura da mesa",
         "Verifica o quórum: mais de metade dos membros para os órgãos da Célula, dois terços para Comités e Conferências. Sem quórum, não permite deliberar"],
        ["Primeira volta",
         "É eleito quem obtiver a maioria absoluta dos votos dos membros em efectividade de funções do órgão competente — não dos presentes, nem dos votos expressos"],
        ["Controlo de coerência",
         "Assinala se os votos apurados excedem os presentes ao acto, porque o voto é pessoal"],
        ["Segunda volta",
         "Aberta automaticamente entre os mais votados quando as vagas não ficam preenchidas. Nesta volta basta o maior número de votos expressos"],
        ["Proclamação",
         "Fixa a ordem de eleição, que determina a chamada de suplentes em caso de vacatura, e gera a acta de eleição"],
        ["Impugnação",
         "Abre trinta dias a contar da prática do acto. O acto mantém-se válido enquanto a anulação não for decidida"],
        ["Homologação",
         "Só é possível depois de decorrido o prazo. A partir daí o mandato de cinco anos fica registado"],
    ],
    [LARGURA_UTIL * 0.24, LARGURA_UTIL * 0.76],
))
esp(10)
A(caixa(
    "Um exemplo que o protótipo já traz resolvido",
    "A eleição do Primeiro Secretário do Comité do Círculo n.º 12 teve, na primeira volta, 7, 6 e 4 votos "
    "para três candidatos, num órgão com 21 membros em efectividade de funções. Eram necessários 11 votos: "
    "nenhum candidato os obteve. O sistema abriu segunda volta entre os dois mais votados, onde o resultado "
    "foi 10 contra 8. A acta de eleição registou o fundamento da segunda volta, e o processo está agora "
    "dentro do prazo de trinta dias de impugnação, com a homologação bloqueada até ao seu termo.",
))
esp(10)
A(Paragraph("6.4 · Mandatos", S["h2"]))
par(
    "Cada eleição proclamada produz um mandato. O quadro de mandatos mostra os titulares em funções, a "
    "progressão dos cinco anos, as vagas por preencher e o risco de cessação.")
esp(6)
A(tabela(
    ["Regra", "Aplicação", "Norma"],
    [
        ["Mandato de cinco anos", "Calculado a partir do dia seguinte ao escrutínio, com progresso visível", "Art. 26 n.º 1"],
        ["Cessação por faltas", "Aviso aos 25% de faltas injustificadas; cessação assinalada aos 50%", "Art. 27 n.º 6"],
        ["Preenchimento de vagas", "Suplente chamado pela ordem de eleição", "Art. 32 n.º 1"],
        ["Designações acima de metade", "Se metade ou mais das vagas for designada, há eleições na sessão seguinte", "Art. 32 n.º 3"],
        ["Renúncia", "Registada por escrito ao Secretário da Célula, abrindo vaga", "Art. 10 n.º 1"],
    ],
    [LARGURA_UTIL * 0.26, LARGURA_UTIL * 0.56, LARGURA_UTIL * 0.18],
))
A(PageBreak())

# ═══════════════════════════ 7. IVO ════════════════════════════════════
A(h1("Secção 7", "Índice de Vitalidade Orgânica"))
par(
    "Uma Célula pode ter todos os registos em ordem e estar politicamente adormecida. O Índice de "
    "Vitalidade Orgânica resume, num número de 0 a 100, a saúde da vida orgânica da Célula, a partir de "
    "cinco pilares com base normativa própria. Não é uma nota atribuída por alguém: é calculado dos dados "
    "que o Secretariado já registou.", "lead")
esp(10)
A(tabela(
    ["Pilar", "Peso", "O que mede", "Norma"],
    [
        ["Assiduidade", ("25%", True), "Presenças médias nas últimas seis Reuniões Gerais", "Art. 12 n.º 2 d)"],
        ["Cotização", ("30%", True), "Membros em dia nos últimos três meses", "Manual · quotas"],
        ["Cadência", ("20%", True), "Reuniões Gerais mensais efectivamente realizadas em doze meses", "Art. 35 n.º 6"],
        ["Base de dados", ("15%", True), "Completude média das fichas de membro", "Manual 1.6"],
        ["Vida orgânica", ("10%", True), "Actividades realizadas nos últimos seis meses: estudo político, auscultação, cultura, solidariedade", "Art. 36 n.º 3"],
    ],
    [LARGURA_UTIL * 0.17, LARGURA_UTIL * 0.09, LARGURA_UTIL * 0.56, LARGURA_UTIL * 0.18],
    alinhar_dir=(1,),
))
esp(10)
A(Paragraph("Leitura do índice", S["h2"]))
A(tabela(
    ["Intervalo", "Classificação", "Interpretação"],
    [
        ["85 a 100", ("Célula exemplar", True), "Cumpre a cadência, cobra as quotas, mantém as fichas e tem vida política própria"],
        ["70 a 84", ("Célula sólida", True), "Funciona bem, com um ou dois pilares a merecer atenção"],
        ["50 a 69", ("Requer atenção", True), "Falhas estruturais num pilar de peso — tipicamente cotização ou cadência"],
        ["abaixo de 50", ("Situação crítica", True), "Merece intervenção directa do Comité de Círculo"],
    ],
    [LARGURA_UTIL * 0.14, LARGURA_UTIL * 0.20, LARGURA_UTIL * 0.66],
))
esp(12)
A(Paragraph("Utilidade nos escalões superiores", S["h2"]))
par(
    "Ao nível do Círculo, o índice permite ordenar as Células e dirigir o apoio para onde é necessário, "
    "em vez de o distribuir por igual. À escala nacional, permite comparar províncias sem depender de "
    "relatórios narrativos. Como o índice se decompõe nos cinco pilares, um valor baixo diz também <i>onde</i> "
    "está o problema — o que uma média global não faria.")
esp(14)

# ═════════════════════ 8. CÍRCULO ══════════════════════════════════════
A(h1("Secção 8", "Consolidação no Círculo"))
par(
    "As Células do Partido são agrupadas em Círculos, e compete ao Comité do Círculo velar pelo "
    "funcionamento das Células que lhe são subordinadas e apoiar e dinamizar a sua acção. O painel do "
    "Círculo dá corpo a essa atribuição.", "lead")
esp(8)
A(kpis([
    ("11", "células subordinadas"),
    ("113", "membros no círculo"),
    ("69", "vitalidade média"),
    ("6", "células com alertas"),
], cols=4))
esp(12)
A(Paragraph("O que o Comité de Círculo vê de cada Célula", S["h2"]))
A(lista([
    "Número de membros, com assinalação de quem está fora do intervalo estatutário de cinco a quinze",
    "Índice de Vitalidade Orgânica e posição relativa no Círculo",
    "Percentagem de cotização e valor cobrado no mês",
    "Assiduidade média e número de sessões realizadas no ano",
    "Data da última sessão e nome do Secretário em funções",
    "Alertas gerados pelas regras estatutárias, com o motivo explicitado",
]))
esp(10)
A(caixa(
    "Consolidação sem trabalho adicional para a Célula",
    "Nenhum Secretariado preenche formulários para o Círculo. Os números do painel resultam do que cada "
    "Célula já registou no seu dia-a-dia — o mesmo registo que produz o relatório mensal produz a "
    "consolidação. É esta propriedade que torna a adopção sustentável: o escalão superior ganha visibilidade "
    "sem impor mais burocracia ao escalão de base.",
    cor=VERDE_ESC, fundo=colors.HexColor("#E7F9EF"),
))
esp(12)
A(Paragraph("Eleições do escalão", S["h2"]))
par(
    "O mesmo módulo eleitoral serve o Círculo, com as regras próprias do escalão: quórum de dois terços "
    "para os Comités e Conferências, universo eleitoral restrito aos membros do órgão quando a norma exige "
    "que a eleição se faça «de entre os seus membros», e as competências específicas da Conferência do "
    "Círculo, que reúne ordinariamente de cinco em cinco anos.")
A(PageBreak())

# ═════════════════════ 9. NACIONAL ═════════════════════════════════════
A(h1("Secção 9", "Consolidação nacional"))
par(
    "A FRELIMO conta com milhares de Células espalhadas por todo o País e na Diáspora. Uma vez que a "
    "Reunião Geral da Célula é mensal e o Secretariado reúne de quinze em quinze dias, o número de sessões "
    "esperadas em todo o País é conhecido de antemão. O painel nacional mostra, a qualquer momento, quantas "
    "foram efectivamente realizadas.", "lead")
esp(10)
A(kpis([
    (n(NAC["cel"]), "células no sistema"),
    (n(NAC["memb"]), "membros registados"),
    (n(NAC["rm"]), "reuniões este mês"),
    (n(NAC["ra"]), "reuniões no ano"),
], cols=4))
esp(6)
A(Paragraph(
    f'Taxa de realização da cadência mensal: <b>{round(NAC["rm"] / NAC["cel"] * 100)}%</b> · '
    f'Adopção do sistema: <b>{pc(NAC["cel"] / NAC["tot"] * 100)}</b> das {n(NAC["tot"])} Células do País · '
    f'Cotização consolidada no mês: <b>{n(NAC["vm"])} MT</b>, dos quais {n(round(NAC["vm"] * 0.6))} MT '
    f'retidos nas Células e {n(round(NAC["vm"] * 0.4))} MT encaminhados aos escalões.',
    S["peq"]))
esp(12)
A(Paragraph("Reuniões de Célula realizadas este mês, por província", S["h2"]))
A(Paragraph(
    "Barra clara: sessões esperadas, iguais ao número de Células aderentes. Barra vermelha: sessões realizadas.",
    S["peq"]))
esp(6)
A(BarrasH([(p[0], p[4], p[1]) for p in PROV], alt_barra=9.6, gap=4.6, rotulo_w=88))
esp(14)
A(Paragraph("Quadro consolidado", S["h2"]))
linhas = []
for nome, cel, tot, memb, rm, ra, cot, ass in PROV:
    linhas.append([nome, n(cel), n(tot), pc(cel / tot * 100), n(memb), n(rm),
                   f"{round(rm / cel * 100)}%", n(ra), f"{cot}%"])
linhas.append([("Total nacional", True), (n(NAC["cel"]), True), (n(NAC["tot"]), True),
               (pc(NAC["cel"] / NAC["tot"] * 100), True), (n(NAC["memb"]), True),
               (n(NAC["rm"]), True), (f'{round(NAC["rm"] / NAC["cel"] * 100)}%', True),
               (n(NAC["ra"]), True), ("—", True)])
A(tabela(
    ["Província", "Células no sistema", "Células no total", "Adopção", "Membros",
     "Reuniões no mês", "Cadência", "Reuniões no ano", "Cotização"],
    linhas,
    [LARGURA_UTIL * 0.19] + [LARGURA_UTIL * 0.101] * 8,
    alinhar_dir=(1, 2, 3, 4, 5, 6, 7, 8),
    destaque_ultima=True,
))
esp(8)
A(caixa(
    "Como o número é apurado",
    "Cada Célula registada no sistema tem uma Reunião Geral esperada por mês, pelo que o total esperado "
    "iguala o número de Células aderentes. As sessões do Secretariado, de quinze em quinze dias, "
    "acrescentam cerca de 1,85 sessões por Célula e por mês. Não há qualquer estimativa manual nem inquérito "
    "aos escalões: o número sobe quando um Secretariado encerra uma sessão no seu telemóvel. É esta a "
    "diferença entre consolidar e recolher.",
))
esp(10)
A(Paragraph("Adopção faseada", S["h2"]))
par(
    "A expansão faz-se por demonstração de utilidade, não por imposição. O painel nacional acompanha as "
    "quatro fases previstas na proposta — piloto num Círculo, ajustes, expansão faseada e enriquecimento — "
    "e mostra, por província, quantas das Células existentes já usam o sistema. A média de membros por "
    "Célula funciona como indicador de saúde orgânica: médias fora do intervalo de cinco a quinze "
    "sinalizam Células a dividir ou a reforçar.")
A(PageBreak())

# ═════════════════ 10. REGRAS NUMÉRICAS ════════════════════════════════
A(h1("Secção 10", "Regras numéricas aplicadas"))
par(
    "Todos os limiares que o sistema aplica estão declarados num único lugar, com a norma de origem. "
    "Uma revisão dos Estatutos ou do Manual traduz-se na alteração destes valores, sem procurar números "
    "espalhados pelo código.", "lead")
esp(8)
A(tabela(
    ["Regra", "Valor", "Norma"],
    [
        ["Dimensão mínima da Célula", ("5 membros", True), "Art. 35 n.º 3"],
        ["Dimensão máxima da Célula", ("15 membros", True), "Art. 35 n.º 3"],
        ["Idade mínima de filiação", ("18 anos", True), "Art. 7"],
        ["Prazo de decisão sobre candidatura", ("120 dias", True), "Art. 8 n.º 3"],
        ["Antecedência mínima da convocatória", ("2 dias", True), "Manual da Célula"],
        ["Duração máxima da Reunião Geral", ("90 minutos", True), "Manual da Célula"],
        ["Periodicidade da Reunião Geral", ("mensal", True), "Art. 35 n.º 6"],
        ["Periodicidade do Secretariado", ("15 dias", True), "Art. 35 n.º 9"],
        ["Taxa da quota", ("1% do rendimento", True), "Manual da Célula"],
        ["Parcela retida na Célula", ("60%", True), "Manual 1.8.3"],
        ["Parcela para o escalão superior", ("40%", True), "Manual 1.8.3"],
        ["Meses de incumprimento até à suspensão", ("12 meses", True), "Art. 16 n.º 4"],
        ["Duração da suspensão de direitos", ("1 ano, até regularizar", True), "Art. 16 n.º 4"],
        ["Quórum dos órgãos da Célula", ("mais de metade", True), "Art. 30 n.º 2"],
        ["Quórum de Comités e Conferências", ("dois terços", True), "Art. 30 n.º 1"],
        ["Maioria na primeira volta", ("maioria absoluta dos membros em efectividade", True), "Art. 25 n.º 4"],
        ["Maioria na segunda volta", ("maior número de votos expressos", True), "Art. 25 n.º 4"],
        ["Duração do mandato dos órgãos", ("5 anos", True), "Art. 26 n.º 1"],
        ["Faltas injustificadas — aviso", ("25%", True), "Art. 27 n.º 6"],
        ["Faltas injustificadas — cessação", ("50%", True), "Art. 27 n.º 6"],
        ["Prazo de impugnação", ("30 dias", True), "Art. 33 n.º 1"],
        ["Composição do Presidium", ("3 a 9 membros", True), "Art. 47 n.º 2 d)"],
        ["Periodicidade das Conferências", ("5 anos", True), "Art. 50 n.º 1"],
        ["Limite do relatório mensal", ("5 páginas", True), "Manual 1.9"],
    ],
    [LARGURA_UTIL * 0.42, LARGURA_UTIL * 0.34, LARGURA_UTIL * 0.24],
))
A(PageBreak())

# ═════════════ 11. ARQUITECTURA E IDENTIDADE ═══════════════════════════
A(h1("Secção 11", "Arquitectura técnica e identidade visual"))
A(Paragraph("11.1 · Como está construído", S["h2"]))
A(tabela(
    ["Camada", "Escolha", "Razão"],
    [
        ["Interface", "React 19 com TypeScript", "Componentes tipados, adequados a um sistema com muitas regras"],
        ["Compilação", "Vite 6", "Arranque imediato em desenvolvimento e pacote pequeno em produção"],
        ["Estilo", "Tailwind CSS com paleta do Partido", "Consistência visual garantida por tokens, não por repetição"],
        ["Gráficos", "Recharts", "Gráficos declarativos, separados num pedaço próprio do pacote"],
        ["Estado", "Memória do navegador com espelho local", "Sem base de dados nem servidor: o protótipo é seguro para apresentar"],
        ["Publicação", "Ficheiros estáticos", "Alojável em qualquer serviço, sem infra-estrutura própria"],
    ],
    [LARGURA_UTIL * 0.18, LARGURA_UTIL * 0.30, LARGURA_UTIL * 0.52],
))
esp(8)
A(caixa(
    "Ausência deliberada de base de dados",
    "O protótipo não cria, não lê e não escreve em qualquer base de dados. Todo o cenário é gerado em "
    "memória, de forma determinística, no arranque da aplicação, e espelhado no armazenamento local do "
    "navegador para que o trabalho não se perca ao recarregar a página. Isto permite distribuir e discutir o "
    "sistema sem qualquer decisão prévia sobre alojamento, soberania de dados ou segurança — decisões que a "
    "proposta reserva, com razão, para os órgãos competentes do Partido.",
))
esp(12)
A(Paragraph("11.2 · Separação entre regras e ecrãs", S["h2"]))
par(
    "A arquitectura separa deliberadamente quatro responsabilidades, o que torna o sistema auditável por "
    "quem não escreve código:")
esp(4)
A(tabela(
    ["Ficheiro", "Responsabilidade"],
    [
        ["estatutos.ts", f"As {len(NORMAS)} normas citadas, as agendas-tipo, os nove cargos eleitorais e os limiares numéricos"],
        ["selectors.ts", "Todo o cálculo: quórum, maiorias, atrasos, prazos, assiduidade, vitalidade e consolidação"],
        ["store.tsx", "As acções que alteram o estado, cada uma com o aviso e a norma que a fundamenta"],
        ["views/", "Os doze ecrãs, que apenas apresentam o que as camadas anteriores decidem"],
    ],
    [LARGURA_UTIL * 0.22, LARGURA_UTIL * 0.78],
))
esp(6)
par(
    "Nenhuma regra estatutária está escrita dentro de um ecrã. Verificar se o sistema aplica corretamente o "
    "Art. 25 n.º 4 é ler uma função, não percorrer a interface.", "nota")
esp(14)
A(Paragraph("11.3 · Identidade visual", S["h2"]))
par(
    "A identidade não é uma paleta genérica: a cor foi extraída do próprio emblema oficial do Partido, "
    "pixel a pixel.")
esp(8)
A(Paleta([
    ("Vermelho", "#E61923", BRAND),
    ("Verde", "#00A34F", VERDE),
    ("Amarelo", "#FFF000", AMARELO),
    ("Preto", "#211E1E", PRETO),
    ("Branco", "#FFFFFF", BRANCO),
]))
esp(10)
A(lista([
    "<b>Emblema oficial</b> — o batuque e a espiga de milho sobre campo vermelho, com as diagonais da "
    "bandeira nacional. Apresentado sobre selo branco, como no original impresso, e sempre na proporção "
    "original. Aparece na barra lateral, no cabeçalho de cada painel, no cartão de membro, no relatório "
    "mensal e como ícone do separador do navegador.",
    "<b>Faixa da bandeira</b> — verde, preto, amarelo e vermelho, na ordem da bandeira nacional e das "
    "diagonais do emblema. Usada como elemento de assinatura sob a barra de topo, no cartão de membro, no "
    "cabeçalho do relatório e no rodapé, incluindo neste documento.",
    "<b>Neutros quentes</b> — a escala de cinzentos foi ajustada ao preto do emblema, em vez do cinzento "
    "azulado habitual, para que o vermelho e o verde assentem naturalmente.",
    "<b>Contraste verificado</b> — os tons usados em texto cumprem o critério AA sobre os respectivos "
    "fundos. O amarelo da bandeira, que não é legível como texto, fica reservado a elementos gráficos.",
]))
esp(14)

# ═══════════════ 12. CENÁRIO DE DEMONSTRAÇÃO ═══════════════════════════
A(h1("Secção 12", "Cenário de demonstração"))
par(
    "O protótipo acompanha um cenário construído para que as regras se vejam em funcionamento, e não "
    "apenas descritas. A data de referência está congelada em <b>12 de Agosto de 2026</b>, para que os "
    "prazos façam sentido em qualquer momento em que o sistema seja apresentado.", "lead")
esp(10)
A(tabela(
    ["Elemento", "Cenário"],
    [
        ["Célula", "Célula n.º 7 «Josina Machel», Bairro Polana Caniço A"],
        ["Círculo", "Círculo n.º 12 — Polana Caniço A, KaMaxakeni, Cidade de Maputo"],
        ["Membros", "15 na base de dados: 11 efectivos, 2 candidatos, 1 suspenso e 1 cessado"],
        ["Reuniões", "36 sessões registadas: 14 Reuniões Gerais realizadas, 16 sessões do Secretariado e 4 actividades"],
        ["Cotização", "123 registos de pagamento em catorze meses, incluindo pagamentos em espécie"],
        ["Documentos", "23 documentos: actas, relatórios mensais, relatórios de contas e normativos centrais"],
        ["Eleições", "4 processos: um homologado, dois em curso na Célula e um proclamado no Círculo"],
        ["Consolidação", f'11 Células no Círculo e {n(NAC["cel"])} Células em doze províncias'],
    ],
    [LARGURA_UTIL * 0.18, LARGURA_UTIL * 0.82],
))
esp(12)
A(Paragraph("Situações deliberadamente em aberto", S["h2"]))
par(
    "O cenário coloca a Célula com problemas reais por resolver, porque é aí que o sistema se demonstra:")
esp(4)
A(tabela(
    ["Situação", "O que o sistema faz", "Norma"],
    [
        ["Reunião Geral marcada para 15 de Agosto sem convocatória difundida",
         "Aviso de nível alto, com o prazo a terminar a 13 de Agosto e um botão para difundir de imediato", "Manual da Célula"],
        ["Uma camarada com catorze meses sem pagar quota",
         "Aviso crítico e proposta de suspensão de direitos por um ano, até à regularização", "Art. 16 n.º 4"],
        ["Um Assistente com 42% de faltas injustificadas",
         "Assinalação de risco no quadro de mandatos e menção no relatório mensal", "Art. 27 n.º 6"],
        ["Elemento de Ligação vago por renúncia",
         "Vaga assinalada e eleição já convocada, na fase de candidaturas", "Art. 32 n.º 1"],
        ["Duas candidaturas a membro em apreciação",
         "Contagem dos 120 dias, com a mais antiga a 25 dias do limite", "Art. 8 n.º 3"],
        ["Relatório mensal de Julho por entregar",
         "Aviso permanente e relatório já montado, à espera de revisão e submissão", "Manual 1.9"],
        ["Eleição do Primeiro Secretário do Círculo proclamada",
         "Prazo de trinta dias de impugnação em contagem, homologação bloqueada até ao termo", "Art. 33 n.º 1"],
    ],
    [LARGURA_UTIL * 0.31, LARGURA_UTIL * 0.51, LARGURA_UTIL * 0.18],
))
esp(8)
par(
    "O botão de reposição, na barra lateral, devolve o cenário ao estado inicial. Cada pessoa que abra o "
    "sistema começa do mesmo ponto, e as alterações que fizer só a ela dizem respeito.", "nota")
A(PageBreak())

# ═══════════════ 13. LIMITES E PRODUÇÃO ════════════════════════════════
A(h1("Secção 13", "Limites e caminho para produção"))
par(
    "Este é um protótipo funcional, destinado a validar o desenho com Secretários de Célula reais antes de "
    "qualquer decisão de investimento. Importa por isso ser claro sobre o que ainda não é.", "lead")
esp(10)
A(Paragraph("13.1 · Limites actuais", S["h2"]))
A(tabela(
    ["Limite", "Consequência prática"],
    [
        ["Sem base de dados nem servidor",
         "Os dados vivem no navegador de cada utilizador. Nada é partilhado entre pessoas nem persiste noutro lugar"],
        ["Sem autenticação",
         "Os quatro perfis trocam-se livremente, para permitir a demonstração. Em produção, cada perfil exige credenciais e permissões"],
        ["Comunicação simulada",
         "Os envios por WhatsApp, SMS e email são registados mas não saem do sistema. Em produção exigem a WhatsApp Business API e um gateway de SMS de uma operadora moçambicana"],
        ["Documentos não são ficheiros reais",
         "O repositório mostra os metadados dos documentos; o carregamento e a leitura de ficheiros ficam para a versão com alojamento"],
        ["Consolidação nacional com dados sintéticos",
         "A Célula e o Círculo têm dados detalhados e coerentes; a escala nacional usa números plausíveis, gerados de forma determinística, para demonstrar a mecânica"],
        ["Tailwind carregado por CDN",
         "Adequado a um protótipo; em produção deve ser compilado, para eliminar a dependência de rede no arranque"],
    ],
    [LARGURA_UTIL * 0.28, LARGURA_UTIL * 0.72],
))
esp(12)
A(Paragraph("13.2 · Passos seguintes sugeridos", S["h2"]))
A(tabela(
    ["", "Passo", "Objectivo"],
    [
        [("1", True), "Validar o desenho com Secretários de Célula reais",
         "Confirmar a nomenclatura, a ordem dos ecrãs e os campos da ficha antes de fixar qualquer coisa"],
        [("2", True), "Decidir a plataforma de suporte",
         "Confirmar se o desenho aqui demonstrado se obtém por configuração de um CRM de código aberto ou se justifica desenvolvimento próprio"],
        [("3", True), "Formalizar os requisitos de soberania de dados",
         "Localização em território nacional, propriedade dos dados, exportação integral, encriptação, cópias de segurança e registo de acessos"],
        [("4", True), "Contratar alojamento e integrar a comunicação",
         "Ambiente na nuvem, WhatsApp Business API e gateway de SMS junto das operadoras"],
        [("5", True), "Piloto num Círculo",
         "Um número reduzido de Células, com formação de duas a quatro horas e um ponto focal técnico local"],
        [("6", True), "Ajustar e expandir",
         "Recolher a experiência do piloto, corrigir e alargar progressivamente a mais Círculos e Distritos"],
    ],
    [14, LARGURA_UTIL * 0.30, LARGURA_UTIL * 0.66],
))
esp(14)
A(caixa(
    "Recomendação final",
    "Manter a disciplina de simplicidade. Cada função adicional no arranque é uma barreira à adopção, e a "
    "expansão deve fazer-se por demonstração de utilidade. O protótipo mostra deliberadamente mais do que a "
    "Versão 1 exige — nomeadamente o módulo eleitoral — para que os órgãos do Partido possam decidir, com "
    "matéria à frente, o que entra no arranque e o que espera.",
    cor=VERDE_ESC, fundo=colors.HexColor("#E7F9EF"),
))
A(PageBreak())

# ═══════════════════ ANEXO A — NORMAS ══════════════════════════════════
A(h1("Anexo A", "Normas citadas pelo sistema"))
par(
    f"As {len(NORMAS)} normas declaradas no sistema, com a referência, a epígrafe e o texto tal como é "
    "apresentado ao utilizador quando toca na etiqueta do artigo.", "lead")
esp(8)
linhas_normas = []
for ref, fonte, epi, txt in NORMAS:
    linhas_normas.append([(ref, True), epi, txt])
A(tabela(
    ["Referência", "Epígrafe", "Texto apresentado"],
    linhas_normas,
    [LARGURA_UTIL * 0.13, LARGURA_UTIL * 0.20, LARGURA_UTIL * 0.67],
    fonte=7.6,
))
A(PageBreak())

# ═══════════════════ ANEXO B — FICHEIROS ═══════════════════════════════
A(h1("Anexo B", "Estrutura de ficheiros"))
par("O protótipo é uma pasta autónoma dentro do repositório, que não altera qualquer sistema existente.", "lead")
esp(8)
A(tabela(
    ["Caminho", "Conteúdo"],
    [
        ["index.html", "Paleta do Partido, fontes e ícone do separador"],
        ["netlify.toml", "Configuração de publicação: compilação, redireccionamentos e cabeçalhos"],
        ["public/frelimo.webp", "Emblema oficial — logótipo, ícone e origem da paleta"],
        ["src/lib/types.ts", "Modelo de domínio: membro, célula, reunião, quota, eleição, mandato"],
        ["src/lib/estatutos.ts", f"As {len(NORMAS)} normas, agendas-tipo, nove cargos eleitorais e limiares numéricos"],
        ["src/lib/seed.ts", "Cenário de demonstração determinístico"],
        ["src/lib/selectors.ts", "Cálculo: quórum, maiorias, atrasos, prazos, assiduidade, vitalidade, consolidação"],
        ["src/lib/store.tsx", "Estado da aplicação e todas as acções"],
        ["src/lib/format.ts", "Datas, moeda e números em português de Moçambique"],
        ["src/ui/", "Primitivas visuais e biblioteca de ícones"],
        ["src/layout/", "Barra lateral, barra de topo e paleta de comandos"],
        ["src/views/", "Os doze ecrãs"],
        ["README.md", "Instruções de execução, publicação e descrição funcional"],
    ],
    [LARGURA_UTIL * 0.26, LARGURA_UTIL * 0.74],
))
esp(16)
A(Faixa(altura=4))
esp(10)
A(Paragraph(
    '<font name="%s" color="#E61923">FRENTE DE LIBERTAÇÃO DE MOÇAMBIQUE</font><br/>'
    '<font color="#726B6B">Sistema de Gestão da Célula · Protótipo funcional · Agosto de 2026</font><br/>'
    '<font name="%s" color="#1A1717">A LUTA CONTINUA</font>' % (FB, FB),
    S["peq_c"]))

doc.build(E)
print("PDF gerado:", SAIDA)
print("Tamanho:", round(SAIDA.stat().st_size / 1024), "KB")
