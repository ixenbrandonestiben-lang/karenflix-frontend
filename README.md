### Estructura del proyecto:

📁 Estructura de Repositorios del Frontend (karenflix-frontend)
Plaintext
```

karenflix-frontend/
├── public/                 # Recursos estáticos globales
│   ├── favicon.ico
│   └── assets/             # Imágenes, iconos, fuentes
├── src/
│   ├── css/                # Estilos CSS modulares
│   │   ├── variables.css   # Variables globales (colores, fuentes, breakpoints)
│   │   ├── global.css      # Reset y estilos base
│   │   ├── components.css  # Botones, tarjetas, modales, alertas
│   │   └── pages/          # Estilos específicos por vista (opcional)
│   │       ├── home.css
│   │       ├── auth.css
│   │       ├── detail.css
│   │       └── admin.css
│   ├── js/
│   │   ├── api/            # Capa de comunicación con el Backend (Fetch API)
│   │   │   ├── client.js   # Cliente HTTP base (configuración de headers, baseURL, token)
│   │   │   ├── auth.api.js # Endpoints de autenticación (login, register)
│   │   │   ├── movie.api.js# Endpoints de películas y series
│   │   │   └── review.api.js# Endpoints de reseñas y reacciones
│   │   ├── components/     # Componentes reutilizables renderizados por JS (opcional)
│   │   │   ├── navbar.js
│   │   │   └── movieCard.js
│   │   ├── pages/          # Lógica específica de cada pantalla
│   │   │   ├── home.js     # Lógica del listado, filtros y ranking
│   │   │   ├── auth.js     # Lógica de formularios de login y registro
│   │   │   ├── detail.js   # Lógica de vista de detalle, reseñas y likes
│   │   │   └── admin.js    # Lógica del panel de administración (aprobar pelis, categorías)
│   │   ├── utils/          # Funciones de ayuda (formato de fechas, manejo de tokens)
│   │   │   ├── authStorage.js # Gestión de JWT en localStorage
│   │   │   └── validators.js  # Validaciones de formularios en cliente
│   │   └── app.js          # Punto de entrada principal para enrutamiento o inicialización global
│   ├── views/              # Archivos HTML principales (Pantallas mínimas requeridas)
│   │   ├── index.html      # Pantalla de Inicio / Listado de películas
│   │   ├── login.html      # Pantalla de Inicio de Sesión[cite: 3]
│   │   ├── register.html   # Pantalla de Registro[cite: 3]
│   │   ├── detail.html     # Pantalla de Detalle de película y reseñas[cite: 3]
│   │   └── admin.html      # Panel de Administración[cite: 3]
│   └── .env.example        # Plantilla de variables de entorno del frontend (ej. API URL)
└── README.md               # Documentación del frontend (instrucciones y link al backend)[cite: 3]
```