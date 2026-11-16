"use strict";

const Chamada = document.getElementByClassName('Chamada');

function chamadaLista() {
    if (Chamada.style.display === 'none') {
      Chamada.style.display = 'block';
    } Chamada {
      accedi.style.display = 'none';
    }
}


(function () {
  /* ---------- Dados ---------- */
  var CHAVE = "ganzine_presenze_v1";

  var EQUIPE_PADRAO = [
    ["Pietro Palumbo", "Redazione Artistica -- 4D2"],
    ["Davide Fontana", "Multimedia -- 4M1"],
    ["Anthea Maddiona", "News -- 4FIG1"],
    ["Diana Bolognesi", "Interviste -- 4ARC"],
    ["Davide Parlanti", "Redazione Artistica -- 4FIG"],
    ["Bernardo Vignoli", "IT e Social Media -- 4BRC1"],
    ["Rosa Iannaccio", "Multimedia -- 4D2"],
    ["Pietro Mancinelli", "Interviste -- 5BRC1"],
    ["Mori Marta", "Redazione Artistica -- 2D2"],
    ["Rajna Sinanrrapaj", "Grafica -- 2D1GS"],
    ["Irene Rossi", "Multimedia -- 5BRC1"],
    ["Maria Francesca Pecorelli", "Interviste -- 5BRC1"],
    ["Ludovico Proietti", "Fotografia -- 3M1"],
    ["Alessio Mencaroni", "Media Digital -- 4FIG1"],
    ["Geremia Dei", "Multimedia -- 1LCV2"],
    ["Riccardo Minciotti", "News -- 3BRC1"],
    ["Irene Puopolo", "Intervista -- 3BRC"],
    ["Giulia Abate", "Interviste -- 3BRC"],
    ["Chiara Materazzi", "Multimedia -- 3BRC"],
    ["Alissa Cazzanti", "News -- 4D2"],
    ["Melissa Quarata", "Redazione Artistica -- 5D1CS"],
    ["Samuele Zanchi", "Redazione Artistica -- 3FIG2"],
    ["Andrea Nofri", "Redazione Artistica -- 4M1"],
    ["Giuggi Scricciolo", "Redazione Artistica -- 2M1"]
  ];

  function equipePadrao() {
    return EQUIPE_PADRAO.map(function (m, i) {
      return { id: "m" + (i + 1), nome: m[0], ruolo: m[1] };
    });
  }

  var armazenamentoOk = true;

  function carregar() {
    try {
      var d = JSON.parse(localStorage.getItem(CHAVE));
      if (d && Array.isArray(d.equipe) && d.presenze && typeof d.presenze === "object") return d;
    } catch (e) { /* segue com o padrão */ }
    return { equipe: equipePadrao(), presenze: {} };
  }

  function gravar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(dados));
      armazenamentoOk = true;
    } catch (e) {
      armazenamentoOk = false;
    }
    return armazenamentoOk;
  }

  var dados = carregar();
  var dataAtual = "";
  var presentes = new Set();
  var sujo = false;

  /* ---------- Utilitários ---------- */
  function $(id) { return document.getElementById(id); }

  function el(tag, props, filhos) {
    var e = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      var v = props[k];
      if (k === "class") e.className = v;
      else if (k === "text") e.textContent = v;
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v);
    });
    (filhos || []).forEach(function (f) {
      e.appendChild(typeof f === "string" ? document.createTextNode(f) : f);
    });
    return e;
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function paraIso(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function deIso(s) {
    var p = s.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  // Sexta-feira mais recente (hoje, se for sexta)
  function sextaAte(d) {
    var r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    r.setDate(r.getDate() - ((r.getDay() - 5 + 7) % 7));
    return r;
  }
  function somarDias(iso, n) {
    var d = deIso(iso);
    d.setDate(d.getDate() + n);
    return paraIso(d);
  }
  function formatarLongo(iso) {
    return deIso(iso).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  function formatarCurto(iso) {
    return deIso(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
  }
  function formatarHora(isoDataHora) {
    var d = new Date(isoDataHora);
    return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }) + " alle " +
      d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  }

  function dizer(msg) { $("avviso").textContent = msg || ""; }

  /* ---------- Dia selecionado ---------- */
  function carregarDia() {
    var rec = dados.presenze[dataAtual];
    presentes = new Set();
    if (rec) {
      rec.membros.forEach(function (m) { if (m.presente) presentes.add(m.id); });
    }
    sujo = false;
  }

  function selecionarData(iso, opcoes) {
    opcoes = opcoes || {};
    if (!iso) return;
    var d = deIso(iso);
    var aviso = "";
    if (d.getDay() !== 5) {
      d = sextaAte(d);
      iso = paraIso(d);
      aviso = "Gli incontri sono di venerdì: data spostata al venerdì precedente.";
    }
    if (iso === dataAtual) { dizer(aviso); $("campoData").value = dataAtual; return; }
    if (sujo && !opcoes.forzare &&
        !confirm("Ci sono modifiche non salvate. Cambiare data e perderle?")) {
      $("campoData").value = dataAtual;
      return;
    }
    dataAtual = iso;
    carregarDia();
    $("campoData").value = dataAtual;
    dizer(aviso);
    renderizarTudo();
  }

  /* ---------- Render: chamada ---------- */
  function renderTitulo() {
    $("titoloData").textContent = formatarLongo(dataAtual);
  }

  function renderContador() {
    var tot = dados.equipe.length;
    $("contatore").textContent = presentes.size + " / " + tot + " presenti";
    var st = $("stato");
    var rec = dados.presenze[dataAtual];
    if (sujo) {
      st.textContent = "Modifiche non salvate";
      st.className = "stato modificato";
    } else if (rec) {
      st.textContent = "Salvato il " + formatarHora(rec.salvoEm);
      st.className = "stato salvato";
    } else {
      st.textContent = "Non ancora salvato";
      st.className = "stato";
    }
  }

  function renderLista() {
    var ul = $("listaMembri");
    var filtro = $("cerca").value.trim().toLowerCase();
    ul.textContent = "";
    var visiveis = dados.equipe.filter(function (m) {
      return !filtro || (m.nome + " " + m.ruolo).toLowerCase().indexOf(filtro) !== -1;
    });
    if (!visiveis.length) {
      ul.appendChild(el("li", { class: "vuoto", text: dados.equipe.length ? "Nessun risultato." : "La lista è vuota: aggiungi un membro qui sotto." }));
      return;
    }
    visiveis.forEach(function (m) {
      var cb = el("input", { type: "checkbox", id: "p-" + m.id });
      cb.checked = presentes.has(m.id);
      var label = el("label", { class: "membro" + (cb.checked ? " presente" : ""), for: "p-" + m.id }, [
        cb,
        el("span", { class: "membro-info" }, [
          el("strong", { text: m.nome }),
          el("small", { text: m.ruolo })
        ])
      ]);
      cb.addEventListener("change", function () {
        if (cb.checked) presentes.add(m.id); else presentes.delete(m.id);
        label.classList.toggle("presente", cb.checked);
        sujo = true;
        renderContador();
      });
      var rem = el("button", {
        type: "button", class: "rimuovi", title: "Rimuovi dalla lista",
        "aria-label": "Rimuovi " + m.nome,
        onclick: function () { rimuoverMembro(m); }
      }, ["×"]);
      ul.appendChild(el("li", { class: "membro-item" }, [label, rem]));
    });
  }

  function renderChamada() {
    renderTitulo();
    renderLista();
    renderContador();
  }

  /* ---------- Render: storico ---------- */
  function renderStorico() {
    var box = $("listaStorico");
    box.textContent = "";
    var datas = Object.keys(dados.presenze).sort().reverse();
    if (!datas.length) {
      box.appendChild(el("p", { text: "Ancora nessuna chiamata salvata." }));
      return;
    }
    datas.forEach(function (iso) {
      var rec = dados.presenze[iso];
      var pres = rec.membros.filter(function (m) { return m.presente; });
      var ass = rec.membros.filter(function (m) { return !m.presente; });

      function coluna(titolo, lista) {
        var ul = el("ul");
        if (!lista.length) ul.appendChild(el("li", { text: "—" }));
        lista.forEach(function (m) { ul.appendChild(el("li", { text: m.nome })); });
        return el("div", {}, [el("h4", { text: titolo + " (" + lista.length + ")" }), ul]);
      }

      var corpo = el("div", { class: "registro-corpo" }, [
        el("div", { class: "colonne" }, [coluna("Presenti", pres), coluna("Assenti", ass)]),
        el("div", { class: "registro-azioni" }, [
          el("button", {
            type: "button", class: "botao botao-piccolo botao-manteiga",
            onclick: function () {
              selecionarData(iso);
              $("chiamata").scrollIntoView();
            }
          }, ["✏️ Modifica"]),
          el("button", {
            type: "button", class: "botao botao-piccolo botao-pericolo",
            onclick: function () { eliminarRegistro(iso); }
          }, ["🗑 Elimina"])
        ])
      ]);

      box.appendChild(el("details", { class: "registro" }, [
        el("summary", {}, [
          el("span", { class: "data", text: formatarLongo(iso) }),
          el("span", { text: pres.length + " / " + rec.membros.length + " presenti" })
        ]),
        corpo
      ]));
    });
  }

  function eliminarRegistro(iso) {
    if (!confirm("Eliminare la chiamata di " + formatarCurto(iso) + "?")) return;
    delete dados.presenze[iso];
    gravar();
    if (iso === dataAtual) carregarDia();
    renderizarTudo();
  }

  /* ---------- Render: statistiche ---------- */
  function calcularStat() {
    var mapa = {};
    Object.keys(dados.presenze).forEach(function (iso) {
      dados.presenze[iso].membros.forEach(function (m) {
        var s = mapa[m.id] || (mapa[m.id] = { nome: m.nome, tot: 0, pres: 0 });
        s.nome = m.nome;
        s.tot++;
        if (m.presente) s.pres++;
      });
    });
    return Object.keys(mapa).map(function (k) { return mapa[k]; }).sort(function (a, b) {
      return b.pres - a.pres || a.nome.localeCompare(b.nome);
    });
  }

  function renderStat() {
    var ul = $("listaStat");
    ul.textContent = "";
    var n = Object.keys(dados.presenze).length;
    $("riepilogo").textContent = n
      ? n + (n === 1 ? " venerdì registrato." : " venerdì registrati.")
      : "Le statistiche appariranno dopo la prima chiamata salvata.";
    calcularStat().forEach(function (s) {
      var perc = Math.round((s.pres / s.tot) * 100);
      var barra = el("div", { class: "stat-barra" }, [el("i")]);
      barra.firstChild.style.width = perc + "%";
      ul.appendChild(el("li", { class: "stat" }, [
        el("strong", { text: s.nome }),
        barra,
        el("span", { text: s.pres + "/" + s.tot + " · " + perc + "%" })
      ]));
    });
  }

  function renderizarTudo() {
    renderChamada();
    renderStorico();
    renderStat();
  }

  /* ---------- Ações ---------- */
  function salvar() {
    dados.presenze[dataAtual] = {
      salvoEm: new Date().toISOString(),
      membros: dados.equipe.map(function (m) {
        return { id: m.id, nome: m.nome, ruolo: m.ruolo, presente: presentes.has(m.id) };
      })
    };
    var ok = gravar();
    sujo = !ok;
    dizer(ok
      ? "Chiamata del " + formatarCurto(dataAtual) + " salvata ✔"
      : "Impossibile salvare: il browser blocca la memoria locale (modalità privata?).");
    renderizarTudo();
  }

  function rimuoverMembro(m) {
    if (!confirm("Rimuovere " + m.nome + " dalla lista? Lo storico resta invariato.")) return;
    dados.equipe = dados.equipe.filter(function (x) { return x.id !== m.id; });
    presentes.delete(m.id);
    gravar();
    renderChamada();
  }

  function aggiungereMembro(ev) {
    ev.preventDefault();
    var nome = $("nuovoNome").value.trim();
    if (!nome) return;
    dados.equipe.push({
      id: "n" + Date.now().toString(36),
      nome: nome,
      ruolo: $("nuovoRuolo").value.trim()
    });
    gravar();
    $("formAggiungi").reset();
    renderChamada();
  }

  /* ---------- Export / import ---------- */
  function baixar(nome, conteudo, tipo) {
    var url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
    var a = el("a", { href: url, download: nome });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function csvCelula(v) {
    return '"' + String(v).replace(/"/g, '""') + '"';
  }

  function exportarCsv() {
    var datas = Object.keys(dados.presenze).sort();
    if (!datas.length) { dizer("Niente da esportare: nessuna chiamata salvata."); return; }
    var nomes = {};
    dados.equipe.forEach(function (m) { nomes[m.id] = m.nome; });
    datas.forEach(function (iso) {
      dados.presenze[iso].membros.forEach(function (m) { nomes[m.id] = m.nome; });
    });
    var linhas = [["Nome"].concat(datas.map(formatarCurto), ["Presenze"]).map(csvCelula).join(";")];
    Object.keys(nomes).forEach(function (id) {
      var total = 0;
      var cels = datas.map(function (iso) {
        var m = dados.presenze[iso].membros.filter(function (x) { return x.id === id; })[0];
        if (!m) return "";
        if (m.presente) { total++; return "P"; }
        return "A";
      });
      linhas.push([nomes[id]].concat(cels, [total]).map(csvCelula).join(";"));
    });
    baixar("presenze-ganzine.csv", "\ufeff" + linhas.join("\r\n"), "text/csv;charset=utf-8");
  }

  function exportarJson() {
    baixar("presenze-ganzine-backup-" + paraIso(new Date()) + ".json",
      JSON.stringify(dados, null, 2), "application/json");
  }

  function importar(ev) {
    var arquivo = ev.target.files[0];
    ev.target.value = "";
    if (!arquivo) return;
    var leitor = new FileReader();
    leitor.onload = function () {
      try {
        var d = JSON.parse(leitor.result);
        var valido = d && Array.isArray(d.equipe) && d.presenze && typeof d.presenze === "object" &&
          d.equipe.every(function (m) { return m && typeof m.id === "string" && typeof m.nome === "string"; }) &&
          Object.keys(d.presenze).every(function (k) {
            return /^\d{4}-\d{2}-\d{2}$/.test(k) && d.presenze[k] && Array.isArray(d.presenze[k].membros);
          });
        if (!valido) throw new Error("formato");
        if (!confirm("Sostituire tutti i dati attuali con quelli del backup?")) return;
        d.equipe.forEach(function (m) { m.ruolo = m.ruolo || ""; });
        dados = d;
        gravar();
        carregarDia();
        dizer("Backup importato ✔");
        renderizarTudo();
      } catch (e) {
        dizer("File non valido: usa un backup JSON scaricato da questa pagina.");
      }
    };
    leitor.readAsText(arquivo);
  }

  /* ---------- Início ---------- */
  function iniciar() {
    $("campoData").addEventListener("change", function (e) { selecionarData(e.target.value); });
    $("btnPrecedente").addEventListener("click", function () { selecionarData(somarDias(dataAtual, -7)); });
    $("btnSuccessivo").addEventListener("click", function () { selecionarData(somarDias(dataAtual, 7)); });
    $("btnOggi").addEventListener("click", function () { selecionarData(paraIso(sextaAte(new Date()))); });
    $("cerca").addEventListener("input", renderLista);
    $("btnTutti").addEventListener("click", function () {
      dados.equipe.forEach(function (m) { presentes.add(m.id); });
      sujo = true;
      renderChamada();
    });
    $("btnNessuno").addEventListener("click", function () {
      presentes.clear();
      sujo = true;
      renderChamada();
    });
    $("btnSalva").addEventListener("click", salvar);
    $("formAggiungi").addEventListener("submit", aggiungereMembro);
    $("btnCsv").addEventListener("click", exportarCsv);
    $("btnJson").addEventListener("click", exportarJson);
    $("btnImporta").addEventListener("click", function () { $("fileImporta").click(); });
    $("fileImporta").addEventListener("change", importar);

    window.addEventListener("beforeunload", function (e) {
      if (sujo) { e.preventDefault(); e.returnValue = ""; }
    });

    // Barra de progresso do cabeçalho
    var barra = document.querySelector(".progresso");
    function progresso() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      barra.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
    }
    window.addEventListener("scroll", progresso, { passive: true });
    progresso();

    dataAtual = paraIso(sextaAte(new Date()));
    carregarDia();
    $("campoData").value = dataAtual;
    renderizarTudo();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
