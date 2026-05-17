# Verisure Home Platform
### Reverse Engineering & AI-Powered Home Security System

> **Proyecto personal de Alonso** — Lima, Perú — Mayo 2026  
> Objetivo: reutilizar equipo Verisure propio (servicio cancelado) y cámara Tapo existente para construir una plataforma de seguridad hogareña autónoma con monitoreo de cámaras, automatizaciones, y un "Sheriff IA" basado en Claude API.

---

## Índice

1. [Contexto y motivación](#1-contexto-y-motivación)
2. [Inventario de hardware Verisure](#2-inventario-de-hardware-verisure)
3. [Inventario de hardware Tapo](#3-inventario-de-hardware-tapo)
4. [Descubrimientos de hardware](#4-descubrimientos-de-hardware)
5. [Research existente — funoverip](#5-research-existente--funoverip)
6. [Arquitectura del sistema](#6-arquitectura-del-sistema)
7. [Hardware adquirido](#7-hardware-adquirido)
8. [Stack tecnológico](#8-stack-tecnológico)
9. [Roadmap del proyecto](#9-roadmap-del-proyecto)
10. [El Sheriff IA — Diseño conceptual](#10-el-sheriff-ia--diseño-conceptual)
11. [Estructura del repositorio](#11-estructura-del-repositorio)
12. [Setup inicial — Guía paso a paso](#12-setup-inicial--guía-paso-a-paso)
13. [Notas de investigación RF](#13-notas-de-investigación-rf)
14. [Riesgos y consideraciones](#14-riesgos-y-consideraciones)
15. [Escalabilidad futura](#15-escalabilidad-futura)
16. [PWA — Interfaz principal del sistema](#16-pwa--interfaz-principal-del-sistema)
17. [Arquitectura de IA — Sheriff Router](#17-arquitectura-de-ia--sheriff-router)
18. [Glosario técnico](#18-glosario-técnico)

---

## 1. Contexto y motivación

El servicio de alarma Verisure fue cancelado. La empresa confirmó que el equipo instalado es propiedad del cliente. Sin embargo, el hardware usa protocolos propietarios cifrados que impiden su uso fuera del ecosistema Verisure de forma oficial.

**El objetivo** es hacer ingeniería inversa del sistema para:
- Entender el protocolo RF entre sensores y hub
- Construir software propio que controle el equipo
- Crear una plataforma de monitoreo hogareño autónoma
- Implementar un agente de IA ("Sheriff") que analice eventos y alerte inteligentemente

**Por qué es factible:**
- El hardware es 100% propiedad del dueño — no hay restricción legal para analizarlo
- Existe research público completo del protocolo Verisure (ver sección 4)
- El equipo es Made in Israel, basado en tecnología Visonic, con comunidad de seguridad activa

---

## 2. Inventario de hardware Verisure

### Hub central (Vbox)
| Campo | Valor |
|-------|-------|
| Modelo | ES6502VSF-ES-M02 |
| SW Ver | 9.7.5 |
| SD Ref | BF039M |
| Fecha fabricación | 07/2019 |
| Origen | Made in Israel |
| Certificación | ANATEL (Brasil) — 0B541-17-06999 |
| Módulo celular | **Telit HE910-EUR** (3G HSPA+) |
| SIM | M2M Solutions (multi-operador: Movistar, O2, Vivo) |
| Puerto externo | **Mini-USB** (puerto de servicio/diagnóstico) |
| Conectividad | Ethernet + 3G celular backup |

**Observaciones críticas del hub:**
- Tiene puerto mini-USB accesible externamente — primer vector de exploración
- El módulo Telit HE910-EUR tiene **intérprete Python 2.7.2 interno** con 2MB de memoria no volátil
- La SIM M2M es multi-operador; con servicio cancelado la SIM puede estar inactiva
- El hub funciona como gateway RF — todos los sensores reportan aquí
- Internamente usa chipset **ARM STR91X** (identificado en research de hardware similar)

### Sensores PIR con cámara (x2)
| Campo | Valor |
|-------|-------|
| Modelo | ES700IPDE-ES-M02 |
| SW Ver | 2.04 |
| SD Ref | BF219SP |
| Fecha fabricación | 06/2019 |
| Origen | Made in Israel |
| Certificación | ANATEL — 01441-17-06999 |
| Función | Detector de movimiento PIR + cámara integrada |

**Observaciones:**
- Ambos sensores son idénticos (misma versión de hardware/software)
- Comunicación exclusivamente RF con el hub — sin procesamiento local
- La cámara integrada es el componente más valioso pero también el más incierto de liberar

### Alarma/sirena
- Componente adicional del kit
- Comunicación RF con el hub
- Modelo pendiente de identificar

---

## 3. Inventario de hardware Tapo

El hogar ya cuenta con un sistema Tapo de TP-Link operativo que se integrará al proyecto desde el día uno, sin necesidad de ingeniería inversa.

### Cámara exterior — Tapo C420
| Campo | Valor |
|-------|-------|
| Modelo | C420 |
| Nombre | Tapo_Camera_Balcon |
| Ubicación | Balcón (apuntando hacia exterior del edificio) |
| Hardware Ver | 1.0 |
| Firmware | 1.4.2 |
| MAC | 9C-53-22-44-E8-2F |
| Hub conectado | Tapo_Hub_alonsix (H200) |
| Alimentación | **Cable a corriente** (no batería) |
| Zona horaria | America/Bogota |

### Hub Tapo — H200
| Campo | Valor |
|-------|-------|
| Modelo | Tapo H200 |
| Nombre | Tapo_Hub_alonsix |
| IP local | 192.168.68.62 |
| MAC | 9C-53-22-44-E1-33 |
| Hardware Ver | 1.0 |
| Firmware | 1.6.1 Build 20251230 rel.64168 |
| Zona horaria | UTC-05:00 (Lima) |

---

### Capacidades y limitaciones de la C420

**Limitación importante — RTSP:**
La C420, a pesar de estar conectada a corriente, **no soporta streaming RTSP/ONVIF continuo**. Esta es una limitación del chip interno, no de la batería. TP-Link confirma que los modelos C410, C420, C425 y D230 no tienen esta capacidad por diseño de hardware.

**Lo que SÍ soporta y es suficiente para el proyecto:**
- Detección de movimiento con notificación de evento en tiempo real
- Captura de snapshot/foto al detectar movimiento
- Acceso local via python-kasa (API no oficial, completamente funcional)
- Consulta de estado, configuración y alertas

**Para el Sheriff — esto es ideal:**
```
Movimiento detectado en balcón
        ↓
Snapshot automático capturado
        ↓
Claude API recibe: foto + hora + contexto
        ↓
"¿Es anómalo? ¿Alertar?"
        ↓
Notificación si corresponde
```

Claude analiza una imagen concreta del evento en lugar de monitorear un stream continuo — más eficiente en CPU y en tokens de API.

---

### Integración técnica — python-kasa

El H200 usa el protocolo Tapo (mismo que cámaras), soportado por python-kasa desde versiones recientes.

**Prerequisito obligatorio:** activar compatibilidad de terceros en la app Tapo:
```
Tapo App → Me → Tapo Lab → Third-Party Compatibility → ON
```

**Código de integración básico:**
```python
from kasa import Discover, Hub

# Descubrir el hub en la red local
devices = await Discover.discover()

# Conectar directamente por IP
hub = await Hub.connect(
    host="192.168.68.62",
    username="tu_email_tapo",
    password="tu_password_tapo"
)
await hub.update()

# Ver dispositivos conectados (incluye C420)
for child in hub.children:
    print(child.alias, child.model)

# Escuchar eventos de movimiento
# Se implementa via polling o webhook según versión de firmware
```

**Librería alternativa para la cámara directamente:**
```python
from pytapo import Tapo

# La C420 se accede via el hub, no directamente por IP
# pytapo es mejor para cámaras con IP propia
```

---

### Futuro — upgrade a stream en vivo

Si en algún momento se quiere stream continuo en el dashboard, la solución es agregar una cámara cableada Tapo compatible con RTSP:

| Modelo | Precio aprox | RTSP | ONVIF |
|--------|-------------|------|-------|
| Tapo C220 | ~$30 | ✅ | ✅ |
| Tapo C320WS | ~$40 | ✅ | ✅ |
| Tapo C520WS | ~$55 | ✅ | ✅ |

URL RTSP estándar cuando se tenga:
```
rtsp://camera_user:camera_pass@IP_CAMARA/stream1  # Alta calidad
rtsp://camera_user:camera_pass@IP_CAMARA/stream2  # Calidad estándar
```

---

## 4. Descubrimientos de hardware

### Puerto mini-USB del hub
Al inspeccionar el exterior del hub se identificó un puerto **mini-USB accesible sin necesidad de abrir el dispositivo**. En equipos IoT de esta generación, este tipo de puerto suele ser:

1. **Puerto de servicio Verisure** — usado por técnicos para diagnóstico y configuración de fábrica
2. **UART sobre USB** — el chip interno convierte UART a USB, dando acceso a consola serial
3. **Puerto de actualización de firmware**

**Próxima acción:** conectar al Mac con cable mini-USB y ejecutar:
```bash
# Identificar si aparece como dispositivo serial
ls /dev/tty.* /dev/cu.*
# o en Linux:
lsusb && dmesg | tail -20
```

Si aparece como `/dev/tty.usbserial-XXXX` → es UART sobre USB → jackpot, acceso a consola.

### Módulo celular Telit HE910-EUR
Identificado en el compartimento de batería/SIM. Datos clave:
- Módulo 3G HSPA+ para EMEA/APAC/LatAm
- Bandas: UMTS 800/850/900/2100 MHz + quad-band GSM
- **Incluye intérprete Python 2.7.2** con 2MB non-volatile storage para scripts de usuario
- Control via AT commands estándar
- Conectividad: USB 2.0 HS, dual UART, SPI, I2C

Esto significa que el mini-USB podría exponer también la interfaz AT del Telit, no solo el ARM principal.

### SIM M2M
- Operadores soportados: Movistar, O2, Vivo
- Formato: SIM estándar (no micro/nano)
- Con servicio cancelado: potencialmente reemplazable con SIM propia para redirigir tráfico

### Test de puerto mini-USB — 17 mayo 2026

Se conectó el hub al Mac via cable mini-USB de datos. Resultados:

1. **El hub respondió físicamente**: sonido de booteo y luces LED en panel frontal (botones Services, correo, alarma, casa+2)
2. **No fue detectado por el Mac**: no apareció ningún dispositivo nuevo en `ls /dev/tty.*`, `ioreg`, ni `system_profiler`
3. **Único USB detectado**: solo el receptor 2.4GHz del teclado/mouse

**Investigación web posterior reveló:**
- El autor de funoverip (Jerome Nokin) reveló en comentarios del blog (2015) que **fue contratado por Verisure y firmó NDA**, por lo que la **Part 3 (USB console authentication) nunca se publicó**
- Confirmó que el acceso por USB es **read-only** y no permite reconfigurar el Vbox: *"Getting access to the USB console doesn't worth it. It won't let you reconfigure the VBOX. Most of the config is read-only."*

**Posibles causas de que no se detecte:**
1. El puerto mini-USB del modelo ES6502VSF-ES-M02 (2019) podría **no estar conectado internamente** a diferencia del modelo anterior del research (2014)
2. Podría requerir **autenticación previa** (como anticipaba el research de funoverip) antes de exponer cualquier interfaz
3. Podría usar un **protocolo propietario** no-estándar que requiere hardware/driver específico

**Conclusión:** El puerto mini-USB no es una vía práctica para este proyecto. El enfoque correcto es **RF passivo** via RTL-SDR + GNU Radio (Fase 1).

---

## 5. Research existente — funoverip

### Fuente principal
**Autor:** Jerome Nokin (@funoverip)  
**Blog:** http://funoverip.net  
**GitHub:** https://github.com/funoverip/verisure-alarm  
**Publicado:** Noviembre-Diciembre 2014

Este research es la base técnica del proyecto. Documentó completamente el protocolo RF de Verisure en dos partes:

### Part 1 — Radio Communications
- **Frecuencia:** 869.036 MHz (banda 868 MHz ISM)
- **Modulación:** 2-FSK (dos picos en el espectro)
- **Herramienta:** HackRF One + GNU Radio framework
- **Chip de sensores:** CC1110/CC1111 (Texas Instruments)
- **Firmware especial:** RFCat para chips CC1110

### Part 2 — Firmwares & Crypto Keys
- **Cifrado RF:** AES-128 CBC mode
- **IV:** Null (00000000000000000000000000000000)
- **Tipos de keys:**
  - **Session Keys** (crypt + hash): generadas aleatoriamente por el hub periódicamente
  - **Personal Keys** (crypt + hash): únicas por dispositivo, hardcodeadas en memoria a dirección estática, enviadas por Verisure vía internet al hub
- **Chipset hub:** ARM STR91X
- **Debug interface:** JTAG (conector 2×7 pines en PCB)
- **Herramienta JTAG:** OpenOCD + Olimex ARM-USB-OCD-H

### Scripts disponibles en el repo
```
verisure-alarm/
├── rf-receiver/
│   ├── verisure_rx.py          # Sniffer RF principal con soporte AES
│   └── grc/
│       └── verisure_demod_hackrf.grc  # Flowgraph GNU Radio
├── lib/
│   └── aes_cbc.py              # Implementación AES-CBC
└── utils/                      # Utilidades varias
```

**Uso básico del sniffer:**
```bash
cd rf-receiver/
./verisure_rx.py -k 1abbd3085124d092aeccfa7802c9fe0d
# Frequency tuned to: 869037.22 KHz
# [timestamp] src_device dst_device payload...
```

### Cómo obtener las Session Keys (con servicio cancelado)
Con el servicio activo, las keys se capturan del tráfico de red. Con servicio cancelado:
1. **Vía JTAG:** extraer firmware del ARM → las Personal Keys están hardcodeadas en memoria a dirección estática
2. Con las Personal Keys se puede descifrar el paquete LOGIN que cada sensor envía al boot
3. Del LOGIN descifrado se extraen las Session Keys actuales

### Limitación conocida
El research original no documentó el **stream de video** de las cámaras ES700IPDE. Solo el protocolo de eventos PIR. El video es el componente más incierto del proyecto.

### Part 3 (no publicada — NDA)
El autor mencionó una parte 3 sobre autenticación en la consola local USB. **Nunca fue publicada**. En comentarios del blog (2015), Jerome Nokin reveló que **fue contratado por Verisure y firmó un acuerdo de confidencialidad (NDA)**, por lo que no pudo publicar la parte 3. Confirmó que el acceso por USB es *read-only* y no permite reconfigurar el Vbox para uso autónomo.

---

## 6. Arquitectura del sistema

### Diagrama general
```
┌─────────────────────────────────────────────────────────┐
│                    HARDWARE VERISURE                     │
│                                                          │
│  [Sensor ES700IPDE #1]                                   │
│  [Sensor ES700IPDE #2]  ←──RF 869MHz AES-128──→ [Hub]  │
│  [Alarma/Sirena]                                         │
└─────────────────────────────────────────────────────────┘
                              │
                    señal RF en el aire
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                    RTL-SDR V3 (USB)                      │
│              Captura pasiva de señal RF                  │
└─────────────────────────────────────────────────────────┘
                              │ USB
                              ▼
┌─────────────────────────────────────────────────────────┐
│                   ORANGE PI 5 (4GB)                      │
│                  Servidor 24/7 local                     │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  GNU Radio  │  │  FastAPI     │  │  Sheriff IA   │  │
│  │  + Scripts  │→ │  Backend     │→ │  Claude API   │  │
│  │  RF decode  │  │  REST + WS   │  │  Análisis     │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
│                          │                    │          │
│                   ┌──────────────┐            │          │
│                   │  SQLite DB   │            │          │
│                   │  Eventos     │            │          │
│                   │  Historial   │            │          │
│                   └──────────────┘            │          │
└───────────────────────────────────────────────┼─────────┘
                                                │
                                    ┌───────────▼──────────┐
                                    │   ALERTAS EXTERNAS   │
                                    │  WhatsApp / Telegram │
                                    │  Push notifications  │
                                    └──────────────────────┘
                                                │
                                    ┌───────────▼──────────┐
                                    │   DASHBOARD WEB      │
                                    │  Accesible desde     │
                                    │  cualquier lugar     │
                                    └──────────────────────┘
```

### Rol de cada componente
| Componente | Rol | Notas |
|-----------|-----|-------|
| Hub Verisure | Emisor RF — habla con sensores | Se deja funcionando, no se modifica |
| Sensores ES700IPDE | Detectores de movimiento + cámara | Reportan al hub vía RF |
| RTL-SDR V3 | Receptor RF pasivo | Captura toda la comunicación hub↔sensores |
| Orange Pi 5 | Servidor 24/7 | Corre todo el software del proyecto |
| GNU Radio | Demodulación RF | Convierte señal a datos binarios |
| Scripts Python | Decode del protocolo | Basados en repo funoverip, adaptados |
| FastAPI | Backend REST/WebSocket | API central del sistema |
| SQLite | Persistencia | Eventos, historial, configuración |
| Claude API | Sheriff IA | Análisis inteligente de eventos |
| Dashboard | Frontend web | Monitoreo en tiempo real |

---

## 7. Hardware adquirido

### Comprado (Mayo 2026 — AliExpress)
| Item | Especificación | Precio | ETA |
|------|---------------|--------|-----|
| RTL-SDR Blog V3 | R820T2, RTL2832U, TCXO 1PPM, antena dipolo incluida | $44.95 | 26 mayo - 14 junio |
| Orange Pi 5 | RK3588S 8-core, 4GB LPDDR4, 64-bit | $118.91 | 26 mayo - 14 junio |
| Case aluminio Orange Pi 5 | Aleación aluminio, dual fan | $10.85 | Por confirmar |
| Fuente alimentación | 5.4V 5A USB-C, EU plug | $10.09 | Por confirmar |
| **TOTAL** | | **~$185** | |

### Ya disponible
| Item | Especificación | Estado |
|------|---------------|--------|
| MicroSD 64GB | SanDisk Ultra Plus, microSDXC, UHS-I | ✅ En mano |
| Mac (desarrollo) | Apple Silicon | ✅ Disponible |
| Hub Verisure ES6502 | Ver sección 2 | ✅ En mano |
| Sensores ES700IPDE x2 | Ver sección 2 | ✅ En mano |
| Cable mini-USB | Pendiente conseguir | 🔍 Buscar en Lima |

### Hardware futuro (opcional)
| Item | Para qué | Precio aprox |
|------|---------|-------------|
| Olimex ARM-USB-OCD-H | JTAG para extracción de firmware | ~$50 |
| HackRF One | SDR más potente para TX también | ~$300 |

---

## 8. Stack tecnológico

### Lenguajes
- **Python 3.11** — todo el backend, RF processing, sheriff
- **JavaScript/TypeScript** — dashboard frontend

### Frameworks y librerías principales
```
RF / Signal Processing:
  - GNU Radio 3.10+
  - gr-osmosdr
  - gr-cc1111
  - pyrtlsdr

Backend:
  - FastAPI
  - SQLAlchemy
  - SQLite (desarrollo) → PostgreSQL (producción opcional)
  - Pydantic
  - APScheduler (para modo sheriff por horarios)

Sheriff IA:
  - anthropic Python SDK
  - claude-sonnet-4-20250514 (modelo recomendado)

Alertas:
  - python-telegram-bot o twilio (WhatsApp)

Frontend:
  - React + Vite
  - Tailwind CSS
  - WebSockets para eventos en tiempo real

DevOps:
  - Git + GitHub
  - systemd (servicios en Orange Pi)
  - ngrok o Cloudflare Tunnel (acceso remoto al dashboard)
```

### Entorno de desarrollo
- **Mac:** desarrollo, pruebas con RTL-SDR conectado
- **Orange Pi 5:** producción 24/7, mismo código via git pull
- **OS Orange Pi:** Ubuntu 22.04 ARM o imagen oficial Orange Pi

---

## 9. Roadmap del proyecto

### Fase 0 — Exploración inicial (Esta semana)
- [ ] Conseguir cable mini-USB en Lima (Surco)
- [ ] Conectar hub al Mac via mini-USB
- [ ] Identificar si aparece como dispositivo serial (`ls /dev/tty.*`)
- [ ] Si es serial: conectar con `screen /dev/tty.usbserial-XXXX 115200`
- [ ] Documentar output del boot log si es accesible
- [ ] Instalar GNU Radio en Mac: `brew install gnuradio`
- [ ] Clonar repo funoverip: `git clone https://github.com/funoverip/verisure-alarm`

### Fase 1 — RF Capture (Cuando llegue RTL-SDR)
- [ ] Conectar RTL-SDR al Mac
- [ ] Abrir GQRX o SDR# y sintonizar 869 MHz
- [ ] Confirmar señal del hub (pulsos cuando se presionan teclas del keypad)
- [ ] Ejecutar `verisure_rx.py` del repo funoverip
- [ ] Capturar tráfico raw entre hub y sensores
- [ ] Identificar device IDs únicos de los sensores

### Fase 2 — Key Extraction
- [ ] **Opción A (sin soldar):** Si el mini-USB da consola, buscar keys en memoria
- [ ] **Opción B (JTAG):** Abrir hub, localizar JTAG 2×7, conectar Olimex, ejecutar OpenOCD
- [ ] Extraer firmware completo del ARM STR91X
- [ ] Parsear firmware con Binwalk + Ghidra
- [ ] Localizar Personal Keys en dirección estática de memoria
- [ ] Validar keys intentando descifrar tráfico capturado

### Fase 3 — Backend base (Paralelo, mientras llega hardware)
- [ ] Crear repo GitHub `verisure-home-platform`
- [ ] Setup FastAPI con estructura base
- [ ] Modelos de base de datos: Event, Device, Alert, SheriffConfig
- [ ] WebSocket endpoint para streaming de eventos
- [ ] Sistema de horarios para modo sheriff (APScheduler)

### Fase 4 — Sheriff IA
- [ ] Integración Claude API (claude-sonnet-4-20250514)
- [ ] Diseñar prompt del Sheriff con contexto del hogar
- [ ] Lógica de decisión: evento → contexto → ¿alertar?
- [ ] Sistema de horarios configurables
- [ ] Integración alertas WhatsApp/Telegram

### Fase 5 — Dashboard
- [ ] Frontend React con mapa del hogar
- [ ] Timeline de eventos en tiempo real via WebSocket
- [ ] Panel de configuración Sheriff (horarios, sensibilidad)
- [ ] Vista de historial con filtros
- [ ] Acceso remoto via Cloudflare Tunnel

### Fase 6 — Deploy Orange Pi
- [ ] Setup Ubuntu en Orange Pi 5 con microSD 64GB
- [ ] Instalar dependencias: GNU Radio, Python, Node
- [ ] Configurar servicios systemd (auto-start)
- [ ] Mover RTL-SDR al Orange Pi
- [ ] Prueba de sistema completo end-to-end

### Meta: Sistema funcional antes del 22 de julio (viaje a Japón)

---

## 10. El Sheriff IA — Diseño conceptual

### Concepto
El Sheriff es un agente Claude que recibe eventos del sistema de seguridad y decide inteligentemente si deben generar una alerta, reduciendo falsos positivos y adaptándose a los patrones del hogar.

### Modos de operación
```python
SHERIFF_MODES = {
    "off": "Sistema desactivado",
    "monitor": "Solo registra, no alerta",
    "normal": "Alerta en horarios configurados",
    "away": "Máxima sensibilidad — todos en casa",
    "travel": "Vigilancia 24/7 — nadie en casa"
}
```

### Configuración de horarios
```python
SHERIFF_SCHEDULE = {
    # Modo viaje: activar manualmente con fecha
    "travel_periods": [
        {"start": "2026-07-22", "end": "2026-08-08",
         "label": "Japón", "mode": "travel"}
    ],
    # Modo away: días laborales fuera de casa
    "away_hours": {
        "weekdays": {"start": "08:00", "end": "20:00"},
        "weekends": None  # Desactivado fines de semana
    }
}
```

### Lógica de decisión del Sheriff
```python
async def sheriff_evaluate(event: Event, context: SheriffContext) -> SheriffDecision:
    """
    El Sheriff recibe:
    - El evento (sensor activado, zona, timestamp)
    - Contexto completo (modo actual, historial reciente, patrones normales)
    
    Y decide:
    - ¿Es anómalo este evento?
    - ¿Qué nivel de alerta merece?
    - ¿Qué mensaje enviar?
    """
    
    prompt = f"""
    Eres el Sheriff de seguridad del hogar de Alonso en Lima, Perú.
    
    EVENTO ACTUAL:
    - Sensor: {event.sensor_name} ({event.zone})
    - Timestamp: {event.timestamp}
    - Tipo: {event.event_type}
    
    CONTEXTO:
    - Modo actual: {context.mode}  
    - Última actividad conocida: {context.last_known_activity}
    - Eventos en las últimas 2 horas: {context.recent_events}
    - Patrones normales para este horario: {context.normal_patterns}
    - En viaje: {context.is_travel_period}
    
    DECISIÓN REQUERIDA:
    Analiza si este evento es anómalo y merece alerta.
    Responde en JSON:
    {{
        "is_anomalous": bool,
        "alert_level": "none|low|medium|high|critical",
        "reasoning": "explicación breve",
        "message": "mensaje para enviar a Alonso (si aplica)",
        "recommended_action": "descripción de qué hacer"
    }}
    """
    
    response = await claude_client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}]
    )
    
    return SheriffDecision.parse(response.content[0].text)
```

### Ejemplos de razonamiento esperado del Sheriff

**Evento normal (no alerta):**
```
Sensor sala — 14:30 — lunes laborable
→ "Es horario de trabajo, movimiento esperado de familiar en casa. No anómalo."
→ alert_level: "none"
```

**Evento anómalo (alerta):**
```
Sensor sala — 02:15 — modo viaje activo — sin actividad previa en 8 horas
→ "Movimiento detectado a las 2am con todos fuera de casa. Altamente anómalo."
→ alert_level: "critical"
→ message: "🚨 Movimiento detectado en sala a las 2:15am. Llevan 8h sin actividad."
```

---

## 11. Estructura del repositorio

```
verisure-home-platform/
│
├── README.md                    # Este archivo
├── .env.example                 # Variables de entorno (no commitear .env real)
├── .gitignore
│
├── docs/
│   ├── hardware.md              # Detalles de hardware Verisure
│   ├── protocol-research.md     # Findings del protocolo RF
│   ├── architecture.md          # Diagramas de arquitectura
│   └── setup-orangepi.md        # Guía deploy en Orange Pi
│
├── rf/
│   ├── README.md
│   ├── capture/
│   │   ├── verisure_rx.py       # Adaptado de funoverip
│   │   └── grc/                 # GNU Radio flowgraphs
│   ├── decode/
│   │   ├── protocol_parser.py   # Parser de mensajes Verisure
│   │   └── crypto.py            # AES-128 CBC helpers
│   └── tests/
│       └── sample_captures/     # Capturas de ejemplo para testing
│
├── backend/
│   ├── main.py                  # FastAPI entrypoint
│   ├── requirements.txt
│   ├── api/
│   │   ├── events.py            # Endpoints de eventos
│   │   ├── devices.py           # Endpoints de dispositivos
│   │   ├── sheriff.py           # Endpoints de configuración Sheriff
│   │   └── websocket.py         # WebSocket streaming
│   ├── models/
│   │   ├── event.py
│   │   ├── device.py
│   │   └── sheriff_config.py
│   ├── services/
│   │   ├── rf_listener.py       # Escucha eventos RF
│   │   ├── sheriff_service.py   # Lógica del Sheriff IA
│   │   ├── alert_service.py     # Envío de alertas
│   │   └── scheduler.py         # APScheduler para horarios
│   └── db/
│       └── database.py          # SQLAlchemy setup
│
├── dashboard/
│   ├── package.json
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── EventTimeline.tsx
│   │   │   ├── HomeMap.tsx
│   │   │   ├── SheriffConfig.tsx
│   │   │   └── AlertHistory.tsx
│   │   └── hooks/
│   │       └── useWebSocket.ts
│   └── public/
│
└── deploy/
    ├── orangepi/
    │   ├── install.sh           # Script de instalación completa
    │   └── services/
    │       ├── rf-listener.service
    │       └── backend.service
    └── docker-compose.yml       # Alternativa containerizada
```

---

## 12. Setup inicial — Guía paso a paso

### En Mac (desarrollo)

```bash
# 1. Instalar dependencias
brew install gnuradio python@3.11 git

# 2. Clonar repos
git clone https://github.com/TU_USUARIO/verisure-home-platform
git clone https://github.com/funoverip/verisure-alarm  # reference

# 3. Setup Python
cd verisure-home-platform/backend
python3.11 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn sqlalchemy anthropic apscheduler

# 4. Variables de entorno
cp .env.example .env
# Editar .env con:
# ANTHROPIC_API_KEY=sk-ant-...
# SHERIFF_MODE=monitor

# 5. Correr backend
uvicorn main:app --reload --port 8000
```

### Explorar el hub via mini-USB

```bash
# 1. Conectar cable mini-USB hub → Mac
# 2. Identificar el puerto
ls /dev/tty.* /dev/cu.*
# Buscar algo como: /dev/tty.usbserial-XXXX o /dev/tty.usbmodem-XXXX

# 3. Si aparece puerto serial — conectar
screen /dev/tty.usbserial-XXXX 115200
# Alternativa:
minicom -b 115200 -D /dev/tty.usbserial-XXXX

# 4. Si no aparece — intentar otros baud rates
# 9600, 19200, 38400, 57600, 115200, 230400
```

### Captura RF inicial (cuando llegue RTL-SDR)

```bash
# 1. Instalar drivers RTL-SDR
brew install librtlsdr

# 2. Verificar que el dispositivo es reconocido
rtl_test

# 3. Instalar GQRX para inspección visual
brew install --cask gqrx
# Abrir GQRX → sintonizar 869.036 MHz → buscar señal del hub

# 4. Correr sniffer
cd rf/capture/
pip install pyrtlsdr pycryptodome gnuradio
python verisure_rx.py
# Con key (una vez extraída):
python verisure_rx.py -k TU_SESSION_KEY
```

### Setup Orange Pi 5

```bash
# 1. Flashear imagen en microSD
# Descargar: Ubuntu 22.04 para Orange Pi 5 desde orangepi.org
# Usar Balena Etcher o dd

# 2. Boot y configuración inicial
ssh orangepi@192.168.1.XXX  # password: orangepi
sudo orangepi-config  # cambiar password, hostname, timezone

# 3. Instalar dependencias
sudo apt update && sudo apt upgrade -y
sudo apt install python3.11 python3-pip git gnuradio rtl-sdr -y

# 4. Clonar repo y setup
git clone https://github.com/TU_USUARIO/verisure-home-platform
cd verisure-home-platform
pip install -r backend/requirements.txt

# 5. Configurar servicios systemd
sudo cp deploy/orangepi/services/*.service /etc/systemd/system/
sudo systemctl enable rf-listener backend
sudo systemctl start rf-listener backend
```

---

## 13. Notas de investigación RF

### Protocolo Verisure documentado
```
Frecuencia:     869.036 MHz
Modulación:     2-FSK
Cifrado:        AES-128 CBC
IV:             0x00000000000000000000000000000000 (null)
Chip sensores:  CC1110/CC1111 (Texas Instruments)
```

### Estructura de mensaje (desde research funoverip)
```
[timestamp] tipo seq src_id dst_id payload...

Ejemplo:
[13:11:00] 1a 08 d8 050232d1 0100c3a7 58 f9 87 00 1e 9e f9 82 62
            │   │   │  │         │       └─── payload cifrado
            │   │   │  │         └─────────── dst: Vbox (0100c3a7)
            │   │   │  └───────────────────── src: sensor
            │   │   └──────────────────────── sequence number
            │   └──────────────────────────── length
            └──────────────────────────────── msg type
```

### Device IDs conocidos
| ID | Dispositivo |
|----|------------|
| 0100c3a7 | Vbox (hub) — broadcast desde aquí |
| ffffffff | Broadcast a todos |
| 050232d1 | Sensor (ejemplo del research) |
| Los de tu equipo | Por descubrir en la captura inicial |

### Keys management
```
Personal Keys:
  - Únicas por dispositivo
  - Hardcodeadas en memoria flash a dirección estática
  - Enviadas al Vbox por Verisure via internet al setup inicial
  - Extraíbles via JTAG del Vbox
  - Permanecen válidas aunque se cancele el servicio

Session Keys:
  - Par crypt/hash generado aleatoriamente por el Vbox
  - Rotación periódica (en firmware upgrades y eventos de red)
  - Distribuidas a sensores cifradas con Personal Key de cada uno
  - Con servicio cancelado: la última Session Key activa permanece en memoria
```

---

## 14. Riesgos y consideraciones

### Técnicos
| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| Puerto mini-USB no expone consola útil | Media | Proceder con JTAG |
| ES6502 usa protocolo diferente al del research | Baja | Mismo fabricante israelí, misma generación |
| Stream de video de cámaras no descifrable | Media | Usar cámaras externas como backup |
| Orange Pi 5 incompatibilidad con GNU Radio | Baja | Alternativa: compilar desde fuente |
| Session Keys rotaron antes de capturar | Media | Extraer Personal Keys vía JTAG y reconstruir |

### Operacionales
- El hub necesita alimentación constante para emitir RF a los sensores
- Si se va la luz, el sistema cae (considerar UPS pequeño)
- El RTL-SDR es receptor pasivo — no puede enviar comandos a los sensores directamente
- Latencia de alertas depende de conexión a internet para Claude API

### Legales (Perú)
- El equipo es propiedad del dueño — análisis legal
- No se está accediendo a sistemas de terceros
- No se está interceptando comunicaciones ajenas
- Uso puramente privado y educativo

---

## 15. Escalabilidad futura

El sistema está diseñado desde el inicio para crecer. El Sheriff no depende de una fuente específica de eventos — cualquier dispositivo que pueda reportar al backend se convierte automáticamente en un sensor más.

### Sensores adicionales compatibles (sin cambiar arquitectura)

**Ecosistema Tapo — plug and play:**
| Dispositivo | Función | Precio aprox |
|-------------|---------|-------------|
| Tapo T110 | Sensor puerta/ventana | ~$15 |
| Tapo T100 | Sensor de movimiento adicional | ~$15 |
| Tapo T300 | Sensor de agua/inundación | ~$18 |
| Tapo T310/T315 | Sensor temperatura/humedad | ~$20 |
| Tapo C220/C320WS | Cámara interior con RTSP | ~$30-40 |

Todos conectan al H200 existente — no se necesita hardware adicional.

**Ecosistema Zigbee/Z-Wave (futuro avanzado):**
Con un dongle Zigbee USB (~$15) conectado al Orange Pi, se pueden integrar cientos de sensores de diferentes marcas (Aqara, Sonoff, IKEA) via Zigbee2MQTT.

### Evolución del Sheriff por fases

```
FASE ACTUAL (v1):
  Verisure PIR + Tapo C420 snapshot → Claude analiza → alerta

FASE 2:
  + Sensores puerta/ventana Tapo → contexto más rico para Claude
  + "Puerta trasera abierta + movimiento sala = más sospechoso"

FASE 3:
  + Cámara interior con RTSP → stream en dashboard
  + Análisis de video con Claude Vision en eventos críticos

FASE 4:
  + Sensores Zigbee de otras marcas
  + Integración con luces inteligentes (encender al detectar intruso)
  + Automatizaciones complejas (si movimiento + noche + nadie en casa → encender todas las luces)
```

### El dashboard como plataforma abierta

La arquitectura FastAPI + WebSocket permite agregar fuentes de datos sin modificar el core:

```python
# Agregar un nuevo sensor es tan simple como:
@app.post("/events")
async def receive_event(event: EventSchema):
    # Cualquier dispositivo puede reportar aquí
    # El Sheriff lo procesa igual independientemente del origen
    await sheriff_service.evaluate(event)
```

---

## 16. PWA — Interfaz principal del sistema

La interfaz del proyecto es una **Progressive Web App (PWA)** — una web app instalable en el homescreen del iPhone que funciona como app nativa, sin App Store, sin costo de distribución, con notificaciones push reales.

### Por qué PWA y no app nativa ni bot de Telegram

| Criterio | PWA | App nativa | Bot Telegram |
|----------|-----|-----------|-------------|
| Feed de cámara | ✅ | ✅ | ❌ |
| Mapa del hogar | ✅ | ✅ | ❌ |
| Notificaciones push | ✅ iOS 16.4+ | ✅ | ✅ |
| Sin App Store | ✅ | ❌ | ✅ |
| Chat con Sheriff | ✅ | ✅ | ✅ |
| Costo de desarrollo | Bajo | Alto | Muy bajo |
| Instalable en homescreen | ✅ | ✅ | ❌ |

**Decisión:** PWA como interfaz principal. Telegram descartado.

**Prerequisito iOS:** la PWA debe estar instalada desde Safari en el homescreen para recibir push notifications. iOS 16.4+ requerido (ya cubierto con iPhone actual).

---

### Features completas de la PWA

#### Panel principal — Home
- Estado del sistema en tiempo real (Activo / Desarmado / Viaje / Noche)
- Indicador visual prominente del modo actual con color semántico
- Último evento registrado con miniatura de foto
- Acceso rápido a armar/desarmar con un tap
- Resumen del día: N eventos, N alertas

#### Control de vigilancia
- **Armar / Desarmar** — tap único con confirmación
- **Selector de modo:**
  - 🏠 `CASA` — alguien en casa, sensibilidad reducida
  - 🚶 `FUERA` — casa vacía durante el día, sensibilidad media
  - 🌙 `NOCHE` — todos durmiendo, sensibilidad alta para zonas externas
  - ✈️ `VIAJE` — nadie en casa por días, máxima sensibilidad 24/7
- Cada modo tiene umbrales de decisión distintos para el Sheriff

#### Cámaras y sensores
- Grid de dispositivos con estado en tiempo real
- Tap en cámara → snapshot más reciente + botón "Pedir foto ahora"
- Tap en sensor → historial de activaciones del día
- Indicador de batería/señal por dispositivo
- Mapa del hogar con zonas activas marcadas (futuro)

#### Timeline de eventos
- Feed cronológico de todos los eventos
- Foto adjunta en eventos con cámara
- Badge de nivel de alerta: 🟢 Normal / 🟡 Inusual / 🔴 Crítico
- Filtros: por zona, por dispositivo, por fecha, por nivel
- Tap en evento → detalle completo + razonamiento del Sheriff

#### Sheriff IA — Chat
- Interfaz de chat directo con el Sheriff
- Preguntas en lenguaje natural:
  - "¿Qué pasó mientras dormía?"
  - "¿Hay algo raro en el patrón de esta semana?"
  - "Muéstrame todos los eventos del balcón en julio"
  - "¿Cuántas veces se activó el sensor de sala ayer?"
- El Sheriff responde con contexto completo del hogar
- Historial de conversaciones guardado
- El Sheriff puede proactivamente enviar resúmenes

#### Programación y automatizaciones
- **Horarios recurrentes:**
  - Lunes-viernes 8am-7pm → modo `FUERA` automático
  - Configuración por días de la semana con hora inicio/fin
- **Eventos de viaje:**
  - Nombre del viaje (ej. "Japón 2026")
  - Fecha inicio y fin
  - Activación automática de modo `VIAJE` en esas fechas
  - Desactivación automática al regresar
- **Excepciones:** "El jueves 24 alguien se queda en casa" — override puntual
- **Horario Sheriff activo:** configurable independientemente del modo de armado

#### Historial e inteligencia
- Calendario de actividad del hogar por mes
- Patrones aprendidos: horas pico de actividad por zona
- Reporte semanal automático del Sheriff (push notification + vista en app)
- Exportar historial de eventos como CSV

#### Configuración
- Gestión de dispositivos (nombre, zona, tipo)
- Configuración de notificaciones push por tipo de evento
- Umbrales de sensibilidad por modo
- Gestión de API keys (ocultas en producción)
- Info del sistema: uptime Orange Pi, última sincronización

---

### Stack técnico de la PWA

```
React 18 + Vite
Tailwind CSS (responsive automático)
WebSockets → eventos en tiempo real via FastAPI
Service Worker → instalable + offline cache
Web Push API → notificaciones push nativas iOS/Android
React Router → navegación entre secciones
Zustand → state management ligero
```

**Acceso remoto:** Cloudflare Tunnel — URL pública segura, gratis, sin abrir puertos del router.

```bash
# Instalar en Orange Pi
cloudflared tunnel create sheriff-home
cloudflared tunnel run --url http://localhost:3000 sheriff-home
# Genera: https://sheriff-home.tu-dominio.pages.dev
```

---

### Diseño visual — principios

- **Color semántico por modo:**
  - Verde → Casa/normal
  - Amarillo → Fuera
  - Azul oscuro → Noche
  - Rojo → Viaje/alerta
- Sin menús complejos — todo accesible en máximo 2 taps
- Optimizado para uso con una mano en iPhone
- Dark mode por defecto (más legible de noche)
- Animaciones mínimas — claridad sobre estética

---

## 17. Arquitectura de IA — Sheriff Router

El Sheriff no usa un solo modelo para todo. Un sistema de routing inteligente asigna cada tarea al modelo más adecuado, optimizando calidad y costo simultáneamente.

### Modelos seleccionados — Mayo 2026

| Modelo | Proveedor | Input /1M | Output /1M | Vision | Rol en el sistema |
|--------|-----------|-----------|------------|--------|-------------------|
| **GPT-5.4 Nano** | OpenAI | $0.20 | $1.25 | ✅ | Detección visual rápida |
| **Claude Haiku 4.5** | Anthropic | $1.00 | $5.00 | ✅ | Razonamiento de seguridad + chat |
| **Claude Sonnet 4.6** | Anthropic | $3.00 | $15.00 | ✅ | Análisis complejo + reportes |
| ~~DeepSeek V3~~ | ~~China~~ | — | — | ❌ | **Descartado** — sin vision + privacidad |

**Por qué se descartó DeepSeek:** no tiene capacidad de vision (no puede analizar fotos de la cámara), y al ser infraestructura china no es apropiado para un sistema que procesa imágenes del interior del hogar.

---

### El router — lógica completa

```python
from enum import Enum
from dataclasses import dataclass

class TaskType(Enum):
    VISION_DETECTION    = "vision_detection"     # ¿Hay algo en la foto?
    EVENT_EVALUATION    = "event_evaluation"     # ¿Es anómalo este evento?
    CONVERSATION_SIMPLE = "conversation_simple"  # Chat cotidiano
    CONVERSATION_DEEP   = "conversation_deep"    # Análisis complejo
    WEEKLY_REPORT       = "weekly_report"        # Reporte semanal

@dataclass
class ModelConfig:
    model_id: str
    provider: str
    max_tokens: int
    temperature: float

ROUTER = {
    TaskType.VISION_DETECTION: ModelConfig(
        model_id="gpt-5.4-nano",
        provider="openai",
        max_tokens=150,       # Solo necesita "sí/no + confianza"
        temperature=0.1       # Determinístico
    ),
    TaskType.EVENT_EVALUATION: ModelConfig(
        model_id="claude-haiku-4-5-20251001",
        provider="anthropic",
        max_tokens=300,       # Decisión + razonamiento breve
        temperature=0.2
    ),
    TaskType.CONVERSATION_SIMPLE: ModelConfig(
        model_id="claude-haiku-4-5-20251001",
        provider="anthropic",
        max_tokens=800,
        temperature=0.7       # Más natural en conversación
    ),
    TaskType.CONVERSATION_DEEP: ModelConfig(
        model_id="claude-sonnet-4-6",
        provider="anthropic",
        max_tokens=2000,
        temperature=0.5
    ),
    TaskType.WEEKLY_REPORT: ModelConfig(
        model_id="claude-sonnet-4-6",
        provider="anthropic",
        max_tokens=3000,
        temperature=0.4
    ),
}

def route_task(task_type: TaskType) -> ModelConfig:
    return ROUTER[task_type]
```

---

### Flujo completo de procesamiento de un evento

```
┌─────────────────────────────────────────────────────────────┐
│  EVENTO: Sensor activado — 02:14am — Balcón — Modo VIAJE   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PASO 1: Captura snapshot de Tapo C420                      │
│  python-kasa → solicitar foto → guardar en SQLite           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PASO 2: GPT-5.4 Nano — Detección visual                    │
│                                                             │
│  Input:  foto + "¿Hay una persona u objeto sospechoso?"     │
│  Output: { "detected": true, "confidence": 0.94,           │
│            "description": "figura humana en balcón" }       │
│                                                             │
│  Si detected = false → TERMINAR (no gastar más tokens)      │
└─────────────────────────────────────────────────────────────┘
                              │ detected = true
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PASO 3: RAG — Recuperar contexto relevante de SQLite       │
│                                                             │
│  - Últimos 10 eventos del balcón                            │
│  - Modo actual y desde cuándo                               │
│  - Última actividad conocida de personas                    │
│  - Patrones normales para esta hora/día                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PASO 4: Claude Haiku 4.5 — Evaluación de seguridad         │
│                                                             │
│  Input:  foto + contexto RAG + estado del hogar             │
│  Output: {                                                  │
│    "alert_level": "critical",                               │
│    "should_notify": true,                                   │
│    "reasoning": "Figura humana a las 2am, modo viaje        │
│                  activo, 0 actividad previa en 16h",        │
│    "message": "🚨 Movimiento detectado en balcón a          │
│                las 2:14am. Llevan 16h sin actividad."       │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                              │ should_notify = true
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PASO 5: Push notification a PWA                            │
│  Guardar evento + decisión + razonamiento en SQLite         │
└─────────────────────────────────────────────────────────────┘
```

---

### Flujo conversacional con RAG

```python
async def sheriff_chat(user_message: str, conversation_history: list) -> str:
    
    # 1. Clasificar complejidad de la pregunta
    is_complex = classify_complexity(user_message)
    # "¿Qué pasó ayer?" → simple
    # "¿Hay patrones anómalos esta semana comparado con la anterior?" → complejo
    
    # 2. RAG — recuperar contexto relevante
    relevant_events = await db.search_events(
        query=user_message,
        limit=20,
        filters=extract_filters(user_message)  # fechas, zonas, etc.
    )
    
    # 3. Armar contexto del hogar
    home_context = await build_home_context()
    # modo actual, última actividad, configuración
    
    # 4. Construir prompt con todo el contexto
    system_prompt = f"""
    Eres el Sheriff, el agente de seguridad del hogar de Alonso en Lima, Perú.
    
    ESTADO ACTUAL:
    {home_context}
    
    EVENTOS RELEVANTES RECUPERADOS:
    {format_events(relevant_events)}
    
    Responde de forma concisa y útil. Si el usuario pregunta por eventos
    específicos, cítalos con fecha y hora. Si pide análisis, sé directo
    con tus conclusiones.
    """
    
    # 5. Elegir modelo según complejidad
    task_type = (TaskType.CONVERSATION_DEEP if is_complex 
                 else TaskType.CONVERSATION_SIMPLE)
    config = route_task(task_type)
    
    # 6. Llamar a la API correcta
    response = await call_model(
        config=config,
        system=system_prompt,
        messages=conversation_history + [
            {"role": "user", "content": user_message}
        ]
    )
    
    return response
```

---

### Condicionales de funcionamiento del Sheriff

```python
# ─── MODO CASA ────────────────────────────────────────────────
# Alguien en casa, actividad esperada
CASA = SheriffConfig(
    vision_threshold=0.95,      # Solo alerta si muy seguro de detectar persona
    time_windows={
        "alert": ["00:00-06:00"],  # Solo alertas en madrugada
        "monitor": ["06:00-00:00"] # Solo registra durante el día
    },
    ignored_zones=["sala", "cocina"],  # Movimiento esperado
    alert_zones=["balcón", "entrada"]  # Siempre alertar
)

# ─── MODO FUERA ───────────────────────────────────────────────
# Casa vacía durante el día
FUERA = SheriffConfig(
    vision_threshold=0.85,
    time_windows={
        "alert": ["all_day"],
    },
    ignored_zones=[],           # Ninguna zona ignorada
    alert_zones=["all"],        # Todo el hogar activo
    cooldown_minutes=5          # No alertar el mismo evento repetidamente
)

# ─── MODO NOCHE ───────────────────────────────────────────────
# Todos durmiendo
NOCHE = SheriffConfig(
    vision_threshold=0.80,
    time_windows={
        "alert": ["22:00-07:00"],
    },
    ignored_zones=["sala"],     # Alguien puede levantarse
    alert_zones=["balcón", "entrada", "puerta_principal"]
)

# ─── MODO VIAJE ───────────────────────────────────────────────
# Nadie en casa por días — máxima sensibilidad
VIAJE = SheriffConfig(
    vision_threshold=0.75,      # Más sensible — preferir falso positivo
    time_windows={
        "alert": ["all_day"],   # 24/7
    },
    ignored_zones=[],
    alert_zones=["all"],
    escalation=True,            # Llamada además de push si no hay respuesta
    recheck_interval_minutes=30 # Re-evaluar si no hay respuesta en 30min
)
```

---

### Estimado de costo mensual — uso real

**Supuestos:** 20 eventos/día, 30% con detección positiva, 10 conversaciones/mes, 4 reportes semanales.

```
GPT-5.4 Nano (600 detecciones visuales/mes)
  600 × 1,500 tokens × $0.20/1M input     = $0.018
  600 × 150 tokens × $1.25/1M output      = $0.001
  Subtotal Nano:                           = $0.02/mes

Claude Haiku 4.5 (180 evaluaciones + 10 chats simples)
  190 × 4,000 tokens × $1.00/1M input     = $0.76
  190 × 300 tokens × $5.00/1M output      = $0.29
  Subtotal Haiku:                          = $1.05/mes

Claude Sonnet 4.6 (4 reportes semanales + 3 chats complejos)
  7 × 15,000 tokens × $3.00/1M input      = $0.32
  7 × 2,000 tokens × $15.00/1M output     = $0.21
  Subtotal Sonnet:                         = $0.53/mes

──────────────────────────────────────────────────────
TOTAL ESTIMADO:                            ~$1.60/mes
Con prompt caching (sistema prompt repetido ~90% off): ~$0.80/mes
```

**Conclusión: menos de $1/mes en uso normal. Incluso en modo viaje con máxima actividad, difícilmente supera $5/mes.**

---

### MVP vs. arquitectura completa

**Para el MVP (antes del viaje a Japón):**
Solo usar Claude Haiku 4.5 para todo — vision + evaluación + chat. Simplifica el código, dos APIs menos que mantener, y el costo sigue siendo ~$2/mes.

```python
# MVP — un solo modelo para todo
MVP_MODEL = "claude-haiku-4-5-20251001"

# Post-Japón — routing completo
PRODUCTION_ROUTER = ROUTER  # ver tabla arriba
```

El router está diseñado para que cambiar de MVP a producción sea un switch de configuración, no una refactorización.

---

## 18. Glosario técnico
|---------|-----------|
| **SDR** | Software Defined Radio — radio implementada en software en lugar de hardware dedicado |
| **RTL-SDR** | Dongle USB basado en chip RTL2832U que permite recibir señales de radio |
| **GNU Radio** | Framework open source para procesamiento de señales de radio |
| **2-FSK** | Frequency Shift Keying — modulación digital que usa 2 frecuencias para representar 0 y 1 |
| **AES-128 CBC** | Advanced Encryption Standard con clave de 128 bits en modo Cipher Block Chaining |
| **JTAG** | Joint Test Action Group — interfaz de debug para acceder directamente a hardware |
| **UART** | Universal Asynchronous Receiver-Transmitter — protocolo de comunicación serial |
| **Vbox** | Nombre interno Verisure para el hub/gateway central |
| **Personal Key** | Clave AES única por dispositivo, hardcodeada en su firmware |
| **Session Key** | Clave AES temporal generada por el hub, compartida con todos los sensores |
| **PIR** | Passive Infrared — sensor de movimiento que detecta calor corporal |
| **M2M SIM** | SIM para comunicaciones Machine-to-Machine, multi-operador |
| **Telit HE910** | Módulo celular 3G integrado en el hub para conectividad backup |
| **RK3588S** | Chip ARM de Rockchip usado en Orange Pi 5 — 8 cores, hasta 2.4GHz |
| **Sheriff** | Nombre del agente IA del proyecto — Claude API analizando eventos de seguridad |
| **funoverip** | Investigador de seguridad (Jerome Nokin) que documentó el protocolo Verisure en 2014 |

---

## Historial de sesiones de trabajo

### Sesión 2 — 17 mayo 2026
- Instalación de GNU Radio en Mac: `brew install gnuradio`
- Clonación del repo funoverip como referencia dentro del proyecto
- Test de puerto mini-USB: hub responde físicamente pero no es detectado por el Mac
- Research web: descubrimiento de que el autor de funoverip trabaja para Verisure bajo NDA — Part 3 jamás publicada
- Se documenta que el puerto mini-USB **no es una vía viable** para el proyecto
- Se define que el enfoque principal es RF passivo (RTL-SDR + GNU Radio) al llegar el hardware (~26 mayo)

### Sesión 1 — 13 mayo 2026
- Identificación del hardware disponible
- Descubrimiento del puerto mini-USB en el hub
- Lectura de etiquetas: modelos ES6502VSF y ES700IPDE
- Descubrimiento del módulo Telit HE910-EUR y SIM M2M
- Research del protocolo: encontrado repo funoverip con trabajo completo
- Definición de arquitectura del sistema
- Compras en AliExpress: RTL-SDR V3, Orange Pi 5 4GB, case, fuente (~$185 total)
- Decisión de stack: Python + FastAPI + GNU Radio + Claude API + React
- Inventario del ecosistema Tapo existente: C420 + H200
- Research Tapo: C420 sin RTSP por limitación de chip, pero snapshot + eventos son suficientes para el Sheriff
- Sección de escalabilidad futura documentada
- **PWA diseñada como interfaz principal** — features completas mapeadas
- **Arquitectura de IA documentada** — router con 3 modelos: GPT-5.4 Nano + Haiku 4.5 + Sonnet 4.6
- Research de precios de modelos IA actualizado a mayo 2026
- Condicionales de funcionamiento del Sheriff por modo documentadas
- Estimado de costo: ~$0.80-1.60/mes en uso normal
- Estrategia MVP (solo Haiku 4.5) vs producción (router completo) definida
- Creación de este documento

---

*Documento generado el 13 de mayo de 2026. Actualizar con cada sesión de trabajo.*
