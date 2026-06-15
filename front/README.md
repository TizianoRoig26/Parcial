# Frontend - Sistema de Gestión Gastronómica y Administración de Pedidos

Este directorio contiene la interfaz de usuario web interactiva del sistema de gestión gastronómica, construida con React y diseñada para interactuar con la API del backend.

## Tecnologías Utilizadas

* React 19
* TypeScript
* Tailwind CSS 4
* Vite
* Zustand (Gestión de estado global)
* TanStack React Query (Sincronización de datos con el servidor)
* Axios (Cliente HTTP)
* React Router DOM (Enrutamiento y navegación)

---

## Guía de Instalación y Ejecución

Siga estos pasos para iniciar la aplicación frontend en su entorno local:

### Requisitos Previos
* Tener instalado Node.js (se recomienda la versión LTS activa).
* Tener instalado el gestor de paquetes global **PNPM**. Si no lo tiene, puede instalarlo ejecutando:
  ```bash
  npm install -g pnpm
  ```

### Paso 1: Configurar las Variables de Entorno (.env)
Verifique que en la raíz de la carpeta `front` exista el archivo `.env` con las siguientes direcciones configuradas para conectarse con la API y los canales de WebSocket del backend:
```env
VITE_API_URL=http://localhost:8000
VITE_API_BASE_URL=http://localhost:8000
VITE_API_URL_BASE=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/pedidos/cocina/ws
```

### Paso 2: Instalar Dependencias mediante PNPM
Instale todas las dependencias del proyecto frontend utilizando PNPM:
```bash
pnpm install
```

### Paso 3: Levantar el Servidor de Desarrollo
Inicie la aplicación web ejecutando:
```bash
pnpm run dev
```

La aplicación estará disponible en su navegador en la dirección `http://localhost:5173`.
