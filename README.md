# Ohara TCG - Álbum Digital de Colección para One Piece TCG

Ohara TCG es una aplicación web moderna diseñada para coleccionistas del juego de cartas coleccionables de One Piece (One Piece Card Game). Permite a los usuarios buscar y filtrar cartas de la base de datos oficial, organizar su colección en un archivador digital virtual interactivo, gestionar listas de deseos con enlaces de compra y notas de precios, y compartir sus álbumes de forma pública con otros coleccionistas (nakamas).

## Características Principales

### Base de Datos de Cartas (Ohara Database)

- Listado completo de cartas oficiales con soporte para scroll infinito.
- Sistema avanzado de filtros: búsqueda por nombre o número de serie, tipo de carta (Leader, Character, Event, Stage), rareza, color, expansiones (sets) y visualización selectiva de cartas de arte alternativo (Alt Arts).
- Vista detallada de cada carta mostrando estadísticas detalladas, habilidades, efectos, estado de reimpresión y enlaces de referencia.

### Archivador Virtual Interactivo (Virtual Binder)

- Simulación visual de un archivador físico de cartas con una distribución de cuadrícula de 4x3 (12 espacios por página).
- Modos de visualización de página doble (Double Page View) y página única (Single Page View).
- Interfaz interactiva con soporte para arrastrar y soltar (drag and drop) para reorganizar las cartas en las páginas del álbum.
- Soporte para gestos táctiles (swipe) en dispositivos móviles y tabletas para pasar páginas.
- Gestión dinámica de páginas: añadir, eliminar y reordenar páginas.
- Configuración de estado por slot: Poseído (Owned), Lista de deseos (Wishlist) o Vacío (Empty).
- Selección de idioma de la carta física en la colección (Japonés o Inglés).

### Gestión de Lista de Deseos (Wishlist) e Integración de Enlaces

- Permite asociar múltiples enlaces de compra, precios estimados y anotaciones a cada carta marcada en la lista de deseos.

### Cartas Personalizadas (Custom Cards)

- Creador integrado de cartas personalizadas que permite a los usuarios subir sus propias imágenes (codificadas en Base64) y definir atributos personalizados (nombre, color, rareza, etc.) para añadirlas a su álbum.

### Comunidad (Nakama Collectors)

- Directorio público de coleccionistas para explorar las colecciones de otros usuarios de forma interactiva.
- Control de visibilidad del álbum: el usuario puede alternar la visibilidad de su álbum de forma global (Público/Privado).
- Página de perfil público individual para cada usuario accesible mediante su nombre de usuario (`/album/[username]`).

### Panel de Estadísticas

- Indicador visual del progreso de la colección con porcentajes de completitud, conteo de cartas poseídas y elementos en la lista de deseos.

---

## Pila Tecnológica

- **Frontend**: React 19, Next.js 16 (App Router), TypeScript.
- **Estilos y Animaciones**: Tailwind CSS v4, Framer Motion (para transiciones fluidas y animaciones interactivas), Lucide React (iconografía).
- **Backend / API**: Next.js API Routes (Route Handlers).
- **Base de Datos**: PostgreSQL (alojado en Dokploy).
- **Autenticación**: Better-Auth (con adaptador de base de datos `pg` nativo para PostgreSQL).

---

## Estructura de Directorios

```text
├── .agents/
├── src/
│   ├── app/                    # Rutas y páginas de Next.js App Router
│   │   ├── album/              # Página del álbum del usuario y vista pública por username
│   │   ├── albums/             # Listado de coleccionistas (Nakama Collectors)
│   │   ├── api/                # Controladores de API (album, cards, auth)
│   │   ├── globals.css         # Estilos globales y configuración de Tailwind CSS
│   │   ├── layout.tsx          # Componente raíz del diseño
│   │   └── page.tsx            # Página de inicio (Ohara Database)
│   ├── components/             # Componentes de UI reutilizables
│   │   ├── album/              # Componentes dedicados al archivador (Header, Slot, Modales)
│   │   ├── AlbumSearchModal.tsx
│   │   ├── AuthModal.tsx
│   │   ├── CardComponent.tsx
│   │   ├── CardDetailsModal.tsx
│   │   ├── CollectionStats.tsx
│   │   ├── FilterSystem.tsx
│   │   └── Navbar.tsx
│   ├── context/                # Contextos de React (AlbumContext para el estado global)
│   ├── data/                   # Datos estáticos o mockups
│   ├── hooks/                  # Hooks personalizados de React
│   ├── lib/                    # Utilidades y configuración de clientes (Auth, DB, API)
│   ├── types/                  # Definiciones de tipos de TypeScript
│   └── tsconfig.json
├── package.json
└── postcss.config.mjs
```

---

## Base de Datos

La persistencia de los álbumes, páginas y slots, así como la autenticación de usuarios y sus sesiones, se gestiona mediante una única instancia de PostgreSQL administrada con Better-Auth y un pool de conexiones `pg` nativo.

---

## Configuración e Instalación

### Requisitos Previos

- Node.js (versión 18 o superior recomendada)
- npm, yarn, pnpm o bun
- Una instancia de base de datos PostgreSQL (ej. Dokploy, Railway, Neon...)

### Paso 1: Clonar el proyecto

```bash
git clone <url-del-repositorio>
cd one-piece-album
```

### Paso 2: Instalar dependencias

```bash
npm install
```

### Paso 3: Levantar el servidor de desarrollo

```bash
npm run dev
```

El servidor estará disponible en [http://localhost:3000](http://localhost:3000).

---

## Scripts Disponibles

En el proyecto puedes ejecutar los siguientes comandos:

- `npm run dev`: Inicia el servidor de desarrollo local.
- `npm run build`: Compila la aplicación Next.js para producción.
- `npm run start`: Inicia el servidor de producción compilado.
- `npm run lint`: Ejecuta el analizador de código (ESLint) para asegurar la calidad y consistencia del código fuente.
