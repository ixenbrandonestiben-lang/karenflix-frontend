# KarenFlix Frontend

Aplicación web de KarenFlix para explorar películas, consultar reparto y
reseñas, gestionar favoritos y mantener una cuenta. Incluye una interfaz de
administración para el catálogo y su contenido relacionado.

El proyecto está construido con HTML, CSS y JavaScript nativo utilizando
módulos ES. Es un sitio estático: no necesita Node.js para servir el frontend,
un paso de compilación ni un framework. El backend y el esquema de base de datos
se mantienen en un [repositorio independiente](https://github.com/Anderson-Oloroso/karenflix-backend).

## Contenido

- [Características](#características)
- [Tecnologías y requisitos](#tecnologías-y-requisitos)
- [Arquitectura de despliegue](#arquitectura-de-despliegue)
- [Desarrollo local](#desarrollo-local)
- [Publicación del frontend](#publicación-del-frontend)
- [Configuración del backend](#configuración-del-backend)
- [Páginas de la aplicación](#páginas-de-la-aplicación)
- [Integración con la API](#integración-con-la-api)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Seguridad](#seguridad)
- [Desarrollo y validación](#desarrollo-y-validación)
- [Solución de problemas](#solución-de-problemas)

## Características

- Inicio con película destacada, tendencias y carruseles por categoría.
- Catálogo de películas aprobadas con búsqueda y filtro de categorías.
- Detalle de película con reparto, reseñas y puntuaciones.
- Publicación de reseñas y reacciones con sesión iniciada.
- Gestión de favoritos en tarjetas, detalle y página personal.
- Registro, inicio y cierre de sesión.
- Perfil para actualizar o eliminar la cuenta autenticada.
- Panel de administración para películas, categorías, actores, reparto y usuarios.
- Tema claro/oscuro, navegación adaptable y notificaciones tipo toast.

## Tecnologías y requisitos

- HTML5, CSS3 y JavaScript moderno (módulos ES).
- Un navegador actual con `fetch`, `localStorage` y soporte para módulos ES.
- Un servidor HTTP estático para desarrollo y pruebas locales.
- Para ejecutar la API en local: Docker Desktop con Docker Compose, o Node.js y
  MySQL según las instrucciones del backend.

No hay `package.json`, gestor de dependencias, framework ni proceso de build en
este repositorio. El directorio `public/` contiene recursos estáticos, como el
favicon y el video de introducción.

## Arquitectura de despliegue

El frontend nunca se conecta directamente a MySQL. El navegador consume la API
HTTP del backend, y solo el backend tiene credenciales de base de datos.

```text
Desarrollo:
Navegador (localhost:5500) ──HTTP──> API local (localhost:4000)
                                      └──> MySQL en Docker (localhost:3307)

Producción:
Navegador ──HTTPS──> Frontend estático en GitHub Pages
         └──HTTPS──> API en Render ──TLS/red privada──> MySQL administrado
```

La configuración actual del frontend selecciona el backend mediante el nombre
de host del navegador. Está implementada en
[`assets/js/api/client.js`](./assets/js/api/client.js):

| Hostname desde el que se abre el frontend | API seleccionada |
|---|---|
| `localhost` o `127.0.0.1` | `http://localhost:4000/api/v1` |
| Cualquier otro hostname (por ejemplo, GitHub Pages) | `https://karenflix-backend.onrender.com/api/v1` |

Esto permite mantener el mismo frontend para desarrollo y producción, sin que
el navegador lea un `.env`. Si se modifica el dominio de Render, se debe
actualizar la URL de producción en `client.js`.

> **Importante:** una página servida desde `file://` no es una forma válida de
> probar el proyecto. Usa un servidor HTTP para que los módulos ES, las rutas
> relativas y las solicitudes de red se comporten como en producción.

## Desarrollo local

### Opción recomendada: MySQL y backend con Docker Compose

Clona ambos repositorios en carpetas hermanas. Por ejemplo:

```text
express/
├── karenflix-backend/
└── karenflix-frontend/
```

Desde PowerShell, configura e inicia el backend:

```powershell
cd ..\karenflix-backend
Copy-Item .env.example .env
```

Edita `karenflix-backend/.env` y establece contraseñas locales propias para
`DB_PASSWORD`, `DB_ROOT_PASSWORD` y un `JWT_SECRET aleatorio`. Luego ejecuta:

```powershell
docker compose up --build
```

Compose inicia MySQL y el backend. La base de datos se publica localmente en el
puerto configurado por `DB_PORT` (por defecto, `3307` en `.env.example`); dentro
de la red de Compose, el backend se conecta a MySQL usando el host `db` y el
puerto `3306`. La carpeta `database/` del backend se monta como scripts de
inicialización de MySQL.

El servicio Compose usa `npm run dev`, que actualmente ejecuta Nodemon. Los
cambios en los archivos del backend se reflejan mediante el volumen montado.
Para detener los contenedores sin borrar los datos persistidos:

```powershell
docker compose down
```

El volumen de MySQL se conserva al detener Compose. No uses `docker compose down
-v` salvo que quieras eliminar intencionalmente los datos locales de la base.

La API local debe responder en:

```text
http://localhost:4000/api/v1
```

La documentación Swagger del backend está disponible normalmente en
`http://localhost:4000/api-docs`.

### Servir el frontend

Abre la carpeta `karenflix-frontend` con VS Code y ejecuta **Live Server** sobre
`index.html`. El origen predeterminado de Live Server, `http://localhost:5500`,
está permitido por el CORS del backend.

También se puede usar cualquier servidor estático que sirva esta carpeta en
`http://localhost` o `http://127.0.0.1`. La aplicación construye las rutas a
otras páginas de forma relativa para que funcione desde la raíz y desde
`pages/`.

Si el servidor local utiliza un hostname distinto de `localhost` o
`127.0.0.1`, el frontend seleccionará el backend de producción. En ese caso,
usa uno de los hostnames locales previstos o actualiza el selector de entorno
en `client.js`.

### Ejecutar backend sin Compose

Como alternativa, configura MySQL localmente, crea `.env` siguiendo
`karenflix-backend/.env.example` y, desde el repositorio backend, instala las
dependencias e inicia el servidor:

```powershell
npm install
npm run dev
```

El backend actual usa Nodemon para desarrollo y `npm start` para producción.
Consulta el README del backend para el esquema, datos de prueba, variables
requeridas y requisitos de Node.js.

## Publicación del frontend

### GitHub Pages

GitHub Pages es adecuado para esta aplicación porque publica archivos estáticos
y el frontend no necesita un servidor propio.

1. Confirma los archivos del frontend en la rama que se utilizará para publicar.
2. En GitHub, abre **Settings → Pages**.
3. Selecciona la fuente de publicación (por ejemplo, la rama `main` y la carpeta
   `/ (root)`, o el flujo de GitHub Actions para sitio estático).
4. Espera el despliegue y abre la URL que proporciona GitHub Pages.
5. Verifica que `client.js` apunte al backend HTTPS de producción y que el
   backend permita el origen de GitHub Pages.

El origen a permitir en CORS es el dominio, sin la ruta del repositorio. Para
este proyecto es:

```text
https://ixenbrandonestiben-lang.github.io
```

Las páginas usan rutas relativas, por lo que también pueden publicarse bajo la
ruta del repositorio que asigna GitHub Pages.

### Render y base de datos de producción

El frontend no se despliega en el servicio Docker del backend. Mantén los
despliegues separados:

- **GitHub Pages:** HTML, CSS, JavaScript e imágenes/videos estáticos.
- **Render:** servicio Node.js del repositorio backend, con URL HTTPS.
- **MySQL:** servicio administrado o instancia accesible de forma segura desde
  el backend.

En Render, configura en el servicio backend las variables requeridas para
producción, como `NODE_ENV=production`, `API_PREFIX=/api/v1`,
`JWT_SECRET`, `JWT_EXPIRES_IN`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`,
`DB_PASSWORD` y `CORS_ORIGIN`. Usa los valores y opciones de TLS proporcionados
por tu proveedor de MySQL. Render asigna el puerto HTTP mediante `PORT`; el
backend debe escuchar en ese valor.

Configura el *Health Check Path* de Render como `/api/v1`. La ruta raíz `/` y
`/favicon.ico` no pertenecen a la API, así que respuestas `404` en esas rutas
no indican por sí solas que el servicio esté detenido.

## Configuración del backend

### Variables y secretos

El backend carga su `.env` local mediante `dotenv`. En despliegues como Render,
las variables se configuran en el panel de la plataforma, no en un archivo `.env`
incluido en el repositorio.

Entre las variables importantes están:

| Variable | Propósito |
|---|---|
| `NODE_ENV` | Distingue el entorno, por ejemplo `development` o `production`. |
| `PORT` | Puerto HTTP asignado al backend. |
| `API_PREFIX` | Prefijo público de la API; por defecto, `/api/v1`. |
| `DB_HOST`, `DB_PORT`, `DB_NAME` | Ubicación y nombre de la base MySQL. |
| `DB_USER`, `DB_PASSWORD` | Credenciales del usuario MySQL de la aplicación. |
| `DB_SSL`, `DB_SSL_CA` | Configuración TLS para proveedores MySQL administrados. |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Firma y vigencia de los tokens de sesión. |
| `CORS_ORIGIN` | Orígenes frontend autorizados, separados por comas. |

`NODE_ENV` configura el modo de ejecución del backend; **no cambia por sí solo
la URL de API del JavaScript del navegador**. La selección de la API frontend se
realiza por hostname, como se explica en [Arquitectura de despliegue](#arquitectura-de-despliegue).

No publiques el `.env` real, claves JWT, contraseñas MySQL ni certificados
privados. El archivo `.env.example` contiene nombres y valores de referencia,
no debe usarse como configuración de producción sin reemplazar los valores de
ejemplo.

### Docker en desarrollo y producción

El repositorio backend incluye dos formas de ejecución con propósitos
diferentes:

- `docker compose up --build`: entorno local; Compose inicia MySQL y ejecuta el
  backend con `npm run dev`.
- Imagen del `Dockerfile`: servicio backend para producción; establece
  `NODE_ENV=production` y ejecuta `npm start`.

El Dockerfile describe el servicio de API, no publica el frontend ni debe
exponer MySQL a Internet. Para Render se despliega el repositorio backend y se
configuran las credenciales de la base por variables seguras de la plataforma.
Revisa el README del backend para la versión de Node compatible con su código y
su imagen Docker.

## Páginas de la aplicación

| Página | Archivo | Descripción |
|---|---|---|
| Inicio | [`index.html`](./index.html) | Película destacada, tendencias y carruseles por categoría. |
| Catálogo | [`pages/movies.html`](./pages/movies.html) | Búsqueda y filtros para películas aprobadas. |
| Detalle | [`pages/detail.html`](./pages/detail.html) | Información, reparto, reseñas, puntuación y favoritos. |
| Mi lista | [`pages/mylist.html`](./pages/mylist.html) | Favoritos del usuario autenticado. |
| Acceso | [`pages/login.html`](./pages/login.html) | Inicio de sesión con correo o nombre de usuario. |
| Registro | [`pages/register.html`](./pages/register.html) | Registro de una cuenta. |
| Perfil | [`pages/profile.html`](./pages/profile.html) | Actualización y eliminación de la cuenta autenticada. |
| Administración | [`pages/admin.html`](./pages/admin.html) | Mantenimiento del catálogo y los recursos asociados. |

El panel administrativo proporciona:

- aprobación y eliminación de películas pendientes;
- consulta, edición y eliminación de películas;
- creación de películas pendientes;
- mantenimiento de categorías y actores;
- consulta y edición del reparto y consulta de filmografía;
- consulta, edición y eliminación de usuarios.

La API es responsable de autorizar las operaciones. Ocultar una pestaña en el
frontend no reemplaza la autenticación y autorización del backend.

## Integración con la API

[`assets/js/api/client.js`](./assets/js/api/client.js) centraliza las solicitudes
HTTP. Los módulos de `assets/js/api/` organizan las funciones por recurso:

| Módulo | Recursos |
|---|---|
| `auth.api.js` | Registro, autenticación, perfil y cierre de sesión. |
| `movie.api.js` | Películas y categorías. |
| `actor.api.js` | Actores, reparto y asociaciones película-actor. |
| `favorite.api.js` | Favoritos del usuario autenticado. |
| `review.api.js` | Reseñas y reacciones. |
| `user.api.js` | Administración de usuarios. |
| `director.api.js` | Funciones opcionales para rutas de directores. |

El cliente central:

- adjunta el token guardado como credencial Bearer;
- envía los cuerpos de las operaciones de escritura como JSON;
- devuelve la propiedad `data` cuando la respuesta del backend la contiene;
- lanza errores con el mensaje y los detalles de validación devueltos por la API;
- devuelve `null` para respuestas HTTP `204 No Content`.

### Rutas utilizadas

La aplicación integra las rutas siguientes bajo el prefijo `/api/v1`:

| Recurso | Rutas | Uso |
|---|---|---|
| Autenticación | `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/profile` | Registro, sesión y perfil. |
| Películas | `/movies`, `/movies/:id`, `/movies/:id/approve` | Catálogo y gestión administrativa. |
| Categorías | `/categories`, `/categories/:id` | Consulta, filtros y administración. |
| Actores | `/actors`, `/actors/:id` | Consulta y administración del reparto. |
| Asociaciones | `/movie-actors`, `/movie-actors/:id`, `/movie-actors/movie/:movieId`, `/movie-actors/actor/:actorId` | Reparto y filmografía. |
| Favoritos | `/favorites`, `/favorites/:id` | Consultar, agregar y quitar favoritos. |
| Reseñas | `/movies/:id/reviews` | Consultar y publicar reseñas. |
| Reacciones | `/reviews/:id/reactions` | Alternar una reacción a una reseña. |
| Usuarios | `/users`, `/users/:id` | Administración de cuentas. |

Las rutas de escritura requieren los permisos correspondientes. En particular,
las funciones de administración requieren una cuenta con rol de administrador.
Las validaciones y restricciones del backend son la fuente de verdad para los
datos aceptados.

### Compatibilidad de directores

El frontend contiene [`assets/js/api/director.api.js`](./assets/js/api/director.api.js),
pero no hay una página de directores en este frontend. Las llamadas a
`/directors` solo estarán disponibles si la versión del backend desplegada
implementa esas rutas.

## Estructura del proyecto

```text
karenflix-frontend/
├── index.html
├── pages/
│   ├── admin.html
│   ├── detail.html
│   ├── login.html
│   ├── movies.html
│   ├── mylist.html
│   ├── profile.html
│   └── register.html
├── assets/
│   ├── css/
│   │   ├── pages/          # Estilos específicos por página
│   │   ├── components.css
│   │   ├── global.css
│   │   └── variables.css   # Tokens y tema
│   └── js/
│       ├── api/            # Cliente HTTP y endpoints por recurso
│       ├── components/     # Navbar, tarjetas y puntuación
│       ├── pages/          # Inicialización y lógica de las vistas
│       └── utils/          # Sesión, rutas, validación, tema y avisos
├── public/
│   ├── favicon.ico
│   └── karenflix_intro.mp4
└── README.md
```

Cada HTML importa su módulo de inicialización. Los componentes y estilos
compartidos se mantienen en `assets/js/components/` y `assets/css/`; las
funciones HTTP se agrupan por recurso en `assets/js/api/`.

## Seguridad

- El token JWT y datos básicos de usuario se guardan en `localStorage` bajo las
  claves `kf_token` y `kf_user`. `localStorage` puede ser leído por JavaScript
  ejecutado en el mismo origen; evita inyecciones XSS y sirve producción por
  HTTPS.
- No se debe confiar en el rol almacenado en el navegador para autorizar
  operaciones. El backend debe validar los tokens y permisos de cada solicitud.
- Nunca guardes secretos, contraseñas de MySQL ni claves privadas en el
  frontend. Toda variable incluida en JavaScript está disponible públicamente.
- El navegador solo debe conectarse al backend por HTTPS en producción. MySQL
  no debe exponerse a Internet ni ser accedido directamente por el frontend.
- Configura CORS para los orígenes frontend necesarios. No habilites `*` como
  sustituto de una lista de orígenes de producción.

## Desarrollo y validación

Al contribuir:

- conserva el patrón de módulos ES y las rutas relativas entre páginas;
- reutiliza el cliente central y los helpers de ruta, sesión y notificaciones;
- valida permisos en backend, aunque el frontend también restrinja el acceso;
- no añadas dependencias de build salvo que el proyecto adopte explícitamente
  una herramienta de compilación.

El repo no define un comando de test o lint. Para comprobar la sintaxis de los
módulos JavaScript con Node.js:

```powershell
Get-ChildItem assets\js -Recurse -Filter *.js |
  ForEach-Object { node --check $_.FullName }
```

Esta comprobación no valida el comportamiento visual ni la conectividad con la
API. Para verificar los flujos completos, inicia el backend y MySQL, sirve el
frontend por HTTP y prueba cada caso con una cuenta que tenga los permisos
adecuados.

## Solución de problemas

### La página muestra “Backend desconectado” o errores de red

1. Comprueba que el servicio backend esté iniciado.
2. Desde desarrollo local, abre `http://localhost:4000/api/v1`.
3. Revisa la URL seleccionada por `client.js` según el hostname de la página.
4. Comprueba la consola del navegador y los logs del backend.

### Error CORS

El origen de la página debe estar permitido por el middleware CORS del backend.
En producción, añade el origen GitHub Pages
`https://ixenbrandonestiben-lang.github.io`; en local, usa los puertos locales
permitidos por la configuración actual del backend. El origen no incluye la
ruta `/karenflix-frontend`.

### Render muestra `404` para `/` o `/favicon.ico`

La API no sirve una página de inicio en la raíz ni el favicon del frontend. Usa
`/api/v1` como ruta de salud y `/api-docs` para Swagger, según la configuración
del backend.

### El administrador no puede abrir el panel

Inicia sesión con una cuenta cuyo rol sea `admin`. El backend también protege
las operaciones administrativas; cambiar datos en `localStorage` no concede
permisos reales.

### Un cambio en JavaScript no aparece en GitHub Pages

Espera a que termine el despliegue de Pages, recarga la página y limpia la caché
del navegador si es necesario. Verifica que el cambio esté en la rama y carpeta
configuradas como fuente de publicación.

## Repositorios relacionados

- Frontend: [ixenbrandonestiben-lang/karenflix-frontend](https://github.com/ixenbrandonestiben-lang/karenflix-frontend)
- Backend: [Anderson-Oloroso/karenflix-backend](https://github.com/Anderson-Oloroso/karenflix-backend)
