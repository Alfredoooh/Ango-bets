# Quick Start - Começar Rápido

## ⚡ Opção 1: Versão Standalone (Mais Rápido)

Não precisa de instalação! Basta abrir o arquivo:

```
editor-standalone.html
```

Abra-o no seu navegador (Chrome, Firefox, Safari, Edge) e comece a usar imediatamente.

**Vantagens:**
- Sem instalação
- Sem dependências
- Funciona offline
- Documentos guardados localmente

## 🚀 Opção 2: Versão React (Recomendada para Desenvolvimento)

### Pré-requisitos
- Node.js 18+ instalado
- pnpm ou npm

### Passos

1. **Abra o terminal na pasta do projeto**:
```bash
cd document_creator
```

2. **Instale as dependências**:
```bash
pnpm install
# ou
npm install
```

3. **Inicie o servidor de desenvolvimento**:
```bash
pnpm dev
# ou
npm run dev
```

4. **Abra no navegador**:
```
http://localhost:3000
```

## 📱 Primeiros Passos

1. **Escrever**: Clique na área branca e comece a escrever
2. **Formatar**: Use a barra de ferramentas para negrito, itálico, etc.
3. **Inserir**: Use o menu "Inserir" para tabelas, ligações, imagens
4. **Guardar**: Clique em "Guardar" ou use Ctrl+S
5. **Exportar**: Use o menu "Ficheiro" para exportar como PDF ou TXT

## 🎨 Personalizar

### Mudar o Tamanho do Papel
1. Clique em "Inserir" → "Layout"
2. Escolha entre A4, A5, Letter ou Legal

### Mudar as Margens
1. Clique em "Inserir" → "Layout"
2. Escolha entre Estreitas, Normais ou Largas

### Mudar o Tema
1. Clique no ícone de tema (canto superior direito)
2. Escolha entre Claro ou Escuro

## 💾 Guardar Documentos

Os documentos são guardados automaticamente em:
- **Versão Standalone**: localStorage do navegador
- **Versão React**: localStorage do navegador

Para fazer backup:
1. Clique em "Ficheiro" → "Transferir como PDF"
2. Ou "Ficheiro" → "Transferir como TXT"

## 🔧 Compilar para Produção

```bash
pnpm build
# ou
npm run build
```

Os ficheiros compilados estarão em `dist/`

## 📚 Documentação Completa

Veja `README-COMPLETO.md` para documentação detalhada.

## ❓ Dúvidas Frequentes

**P: Posso usar offline?**  
R: Sim! A versão standalone funciona completamente offline.

**P: Onde são guardados os documentos?**  
R: No localStorage do navegador. Não são enviados para nenhum servidor.

**P: Posso exportar para Word?**  
R: Pode exportar para PDF ou TXT. Para Word, abra o PDF em LibreOffice e exporte.

**P: Funciona em mobile?**  
R: Sim! A interface é totalmente responsiva.

**P: Posso usar em produção?**  
R: Sim! Compile com `pnpm build` e faça deploy.

---

**Pronto para começar?** Abra `editor-standalone.html` ou execute `pnpm dev`!
