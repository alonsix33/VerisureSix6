# VerisureSix6 — CLAUDE.md

## Project Overview

Plataforma de seguridad hogareña autónoma con reverse engineering de un sistema Verisure (hub ES6502VSF, sensores ES700IPDE), integración Tapo (H200 + C420), y un "Sheriff IA" basado en Claude + GPT para análisis inteligente de eventos.

## Architecture

```
Orange Pi 5 (4GB) — servidor 24/7
RTL-SDR Blog V3 — receptor RF 869 MHz (pendiente de llegada ~26 mayo)
Tapo H200 Hub + C420 — cámara balcón
Hub Verisure ES6502 — solo como emisor RF (servicio cancelado)

Backend:  Python 3.14 + FastAPI + SQLAlchemy async + SQLite + Anthropic SDK + OpenAI SDK
RF:       GNU Radio 3.10 + pyrtlsdr + scripts funoverip (pendiente)
Dashboard: React 19 + Vite + TypeScript + Tailwind CSS v4 + Zustand
Alertas:  Telegram via python-telegram-bot
Deploy:   systemd services en Orange Pi, Cloudflare Tunnel
```

## Tech Stack

| Layer | Stack |
|-------|-------|
| Backend | Python 3.14, FastAPI, SQLAlchemy 2.0 async, aiosqlite, Pydantic v2 |
| IA | Claude Sonnet 4 (evaluación), GPT-4.5 mini (triage visual), Prompt Caching |
| Tapo | python-kasa 0.7+ |
| RF | GNU Radio 3.10, pyrtlsdr |
| Dashboard | React 19, Vite 8, Tailwind CSS v4, Zustand, react-router-dom v7 |
| PWA | vite-plugin-pwa, Workbox, NetworkFirst API caching |
| Deploy | systemd, Cloudflare Tunnel |

## Directory Structure

```
VerisureSix6/
├── CLAUDE.md
├── README.md                    # Documentación completa del proyecto
├── .gitignore
├── backend/
│   ├── main.py                  # FastAPI entrypoint + lifespan
│   ├── settings.py              # Pydantic settings (ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.)
│   ├── requirements.txt
│   ├── .env.example
│   ├── api/
│   │   ├── events.py            # CRUD eventos + POST con evaluación Sheriff
│   │   ├── devices.py           # CRUD dispositivos
│   │   ├── sheriff.py           # GET/PATCH config + chat endpoint
│   │   └── ws.py                # WebSocket /ws/events + broadcast
│   ├── models/
│   │   ├── event.py             # Event (FK a Device, timestamp, alert_level, sheriff_decision)
│   │   ├── device.py            # Device (device_id único, battery, signal, zone)
│   │   └── config.py            # SheriffConfig (mode, zones, schedule, cooldown)
│   ├── services/
│   │   ├── rag_service.py       # RAG: build_context, trend_analysis, consultas SQL
│   │   ├── sheriff_service.py   # Router: GPT triage → RAG context → Claude evaluation
│   │   ├── tapo_service.py      # Placeholder: python-kasa H200 + C420
│   │   ├── rf_service.py        # Placeholder: GNU Radio bridge
│   │   └── alert_service.py     # Telegram alerts via python-telegram-bot
│   └── db/
│       └── database.py          # SQLAlchemy async engine + session + init_db
├── dashboard/
│   ├── vite.config.ts           # Vite + Tailwind + PWA (Workbox)
│   ├── src/
│   │   ├── main.tsx             # BrowserRouter entry point
│   │   ├── App.tsx              # Routes + useWebSocket
│   │   ├── store.ts             # Zustand global state
│   │   ├── types.ts             # TypeScript interfaces
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts  # WebSocket con reconexión automática
│   │   ├── pages/
│   │   │   ├── Layout.tsx       # Sidebar responsive + Outlet + NavLink
│   │   │   ├── Home.tsx         # Status cards + eventos recientes
│   │   │   ├── TimelinePage.tsx # Timeline completo con scroll
│   │   │   ├── ConfigPage.tsx   # Modo Sheriff + estado
│   │   │   └── ChatPage.tsx     # Chat con el Sheriff
│   │   └── components/
│   │       ├── EventTimeline.tsx # Lista eventos con niveles de alerta
│   │       └── AlertHistory.tsx  # Alertas high/critical
│   └── public/
│       └── favicon.svg
├── rf/
│   ├── __init__.py
│   └── listener.py              # RF Listener placeholder (loop asyncio)
├── funoverip-reference/         # Repo clonado de funoverip/verisure-alarm
├── deploy/
│   └── orangepi/
│       ├── install.sh
│       └── services/
│           ├── verisure-backend.service
│           └── verisure-rf-listener.service
```

## How to Run

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Editar .env con ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.
uvicorn backend.main:app --reload --port 8000
```

### Dashboard
```bash
cd dashboard
npm install
npm run dev
# Abre http://localhost:5173
# Para build de producción: npm run build
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Estado del servidor + servicios (RF, Tapo) |
| GET | `/api/v1/events` | Listar eventos (query: device_id, alert_level, limit, offset) |
| POST | `/api/v1/events` | Crear evento → Sheriff evalúa → broadcast WS |
| GET | `/api/v1/events/{id}` | Detalle de evento |
| DELETE | `/api/v1/events/{id}` | Eliminar evento |
| GET | `/api/v1/devices` | Listar dispositivos |
| POST | `/api/v1/devices` | Registrar dispositivo |
| PATCH | `/api/v1/devices/{device_id}` | Actualizar dispositivo |
| DELETE | `/api/v1/devices/{device_id}` | Eliminar dispositivo |
| GET | `/api/v1/sheriff/config` | Obtener/configuración Sheriff |
| PATCH | `/api/v1/sheriff/config` | Actualizar configuración (mode, zones, etc.) |
| POST | `/api/v1/sheriff/chat` | Chat con el Sheriff (body: { message }) |
| WS | `/ws/events` | WebSocket eventos en tiempo real |

## Sheriff IA — Pipeline

```
1. Evento entrante (POST /events o RF listener)
2. [Si hay snapshot] → GPT-4.5 mini triage visual
3. RAGService.build_context() → consulta SQLite (últimos eventos, patrones)
4. Claude Sonnet 4 evalúa con system prompt cacheadο + contexto RAG
5. Si alert_level > "none" → AlertService.send_alert()
6. broadcast_event() → WebSocket a todos los clientes
```

## Coding Conventions

### Python
- Python 3.14+, type hints en todas las funciones
- async/await para todas las operaciones I/O
- SQLAlchemy 2.0 style (mapped_column, Mapped[], select())
- Pydantic v2 para validación (model_validate, model_dump)
- Logging con logger = logging.getLogger(__name__)
- SecretStr para API keys en settings
- Imports: stdlib → third-party → local, con línea en blanco entre grupos

### TypeScript/React
- TypeScript strict mode, verbatimModuleSyntax
- Functional components con hooks (no classes)
- Zustand para estado global (selectors atómicos)
- Tailwind CSS v4 utility classes (no CSS modules)
- `import type` para solo-tipos
- Nombres: PascalCase para componentes, camelCase para hooks/funciones

### Database
- SQLAlchemy async engine + async_sessionmaker
- DateTime(timezone=True) para timestamps
- ForeignKey + relationship entre Event y Device
- Singular table names (event, device, sheriff_config)
- UUID strings como PK, field_id unique para dispositivos

## PWA

- Instalable via Safari (iOS 16.4+) o Chrome (Android)
- Service Worker auto-update (registerType: "autoUpdate")
- Caching: NetworkFirst para API calls (5min TTL, max 50 entries)
- Precache: static assets (JS, CSS, HTML, SVG)
- Theme: dark mode (#0f172a), standalone display

## Deployment (Orange Pi 5)

```bash
# Ver deploy/orangepi/install.sh para instalación completa
# Servicios systemd:
sudo systemctl enable verisure-backend
sudo systemctl enable verisure-rf-listener
```

## Current Session Progress

### Sesión 1 — 13 mayo 2026
- Identificación de hardware, research funoverip, arquitectura definida
- Stack decidido, compras AliExpress realizadas

### Sesión 2 — 17 mayo 2026
- Test puerto mini-USB: no detectado como dispositivo serial
- Research web: funoverip contratado por Verisure bajo NDA (Part 3 no publicada)
- USB documentado como vía no viable → enfoque RF passivo
- Instalación GNU Radio + clonación funoverip-reference
- Backend: FastAPI + SQLAlchemy async + modelos (Event, Device, SheriffConfig)
- API REST: CRUD eventos/dispositivos + sheriff/config + chat
- WebSocket con broadcast en tiempo real
- Servicios: Sheriff IA (Anthropic SDK), Tapo (python-kasa), RF, Alertas (Telegram)
- Deploy: systemd services + install.sh para Orange Pi
- Subagente verificador: corrigió AsyncAnthropic, singletons, CORS, types

### Sesión 3 — 18 mayo 2026 (mañana)
- Investigación RAG: Contextual Retrieval (Anthropic), Prompt Caching
- RAGService: build_context con eventos recientes, patrones por hora, modo Sheriff
- Sheriff router: GPT-4.5 mini triage → RAG context → Claude evaluation
- Claude con cache_control en system prompt (Prompt Caching)
- OpenAI SDK integrado, parse JSON con regex robusto
- Dashboard: Vite + React 19 + Tailwind CSS v4 + PWA (Workbox)
- Layout responsive: sidebar desktop, hamburger mobile
- Componentes: Home, Timeline, Config, Chat, EventTimeline, AlertHistory
- WebSocket hook con reconexión automática
- Subagente verificador: corrijió iconos PWA, dead code, .env.example, lang

### Sesión 3 — 18 mayo 2026 (tarde)
- M3 redesign completo: design tokens (color, elevation, shape, typography), clases utilitarias
- Lucide icons: reemplazo de emojis por iconos vectoriales (Layout, Home, Timeline, Config, Chat)
- Loading states: skeleton cards y listas en Home, TimelinePage
- Error UI: banner global en Layout con dismiss, manejo en store
- TimelinePage: auto-carga si events vacío, filtros por nivel y zona, conteo, skeletons
- CamerasPage: snapshot button, integración HomeMap, device list dinámica desde store
- ChatPage: M3 filled input, typing indicator (dots animados), scroll automático
- AlertHistory: M3 card con border-left dinámico por nivel, animaciones escalonadas
- HomeMap: SVG floor plan animado con pulse-ring, dots por zona, leyenda
- Store: loading/error states, fetchInitial con try/catch, clearError
- Subagente verificador: 11 issues corregidos (PNG icon, border color, dependency fantasma, emoji, snapshot duplicado, device list, replace string, Map type, all type)

## Testing

```bash
# Backend
cd backend && source venv/bin/activate
python3 -c "from backend.main import app; print('Backend OK')"

# Dashboard
cd dashboard && npm run build  # Verifica build sin errores

# Full integration
# Iniciar backend en terminal 1: uvicorn backend.main:app --port 8000
# Iniciar dashboard en terminal 2: npm run dev
# Test: curl http://localhost:8000/health
```

## Important Notes

- ANTHROPIC_API_KEY y OPENAI_API_KEY requeridas para IA funcional
- Sin API keys → Sheriff opera en modo monitor (default values)
- RTL-SDR no ha llegado aún (~26 mayo) → RF service es placeholder
- python-kasa necesita Third-Party Compatibility ON en app Tapo
- Prompt Caching de Anthropic reduce costos ~90% en system prompts recurrentes
- El puerto mini-USB del hub ES6502VSF no es una vía viable (documentado)
