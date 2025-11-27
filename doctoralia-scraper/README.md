# Doctoralia Scraper

Este proyecto es un scraper para Doctoralia que extrae información de doctores, tratamientos y disponibilidad. Además, incluye funcionalidad para generar pacientes de prueba y gestionar citas.

## Tecnologías

- **Lenguaje:** TypeScript / Node.js
- **Base de Datos:** PostgreSQL
- **ORM:** Prisma
- **Contenedores:** Docker & Docker Compose
- **Librerías Clave:**
  - `cheerio` & `axios` para scraping
  - `p-queue` para control de concurrencia
  - `@faker-js/faker` para generación de datos falsos

## Requisitos Previos

- [Docker](https://www.docker.com/get-started) y [Docker Compose](https://docs.docker.com/compose/install/) instalados.
- (Opcional) Node.js v20+ si deseas ejecutarlo localmente sin Docker.

## Ejecución con Docker (Recomendado)

Esta es la forma más sencilla de ejecutar el proyecto, ya que levanta tanto la base de datos como el scraper en contenedores aislados.

### 1. Construir e Iniciar

Ejecuta el siguiente comando en la raíz del proyecto:

```bash
docker-compose up --build
```

Esto realizará lo siguiente:
1.  Levantará un contenedor con **PostgreSQL 16**.
2.  Construirá la imagen del **Scraper**.
3.  Esperará a que la base de datos esté lista.
4.  Ejecutará las migraciones de Prisma (`prisma migrate deploy`).
5.  Iniciará el scraper (`src/index.ts`).

### 2. Detener los contenedores

Para detener y remover los contenedores:

```bash
docker-compose down
```

Si deseas borrar también los volúmenes de la base de datos (para empezar desde cero):

```bash
docker-compose down -v
```

## Ejecución Local (Sin Docker)

Si prefieres ejecutar el scraper directamente en tu máquina:

1.  **Instalar dependencias:**
    ```bash
    npm install
    ```

2.  **Configurar Base de Datos:**
    Asegúrate de tener una instancia de PostgreSQL corriendo y actualiza el archivo `.env` con tu `DATABASE_URL`.

3.  **Generar Cliente de Prisma:**
    ```bash
    npx prisma generate
    ```

4.  **Ejecutar Migraciones:**
    ```bash
    npx prisma migrate dev
    ```

5.  **Iniciar el Scraper:**
    ```bash
    npm start
    ```
    o para desarrollo:
    ```bash
    npm run dev
    ```

## Estructura del Proyecto

- `src/index.ts`: Punto de entrada principal. Orquesta la generación de pacientes y el scraping.
- `src/services/`: Lógica de negocio (scraping, generación de pacientes).
- `src/parsers/`: Utilidades para parsear semillas y datos.
- `src/db/`: Configuración de Prisma.
- `prisma/schema.prisma`: Definición del esquema de la base de datos.
- `sql/init.sql`: Script SQL de inicialización (usado por Docker).
- `Dockerfile`: Definición de la imagen del contenedor.
- `docker-compose.yml`: Orquestación de servicios (App + DB).

## Variables de Entorno

El contenedor de Docker ya viene preconfigurado en `docker-compose.yml`. Las variables principales son:

- `DATABASE_URL`: URL de conexión a PostgreSQL.
- `CONCURRENCY`: Número de tareas simultáneas (default: 5).
- `DELAY_MS`: Retraso entre peticiones para evitar bloqueos (default: 600ms).
- `MAX_PAGES_PER_SEED`: Límite de páginas a scrapear por especialidad/servicio.



# Inconvenientes y Observaciones al Obtener Datos de Doctoralia

Durante el desarrollo del scraper se presentaron varios retos y limitaciones al momento de obtener los datos:

1. **Tiempo de carga de los datos**  
   Algunos valores, especialmente los **precios (`price`) y nombres de doctores**, dependían del tiempo de carga de la página. Esto hizo que la obtención de datos fuera más lenta y requería esperar a que la información estuviera disponible antes de leerla.

2. **Especialidades con doctores repetidos**  
   En algunos casos, dentro de una misma especialidad, los doctores tenían el **mismo nombre**, lo que dificultaba la identificación única de cada profesional.

3. **Horarios de atención**  
   Los horarios eran especialmente complicados de obtener porque la página utilizaba **scroll dinámico**. Cada vez que se hacía scroll, se cargaban nuevos datos que la librería de scraping no captaba automáticamente, lo que imposibilitaba obtener todos los horarios de manera completa.

4. **Logs de errores**  
   Dentro de los logs aparecen líneas con `Error fetch`, que indican que **ese doctor no tiene horarios disponibles** en la página. Esto no significa que haya un fallo en el scraper, sino que la información simplemente no está disponible en la web.

