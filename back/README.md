# Backend - Sistema de Gestión Gastronómica y Administración de Pedidos

Este directorio contiene el backend del sistema de gestión gastronómica, encargado de la lógica de negocio, persistencia en base de datos, autenticación y comunicación en tiempo real a través de WebSockets.

## Tecnologías Utilizadas

* Python 3.13
* FastAPI
* SQLModel (ORM sobre SQLAlchemy)
* PostgreSQL
* Uvicorn
* Autenticación JWT (python-jose y passlib con bcrypt)

---

## Guía de Instalación y Ejecución

Siga estos pasos detallados para poner el backend en marcha:

### Requisitos Previos
* Tener instalado PostgreSQL en su sistema y en ejecución.
* Tener instalado Python 3.13.

### Paso 1: Crear la Base de Datos en PostgreSQL
Antes de iniciar el servidor del backend, debe crear la base de datos en su servidor de PostgreSQL local.
1. Abra su cliente de base de datos preferido (por ejemplo, pgAdmin o la consola de psql).
2. Cree una base de datos vacía con el nombre `parcial`. Por ejemplo, mediante comando SQL:
   ```sql
   CREATE DATABASE parcial;
   ```

### Paso 2: Configurar las Variables de Envío (.env)
Verifique la existencia del archivo `.env` en la raíz de la carpeta `back`. Si el archivo no existe, créelo y configure las siguientes variables de conexión con los datos correspondientes a su instancia local de PostgreSQL:
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

### Paso 3: Crear y Activar el Entorno Virtual
Se recomienda utilizar Python 3.13 para evitar inconvenientes de compatibilidad.
1. Dentro de la carpeta `back`, cree el entorno virtual ejecutando:
   ```bash
   python -m venv .venv
   ```
   *Nota: Si tiene múltiples versiones de Python instaladas y Windows como sistema operativo, puede especificar la ruta del intérprete de Python 3.13. Por ejemplo: `C:\Python313\python.exe -m venv .venv`*
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

### Paso 4: Instalar las Dependencias
Con el entorno virtual activado, instale las dependencias especificadas en el archivo `requirements.txt`:
```bash
pip install -r requirements.txt
```

### Paso 5: Iniciar el Servidor de Desarrollo
Ejecute el servidor de desarrollo mediante Uvicorn:
(revisar para que active las seed antes de iniciar estan el main comentadas para evitar repeticiones pero si es la primera vez hay que descomentarlas para que inicien.)
```bash
uvicorn main:app --reload
```

Al iniciar por primera vez, el backend detectará la base de datos `parcial`, creará automáticamente las tablas necesarias (gracias a SQLModel) y realizará el sembrado (seed) de datos iniciales requeridos como los roles de usuario y catálogos de estados de pedidos.

El servidor quedará corriendo en `http://localhost:8000`. Puede verificar su correcto funcionamiento ingresando a la documentación interactiva generada por FastAPI en `http://localhost:8000/docs`.
