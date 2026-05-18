# MineraçãoProdutos — Plataforma SaaS de Mineração de Produtos

> **Plataforma premium para descobrir produtos virais, anúncios vencedores e oportunidades de dropshipping em 7 marketplaces com IA.**

[![CI/CD](https://github.com/seu-usuario/mineracaoprodutos/actions/workflows/ci.yml/badge.svg)](https://github.com/seu-usuario/mineracaoprodutos/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com)

---

## 🚀 Funcionalidades

- **Descoberta de Produtos** — Busca em 7 marketplaces simultaneamente com filtros avançados
- **Score de Oportunidade** — Algoritmo proprietário 0-100 baseado em 10 variáveis
- **Radar de Anúncios** — Detecta anúncios vencedores no Facebook, TikTok, Pinterest e Instagram
- **Sistema de Promoções** — Flash sales, cupons e histórico de preços em tempo real
- **IA e Insights** — Análise automática com GPT-4o, embeddings e vector search
- **Alertas Inteligentes** — Email, Telegram, WhatsApp e Push notifications
- **Dashboard Premium** — KPIs, gráficos, heatmaps e tendências em tempo real
- **Admin Panel** — Gerenciamento completo de usuários, workers e scrapers

---

## 🛠 Stack Tecnológica

### Frontend
| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| Next.js | 15 | Framework React com App Router |
| React | 19 | UI Library |
| TypeScript | 5.7 | Type Safety |
| TailwindCSS | 3.4 | Estilização |
| ShadCN/UI | Latest | Componentes |
| Framer Motion | 11 | Animações |
| Zustand | 5 | State Management |
| TanStack Query | 5 | Data Fetching |
| Recharts | 2.14 | Gráficos |

### Backend
| Tecnologia | Uso |
|-----------|-----|
| Supabase | Auth, DB, Storage, Edge Functions |
| PostgreSQL | Banco principal com pgvector |
| Redis (Upstash) | Cache e filas |
| Python 3.11 | Scrapers e workers |
| Celery | Task queue distribuída |
| OpenAI GPT-4o | Insights com IA |

---

## 📁 Estrutura do Projeto

```
mineracaoprodutos/
├── apps/
│   └── web/                    # Next.js 15 App
│       └── src/
│           ├── app/            # App Router pages
│           ├── components/     # React components
│           ├── lib/            # Utilities & API client
│           ├── store/          # Zustand stores
│           ├── hooks/          # Custom hooks
│           └── types/          # TypeScript types
├── packages/
│   ├── ui/                     # Shared UI components
│   ├── db/                     # Database types & client
│   ├── core/                   # Business logic
│   └── ai/                     # AI/ML utilities
├── scrapers/                   # Python scrapers
│   ├── aliexpress/             # AliExpress scraper
│   ├── shopee/                 # Shopee API scraper
│   ├── amazon/                 # Amazon scraper
│   └── common/                 # Shared utilities
│       ├── proxies/            # Proxy manager
│       ├── parsers/            # HTML parsers
│       ├── ai/                 # AI scoring
│       └── utils/              # Helpers
├── supabase/
│   ├── migrations/             # SQL migrations
│   └── functions/              # Edge Functions
├── docker/                     # Dockerfiles & nginx config
├── .github/workflows/          # CI/CD pipelines
├── docker-compose.yml
└── turbo.json                  # Monorepo config
```

---

## ⚡ Início Rápido

### Pré-requisitos
- Node.js 22+
- Python 3.11+
- Docker & Docker Compose
- Conta Supabase
- Conta Upstash Redis

### 1. Clonar e instalar

```bash
git clone https://github.com/seu-usuario/mineracaoprodutos.git
cd mineracaoprodutos
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
# Editar .env.local com suas credenciais
```

### 3. Configurar banco de dados

```bash
# Via Supabase CLI
npx supabase db push

# Ou manual via dashboard Supabase
# Execute: supabase/migrations/001_initial_schema.sql
# Execute: supabase/migrations/002_seed_data.sql
```

### 4. Instalar scrapers Python

```bash
cd scrapers
pip install -e .
python -m playwright install chromium
```

### 5. Iniciar desenvolvimento

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Workers Python
cd scrapers && celery -A worker worker --loglevel=info

# Terminal 3: Beat scheduler (opcional)
cd scrapers && celery -A worker beat --loglevel=info
```

Acesse: **http://localhost:3000**

---

## 🐳 Docker

```bash
# Build e subir todos os serviços
docker-compose up --build

# Apenas workers
docker-compose up worker beat redis

# Ver logs
docker-compose logs -f worker
```

---

## 🗄️ Banco de Dados

### Tabelas principais
| Tabela | Descrição |
|--------|-----------|
| `users` | Perfis de usuários (via auth.users) |
| `products` | Produtos minerados de todos os marketplaces |
| `product_history` | Histórico de preços e vendas (particionado) |
| `promotions` | Flash sales, cupons e promoções |
| `product_ads` | Anúncios rastreados (Facebook, TikTok, etc) |
| `trends` | Tendências de keywords |
| `favorites` | Produtos salvos pelos usuários |
| `alerts` | Configurações de alertas |
| `scraper_jobs` | Fila de jobs dos scrapers |
| `ai_insights` | Análises geradas por IA |

### Otimizações
- Índices compostos para queries frequentes
- Full Text Search em português
- pgvector para busca semântica
- Materialized Views para dashboards
- Particionamento de `product_history` por mês
- RLS em todas as tabelas de usuários

---

## 🤖 Sistema de Scraping

### Técnicas Anti-Bloqueio
- Rotação de proxies residenciais
- Fingerprint spoofing (User-Agent, viewport, timezone)
- Simulação de comportamento humano (mouse, scroll, delay)
- CAPTCHA detection e fallback
- Rate limiting inteligente
- Session persistence
- Headless browser com stealth mode

### Workers (Celery)
| Worker | Frequência | Função |
|--------|-----------|--------|
| `scrape_aliexpress_trending` | 1h | Scraping de trending keywords |
| `scrape_shopee_flash` | 30min | Flash deals da Shopee |
| `analyze_viral` | 15min | Detecta produtos viralizando |
| `send_alerts` | 5min | Processa e envia alertas |
| `refresh_views` | 1h | Atualiza materialized views |

---

## 📡 API Reference

### Produtos
```
GET  /api/products          # Listar com filtros
GET  /api/products/:id      # Detalhes do produto
GET  /api/products/:id/similar  # Produtos similares (pgvector)
GET  /api/products/:id/history  # Histórico de preços
```

### Busca
```
GET  /api/search?q=keyword  # Busca full-text + semântica
```

### Tendências
```
GET  /api/trends            # Listar tendências
GET  /api/trends/:id        # Detalhes da tendência
```

### Promoções
```
GET  /api/promotions        # Promoções ativas
GET  /api/promotions/flash  # Flash sales em tempo real
```

### Alertas
```
GET    /api/alerts          # Listar alertas do usuário
POST   /api/alerts          # Criar alerta
PATCH  /api/alerts/:id      # Atualizar alerta
DELETE /api/alerts/:id      # Remover alerta
```

### IA (Supabase Edge Functions)
```
POST /functions/v1/ai-insights    # Gerar insight de produto
```

---

## 🚀 Deploy

### Frontend → Vercel

```bash
# Via CLI
npx vercel --prod

# Variáveis de ambiente no Vercel dashboard:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
STRIPE_SECRET_KEY=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

### Workers → Railway

```bash
# Via Railway CLI
cd scrapers
railway up --service workers
railway up --service beat
```

### Supabase Edge Functions

```bash
npx supabase functions deploy ai-insights
```

---

## 📊 Score de Oportunidade

Algoritmo proprietário que calcula uma pontuação de 0-100:

| Variável | Peso | Descrição |
|---------|------|-----------|
| Volume de Vendas | 20% | Quantidade de vendas no marketplace |
| Taxa de Crescimento | 25% | Velocidade de crescimento recente |
| Saturação | 10% | Nível de competição no nicho |
| Qtd. Anúncios | 5% | Presença em plataformas de ads |
| Ticket Médio | 10% | Faixa de preço ideal ($5-$50) |
| Avaliação | 15% | Rating e volume de reviews |
| Engajamento | 5% | Interação social com o produto |
| Tendência Social | 5% | Sinal de viralização |
| Markup Potencial | 5% | Margem de lucro estimada |

---

## 🔐 Segurança

- **RLS** em todas as tabelas sensíveis
- **JWT** com rotação automática via Supabase
- **Rate limiting** nas APIs (100 req/min por usuário)
- **CSRF protection** via SameSite cookies
- **XSS protection** via Content Security Policy
- **SQL Injection** prevenido por queries parametrizadas
- **Headers seguros** configurados no Next.js

---

## 📈 Escalabilidade

- Workers Celery escaláveis horizontalmente
- Redis como broker e cache distribuído
- CDN para assets estáticos (Vercel Edge Network)
- Supabase com connection pooling (PgBouncer)
- Materialized Views para queries pesadas
- Paginação e virtualização no frontend
- Image optimization com Next.js

---

## 🛣️ Roadmap

- [ ] Integração TikTok Shop
- [ ] Busca por imagem (visual search)
- [ ] App mobile (React Native)
- [ ] WhatsApp bot de alertas
- [ ] Comparador de preços histórico
- [ ] Sistema de afiliados interno
- [ ] API pública para desenvolvedores
- [ ] Extensão Chrome para análise na hora

---

## 📄 Licença

MIT © 2024 MineraçãoProdutos
