/**
 * System prompt and helpers for the AI Financial Assistant
 * Formats the FULL user financial data for the model.
 */

type TransactionCompact = {
  date: string;
  name: string;
  category: string;
  amount: number;
  type: "income" | "expense";
};

type CategoryCompact = {
  name: string;
  type: "income" | "expense";
  group: string;
};

type BudgetSnapshot = {
  categoryName: string;
  type: "limit" | "goal";
  amount: number;
  spent: number;
  saved: number;
  percentage: number;
  remaining: number;
  isExceeded: boolean;
  isCompleted: boolean;
  status: string;
  isRecurring: boolean;
  period: {
    type: string;
    startDate: string;
    endDate: string;
  };
};

type TripSnapshot = {
  name: string;
  destination: string;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string | null;
  status: string;
  expenses: { name: string; amount: number; category: string; date: string }[];
};

type MonthSummary = {
  key: string;
  income: number;
  expenses: number;
  balance: number;
  transactionCount: number;
};

type SnapshotData = {
  transactions: TransactionCompact[];
  categories: CategoryCompact[];
  budgets: BudgetSnapshot[];
  trips: TripSnapshot[];
  summary: {
    totalTransactions: number;
    totalIncome: number;
    totalExpenses: number;
    firstTransactionDate: string | null;
    lastTransactionDate: string | null;
    monthlyBreakdown: MonthSummary[];
  };
  budgetHealthCheck: {
    exceededLimits: number;
    totalLimits: number;
    goalPercentage: number;
    totalGoals: number;
  };
  currency: string;
  locale: string;
};

function formatNumber(num: number): string {
  return num.toLocaleString("es-CO", { maximumFractionDigits: 0 });
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    COP: "$",
    USD: "$",
    EUR: "\u20AC",
    GTQ: "Q",
    MXN: "$",
    BRL: "R$",
    ARS: "$",
    CLP: "$",
    PEN: "S/",
  };
  return symbols[currency] || "$";
}

function formatSnapshotForPrompt(
  snapshot: SnapshotData,
  sym: string,
): string {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  let text = `FECHA DE HOY: ${todayStr}\n`;
  text += `MONEDA: ${snapshot.currency} (${sym})\n\n`;

  // ── RESUMEN GENERAL ──
  const s = snapshot.summary;
  text += `=== RESUMEN GENERAL ===\n`;
  text += `Total transacciones: ${s.totalTransactions}\n`;
  text += `Ingresos totales (historico): ${sym} ${formatNumber(s.totalIncome)}\n`;
  text += `Gastos totales (historico): ${sym} ${formatNumber(s.totalExpenses)}\n`;
  text += `Balance neto historico: ${sym} ${formatNumber(s.totalIncome - s.totalExpenses)}\n`;
  if (s.firstTransactionDate) {
    text += `Primera transaccion: ${s.firstTransactionDate}\n`;
    text += `Ultima transaccion: ${s.lastTransactionDate}\n`;
  }
  text += `\n`;

  // ── DESGLOSE MENSUAL ──
  if (s.monthlyBreakdown.length > 0) {
    text += `=== DESGLOSE MENSUAL ===\n`;
    for (const m of s.monthlyBreakdown) {
      text += `${m.key}: ingresos ${sym} ${formatNumber(m.income)}, gastos ${sym} ${formatNumber(m.expenses)}, balance ${sym} ${formatNumber(m.balance)}, ${m.transactionCount} transacciones\n`;
    }
    text += `\n`;
  }

  // ── PRESUPUESTOS ──
  if (snapshot.budgets.length > 0) {
    text += `=== PRESUPUESTOS (${snapshot.budgets.length} total) ===\n`;
    for (const b of snapshot.budgets) {
      const endDate = new Date(b.period.endDate);
      const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
      const statusLabel = b.status === "active" ? "ACTIVO" : b.status === "completed" ? "COMPLETADO" : "ARCHIVADO";
      const recurringLabel = b.isRecurring ? "recurrente" : "unico";

      if (b.type === "limit") {
        const exceeded = b.isExceeded ? "EXCEDIDO" : `quedan ${sym} ${formatNumber(b.remaining)}`;
        text += `- ${b.categoryName} (Limite, ${statusLabel}, ${recurringLabel}): ${sym} ${formatNumber(b.spent)} / ${sym} ${formatNumber(b.amount)} (${b.percentage}% usado, ${exceeded}, ${daysLeft} dias restantes, periodo ${b.period.type}: ${b.period.startDate} a ${b.period.endDate})\n`;
      } else {
        const dailySuggested = daysLeft > 0 ? Math.ceil((b.amount - b.saved) / daysLeft) : 0;
        text += `- ${b.categoryName} (Meta, ${statusLabel}, ${recurringLabel}): ${sym} ${formatNumber(b.saved)} / ${sym} ${formatNumber(b.amount)} (${b.percentage}% completado, ${daysLeft} dias restantes, aporte diario sugerido: ${sym} ${formatNumber(dailySuggested)}, periodo ${b.period.type}: ${b.period.startDate} a ${b.period.endDate})\n`;
      }
    }
    text += `\n`;
  }

  // ── SALUD FINANCIERA ──
  const hc = snapshot.budgetHealthCheck;
  text += `=== SALUD FINANCIERA ===\n`;
  text += `Limites excedidos: ${hc.exceededLimits} de ${hc.totalLimits}\n`;
  text += `Progreso promedio de metas: ${hc.goalPercentage}% (${hc.totalGoals} metas)\n\n`;

  // ── VIAJES ──
  if (snapshot.trips.length > 0) {
    text += `=== VIAJES (${snapshot.trips.length} total) ===\n`;
    for (const trip of snapshot.trips) {
      const statusLabel = trip.status === "active" ? "En curso" : trip.status === "completed" ? "Completado" : "Planeando";
      text += `- ${trip.name} (${trip.destination}, ${statusLabel}): presupuesto ${sym} ${formatNumber(trip.budget)}, gastado ${sym} ${formatNumber(trip.spent)}, ${trip.startDate} a ${trip.endDate || "sin fecha fin"}\n`;
      if (trip.expenses.length > 0) {
        for (const e of trip.expenses) {
          text += `  * ${e.date} | ${e.name} | ${e.category} | ${sym} ${formatNumber(e.amount)}\n`;
        }
      }
    }
    text += `\n`;
  }

  // ── CATEGORIAS ──
  if (snapshot.categories.length > 0) {
    const expenseCats = snapshot.categories.filter((c) => c.type === "expense");
    const incomeCats = snapshot.categories.filter((c) => c.type === "income");
    text += `=== CATEGORIAS ===\n`;
    text += `Gastos (${expenseCats.length}): ${expenseCats.map((c) => c.name).join(", ")}\n`;
    text += `Ingresos (${incomeCats.length}): ${incomeCats.map((c) => c.name).join(", ")}\n\n`;
  }

  // ── TODAS LAS TRANSACCIONES ──
  if (snapshot.transactions.length > 0) {
    text += `=== TODAS LAS TRANSACCIONES (${snapshot.transactions.length}) ===\n`;
    text += `formato: fecha | nombre | categoria | monto | tipo\n`;
    for (const t of snapshot.transactions) {
      const sign = t.type === "income" ? "+" : "-";
      text += `${t.date} | ${t.name} | ${t.category} | ${sign}${sym} ${formatNumber(t.amount)} | ${t.type === "income" ? "ingreso" : "gasto"}\n`;
    }
  }

  return text;
}

export function getSystemPrompt(
  snapshot: SnapshotData,
  locale: string,
): string {
  const sym = getCurrencySymbol(snapshot.currency);
  const data = formatSnapshotForPrompt(snapshot, sym);
  const lang = locale.split("-")[0];

  const prompts: Record<string, string> = {
    es: `Eres un asistente financiero inteligente para SmartSpend, una app de presupuesto personal.

TU ROL:
- Responder cualquier pregunta sobre gastos, ingresos, presupuestos, metas, viajes y habitos financieros del usuario
- Proporcionar insights, analisis y recomendaciones basadas en TODOS los datos del usuario
- Puedes contar transacciones, calcular totales, comparar meses, identificar patrones, etc.
- Ser conciso, claro y amigable
- NUNCA crear, modificar o eliminar transacciones/presupuestos (eres solo de lectura)

DATOS COMPLETOS DEL USUARIO:
${data}

REGLAS:
1. Responde en espanol
2. Usa el simbolo de moneda: ${sym}
3. Formatea numeros grandes con separadores de miles (ej: 1.500.000)
4. Se breve pero completo (maximo 4-5 oraciones por respuesta)
5. Si la pregunta esta fuera de alcance financiero, responde amablemente que solo puedes ayudar con finanzas
6. No inventes datos ni hagas suposiciones sin fundamento
7. Tienes acceso a TODOS los datos del usuario - usa la seccion de transacciones para contar, sumar, filtrar, buscar, etc.
8. Si te preguntan algo que puedes calcular de los datos, calculalo (conteos, promedios, maximos, comparaciones, etc.)`,

    en: `You are an intelligent financial assistant for SmartSpend, a personal budgeting app.

YOUR ROLE:
- Answer any question about the user's spending, income, budgets, goals, trips, and financial habits
- Provide insights, analysis, and recommendations based on ALL of the user's data
- You can count transactions, calculate totals, compare months, identify patterns, etc.
- Be concise, clear, and friendly
- NEVER create, modify, or delete transactions/budgets (you are read-only)

COMPLETE USER DATA:
${data}

RULES:
1. Respond in English
2. Use the currency symbol: ${sym}
3. Format large numbers with thousand separators (e.g., 1,500,000)
4. Be brief but thorough (max 4-5 sentences per response)
5. If the question is outside financial scope, politely say you can only help with finances
6. Don't make up data or unfounded assumptions
7. You have access to ALL user data - use the transactions section to count, sum, filter, search, etc.
8. If asked something you can calculate from the data, calculate it (counts, averages, maximums, comparisons, etc.)`,

    pt: `Voce e um assistente financeiro inteligente para SmartSpend, um aplicativo de orcamento pessoal.

SEU PAPEL:
- Responder qualquer pergunta sobre gastos, receitas, orcamentos, metas, viagens e habitos financeiros do usuario
- Fornecer insights, analises e recomendacoes com base em TODOS os dados do usuario
- Voce pode contar transacoes, calcular totais, comparar meses, identificar padroes, etc.
- Ser conciso, claro e amigavel
- NUNCA criar, modificar ou excluir transacoes/orcamentos (voce e somente leitura)

DADOS COMPLETOS DO USUARIO:
${data}

REGRAS:
1. Responda em portugues
2. Use o simbolo da moeda: ${sym}
3. Formate numeros grandes com separadores de milhares (ex: 1.500.000)
4. Seja breve mas completo (maximo 4-5 frases por resposta)
5. Se a pergunta estiver fora do escopo financeiro, responda educadamente que so pode ajudar com financas
6. Nao invente dados nem faca suposicoes infundadas
7. Voce tem acesso a TODOS os dados do usuario - use a secao de transacoes para contar, somar, filtrar, pesquisar, etc.`,

    fr: `Vous etes un assistant financier intelligent pour SmartSpend, une application de budget personnel.

VOTRE ROLE:
- Repondre a toute question sur les depenses, revenus, budgets, objectifs, voyages et habitudes financieres de l'utilisateur
- Fournir des insights, analyses et recommandations bases sur TOUTES les donnees de l'utilisateur
- Vous pouvez compter les transactions, calculer les totaux, comparer les mois, identifier les tendances, etc.
- Etre concis, clair et amical
- NE JAMAIS creer, modifier ou supprimer des transactions/budgets (vous etes en lecture seule)

DONNEES COMPLETES DE L'UTILISATEUR:
${data}

REGLES:
1. Repondez en francais
2. Utilisez le symbole monetaire: ${sym}
3. Formatez les grands nombres avec des separateurs de milliers (ex: 1 500 000)
4. Soyez bref mais complet (maximum 4-5 phrases par reponse)
5. Si la question est hors du domaine financier, repondez poliment que vous ne pouvez aider qu'avec les finances
6. N'inventez pas de donnees et ne faites pas de suppositions infondees
7. Vous avez acces a TOUTES les donnees de l'utilisateur - utilisez la section des transactions pour compter, additionner, filtrer, rechercher, etc.`,
  };

  return prompts[lang] || prompts["en"];
}

export function buildUserPrompt(
  question: string,
  conversationHistory?: { role: string; content: string }[],
): string {
  let prompt = "";

  if (conversationHistory && conversationHistory.length > 0) {
    const recent = conversationHistory.slice(-5);
    prompt += "CONVERSACION PREVIA:\n";
    for (const msg of recent) {
      const role = msg.role === "user" ? "Usuario" : "Asistente";
      prompt += `${role}: ${msg.content}\n`;
    }
    prompt += "\n";
  }

  prompt += `PREGUNTA:\n${question}`;
  return prompt;
}
