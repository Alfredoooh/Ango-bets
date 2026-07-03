export const API_BASE = 'https://ipc.alfredopjonas.workers.dev';

export const AuthApiService = {
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao iniciar sessão');
    return data;
  },
  async register(name, email, password) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao criar conta');
    return data;
  },
  async loginWithGoogle(idToken) {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro Google');
    return data;
  },
  async logout(token) {
    try { await fetch(`${API_BASE}/auth/logout`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }); } catch (e) {}
  },
  async listConversations(token) {
    try {
      const res = await fetch(`${API_BASE}/conversations`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) return [];
      const data = await res.json();
      return data.conversations || [];
    } catch (e) { return []; }
  },
  async createConversation(token, title, messages) {
    try {
      const res = await fetch(`${API_BASE}/conversations`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title, messages })
      });
      if (!res.ok) return null;
      const data = await res.json(); return data.id || null;
    } catch (e) { return null; }
  },
  async updateConversation(token, id, title, messages) {
    try {
      await fetch(`${API_BASE}/conversations/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title, messages })
      });
    } catch (e) {}
  },
  async deleteConversation(token, id) {
    try { await fetch(`${API_BASE}/conversations/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); } catch (e) {}
  },
  async pinConversation(token, id, pinned) {
    try {
      await fetch(`${API_BASE}/conversations/${id}/pin`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ pinned })
      });
    } catch (e) {}
  },
};

export const CreditsApiService = {
  async getBalance(token) {
    try {
      const res = await fetch(`${API_BASE}/credits/balance`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) return null; return await res.json();
    } catch (e) { return null; }
  },
  async checkout(token, packageId) {
    const res = await fetch(`${API_BASE}/credits/checkout`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ package: packageId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro checkout');
    return data;
  },
};

const LANG_NATIVE = {
  pt:'português europeu','pt-BR':'português do Brasil',en:'English',es:'español',
  fr:'français',de:'Deutsch',it:'italiano',nl:'Nederlands',ru:'русский',
  zh:'中文（简体）',ja:'日本語',ko:'한국어',ar:'العربية',hi:'हिन्दी',
  tr:'Türkçe',pl:'polski',sv:'svenska',uk:'українська',
};

export const GeminiApiService = {
  buildSystemPrompt(lang, sheetsEnabled) {
    const tick = '```'; const langName = LANG_NATIVE[lang] || LANG_NATIVE.pt;
    const base = `És um assistente de IA integrado na app Nexa. Responde sempre em ${langName}, seja qual for a língua usada pelo utilizador, a menos que ele peça explicitamente outra língua.\n\nNão tens limite artificial de tamanho de resposta. Quando o pedido exigir um texto longo — uma história, um conto, um artigo extenso, um relatório, um guião, código extenso, ou qualquer conteúdo narrativo ou técnico de grande dimensão — escreve o texto completo, do início ao fim, sem o resumir, sem o encurtar e sem dizer que "não é capaz" de produzir textos longos. Gerar textos longos e detalhados É uma das tuas capacidades centrais.\n\nAdapta o tamanho da resposta ao que for pedido. Usa formatação rica sempre que isso ajudar a clareza: títulos, listas, **negrito**, tabelas markdown, e notação matemática em LaTeX (com $...$ para expressões em linha e $$...$$ para fórmulas em destaque).\n\nPara tabelas widget:\n${tick}widget_table\n{"headers":["Col1","Col2"],"rows":[["v1","v2"]]}\n${tick}\n\nPara código widget:\n${tick}widget_code\n{"language":"javascript","code":"// código"}\n${tick}\n\nPara mapa widget:\n${tick}widget_map\n{"lat":38.7169,"lng":-9.1399,"zoom":13}\n${tick}`;
    const sheets = sheetsEnabled ? `\n\n${tick}widget_bar\n{"data":[{"label":"Jan","value":35}]}\n${tick}\n\n${tick}widget_pie\n{"data":[{"label":"A","value":40}]}\n${tick}\n\n${tick}widget_sheet\n{"lines":[{"text":"Título","title":true}]}\n${tick}\n\n${tick}widget_market\n{"type":"crypto","symbol":"BTC","name":"Bitcoin"}\n${tick}\n\n${tick}widget_calendar\n{"events":[{"date":"2025-06-20","name":"Reunião","time":"14:00","color":"#6F5AF6"}]}\n${tick}\n\n${tick}widget_timer\n{"seconds":300,"label":"Foco"}\n${tick}\n\n${tick}widget_mindmap\n{"title":"Projeto","tree":{"id":"root","label":"Projeto","color":"#6F5AF6","children":[]}}\n${tick}\n\n${tick}widget_graph\n{"expression":"sin(x)","xMin":-10,"xMax":10}\n${tick}` : '';
    return base + sheets;
  },
  async * streamChat({ messages, systemPrompt, token, think, language }) {
    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ messages, stream: true, systemPrompt, think, language: language || 'pt' })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 402 || data.error === 'credits_exhausted') { yield { type: 'credits_exhausted' }; return; }
        yield { type: 'error', message: `Erro ${res.status}` }; return;
      }
      const reader = res.body.getReader(); const decoder = new TextDecoder();
      let buffer = ''; let fullText = '';
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n'); buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') { yield { type: 'done', fullText }; return; }
          try {
            const json = JSON.parse(raw); const candidates = json.candidates;
            if (!candidates?.length) continue;
            const parts = candidates[0].content?.parts || [];
            for (const part of parts) {
              const text = part.text || ''; if (!text) continue;
              if (part.thought) { yield { type: 'think', text }; }
              else { fullText += text; yield { type: 'token', text }; }
            }
            const fin = candidates[0].finishReason;
            if (fin === 'STOP' || fin === 'MAX_TOKENS') { yield { type: 'done', fullText }; return; }
          } catch (e) {}
        }
      }
      yield { type: 'done', fullText };
    } catch (e) { yield { type: 'error', message: 'Erro de rede: ' + e.message }; }
  },
  async generateTitle(message, token, language) {
    try {
      const res = await fetch(`${API_BASE}/ai/title`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message, language: language || 'pt' })
      });
      if (res.ok) { const data = await res.json(); return data.title || message.trim().split(/\s+/).slice(0,4).join(' ').substring(0,40); }
    } catch (e) {}
    return message.trim().split(/\s+/).slice(0,4).join(' ').substring(0,40);
  },
};