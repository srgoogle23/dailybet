# 🎰 DailyBet

Uma aplicação interativa para sortear quem apresentará a Daily, com sistema de apostas, cálculo de odds e roleta animada. Feita pra tornar a daily do time mais divertida!

## 📸 Como funciona

O fluxo da aplicação segue 5 telas:

1. **Setup** — Adicione os participantes da daily. Nomes já utilizados anteriormente são carregados automaticamente do `localStorage`.
2. **Apostas** — Cada participante aposta em quem vai apresentar. Suporta **aposta múltipla** (apostar em mais de uma pessoa por turno).
3. **Odds** — Visualize as odds/multiplicadores calculados com base na distribuição das apostas.
4. **Roleta** — Animação de roleta para sortear o apresentador.
5. **Resultado** — Exibe o vencedor, lucro/prejuízo de cada participante e atualiza os saldos.

## ✨ Features

| Feature | Descrição |
|---------|-----------|
| 🎯 **Aposta múltipla** | Aposte em mais de uma pessoa por turno com valores individuais |
| 💰 **Sistema de crédito/dívida** | Sem saldo? Pegue um crédito de $50. Se perder, a dívida acumula (-50, -100...) |
| 🛡️ **Buyout (Imunidade)** | Pague $999 para ficar imune ao sorteio da rodada |
| 🔄 **Auto-load** | Nomes e saldos são persistidos no `localStorage` e carregados automaticamente |
| 📊 **Cálculo de odds** | Multiplicadores dinâmicos baseados na distribuição das apostas |
| 📜 **Histórico** | Modal com histórico de sorteios passados e leaderboard de saldos |
| 🌐 **i18n** | Português (pt) e Inglês (en) com toggle no header |

## 🏗️ Tech Stack

- **React** 19 + **TypeScript** 5.8
- **Vite** 6 (build & dev server)
- **Tailwind CSS** (estilização)
- **Lucide React** (ícones)
- **Vitest** + **React Testing Library** (testes)
- **GitHub Actions** (CI)

## 🚀 Rodando o projeto

```bash
# Instalar dependências
npm install

# Rodar em modo desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview
```

## 🧪 Testes

```bash
# Rodar testes
npm test

# Rodar testes em modo watch
npm run test:watch

# Rodar testes com coverage
npm run test:coverage
```

O projeto tem **124 testes unitários** com threshold mínimo de **80% de coverage** configurado.

## 📁 Estrutura

```
├── App.tsx                  # Componente principal com máquina de estados
├── index.tsx                # Entry point
├── constants.ts             # Constantes do jogo (saldo inicial, valores, cores)
├── translations.ts          # Traduções pt/en
├── types.ts                 # Tipos TypeScript (Participant, Bet, HistoryEntry)
├── components/
│   ├── SetupScreen.tsx      # Tela de setup dos participantes
│   ├── BettingScreen.tsx    # Tela de apostas (multi-bet, crédito, buyout)
│   ├── OddsScreen.tsx       # Tela de odds/multiplicadores
│   ├── RouletteScreen.tsx   # Roleta animada
│   ├── ResultsScreen.tsx    # Resultado e cálculo financeiro
│   ├── HistoryModal.tsx     # Modal de histórico e leaderboard
│   └── ui/
│       └── Button.tsx       # Componente de botão reutilizável
├── contexts/
│   └── LanguageContext.tsx   # Context de i18n (pt/en)
├── tests/                   # 12 arquivos de teste
├── .github/workflows/
│   └── test.yml             # Pipeline CI (testes + build)
└── vitest.config.ts         # Configuração do Vitest
```

## ⚙️ Constantes do jogo

| Constante | Valor | Descrição |
|-----------|-------|-----------|
| `INITIAL_BALANCE` | $1.000 | Saldo inicial de cada participante |
| `BET_AMOUNT` | $100 | Valor padrão de aposta |
| `PRESET_BET_AMOUNTS` | 10, 50, 100, 200, 500 | Opções rápidas de valor |
| `LOAN_AMOUNT` | $50 | Valor do crédito para quem está zerado |
| `BUYOUT_COST` | $999 | Custo para comprar imunidade |

## 📝 Licença

MIT