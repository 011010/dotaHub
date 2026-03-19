# DOTA 2 REPLAY HUB — Documentación Técnica Inicial

> **Proyecto:** Plataforma multi-streaming para visualización de clips y jugadas destacadas de Dota 2
> **Inspiración:** pubg.report
> **Versión del documento:** 1.0
> **Fecha:** Marzo 2026
> **Estado:** Fase de investigación y planificación

---

## Tabla de Contenidos

1. [Visión General del Proyecto](#1-visión-general-del-proyecto)
2. [Concepto y Flujo de Funcionamiento](#2-concepto-y-flujo-de-funcionamiento)
3. [APIs de Datos de Dota 2](#3-apis-de-datos-de-dota-2)
   - 3.1 Steam Web API (Valve)
   - 3.2 OpenDota API
   - 3.3 STRATZ GraphQL API
4. [Plataformas de Streaming — Análisis Individual](#4-plataformas-de-streaming--análisis-individual)
   - 4.1 Twitch
   - 4.2 YouTube (Live & VODs)
   - 4.3 Kick
   - 4.4 TikTok Live
   - 4.5 Trovo
   - 4.6 Facebook Live
5. [Matriz Comparativa de Plataformas](#5-matriz-comparativa-de-plataformas)
6. [Arquitectura Técnica Propuesta](#6-arquitectura-técnica-propuesta)
7. [Stack Tecnológico Recomendado](#7-stack-tecnológico-recomendado)
8. [Features Killer y Diferenciación](#8-features-killer-y-diferenciación)
9. [Consideraciones Legales Globales](#9-consideraciones-legales-globales)
10. [Riesgos y Mitigaciones](#10-riesgos-y-mitigaciones)
11. [Plan de Desarrollo por Fases](#11-plan-de-desarrollo-por-fases)
12. [Estimación de Costos](#12-estimación-de-costos)
13. [Métricas de Éxito](#13-métricas-de-éxito)
14. [Apéndices y Enlaces Útiles](#14-apéndices-y-enlaces-útiles)

---

## 1. Visión General del Proyecto

### ¿Qué es?

Una plataforma web que detecta cuándo un jugador de Dota 2 aparece en el stream de un streamer durante una jugada destacada (kill, rampage, teamfight, aegis steal, etc.) y presenta el clip correspondiente desde la perspectiva del streamer, agregando contenido de múltiples plataformas de streaming: Twitch, YouTube, Kick, TikTok, Trovo y Facebook Live.

### ¿Por qué Dota 2?

- Dota 2 tiene una de las APIs de datos de partidas más ricas y abiertas del gaming competitivo.
- Cada partida genera eventos con timestamps precisos (kills, rampages, tower kills, Roshan, etc.).
- Existe un ecosistema robusto de datos (OpenDota, STRATZ) que parsea replays automáticamente.
- La comunidad de Dota 2 es altamente técnica y receptiva a herramientas de datos.
- No existe un equivalente de pubg.report para Dota 2 que sea funcional y multi-plataforma.

### Diferencias clave con pubg.report

| Aspecto | pubg.report | Dota 2 Replay Hub |
|---------|-------------|-------------------|
| Juego | PUBG | Dota 2 |
| Plataformas | Solo Twitch | Twitch, YouTube, Kick, TikTok, Trovo, Facebook |
| Tipo de evento | Kill/Death | Kills, Rampages, Teamwipes, Aegis, Ultra Kills, etc. |
| Contexto | Mínimo | Narrativo (héroe, minuto, contexto de partida) |
| Datos del juego | Limitados | Extremadamente ricos (OpenDota/STRATZ) |

---

## 2. Concepto y Flujo de Funcionamiento

### Flujo principal

```
[1] Partida de Dota 2 finaliza
         │
         ▼
[2] Worker consulta OpenDota/STRATZ por partidas recientes
         │
         ▼
[3] Se extraen eventos destacados con timestamps
    (kills, rampages, teamwipes, aegis steals)
         │
         ▼
[4] Se cruzan los Steam IDs de los jugadores con
    la base de datos de streamers registrados
         │
         ▼
[5] Si hay match: se verifica si el streamer estaba
    en vivo durante la partida en alguna plataforma
         │
         ▼
[6] Se genera/obtiene el clip del momento exacto
    (vía API de la plataforma o deep link al VOD)
         │
         ▼
[7] El clip se asocia al evento y se almacena
    en la base de datos
         │
         ▼
[8] Usuario busca su Steam ID → ve clips donde
    aparece en jugadas con/contra streamers
```

### Tipos de eventos detectables

| Evento | Prioridad | Fuente de datos |
|--------|-----------|-----------------|
| Rampage (5 kills seguidas) | ALTA | OpenDota/STRATZ parsed data |
| Ultra Kill (4 kills seguidas) | ALTA | OpenDota/STRATZ parsed data |
| Triple Kill | MEDIA | OpenDota/STRATZ parsed data |
| First Blood | MEDIA | Steam Web API / OpenDota |
| Aegis Steal | ALTA | OpenDota parsed replay |
| Teamwipe (5-0 en teamfight) | ALTA | OpenDota parsed replay |
| Comeback (gold swing >10k) | MEDIA | STRATZ analytics |
| Courier Snipe | BAJA | OpenDota parsed replay |
| Mega Creeps + Win | ALTA | Steam Web API |
| Base Race | ALTA | Calculable vía timestamps de buildings |

---

## 3. APIs de Datos de Dota 2

### 3.1 Steam Web API (Valve — Oficial)

**URL Base:** `https://api.steampowered.com/`

**Documentación:** https://wiki.teamfortress.com/wiki/WebAPI

**Obtener API Key:** https://steamcommunity.com/dev/

**Endpoints relevantes para Dota 2:**

| Endpoint | Descripción | Uso en el proyecto |
|----------|-------------|-------------------|
| `IDOTA2Match_570/GetMatchDetails/v1` | Detalles completos de una partida | Datos base de cada partida |
| `IDOTA2Match_570/GetMatchHistory/v1` | Historial de partidas filtrable | Buscar partidas de jugadores específicos |
| `IDOTA2Match_570/GetMatchHistoryBySequenceNum/v1` | Partidas por número de secuencia | Polling continuo de partidas nuevas |
| `IDOTA2Match_570/GetTopLiveGame/v1` | Partidas en vivo más vistas | Monitoreo en tiempo real |
| `IEconDOTA2_570/GetHeroes/v1` | Lista de héroes | Mapeo de hero_id a nombres |
| `IDOTA2StreamSystem_570/GetBroadcasterInfo/v1` | Info de broadcasters | Relación con streamers |

**Datos obtenibles por partida:**

- Match ID, duración, modo de juego, tipo de lobby
- Lista de jugadores con: account_id, hero_id, kills, deaths, assists, items, gold_per_min, xp_per_min
- Resultado (Radiant/Dire win)
- Timestamps: first_blood_time, duración
- Tower status, barracks status
- Picks y bans (Captain's Mode)
- Cluster (servidor, útil para descargar replays)
- Replay salt (para construir URL de descarga del replay)

**Rate Limits:**

- Se requiere API key (gratuita)
- 100,000 llamadas por día (límite general de Steam Web API)
- No hay límite oficial por minuto documentado, pero se recomienda no exceder ~1 request/segundo
- Las llamadas sin key reciben 403 Forbidden

**Términos de servicio relevantes:**

- Steam Web API Terms of Use: https://steamcommunity.com/dev/apiterms
- Los datos son propiedad de Valve; se pueden usar para aplicaciones no comerciales y comerciales siempre que no se violen los ToS de Steam
- No se permite usar la API para crear servicios que compitan directamente con los servicios de Valve
- Se debe mostrar atribución a Steam/Valve cuando se muestren datos de la API
- No se permite almacenar datos de usuarios más allá de lo necesario para el funcionamiento de la aplicación

**Limitantes:**

- No proporciona datos parseados de replays (solo datos post-match básicos)
- No incluye timestamps de kills individuales (solo first_blood_time)
- Para eventos detallados dentro de la partida, necesitas OpenDota o STRATZ que parsean los replays
- Los account_id de perfiles privados no son visibles

---

### 3.2 OpenDota API

**URL Base:** `https://api.opendota.com/api`

**Documentación:** https://docs.opendota.com/

**API Keys:** https://www.opendota.com/api-keys

**Tipo:** REST API, open source

**Endpoints críticos para el proyecto:**

| Endpoint | Descripción | Datos clave |
|----------|-------------|-------------|
| `GET /matches/{match_id}` | Detalles extendidos del match | Incluye datos parseados del replay |
| `GET /players/{account_id}/matches` | Historial de un jugador | Filtrable por héroe, lobby type, fecha |
| `GET /players/{account_id}/recentMatches` | Últimas 20 partidas | Datos rápidos sin parseo |
| `GET /publicMatches` | Partidas públicas recientes | Polling para detección de partidas nuevas |
| `GET /proPlayers` | Lista de jugadores pro | Pre-poblar base de streamers pro |
| `GET /parsedMatches` | Cola de partidas parseadas | Verificar si hay replay disponible |
| `POST /request/{match_id}` | Solicitar parseo de un match | Obtener datos detallados del replay |

**Datos exclusivos de OpenDota (post-parseo de replay):**

- `objectives`: Lista de eventos con timestamps (tower kills, Roshan, barracks, etc.)
- `teamfights`: Array de teamfights con timestamps, jugadores involucrados, y daño/heal
- `players[].kills_log`: Log detallado de cada kill con timestamp y víctima
- `players[].buyback_log`: Buybacks con timestamps
- `players[].runes_log`: Runas recogidas con timestamps
- `players[].purchase_log`: Compras de items con timestamps
- `chat`: Mensajes del chat de partida con timestamps
- `draft_timings`: Tiempos exactos de picks/bans
- `radiant_gold_adv[]`: Ventaja de oro por minuto (para detectar comebacks)
- `radiant_xp_adv[]`: Ventaja de XP por minuto

**Rate Limits:**

| Tier | Llamadas/mes | Llamadas/minuto | Costo |
|------|-------------|-----------------|-------|
| Free (sin key) | 50,000 | 60 | $0 |
| Free (con key) | 50,000 | 60 | $0 |
| Premium | Ilimitadas | Mayor | Varía (contactar) |

**Términos de servicio:**

- OpenDota es open source (licencia MIT para el código)
- Los datos provienen de la Steam Web API y de replays parseados
- Se permite uso comercial y no comercial
- Se solicita atribución a OpenDota cuando se usen sus datos
- Se prohíbe el abuso del API (exceder rate limits, scraping agresivo)
- No se garantiza disponibilidad o exactitud de los datos
- Los datos de replays parseados están sujetos a la disponibilidad del replay en los servidores de Valve (los replays expiran después de ~14 días)
- URL del proyecto open source: https://github.com/odota/core

**Limitantes:**

- 50,000 llamadas/mes puede ser restrictivo para monitoreo continuo
- No todas las partidas están parseadas; se debe solicitar el parseo explícitamente via `POST /request/{match_id}` (consume una llamada adicional)
- El parseo puede tardar minutos u horas dependiendo de la cola
- Los replays de partidas viejas pueden no estar disponibles (Valve los elimina después de ~2 semanas)
- Perfiles privados no retornan datos de jugador

---

### 3.3 STRATZ GraphQL API

**URL Base:** `https://api.stratz.com/graphql`

**Documentación:** https://docs.stratz.com/

**Portal:** https://stratz.com/api

**Tipo:** GraphQL API

**Características únicas de STRATZ:**

- GraphQL permite solicitar exactamente los campos necesarios, reduciendo overhead
- Datos de performance individual (IMP score: -100 a +100)
- Detección de smurfs y toxicidad
- Datos de héroes con builds óptimas
- Métricas avanzadas de teamfights
- Parseo automático de replays (no requiere solicitud manual como OpenDota)

**Queries relevantes:**

```graphql
# Ejemplo: Obtener kills de un match con timestamps
query {
  match(id: 7123456789) {
    id
    durationSeconds
    startDateTime
    didRadiantWin
    players {
      steamAccountId
      heroId
      kills
      deaths
      assists
      stats {
        killEvents {
          time
          target
          assist
        }
      }
    }
  }
}
```

**Rate Limits (Sistema de Tokens):**

| Tier | Llamadas/hora | Llamadas/día | Notas |
|------|--------------|-------------|-------|
| Default (registrado) | 2,000 | 10,000 | Tras login en stratz.com |
| Referral | Mayor | Mayor | Por generar tráfico a STRATZ |
| Multi-Token | Ilimitadas por usuario | 100/usuario/día | Para apps multi-usuario |

**Términos de servicio:**

- API gratuita para uso personal y comercial
- Se requiere registro (login con Steam en stratz.com) para obtener token
- Se solicita atribución a STRATZ (links a perfiles/partidas de STRATZ)
- Se prohíbe uso para herramientas que violen el Steam Subscriber Agreement (cheats, boosting, etc.)
- Se prohíbe el uso de bots para evadir rate limits
- Se puede solicitar acceso a tiers superiores contactando por Discord
- STRATZ se reserva el derecho de revocar acceso por abuso
- Los datos son propiedad de Valve; STRATZ los procesa y sirve bajo licencia

**Limitantes:**

- GraphQL requiere conocimiento específico para construir queries eficientes
- El tier gratuito puede no ser suficiente para polling agresivo
- No todos los campos están documentados en el schema público
- Cambios en el schema pueden romper queries existentes

**Recomendación para el proyecto:** Usar STRATZ como fuente primaria de datos parseados (por la riqueza de killEvents con timestamps) y OpenDota como fallback. Usar Steam Web API para datos que no requieran parseo.

---

## 4. Plataformas de Streaming — Análisis Individual

### 4.1 Twitch

**Estado de integración: ✅ VIABLE — Prioridad ALTA**

**API:** Twitch Helix API
**Documentación:** https://dev.twitch.tv/docs/api/
**Developer Console:** https://dev.twitch.tv/console

#### Endpoints clave

| Endpoint | Uso | Auth requerida |
|----------|-----|---------------|
| `GET /helix/streams` | Detectar streams en vivo por juego (Dota 2 game_id: 29595) | App Access Token |
| `GET /helix/clips` | Obtener clips existentes de un broadcaster | App Access Token |
| `POST /helix/clips` | Crear clip programáticamente | User Access Token (clips:edit) |
| `POST /helix/videos/clips` | Crear clip desde VOD | User Access Token (editor:manage:clips) |
| `GET /helix/videos` | Obtener VODs de un canal | App Access Token |
| `GET /helix/users` | Info de usuario/canal | App Access Token |
| `GET /helix/search/channels` | Buscar canales | App Access Token |

#### Capacidades de clips

- **Creación programática:** SÍ. La API crea clips de hasta 90 segundos (85s antes + 5s después del momento de la llamada).
- **Clips desde VOD:** SÍ (endpoint nuevo). Se puede especificar `vod_offset` y `duration` (5-60 segundos).
- **Embed de clips:** SÍ. Twitch proporciona `embed_url` para embeber clips con su player oficial.
- **Requisitos para crear clips:** El broadcaster debe tener clips habilitados; el stream debe estar activo (para clips en vivo).

#### Rate Limits

- **App Access Tokens:** 800 puntos por minuto (la mayoría de endpoints cuestan 1 punto)
- **User Access Tokens:** 800 puntos por minuto
- Los clips se limitan adicionalmente a evitar spam

#### Embedding

- Los embeds requieren SSL y un parámetro `parent` que especifique el dominio
- El embed es gratuito y oficial
- Se usa el player de Twitch (no se descarga video)

#### Términos de servicio (Developer Services Agreement)

**URL:** https://legal.twitch.com/legal/developer-agreement/

**Puntos críticos:**

- ✅ Se permite crear aplicaciones que usen la Twitch API para clips y datos de streams
- ✅ Se permite embeber clips usando el player oficial de Twitch
- ⚠️ NO se permite cachear contenido de Twitch por más de 24 horas sin autorización escrita
- ⚠️ NO se permite re-sindicar o redistribuir datos o contenido de la API de Twitch
- ⚠️ Se debe borrar datos de usuario si se revoca autorización o lo solicita Twitch/usuario
- ⚠️ No se permite acceder a endpoints no documentados o hacer reverse engineering
- ❌ No se puede exceder rate limits ni intentar eludirlos
- ❌ Se debe cumplir con Community Guidelines de Twitch
- Los embeds deben respetar las restricciones del broadcaster (clips deshabilitados, subscriber-only, etc.)
- Se requiere app review para aplicaciones que soliciten scopes sensibles

**Limitantes para el proyecto:**

- Para crear clips programáticamente se necesita un User Access Token con scope `clips:edit`, lo cual requiere que un usuario autorice la app vía OAuth
- La creación de clips requiere que el stream esté activo en el momento de la llamada (para clips en vivo)
- La paginación de clips está limitada a ~1,000 resultados
- Los clips creados por la API aparecen en la página del broadcaster (puede generar spam si no se controla)

---

### 4.2 YouTube (Live & VODs)

**Estado de integración: ⚠️ VIABLE CON LIMITACIONES — Prioridad MEDIA-ALTA**

**API:** YouTube Data API v3
**Documentación:** https://developers.google.com/youtube/v3/
**Console:** https://console.cloud.google.com/

#### Endpoints clave

| Endpoint | Uso | Costo en cuota |
|----------|-----|---------------|
| `search.list` (eventType=live, videoCategoryId=gaming) | Encontrar streams en vivo de Dota 2 | 100 unidades |
| `videos.list` | Detalles de un video/VOD/live | 1 unidad |
| `liveBroadcasts.list` | Listar broadcasts del usuario autenticado | 50 unidades |
| `channels.list` | Info de canal | 1 unidad |

#### Sistema de cuota

| Recurso | Cuota diaria gratuita | Costo de búsqueda | Costo de lectura |
|---------|----------------------|-------------------|-----------------|
| YouTube Data API v3 | 10,000 unidades/día | 100 unidades/búsqueda | 1 unidad/video.list |
| Quota adicional | Requiere solicitud + auditoría | — | — |

**Impacto:** Con 10,000 unidades/día, solo se pueden hacer ~100 búsquedas de streams en vivo. Esto es extremadamente limitante para monitoreo continuo.

#### Capacidad de clips

- **YouTube NO tiene una API de clips como Twitch.** No existe un endpoint `create_clip`.
- **Alternativa 1 — Deep links con timestamp:** Se puede generar un enlace al VOD con parámetro `?t=XXs` que salte al momento exacto. Ejemplo: `https://youtube.com/watch?v=VIDEO_ID&t=2450s`
- **Alternativa 2 — Recorte server-side:** Descargar el VOD con herramientas como `yt-dlp` y recortar con `ffmpeg`. Esto tiene implicaciones legales significativas (ver ToS abajo).
- **Alternativa 3 — YouTube oEmbed/iFrame embed:** Embeber el video desde un timestamp específico usando el player oficial.

#### Embedding

```html
<!-- Embed con timestamp específico (startSeconds) -->
<iframe width="560" height="315"
  src="https://www.youtube.com/embed/VIDEO_ID?start=2450&autoplay=0"
  frameborder="0" allowfullscreen>
</iframe>
```

- Los embeds son gratuitos y oficiales
- Se puede especificar `start` y `end` para mostrar solo un segmento
- Requiere que el video sea público o no listado

#### Términos de servicio

**URL:** https://developers.google.com/youtube/terms/api-services-terms-of-service

**Puntos críticos:**

- ✅ Se permite embeber videos usando el player oficial de YouTube
- ✅ Se permite usar la API para buscar y mostrar metadatos de videos
- ⚠️ Se requiere auditoría de cumplimiento para solicitar cuota adicional
- ⚠️ YouTube puede cambiar la cuota o los ToS en cualquier momento
- ❌ NO se permite descargar, almacenar, o redistribuir contenido de video de YouTube
- ❌ NO se permite usar la API para crear un servicio que reemplace la experiencia de YouTube
- ❌ NO se permite modificar, reformatear, o re-displayar el player de YouTube
- ❌ NO se permite usar `yt-dlp` o herramientas similares (violan los ToS)
- Se debe mostrar el branding de YouTube cuando se muestren datos de la API
- Se debe cumplir con YouTube Community Guidelines

**Limitantes para el proyecto:**

- La cuota diaria de 10,000 unidades es el cuello de botella más severo del proyecto
- No se puede crear clips automáticamente como en Twitch
- `search.list` es el endpoint más costoso (100 unidades) y es necesario para detectar streams
- Para monitoreo continuo, se necesita solicitar incremento de cuota (proceso lento, requiere auditoría)
- La descarga de VODs para recorte viola los ToS; la única ruta legal es embeber con timestamp
- Los streams que se borran o se hacen privados dejan clips rotos

**Estrategia recomendada:**

1. Usar `search.list` esporádicamente (cada 5-10 min) para mapear streamers activos
2. Cachear agresivamente los resultados (channel IDs ↔ video IDs)
3. Generar deep links al VOD con timestamp en lugar de crear clips
4. Embeber usando el iFrame player oficial con parámetro `start`

---

### 4.3 Kick

**Estado de integración: ⚠️ VIABLE PERO INMADURA — Prioridad MEDIA**

**API:** Kick Public API (lanzada recientemente)
**Documentación:** https://docs.kick.com y https://github.com/KickEngineering/KickDevDocs
**Developer Portal:** https://dev.kick.com

#### Estado actual de la API

Kick lanzó su API pública oficial tras años de solo contar con endpoints no documentados. La situación ha mejorado significativamente:

- Se puede registrar una app en dev.kick.com y obtener Client ID / Client Secret
- La API usa OAuth 2.0 estándar
- Hay documentación en GitHub abierta a contribuciones de la comunidad

#### Capacidades conocidas

| Funcionalidad | Estado | Notas |
|--------------|--------|-------|
| Obtener info de canales | ✅ Disponible | Endpoint público |
| Detectar streams en vivo | ✅ Disponible | Filtrable por categoría |
| Obtener clips | ⚠️ Parcial | Endpoints en desarrollo |
| Crear clips | ❌ No disponible | No hay endpoint público |
| Obtener VODs | ⚠️ Parcial | Disponibilidad limitada |
| Embeds | ⚠️ Limitado | No hay embed player oficial documentado |
| Chat/WebSocket | ✅ Disponible | Para bots y lectura de chat |

#### Términos de servicio

**URL:** https://kick.com/terms-of-service y documentación del developer portal

**Puntos críticos:**

- ✅ Se permite crear aplicaciones usando la API pública
- ✅ Se permite acceder a datos públicos de canales y streams
- ⚠️ La API está en desarrollo activo; pueden haber cambios breaking
- ⚠️ No hay garantía de estabilidad o disponibilidad
- ❌ No se permite scraping de la web de Kick fuera de la API oficial
- ❌ Los ToS generales de Kick prohíben automatización no autorizada
- Se debe cumplir con las community guidelines de Kick

**Limitantes para el proyecto:**

- No existe API de creación de clips (la funcionalidad más importante)
- El ecosistema de desarrolladores es nuevo y la documentación puede tener gaps
- No hay embed player oficial para clips/VODs (se necesitaría enlace directo)
- La comunidad de devs es pequeña; menos recursos y ejemplos
- Rate limits no están claramente documentados

**Estrategia recomendada:**

1. Usar la API oficial para detectar streamers de Dota 2 en vivo
2. Generar enlaces directos a los VODs en kick.com con timestamp si es posible
3. Monitorear los releases de la API para nuevos endpoints de clips
4. Participar en el programa de bounties de Kick para posible colaboración
5. Considerar esta plataforma como Fase 2-3 del proyecto

---

### 4.4 TikTok Live

**Estado de integración: ❌ MUY LIMITADO — Prioridad BAJA**

**API:** TikTok for Developers
**Documentación:** https://developers.tiktok.com/
**Tipo:** Proceso de aprobación estricto

#### Realidad de TikTok Live para este proyecto

TikTok Live es fundamentalmente diferente de las otras plataformas:

- **No es una plataforma de streaming gaming tradicional.** El gaming en TikTok Live existe pero es secundario.
- **No hay API pública de Live Streams para detectar streams por juego.** La API oficial de TikTok está enfocada en: Login Kit, Share Kit, Video Kit (para subir/embeber videos), y Content Posting API.
- **No hay acceso programático a TikTok Live streams** para detectar quién está streameando qué juego.
- **El proceso de aprobación es estricto:** TikTok revisa cada aplicación individualmente y el proceso puede tardar semanas o meses.

#### APIs oficiales disponibles

| API | Utilidad para el proyecto | Accesibilidad |
|-----|--------------------------|---------------|
| Login Kit | Autenticar usuarios con TikTok | Requiere aprobación |
| Video Kit | Embeber videos de TikTok | Requiere aprobación |
| Content Posting API | Publicar contenido | No relevante |
| Research API | Acceso a datos para investigación académica | Solo universidades |

#### APIs no oficiales (terceros)

Existen servicios como TikAPI, Euler Stream, y SociaVault que ofrecen acceso a datos de TikTok Live, pero:

- Son servicios pagos ($29-200+/mes)
- Pueden violar los ToS de TikTok
- No tienen garantía de estabilidad
- TikTok cambia sus estructuras frecuentemente, rompiendo scrapers

#### Términos de servicio

**URL:** https://developers.tiktok.com/doc/tiktok-api-scopes

**Puntos críticos:**

- ❌ TikTok prohíbe explícitamente el scraping y acceso no autorizado
- ❌ No hay API de Live Streams pública para detección de juegos
- ⚠️ El proceso de aprobación es el más restrictivo de todas las plataformas
- ⚠️ TikTok puede revocar acceso en cualquier momento
- Se debe cumplir con las leyes de privacidad de datos de cada jurisdicción

**Estrategia recomendada:**

1. **No incluir TikTok en el MVP ni en Fase 2**
2. Considerar un enfoque alternativo: en lugar de detectar clips en vivo, buscar videos de Dota 2 subidos a TikTok con tags relevantes (post-hoc, no en tiempo real)
3. Re-evaluar cuando TikTok abra más su API de Live Streams
4. Si se decide implementar, usar Video Kit para embeber contenido (no scraping)

---

### 4.5 Trovo

**Estado de integración: ✅ VIABLE — Prioridad BAJA (por tamaño de comunidad)**

**API:** Trovo Open API (REST)
**Documentación:** https://developer.trovo.live/docs/APIs.html
**Developer Portal:** https://developer.trovo.live/

#### Capacidades

| Funcionalidad | Estado | Endpoint |
|--------------|--------|----------|
| Obtener canales en vivo por categoría | ✅ | `POST /gettopchannels` con `category_id` |
| Info de canal específico | ✅ | `POST /getusers` |
| Chat WebSocket | ✅ | `wss://open-chat.trovo.live/chat` |
| Embed player | ✅ (con whitelist) | iFrame embed |
| Embed chat | ✅ | iFrame embed |
| Clips/VODs | ⚠️ No documentado | No hay endpoints específicos para clips |

#### Proceso de registro

1. Registrar app en https://developer.trovo.live/
2. Proporcionar: nombre de app, empresa, email, logo, redirect URL, ToS/Privacy links
3. Proceso de revisión: hasta 1 semana
4. Se recibe Client ID para llamadas API

#### Embedding

- Desde marzo 2022, solo dominios whitelisted pueden usar embeds de Trovo
- Se debe enviar solicitud a `developer@trovo.live` con dominio, descripción de uso
- Embed player: `https://player.trovo.live/embed/player?streamername=USERNAME`
- Embed chat: `https://player.trovo.live/chat/USERNAME`

#### Términos de servicio

- ✅ API gratuita y abierta para desarrolladores
- ✅ OAuth 2.0 estándar
- ⚠️ Requiere aprobación de la app (hasta 1 semana)
- ⚠️ Embeds requieren whitelist de dominio
- ⚠️ Comunidad de desarrolladores muy pequeña; poco soporte

**Limitantes para el proyecto:**

- Trovo tiene una base de usuarios de Dota 2 muy pequeña
- No hay API de clips (la funcionalidad central del proyecto)
- La API está poco mantenida (últimas actualizaciones de repos de la comunidad son de 2023-2024)
- El ROI de implementar esta integración es bajo comparado con el esfuerzo
- Riesgo de que la plataforma cierre o cambie significativamente

**Estrategia recomendada:**

1. Implementar como Fase 3+ si hay demanda
2. Usar el endpoint de canales en vivo para detectar streamers de Dota 2
3. Generar enlaces directos a Trovo (no embeds, a menos que se obtenga whitelist)
4. Monitorear la salud de la plataforma antes de invertir tiempo

---

### 4.6 Facebook Live (Meta)

**Estado de integración: ⚠️ VIABLE PERO BUROCRÁTICO — Prioridad BAJA**

**API:** Meta Graph API — Live Video API
**Documentación:** https://developers.facebook.com/docs/live-video-api/
**Developer Portal:** https://developers.facebook.com/

#### Contexto actual

Facebook Gaming como programa dedicado fue cerrado en 2022-2023, pero la gente sigue streameando juegos por Facebook Live. La infraestructura API existe pero está orientada a broadcasters, no a consumidores de clips.

#### Capacidades vía Graph API

| Funcionalidad | Estado | Notas |
|--------------|--------|-------|
| Detectar Live Videos de una página | ✅ | Requiere page access token |
| Obtener detalles de un live video | ✅ | `GET /{live-video-id}` |
| Listar VODs de una página | ✅ | `GET /{page-id}/videos` |
| Crear clips | ❌ | No existe funcionalidad de clips |
| Embed de videos | ✅ | oEmbed o iFrame (videos públicos) |
| Búsqueda por juego/categoría | ⚠️ Limitada | No hay equivalente directo a "browse by game" |

#### Proceso de aprobación

1. Crear cuenta de desarrollador en Facebook
2. Crear una app en el Developer Portal
3. Solicitar permisos específicos (Live Video API requiere app review)
4. Pasar la revisión de Meta (puede tardar semanas a meses)
5. Cumplir con las Platform Policies de Meta

#### Embedding

```html
<!-- Facebook Video Embed -->
<iframe src="https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2FPAGE%2Fvideos%2FVIDEO_ID&width=500"
  width="500" height="281" style="border:none;overflow:hidden"
  scrolling="no" frameborder="0" allowfullscreen="true">
</iframe>
```

#### Términos de servicio (Meta Platform Terms)

**URL:** https://developers.facebook.com/terms/

**Puntos críticos:**

- ✅ Se permite embeber videos públicos de Facebook
- ✅ Se permite usar la Graph API para obtener datos públicos
- ⚠️ App Review es obligatorio para endpoints de Live Video
- ⚠️ Meta puede cambiar la API con 90 días de aviso (pero históricamente ha roto cosas sin aviso)
- ❌ NO se permite almacenar datos de Facebook por más de 24 horas sin actualización
- ❌ NO se permite usar datos para surveillance o tracking de usuarios
- ❌ Se prohíbe scraping de Facebook
- Se debe cumplir con GDPR si se manejan datos de usuarios europeos
- Se requiere Privacy Policy y Terms of Service propios para pasar app review

**Limitantes para el proyecto:**

- El proceso de app review es el más burocrático después de TikTok
- No hay forma eficiente de descubrir streams de Dota 2 en Facebook (no hay "browse by game" en la API)
- La comunidad de Dota 2 en Facebook Live es significativamente menor que en Twitch/YouTube
- No hay API de clips; solo se pueden embeber videos completos con timestamp
- Los permisos de Live Video API son restrictivos y requieren justificación detallada
- La inestabilidad de la API de Meta es legendaria (deprecaciones frecuentes)

**Estrategia recomendada:**

1. Implementar como Fase 3+ solo si hay demanda demostrada
2. Si se implementa, enfocarse solo en embed de VODs con timestamp
3. Requerir que streamers de Facebook se registren manualmente (no discovery automático)
4. No invertir en la app review hasta que se valide demanda

---

## 5. Matriz Comparativa de Plataformas

| Criterio | Twitch | YouTube | Kick | TikTok | Trovo | Facebook |
|----------|--------|---------|------|--------|-------|----------|
| API de clips | ✅ Excelente | ❌ No existe | ❌ No existe | ❌ No existe | ❌ No existe | ❌ No existe |
| Detección de streams por juego | ✅ Fácil | ⚠️ Costoso (cuota) | ✅ Disponible | ❌ No disponible | ✅ Disponible | ⚠️ Muy limitado |
| Embed de video | ✅ Oficial | ✅ Oficial | ⚠️ Limitado | ⚠️ Requiere aprobación | ⚠️ Requiere whitelist | ✅ Oficial |
| Rate limits | Generosos (800/min) | Restrictivos (10k/día) | No documentados | N/A | No documentados | Moderados |
| Estabilidad de la API | ✅ Alta | ✅ Alta | ⚠️ Nueva/cambiante | ⚠️ Cambiante | ⚠️ Poco mantenida | ⚠️ Deprecaciones frecuentes |
| Comunidad Dota 2 | ✅ Muy grande | ✅ Grande | ⚠️ Pequeña | ⚠️ Mínima (gaming) | ❌ Muy pequeña | ⚠️ Pequeña |
| Complejidad de integración | Baja | Media | Media | Alta | Media | Alta |
| Proceso de aprobación | Rápido | Medio | Rápido | Lento | Medio | Lento |
| Prioridad recomendada | 🥇 Fase 1 | 🥈 Fase 1-2 | 🥉 Fase 2-3 | ⏸️ Fase 4+ | ⏸️ Fase 3+ | ⏸️ Fase 3+ |

---

## 6. Arquitectura Técnica Propuesta

### Diagrama de módulos

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js)                      │
│   Búsqueda por Steam ID → Feed de clips → Perfil de jugador │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API / WebSocket
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API (Node.js / Python)            │
│         Autenticación · Búsqueda · Feed · Notificaciones     │
└──────────┬──────────┬──────────┬──────────┬─────────────────┘
           │          │          │          │
           ▼          ▼          ▼          ▼
┌──────────────┐ ┌─────────┐ ┌──────────┐ ┌──────────────────┐
│ Match Ingesta│ │ Streamer│ │  Clip    │ │  Notificaciones  │
│   Worker     │ │ Mapper  │ │ Capture  │ │     Worker       │
│              │ │         │ │  Worker  │ │                  │
│ OpenDota     │ │ DB de   │ │ Twitch   │ │ WebSocket/Push   │
│ STRATZ       │ │ mapeos  │ │ YouTube  │ │                  │
│ Steam API    │ │ Steam↔  │ │ Kick     │ │                  │
│              │ │ Platform│ │ etc.     │ │                  │
└──────┬───────┘ └────┬────┘ └────┬─────┘ └────────┬─────────┘
       │              │           │                 │
       └──────────────┴───────────┴─────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │    PostgreSQL (Supabase)│
              │                        │
              │ · matches              │
              │ · events               │
              │ · streamers            │
              │ · clips                │
              │ · users                │
              └────────────────────────┘
```

### Modelo de datos (simplificado)

```sql
-- Streamers registrados con sus cuentas en plataformas
CREATE TABLE streamers (
    id              SERIAL PRIMARY KEY,
    steam_account_id BIGINT UNIQUE NOT NULL,
    display_name    VARCHAR(255),
    twitch_id       VARCHAR(100),
    youtube_channel_id VARCHAR(100),
    kick_username   VARCHAR(100),
    trovo_username  VARCHAR(100),
    facebook_page_id VARCHAR(100),
    tiktok_username VARCHAR(100),
    verified        BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Partidas procesadas
CREATE TABLE matches (
    id              SERIAL PRIMARY KEY,
    match_id        BIGINT UNIQUE NOT NULL,
    start_time      TIMESTAMPTZ NOT NULL,
    duration_seconds INTEGER,
    game_mode       INTEGER,
    radiant_win     BOOLEAN,
    avg_rank        INTEGER,
    processed       BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Eventos destacados dentro de partidas
CREATE TABLE events (
    id              SERIAL PRIMARY KEY,
    match_id        BIGINT REFERENCES matches(match_id),
    event_type      VARCHAR(50) NOT NULL, -- 'rampage', 'ultra_kill', 'aegis_steal', etc.
    game_time_sec   INTEGER NOT NULL,     -- segundo dentro de la partida
    player_steam_id BIGINT NOT NULL,      -- quien realizó la jugada
    victim_steam_id BIGINT,               -- víctima (si aplica)
    hero_id         INTEGER,
    context_json    JSONB,                -- datos extra del evento
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Clips asociados a eventos
CREATE TABLE clips (
    id              SERIAL PRIMARY KEY,
    event_id        INTEGER REFERENCES events(id),
    streamer_id     INTEGER REFERENCES streamers(id),
    platform        VARCHAR(20) NOT NULL, -- 'twitch', 'youtube', 'kick', etc.
    clip_url        TEXT NOT NULL,         -- URL del clip o deep link
    embed_url       TEXT,                  -- URL de embed (si disponible)
    thumbnail_url   TEXT,
    duration_sec    INTEGER,
    clip_title      VARCHAR(500),
    platform_clip_id VARCHAR(200),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Usuarios que buscan sus jugadas
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    steam_account_id BIGINT UNIQUE NOT NULL,
    display_name    VARCHAR(255),
    notification_prefs JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_events_match_id ON events(match_id);
CREATE INDEX idx_events_player ON events(player_steam_id);
CREATE INDEX idx_clips_event ON clips(event_id);
CREATE INDEX idx_clips_streamer ON clips(streamer_id);
CREATE INDEX idx_streamers_steam ON streamers(steam_account_id);
```

---

## 7. Stack Tecnológico Recomendado

### Optimizado para costo mínimo

| Componente | Tecnología | Tier gratuito | Costo escalado |
|-----------|------------|---------------|----------------|
| **Frontend** | Next.js + React | Vercel (Hobby) | $20/mes (Pro) |
| **Backend API** | Node.js + TypeScript (Fastify) ó Python (FastAPI) | Railway / Render | $5-20/mes |
| **Base de datos** | PostgreSQL | Supabase Free (500MB, 50k rows) | $25/mes (Pro) |
| **Cache** | Redis | Upstash Free (10k cmds/día) | $10/mes |
| **Queue/Workers** | BullMQ (Node) ó Celery (Python) | Mismo server que backend | Incluido |
| **CDN** | Cloudflare | Free (ilimitado) | $0 |
| **Dominio** | Cualquier registrar | — | $10-15/año |
| **Monitoreo** | Sentry + Grafana Cloud | Free tiers | $0-30/mes |
| **CI/CD** | GitHub Actions | Free (2,000 min/mes) | $0 |

### Librerías y herramientas clave

**Para Node.js/TypeScript:**
- `axios` / `node-fetch` — HTTP client para APIs
- `bullmq` — Cola de trabajos con Redis
- `prisma` / `drizzle-orm` — ORM para PostgreSQL
- `fastify` — Framework HTTP (más rápido que Express)
- `ws` — WebSocket client/server
- `graphql-request` — Cliente GraphQL ligero (para STRATZ)
- `twurple` — SDK no-oficial de Twitch (TypeScript)

**Para Python:**
- `httpx` / `aiohttp` — HTTP client async
- `celery` — Cola de trabajos
- `sqlalchemy` / `tortoise-orm` — ORM
- `fastapi` — Framework HTTP async
- `gql` — Cliente GraphQL (para STRATZ)
- `twitchAPI` — SDK de Twitch para Python

---

## 8. Features Killer y Diferenciación

### 8.1 Contexto narrativo de jugadas

No solo mostrar "X mató a Y", sino construir la narrativa completa:

```
🎮 RAMPAGE por Miracle- (Invoker) — Minuto 38:22
📊 Partida ranked Immortal (#7,245,891)
⚔️ Teamfight 5v5 frente al Roshan pit
💰 Radiant tenía 12k gold de desventaja → Comeback
👀 Visto desde el stream de gorgc (Twitch) — 14,500 viewers
```

Los datos para esto ya existen en OpenDota/STRATZ.

### 8.2 Multi-perspectiva

Si dos streamers estaban en la misma partida, mostrar la misma jugada desde ambas perspectivas. Esto es técnicamente simple (misma partida, diferentes streams) pero visualmente impactante.

### 8.3 Rankings y estadísticas

- "Streamer con más rampages esta semana"
- "Héroe con más clips generados"
- "Jugada del día" (votada por la comunidad)
- Rankings de jugadores que más aparecen en clips de streamers

### 8.4 Feed comunitario curado

Las mejores jugadas del día/semana/mes, auto-generadas por el sistema y votadas por la comunidad. Un "Reddit de clips de Dota" pero completamente automatizado.

### 8.5 Notificaciones en tiempo real

"Tu héroe favorito acaba de hacer un rampage en el stream de X"

Implementable con WebSockets o push notifications (web push API, gratuita).

### 8.6 Integración con el cliente de Dota 2

Dota 2 permite ver replays desde el cliente. Se puede generar un link `steam://rungame/570/...` que abra el replay en el minuto exacto.

### 8.7 API pública

Ofrecer una API para que otros desarrolladores construyan sobre los datos de clips. Esto genera ecosistema y diferenciación a largo plazo.

---

## 9. Consideraciones Legales Globales

### Propiedad del contenido

- **Los clips son contenido del streamer.** El streamer retiene los derechos sobre su stream.
- **Embeber ≠ Hostear.** Embeber usando el player oficial de cada plataforma es generalmente aceptado y está contemplado en los ToS. Descargar y re-hostear video es riesgoso legalmente.
- **Los datos de partidas son de Valve.** Valve permite el uso de datos de la Steam Web API para aplicaciones, con atribución.

### Privacidad

- Los Steam IDs de jugadores con perfiles públicos son datos públicos
- Los perfiles privados no deben ser expuestos ni rastreados
- Si se implementa en Europa, se debe cumplir con GDPR:
  - Política de privacidad obligatoria
  - Derecho al olvido (usuarios pueden pedir borrado de sus datos)
  - Consentimiento para notificaciones
- En México, aplica la Ley Federal de Protección de Datos Personales

### Copyright

- No descargar ni re-hostear videos de ninguna plataforma
- Siempre usar embeds oficiales
- Dar crédito al streamer y la plataforma
- Responder a solicitudes de takedown (DMCA) inmediatamente

### Recomendación legal

Antes de lanzar, es recomendable:
1. Escribir Terms of Service propios
2. Escribir Privacy Policy completa
3. Implementar un sistema de reportes/takedown
4. Implementar opt-out para streamers que no quieran aparecer

---

## 10. Riesgos y Mitigaciones

| Riesgo | Severidad | Probabilidad | Mitigación |
|--------|-----------|-------------|------------|
| Rate limits de OpenDota insuficientes | Alta | Media | Usar STRATZ como fallback; cacheo agresivo; considerar Premium |
| Cuota de YouTube Data API agotada | Alta | Alta | Minimizar búsquedas; cachear channel IDs; solicitar incremento |
| Kick cambia/rompe su API | Media | Alta | Abstracción de la capa de integración; desactivar plataforma temporalmente |
| Cold start (no hay clips al lanzar) | Alta | Alta | Pre-poblar con top 500 streamers; generar clips retroactivamente de VODs |
| Streamer solicita takedown | Media | Media | Sistema de opt-out; eliminación rápida; respetar DMCA |
| Replays de Valve expiran (>14 días) | Media | Alta | Procesar partidas dentro de las primeras horas; no depender de replays viejos |
| Abuso/spam de la plataforma | Media | Baja | Rate limiting propio; autenticación Steam para usuarios |
| Costos escalan con tráfico | Alta | Media (si hay éxito) | Usar embeds (no hosting de video); CDN gratuito; optimizar queries |
| Cambios en la API de Twitch | Media | Baja | Monitorear changelogs; versionar integraciones |
| Perfiles privados causan datos incompletos | Baja | Alta | Aceptar como limitación; mostrar "jugador anónimo" |

---

## 11. Plan de Desarrollo por Fases

### Fase 1 — MVP (6-10 semanas)

**Objetivo:** Demostrar que el concepto funciona con una integración.

- Integración con OpenDota + STRATZ para datos de partidas
- Solo Twitch como plataforma de streaming
- Mapeo manual de los top 200-500 streamers de Dota 2
- Detección de kills, rampages, ultra kills
- Frontend básico: búsqueda por Steam ID, feed de clips
- Base de datos PostgreSQL en Supabase
- Deploy en Vercel (frontend) + Railway/Render (backend)

**Costo estimado:** $0-20/mes

### Fase 2 — Consolidación (4-8 semanas)

**Objetivo:** Mejorar UX y agregar YouTube.

- Integración con YouTube (deep links a VODs con timestamp)
- Sistema de registro voluntario para streamers (OAuth Twitch + Steam)
- Detección de más eventos (aegis steal, teamwipes, comebacks)
- Notificaciones básicas (email/web push)
- Rankings y estadísticas semanales
- Feed de "mejores clips del día"

**Costo estimado:** $20-50/mes

### Fase 3 — Expansión Multi-plataforma (6-12 semanas)

**Objetivo:** Agregar plataformas secundarias y features sociales.

- Integración con Kick (cuando la API madure)
- Evaluación e integración de Facebook Live (si hay demanda)
- Evaluación de Trovo (si hay demanda)
- Sistema de votación para clips
- API pública v1
- Multi-perspectiva para partidas con 2+ streamers

**Costo estimado:** $50-200/mes

### Fase 4 — Diferenciación (ongoing)

**Objetivo:** Features killer que no existen en ningún otro sitio.

- Contexto narrativo completo de jugadas
- Integración con cliente de Dota 2 (links a replays)
- App móvil (React Native / Flutter)
- Análisis de TikTok (si se abre la API)
- Machine learning para detectar jugadas "interesantes" más allá de kills
- Posible monetización (ads no intrusivos, subscripciones premium)

**Costo estimado:** $100-500/mes

---

## 12. Estimación de Costos

### Escenario 1 — Bootstrap (Fase 1-2, máximo ahorro)

| Concepto | Costo mensual | Notas |
|----------|--------------|-------|
| Hosting Frontend (Vercel Hobby) | $0 | Límites generosos para proyectos personales |
| Hosting Backend (Railway/Render) | $0-7 | Free tier con limitaciones |
| PostgreSQL (Supabase Free) | $0 | 500MB, suficiente para MVP |
| Redis (Upstash Free) | $0 | 10,000 comandos/día |
| Cloudflare CDN | $0 | Ilimitado |
| Dominio | ~$1/mes | $10-15/año |
| **Total mensual** | **$0-8** | |
| **Total primer año** | **$50-150** | |

### Escenario 2 — Crecimiento (Fase 2-3, 1000+ usuarios activos)

| Concepto | Costo mensual | Notas |
|----------|--------------|-------|
| Hosting Frontend (Vercel Pro) | $20 | Mayor bandwidth y features |
| Hosting Backend (Railway/Render Pro) | $20-50 | Más RAM y CPU para workers |
| PostgreSQL (Supabase Pro) | $25 | 8GB, backups, más conexiones |
| Redis (Upstash Pro) | $10 | Más comandos y memoria |
| Cloudflare CDN | $0 | Sigue siendo gratuito |
| Monitoreo (Sentry) | $0-26 | Tier gratuito probablemente suficiente |
| Dominio + Email | $5 | |
| **Total mensual** | **$80-136** | |
| **Total anual** | **$960-1,632** | |

### Escenario 3 — Escala (Fase 3-4, 10,000+ usuarios)

| Concepto | Costo mensual | Notas |
|----------|--------------|-------|
| Infraestructura total | $200-500 | Depende mucho del tráfico |
| OpenDota Premium (si necesario) | $50-100 | Para superar rate limits |
| Almacenamiento (si se guardan thumbnails) | $10-30 | Cloudflare R2 |
| **Total mensual** | **$260-630** | |

### Costo de desarrollo (si se contrata)

| Opción | Costo estimado | Timeframe |
|--------|---------------|-----------|
| Freelancer para MVP | $3,000 - $8,000 USD | 6-10 semanas |
| Agencia pequeña (MVP + Fase 2) | $10,000 - $25,000 USD | 10-18 semanas |
| Equipo completo (todas las fases) | $30,000 - $80,000 USD | 6-12 meses |
| DIY (solo tu tiempo) | $50-150 USD (infra) | Variable |

---

## 13. Métricas de Éxito

### MVP (Fase 1)

- ¿Se generan clips automáticamente en <30 min después de la partida?
- ¿El 80%+ de las búsquedas de Steam IDs de streamers conocidos retornan resultados?
- ¿Los embeds de Twitch funcionan correctamente en 95%+ de los casos?

### Crecimiento (Fase 2-3)

- MAU (Monthly Active Users) > 1,000
- Clips generados/día > 100
- Streamers mapeados > 1,000
- Tiempo promedio de detección (partida → clip disponible) < 15 min
- Retención D7 > 20%

### Madurez (Fase 4+)

- MAU > 10,000
- Clips generados/día > 1,000
- Cobertura multi-plataforma > 3 plataformas funcionales
- API pública con > 10 consumidores

---

## 14. Apéndices y Enlaces Útiles

### APIs de datos de Dota 2

| Recurso | URL |
|---------|-----|
| Steam Web API Key | https://steamcommunity.com/dev/ |
| Steam Web API Docs | https://wiki.teamfortress.com/wiki/WebAPI |
| OpenDota API Docs | https://docs.opendota.com/ |
| OpenDota API Keys | https://www.opendota.com/api-keys |
| OpenDota GitHub (core) | https://github.com/odota/core |
| STRATZ API | https://stratz.com/api |
| STRATZ GraphQL Explorer | https://api.stratz.com/graphiql |
| Dota 2 Game Constants | https://github.com/odota/dotaconstants |

### Plataformas de streaming

| Plataforma | Developer Portal | Documentación |
|-----------|-----------------|---------------|
| Twitch | https://dev.twitch.tv/console | https://dev.twitch.tv/docs/api/ |
| YouTube | https://console.cloud.google.com/ | https://developers.google.com/youtube/v3/ |
| Kick | https://dev.kick.com/ | https://github.com/KickEngineering/KickDevDocs |
| TikTok | https://developers.tiktok.com/ | https://developers.tiktok.com/doc/ |
| Trovo | https://developer.trovo.live/ | https://developer.trovo.live/docs/APIs.html |
| Facebook/Meta | https://developers.facebook.com/ | https://developers.facebook.com/docs/live-video-api/ |

### Términos de servicio

| Plataforma | URL de ToS relevantes |
|-----------|----------------------|
| Steam | https://steamcommunity.com/dev/apiterms |
| Twitch Developer Agreement | https://legal.twitch.com/legal/developer-agreement/ |
| Twitch ToS | https://legal.twitch.com/en/legal/terms-of-service/ |
| Twitch Embedding Rules | https://dev.twitch.tv/docs/embed/ |
| YouTube API ToS | https://developers.google.com/youtube/terms/api-services-terms-of-service |
| YouTube ToS General | https://www.youtube.com/t/terms |
| Kick ToS | https://kick.com/terms-of-service |
| Meta Platform Terms | https://developers.facebook.com/terms/ |
| Trovo ToS | https://trovo.live/policy/apis-developer-doc.html |
| TikTok Developer Terms | https://developers.tiktok.com/doc/tiktok-api-scopes |

### Herramientas y recursos

| Herramienta | Uso | URL |
|------------|-----|-----|
| Postman (OpenDota collection) | Testing de APIs | https://www.postman.com/etherio/etherio-s-public-workspace/documentation/au3szof/dota2-opendota-apis |
| Supabase | PostgreSQL hosted | https://supabase.com/ |
| Vercel | Frontend hosting | https://vercel.com/ |
| Railway | Backend hosting | https://railway.app/ |
| Upstash | Redis serverless | https://upstash.com/ |
| Cloudflare R2 | Object storage | https://www.cloudflare.com/r2/ |
| BullMQ | Job queues (Node.js) | https://docs.bullmq.io/ |

---

> **Nota final:** Este documento es un punto de partida vivo. Debe actualizarse conforme evolucionen las APIs, cambien los ToS de las plataformas, y el proyecto avance de fase. Última revisión: Marzo 2026.
