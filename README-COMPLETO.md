# Document Creator - Editor de Documentos Profissional

Um editor de documentos web completo e responsivo com design Microsoft Fluent, papel A4 de tamanho correto e funcionalidades avançadas de formatação.

## 🎯 Características Principais

### Editor
- **Papel A4 Correto**: Dimensões exatas (794px × 1123px) com margens ajustáveis
- **Responsividade Total**: Funciona em desktop, tablet e mobile
- **Zoom Adaptativo**: Ajusta automaticamente o zoom para caber na tela
- **Múltiplas Páginas**: Suporte para documentos com várias páginas
- **Formatação Rica**: Negrito, itálico, sublinhado, cores, fontes, etc.

### Formatação de Texto
- **Estilos**: Títulos (H1, H2, H3), Parágrafo, Citações
- **Listas**: Marcadas e numeradas
- **Tabelas**: Inserção com linhas e colunas personalizáveis
- **Código**: Blocos de código com destaque de sintaxe
- **Ligações**: Inserção de URLs com texto personalizado
- **Imagens**: Inserção de imagens com redimensionamento

### Funcionalidades Avançadas
- **Temas**: Modo claro e escuro
- **Margens Ajustáveis**: Estreitas, normais ou largas
- **Espaçamento de Linhas**: Compacto, normal, duplo ou triplo
- **Formatos de Página**: A4, A5, Letter, Legal
- **Exportação**: PDF, TXT e imagem (PNG)
- **Partilha**: Compartilhe documentos em PDF
- **Quadro Branco**: Ferramenta de desenho integrada

### Armazenamento
- **localStorage**: Documentos guardados localmente no navegador
- **Histórico**: Desfazer/Refazer ilimitado
- **Contagem**: Palavras e caracteres em tempo real

## 📁 Estrutura do Projeto

```
document_creator/
├── client/
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── DocumentEditor.tsx       # Área de edição com papel A4
│   │   │   ├── EditorToolbar.tsx        # Barra de ferramentas
│   │   │   ├── SidePanel.tsx            # Painel lateral responsivo
│   │   │   ├── LinkDialog.tsx           # Diálogo de ligações
│   │   │   ├── TableDialog.tsx          # Diálogo de tabelas
│   │   │   └── ImageDialog.tsx          # Diálogo de imagens
│   │   ├── pages/
│   │   │   ├── Home.tsx                 # Página principal do editor
│   │   │   ├── DocumentGallery.tsx      # Galeria de documentos
│   │   │   └── NotFound.tsx             # Página 404
│   │   ├── App.tsx                      # Roteamento principal
│   │   ├── main.tsx                     # Entrada React
│   │   └── index.css                    # Estilos globais
│   └── index.html                       # HTML principal
├── editor-standalone.html               # Versão HTML/CSS/JS pura
├── package.json                         # Dependências
└── README.md                            # Documentação
```

## 🚀 Como Usar

### Versão React (Recomendada)

1. **Instalar dependências**:
```bash
cd document_creator
pnpm install
```

2. **Executar em desenvolvimento**:
```bash
pnpm dev
```

3. **Compilar para produção**:
```bash
pnpm build
```

### Versão Standalone (HTML/CSS/JS Puro)

Abra o arquivo `editor-standalone.html` diretamente no navegador. Não requer instalação de dependências.

## 🎨 Design

### Paleta de Cores (Microsoft Fluent)
- **Primária**: #0078D4 (Azul corporativo)
- **Fundo**: #FFFFFF (Branco)
- **Texto**: #323130 (Cinza escuro)
- **Secundária**: #F3F3F3 (Cinza claro)
- **Perigo**: #D13438 (Vermelho)

### Tipografia
- **Interface**: Roboto (400, 500, 700, 900)
- **Conteúdo**: Georgia (400, 700)
- **Código**: Space Mono (400, 700)

### Dimensões do Papel
- **A4**: 794px × 1123px
- **A5**: 559px × 794px
- **Letter**: 816px × 1056px
- **Legal**: 816px × 1344px

## ⌨️ Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| Ctrl+B | Negrito |
| Ctrl+I | Itálico |
| Ctrl+U | Sublinhado |
| Ctrl+S | Guardar |
| Ctrl+Z | Desfazer |
| Ctrl+Y | Refazer |
| Tab | Indentar |

## 📱 Responsividade

O editor é totalmente responsivo:

- **Desktop** (≥1024px): Layout completo com painel lateral
- **Tablet** (768px-1023px): Layout otimizado com painel lateral oculto
- **Mobile** (<768px): Interface compacta com toolbar minimizada

## 🔧 Configuração

### Margens Padrão
- **Normais**: 94px (padrão)
- **Estreitas**: 48px
- **Largas**: 120px

### Espaçamento de Linhas
- **Compacto**: 1.2
- **Normal**: 1.5 (padrão)
- **Duplo**: 2.0
- **Triplo**: 2.5

## 💾 Armazenamento de Dados

Os documentos são guardados em `localStorage` do navegador com a seguinte estrutura:

```json
{
  "documents": [
    {
      "name": "Meu Documento",
      "content": "<p>Conteúdo HTML...</p>",
      "lastModified": "2026-03-26T14:30:00"
    }
  ]
}
```

## 🌙 Tema Escuro

Ative o tema escuro através do menu de opções. As cores ajustam-se automaticamente:

- **Fundo**: #1F1F1F
- **Cartão**: #2D2D2D
- **Texto**: #E8E8E8

## 📤 Exportação

### PDF
Exporta o documento com toda a formatação preservada.

### TXT
Exporta apenas o texto sem formatação.

### PNG
Exporta a página atual como imagem.

## 🐛 Resolução de Problemas

### O papel não está do tamanho correto
- Verifique se o zoom está em 100%
- Limpe o cache do navegador
- Recarregue a página

### As fontes não estão carregando
- Verifique a conexão com a internet
- As fontes são carregadas do Google Fonts
- Aguarde alguns segundos para o carregamento

### Os documentos não estão sendo guardados
- Verifique se o localStorage está ativado
- Verifique o espaço disponível no navegador
- Tente exportar o documento como backup

## 📝 Licença

Este projeto é fornecido como está. Sinta-se livre para usar, modificar e distribuir.

## 🤝 Contribuições

Sugestões e melhorias são bem-vindas!

## 📞 Suporte

Para problemas ou dúvidas, consulte a documentação ou abra uma issue.

---

**Versão**: 1.0.0  
**Última atualização**: 26 de Março de 2026  
**Compatibilidade**: Chrome, Firefox, Safari, Edge (últimas versões)
