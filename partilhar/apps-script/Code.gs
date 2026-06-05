const SPREADSHEET_ID = "1Y222Imfvfx4M1tBjmaNuL4kekR689QTIQ53YE6eT-jU";
const TEAM_ACCESS_CODE = "trocar-este-codigo";

const SHEETS = {
  donation: "SITE_DOACOES",
  volunteer: "SITE_VOLUNTARIOS",
  contact: "SITE_CONTATOS",
  movement: "SITE_MOVIMENTACOES",
  attendance: "SITE_PRESENCA",
  config: "SITE_CONFIG",
  legacyEntries: "ENTRADAS",
  legacyExits: "SA\u00cdDAS",
  legacyMeals: "FICHA T\u00c9CNICA - MARMITAS",
  legacyDiary: "DI\u00c1RIO",
  legacyStock: "ESTOQUE",
};

const HEADERS = {
  [SHEETS.donation]: [
    "Criado em",
    "Nome",
    "Telefone",
    "Tipo de doacao",
    "Item",
    "Quantidade",
    "Data prevista",
    "Observacao",
    "Status",
  ],
  [SHEETS.volunteer]: [
    "Criado em",
    "Nome",
    "Telefone",
    "Sabado",
    "Area",
    "Periodo",
    "Observacao",
    "Status",
  ],
  [SHEETS.contact]: ["Criado em", "Nome", "Telefone", "Assunto", "Mensagem", "Status"],
  [SHEETS.movement]: [
    "Criado em",
    "Data",
    "Tipo",
    "Tarefa/origem/destino",
    "Produto",
    "Quantidade",
    "Unidade",
    "Observacao",
  ],
  [SHEETS.attendance]: [
    "Criado em",
    "Data",
    "Nome",
    "Telefone",
    "Confirmado",
    "Compareceu",
    "Observacao",
  ],
  [SHEETS.config]: ["Chave", "Valor"],
};

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const route = String(params.route || "").trim();

  if (route === "summary") {
    try {
      requireTeamCode(params.codigoEquipe);
      const data = buildResponsibleSummary(params);
      return scriptResponse(data, params.callback);
    } catch (error) {
      return scriptResponse({ ok: false, error: error.message }, params.callback);
    }
  }

  if (route === "checkin") {
    try {
      requireTeamCode(params.codigoEquipe);
      const data = buildCheckin(params);
      return scriptResponse(data, params.callback);
    } catch (error) {
      return scriptResponse({ ok: false, error: error.message }, params.callback);
    }
  }

  if (route === "textReport") {
    try {
      requireTeamCode(params.codigoEquipe);
      const data = buildTextReport(params);
      return scriptResponse(data, params.callback);
    } catch (error) {
      return scriptResponse({ ok: false, error: error.message }, params.callback);
    }
  }

  return scriptResponse({ ok: true, app: "Partilhar Fase 2" }, params.callback);
}

function doPost(e) {
  try {
    const payload = parsePayload(e);
    const route = String(payload.route || "").trim();

    if (route === "donation") {
      appendRow(SHEETS.donation, [
        nowIso(),
        payload.nome,
        payload.telefone,
        payload.tipoDoacao,
        payload.item,
        payload.quantidade,
        payload.dataPrevista,
        payload.observacao,
        "Prometida",
      ]);
      return jsonResponse({ ok: true, route });
    }

    if (route === "volunteer") {
      appendRow(SHEETS.volunteer, [
        nowIso(),
        payload.nome,
        payload.telefone,
        payload.sabado,
        payload.area,
        payload.periodo,
        payload.observacao,
        "Novo interesse",
      ]);
      return jsonResponse({ ok: true, route });
    }

    if (route === "contact") {
      appendRow(SHEETS.contact, [
        nowIso(),
        payload.nome,
        payload.telefone,
        payload.assunto,
        payload.mensagem,
        "Novo",
      ]);
      return jsonResponse({ ok: true, route });
    }

    if (route === "movement") {
      requireTeamCode(payload.codigoEquipe);
      appendRow(SHEETS.movement, [
        nowIso(),
        payload.data,
        payload.tipoMovimento,
        payload.tarefa,
        payload.produto,
        Number(payload.quantidade || 0),
        payload.unidade,
        payload.observacao,
      ]);
      return jsonResponse({ ok: true, route });
    }

    if (route === "attendance") {
      requireTeamCode(payload.codigoEquipe);
      appendRow(SHEETS.attendance, [
        nowIso(),
        payload.data,
        payload.nome,
        payload.telefone,
        payload.confirmado,
        payload.compareceu,
        payload.observacao,
      ]);
      return jsonResponse({ ok: true, route });
    }

    return jsonResponse({ ok: false, error: "Rota invalida" });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message });
  }
}

function setupPartilhar() {
  Object.keys(HEADERS).forEach((sheetName) => {
    const sheet = getOrCreateSheet(sheetName);
    const header = HEADERS[sheetName];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(header);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, header.length).setFontWeight("bold");
    }
  });

  const config = getOrCreateSheet(SHEETS.config);
  if (config.getLastRow() < 2) {
    config.appendRow(["ESTOQUE_MINIMO_PADRAO", "5"]);
    config.appendRow(["STATUS_DOACAO_PADRAO", "Prometida"]);
    config.appendRow(["STATUS_VOLUNTARIO_PADRAO", "Novo interesse"]);
  }
}

function gerarResumoSemanal() {
  const ss = getSpreadsheet();
  const resumo = getOrCreateSheet("SITE_RESUMO_SEMANAL");
  resumo.clear();
  resumo.appendRow(["Indicador", "Valor"]);
  resumo.appendRow(["Doacoes registradas", countRows(SHEETS.donation)]);
  resumo.appendRow(["Voluntarios registrados", countRows(SHEETS.volunteer)]);
  resumo.appendRow(["Contatos registrados", countRows(SHEETS.contact)]);
  resumo.appendRow(["Movimentacoes de estoque", countRows(SHEETS.movement)]);
  resumo.getRange(1, 1, 1, 2).setFontWeight("bold");
  SpreadsheetApp.flush();
  return ss.getUrl();
}

function buildResponsibleSummary(params) {
  const period = buildPeriod(params);
  const donations = filterRowsByPeriod(getSheetObjects(SHEETS.donation), period, ["Data prevista", "Criado em"]);
  const volunteers = filterRowsByPeriod(getSheetObjects(SHEETS.volunteer), period, ["Sabado", "Criado em"]);
  const contacts = filterRowsByPeriod(getSheetObjects(SHEETS.contact), period, ["Criado em"]);
  const movements = filterRowsByPeriod(getSheetObjects(SHEETS.movement), period, ["Data", "Criado em"]);
  const attendance = filterRowsByPeriod(getSheetObjects(SHEETS.attendance), period, ["Data", "Criado em"]);
  const legacyEntries = filterRowsByPeriod(getSheetObjects(SHEETS.legacyEntries), period, ["DATA"]);
  const legacyExits = filterRowsByPeriod(getSheetObjects(SHEETS.legacyExits), period, ["DATA"]);
  const legacyMeals = filterRowsByPeriod(getSheetObjects(SHEETS.legacyMeals), period, ["DATA"]);
  const legacyDiary = filterRowsByPeriod(getSheetObjects(SHEETS.legacyDiary), period, ["DATA", "Data"]);
  const stockRows = getSheetObjects(SHEETS.legacyStock);
  const lowStock = buildLowStock(stockRows, Number(params.stockLimit || 5));

  const entries = movements.filter((row) => String(row["Tipo"] || "").toLowerCase() === "entrada");
  const exits = movements.filter((row) => String(row["Tipo"] || "").toLowerCase() === "saida");
  const normalizedLegacyEntries = legacyEntries.map((row) => normalizeLegacyMovement(row, "Entrada historica"));
  const normalizedLegacyExits = legacyExits.map((row) => normalizeLegacyMovement(row, "Saida historica"));
  const normalizedSiteMovements = movements.map(normalizeSiteMovement);
  const allMovements = normalizedSiteMovements.concat(normalizedLegacyEntries, normalizedLegacyExits);
  const allDonations = donations.concat(normalizedLegacyEntries.map((row) => ({
    "Criado em": row["Data"],
    "Nome": row["Tarefa/origem/destino"],
    "Item": row["Produto"],
    "Quantidade": row["Quantidade"],
    "Status": row["Tipo"],
  })));

  return {
    ok: true,
    updatedAt: nowIso(),
    period: {
      dateFrom: period.dateFromText,
      dateTo: period.dateToText,
    },
    totals: {
      donations: allDonations.length,
      volunteers: volunteers.length,
      contacts: contacts.length,
      movements: allMovements.length,
      entries: entries.length + legacyEntries.length,
      exits: exits.length + legacyExits.length,
      attendance: attendance.length,
      meals: legacyMeals.filter((row) => row["DATA"]).length,
      diary: legacyDiary.length,
      stockItems: stockRows.length,
      lowStock: lowStock.length,
    },
    recent: {
      donations: allDonations.slice(-8).reverse(),
      volunteers: volunteers.slice(-8).reverse(),
      movements: allMovements.slice(-8).reverse(),
      contacts: contacts.slice(-8).reverse(),
    },
    charts: {
      donationTypes: countBy(allDonations, "Status"),
      volunteerAreas: countBy(volunteers, "Area"),
      movementTypes: countBy(allMovements, "Tipo"),
      topProducts: countBy(allMovements, "Produto").slice(0, 10),
      legacyTasks: countBy(allMovements, "Tarefa/origem/destino").slice(0, 10),
    },
    stock: {
      lowStock: lowStock.slice(0, 25),
    },
  };
}

function buildCheckin(params) {
  const selectedDate = String((params && params.date) || "").trim();
  const period = selectedDate
    ? {
        dateFromText: selectedDate,
        dateToText: selectedDate,
        dateFrom: parseDateOnly(selectedDate, false),
        dateTo: parseDateOnly(selectedDate, true),
      }
    : buildPeriod(params);
  const volunteers = filterRowsByPeriod(getSheetObjects(SHEETS.volunteer), period, ["Sabado", "Criado em"]);
  const attendance = filterRowsByPeriod(getSheetObjects(SHEETS.attendance), period, ["Data", "Criado em"]);
  const present = attendance.filter((row) => normalizeText(row["Compareceu"]) === "sim").length;
  const absent = attendance.filter((row) => normalizeText(row["Compareceu"]) === "nao").length;

  return {
    ok: true,
    updatedAt: nowIso(),
    date: selectedDate,
    period: {
      dateFrom: period.dateFromText,
      dateTo: period.dateToText,
    },
    totals: {
      volunteers: volunteers.length,
      attendance: attendance.length,
      present: present,
      absent: absent,
    },
    volunteers: volunteers.slice(-40).reverse(),
    attendance: attendance.slice(-60).reverse(),
  };
}

function buildTextReport(params) {
  const summary = buildResponsibleSummary(params);
  const topProducts = (summary.charts.topProducts || [])
    .slice(0, 5)
    .map((row) => `${row.name}: ${row.value}`)
    .join("; ") || "sem produtos movimentados";
  const topTasks = (summary.charts.legacyTasks || [])
    .slice(0, 5)
    .map((row) => `${row.name}: ${row.value}`)
    .join("; ") || "sem tarefas registradas";
  const periodText = summary.period.dateFrom || summary.period.dateTo
    ? `${summary.period.dateFrom || "inicio"} ate ${summary.period.dateTo || "hoje"}`
    : "periodo completo";

  return {
    ok: true,
    updatedAt: summary.updatedAt,
    period: summary.period,
    reportText: [
      `Relatorio Partilhar - ${periodText}`,
      `Doacoes/entradas registradas: ${summary.totals.donations}.`,
      `Entradas de estoque: ${summary.totals.entries}. Saidas de estoque: ${summary.totals.exits}.`,
      `Movimentacoes analisadas: ${summary.totals.movements}.`,
      `Voluntarios registrados: ${summary.totals.volunteers}. Presencas lancadas: ${summary.totals.attendance}.`,
      `Itens em estoque baixo: ${summary.totals.lowStock}.`,
      `Produtos mais movimentados: ${topProducts}.`,
      `Tarefas/origens mais recorrentes: ${topTasks}.`,
    ].join("\n"),
  };
}

function buildLowStock(stockRows, limit) {
  const safeLimit = isNaN(limit) || limit < 0 ? 5 : limit;
  return stockRows
    .map((row) => ({
      "Produto": row["PRODUTO"] || row["Produto"] || "",
      "Unidade": row["UN MEDIDA"] || row["Unidade"] || "",
      "Entradas": parseNumberPt(row["ENTRADAS"]),
      "Saidas": parseNumberPt(row["SA\u00cdDAS"] || row["SAIDAS"]),
      "Estoque": parseNumberPt(row["ESTOQUE"]),
    }))
    .filter((row) => row["Produto"] && row["Estoque"] <= safeLimit)
    .sort((a, b) => a["Estoque"] - b["Estoque"]);
}

function normalizeSiteMovement(row) {
  return {
    "Criado em": row["Criado em"] || "",
    "Data": row["Data"] || row["Criado em"] || "",
    "Tipo": row["Tipo"] || "",
    "Tarefa/origem/destino": row["Tarefa/origem/destino"] || "",
    "Produto": row["Produto"] || "",
    "Quantidade": row["Quantidade"] || "",
    "Unidade": row["Unidade"] || "",
    "Observacao": row["Observacao"] || "",
  };
}

function normalizeLegacyMovement(row, typeName) {
  return {
    "Criado em": row["DATA"] || "",
    "Data": row["DATA"] || "",
    "Tipo": typeName,
    "Tarefa/origem/destino": row["TAREFAS"] || "",
    "Produto": row["PRODUTOS"] || "",
    "Quantidade": row["QTD PROD"] || "",
    "Unidade": row["UN MEDIDA"] || "",
    "Observacao": row["ITENS"] || "",
  };
}

function buildPeriod(params) {
  const dateFromText = String((params && params.dateFrom) || "").trim();
  const dateToText = String((params && params.dateTo) || "").trim();
  return {
    dateFromText: dateFromText,
    dateToText: dateToText,
    dateFrom: parseDateOnly(dateFromText, false),
    dateTo: parseDateOnly(dateToText, true),
  };
}

function filterRowsByPeriod(rows, period, candidateFields) {
  if (!period.dateFrom && !period.dateTo) return rows;
  return rows.filter((row) => {
    const date = getFirstRowDate(row, candidateFields);
    if (!date) return false;
    if (period.dateFrom && date < period.dateFrom) return false;
    if (period.dateTo && date > period.dateTo) return false;
    return true;
  });
}

function getFirstRowDate(row, candidateFields) {
  for (let i = 0; i < candidateFields.length; i++) {
    const value = row[candidateFields[i]];
    const parsed = parseFlexibleDate(value);
    if (parsed) return parsed;
  }
  return null;
}

function parseDateOnly(value, endOfDay) {
  if (!value) return null;
  const parts = String(value).split("-");
  if (parts.length !== 3) return parseFlexibleDate(value);
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  return endOfDay
    ? new Date(year, month, day, 23, 59, 59, 999)
    : new Date(year, month, day, 0, 0, 0, 0);
}

function parseFlexibleDate(value) {
  if (!value) return null;
  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value)) return value;
  const text = String(value).trim();
  if (!text) return null;

  const br = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (br) return new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]));

  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

  const parsed = new Date(text);
  return isNaN(parsed) ? null : parsed;
}

function getSheetObjects(sheetName) {
  const sheet = getOrCreateSheet(sheetName);
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];

  const values = sheet.getRange(1, 1, lastRow, lastCol).getDisplayValues();
  const headers = values[0].map((header) => String(header || "").trim());
  return values.slice(1)
    .filter((row) => row.some((value) => value !== ""))
    .map((row) => {
      const item = {};
      headers.forEach((header, index) => {
        if (header) item[header] = row[index] || "";
      });
      return item;
    });
}

function countBy(rows, fieldName) {
  const counts = {};
  rows.forEach((row) => {
    const key = String(row[fieldName] || "Nao informado").trim() || "Nao informado";
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.keys(counts)
    .map((name) => ({ name: name, value: counts[name] }))
    .sort((a, b) => b.value - a.value);
}

function parseNumberPt(value) {
  if (typeof value === "number") return value;
  const text = String(value || "").trim();
  if (!text) return 0;
  const normalized = text
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  const number = Number(normalized);
  return isNaN(number) ? 0 : number;
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getSpreadsheet() {
  if (!SPREADSHEET_ID) {
    throw new Error("Preencha SPREADSHEET_ID no Code.gs.");
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getOrCreateSheet(sheetName) {
  const ss = getSpreadsheet();
  return ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
}

function appendRow(sheetName, values) {
  const sheet = getOrCreateSheet(sheetName);
  if (sheet.getLastRow() === 0 && HEADERS[sheetName]) {
    sheet.appendRow(HEADERS[sheetName]);
    sheet.setFrozenRows(1);
  }
  sheet.appendRow(values.map((value) => value === undefined ? "" : value));
}

function countRows(sheetName) {
  const sheet = getOrCreateSheet(sheetName);
  return Math.max(sheet.getLastRow() - 1, 0);
}

function requireTeamCode(code) {
  if (String(code || "") !== TEAM_ACCESS_CODE) {
    throw new Error("Codigo da equipe invalido.");
  }
}

function parsePayload(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  const raw = e.postData.contents;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return e.parameter || {};
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function scriptResponse(data, callback) {
  if (callback) {
    const safeCallback = String(callback).replace(/[^\w.$]/g, "");
    return ContentService
      .createTextOutput(`${safeCallback}(${JSON.stringify(data)});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return jsonResponse(data);
}

function nowIso() {
  return new Date().toISOString();
}
