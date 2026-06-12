# Sistema de Gestion Gastronomica y Administracion de Pedidos

Este proyecto es un sistema de gestion gastronomica y administracion de pedidos desarrollado para optimizar los procesos de un local de comida. Permite la administracion de usuarios con control de accesos segun roles (administrador, stock, pedidos), gestion de inventario (ingredientes, unidades de medida y categorias), administracion de productos, control de direcciones de entrega, simulacion de pagos y un flujo completo de procesamiento de pedidos con una pantalla especializada para cocina en tiempo real.

## Links del Proyecto

* Parcial 1: https://youtu.be/aESDseVxVGk
* Parcial 2: https://youtu.be/y-FnOq9mqJU

## Tecnologias Utilizadas

### Backend
* Python 3.13
* FastAPI
* SQLModel (ORM sobre SQLAlchemy)
* PostgreSQL
* Uvicorn
* Autenticacion JWT (python-jose y passlib con bcrypt)

### Frontend
* React 19
* TypeScript
* Tailwind CSS 4
* Vite
* Zustand (Gestion de estado global)
* TanStack React Query (Sincronizacion de datos con el servidor)
* Axios (Cliente HTTP)
* React Router DOM (Enrutamiento y navegacion)

---

## Guia de Instalacion y Ejecucion

A continuacion se detallan los pasos necesarios para levantar el proyecto de forma local en entornos Windows, Linux o macOS.

### Requisitos Previos
* Tener instalado PostgreSQL en su sistema y en ejecucion.
* Tener instalado Node.js (se recomienda la version LTS activa).
* Tener instalado Python 3.13.
* Tener instalado el gestor de paquetes global PNPM. Si no lo tiene, puede instalarlo ejecutando:
  ```bash
  npm install -g pnpm
  ```

---

### 1. Configuracion y Ejecucion del Backend

El backend se encuentra dentro de la carpeta `back`. Siga estos pasos detallados para ponerlo en marcha:

#### Paso 1.1: Crear la Base de Datos en PostgreSQL
Antes de iniciar el servidor del backend, debe crear la base de datos en su servidor de PostgreSQL local.
1. Abra su cliente de base de datos preferido (por ejemplo, pgAdmin o la consola de psql).
2. Cree una base de datos vacia con el nombre `parcial`. Por ejemplo, mediante comando SQL:
   ```sql
   CREATE DATABASE parcial;
   ```

#### Paso 1.2: Configurar las Variables de Entorno del Backend
1. Ingrese a la carpeta del backend:
   ```bash
   cd back
   ```
2. Verifique la existencia del archivo `.env` en la raiz de la carpeta `back`. Si el archivo no existe, creelo y configure las siguientes variables de conexion con los datos correspondientes a su instancia local de PostgreSQL:
   ```env
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=su_contraseña
   POSTGRES_DB=parcial
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432

   SECRET_KEY=TASTYSA
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   ```

#### Paso 1.3: Crear y Activar el Entorno Virtual
Se recomienda utilizar Python 3.13 para evitar inconvenientes de compatibilidad.
1. Dentro de la carpeta `back`, cree el entorno virtual ejecutando:
   ```bash
   python -m venv .venv
   ```
   *Nota: Si tiene multiples versiones de Python instaladas y Windows como sistema operativo, puede especificar la ruta del interprete de Python 3.13. Por ejemplo: `C:\Python313\python.exe -m venv .venv`*
2. Active el entorno virtual de acuerdo a su sistema operativo y terminal:
   * **Windows (PowerShell):**
     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```
   * **Windows (CMD / Command Prompt):**
     ```cmd
     .\.venv\Scripts\activate.bat
     ```
   * **Linux o macOS (Terminal):**
     ```bash
     source .venv/bin/activate
     ```

#### Paso 1.4: Instalar las Dependencias del Backend
Con el entorno virtual activado, instale las dependencias especificadas en el archivo `requirements.txt`:
```bash
pip install -r requirements.txt
```

#### Paso 1.5: Iniciar el Servidor del Backend
Ejecute el servidor de desarrollo mediante Uvicorn:
```bash
uvicorn main:app --reload
```
Al iniciar por primera vez, el backend detectara la base de datos `parcial`, creara automaticamente las tablas necesarias (gracias a SQLModel) y realizara el sembrado (seed) de datos iniciales requeridos como los roles de usuario y catalogos de estados de pedidos.

El servidor quedara corriendo en `http://localhost:8000`. Puede verificar su correcto funcionamiento ingresando a la documentacion interactiva generada por FastAPI en `http://localhost:8000/docs`.

---

### 2. Configuracion y Ejecucion del Frontend

El frontend se encuentra dentro de la carpeta `front`. Siga estos pasos para iniciarlo:

#### Paso 2.1: Acceder al Directorio del Frontend
Abra una nueva terminal o consola (dejando corriendo el servidor de backend en la anterior) y dirijase a la carpeta del frontend:
```bash
cd front
```

#### Paso 2.2: Configurar las Variables de Entorno del Frontend
Verifique que en la raiz de la carpeta `front` exista el archivo `.env` con las siguientes direcciones configuradas para conectarse con la API y los canales de WebSocket del backend:
```env
VITE_API_URL=http://localhost:8000
VITE_API_BASE_URL=http://localhost:8000
VITE_API_URL_BASE=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/pedidos/cocina/ws
```

#### Paso 2.3: Instalar Dependencias mediante PNPM
Instale todas las dependencias del proyecto frontend utilizando PNPM:
```bash
pnpm install
```

#### Paso 2.4: Levantar el Servidor de Desarrollo del Frontend
Inicie la aplicacion web ejecutando:
```bash
pnpm run dev
```
La aplicacion estara disponible en su navegador en la direccion `http://localhost:5173`.

---

## Roles de Acceso Predeterminados

Una vez levantado el sistema y creados los datos iniciales, podra iniciar sesion utilizando los usuarios de prueba correspondientes a cada rol para probar las distintas funcionalidades del sistema.
