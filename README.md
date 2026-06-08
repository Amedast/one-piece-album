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
- **Base de Datos**: Supabase (PostgreSQL).
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
│   ├── lib/                    # Utilidades y configuración de clientes (Auth, Supabase, API)
│   ├── types/                  # Definiciones de tipos de TypeScript
│   └── tsconfig.json
├── package.json
└── postcss.config.mjs
```

---

## Base de Datos

La aplicación utiliza Supabase como base de datos PostgreSQL. A continuación se describe el esquema de base de datos que maneja la persistencia de los álbumes:

### Tabla `albums`
Almacena el registro principal del álbum asociado a cada usuario.
- `id` (UUID, Primary Key): Identificador único del álbum.
- `user_id` (UUID, Unique): Identificador del usuario (referencia a la tabla de usuarios de Better-Auth).
- `is_public` (Boolean): Define si el álbum es visible en la sección pública de coleccionistas.
- `updated_at` (Timestamp): Fecha y hora de la última modificación.

### Tabla `album_pages`
Almacena las páginas de cada álbum.
- `id` (UUID, Primary Key): Identificador único de la página.
- `album_id` (UUID, Foreign Key): Referencia a `albums.id` (eliminación en cascada).
- `page_id` (Text): Identificador de la página generado en el cliente.
- `title` (Text): Nombre o título asignado a la página (por defecto, "Page N").
- `position` (Integer): Posición ordinal de la página dentro del álbum.

### Tabla `album_slots`
Almacena la información de cada uno de los 12 espacios disponibles en una página.
- `id` (UUID, Primary Key): Identificador único del slot.
- `page_db_id` (UUID, Foreign Key): Referencia a `album_pages.id` (eliminación en cascada).
- `slot_id` (Text): Identificador del slot generado en el cliente.
- `position` (Integer): Posición dentro de la cuadrícula de la página (0 a 11).
- `state` (Text): Estado del slot (`EMPTY` | `OWNED` | `WISHLIST`).
- `card_id` (Text, Nullable): Identificador de la carta colocada.
- `card_data` (JSONB, Nullable): Datos y metadatos de la carta.
- `language` (Text, Nullable): Idioma de la carta (`JP` | `EN`).
- `wishlist_urls` (JSONB, Nullable): Colección de enlaces de compra asociados a la lista de deseos.

### Autenticación (Better-Auth)
Las tablas de usuarios, sesiones, cuentas y verificaciones son gestionadas automáticamente por la librería Better-Auth a través del adaptador PostgreSQL (`pg`).

---

## Configuración e Instalación

### Requisitos Previos
- Node.js (versión 18 o superior recomendada)
- npm, yarn, pnpm o bun
- Una instancia de base de datos PostgreSQL (ej. Supabase)

### Paso 1: Clonar el proyecto
```bash
git clone <url-del-repositorio>
cd one-piece-album
```

### Paso 2: Instalar dependencias
```bash
npm install
```

### Paso 3: Configurar variables de entorno
Crea un archivo `.env.local` en la raíz del proyecto y define las siguientes variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase

# Conexión directa a PostgreSQL (utilizada por Better-Auth a nivel de servidor)
DATABASE_URL=postgresql://usuario:contraseña@servidor:puerto/base_de_datos

# Configuración de Better-Auth
BETTER_AUTH_SECRET=un-secreto-aleatorio-seguro
BETTER_AUTH_URL=http://localhost:3000

# Registro de nuevos usuarios
NEXT_PUBLIC_ENABLE_REGISTRATION=true

# URL de la aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Paso 4: Levantar el servidor de desarrollo
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
