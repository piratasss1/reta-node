#!/bin/sh
set -e

echo "Waiting for Postgres..."
until node -e "
  const { Client } = require('pg');
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  c.connect()
   .then(()=>c.end().then(()=>process.exit(0)))
   .catch(()=>process.exit(1));
"; do
  sleep 2
done

echo "Postgres is up."

# Esto asegura que los archivos generados por prisma existan
echo "Running prisma generate..."
npx prisma generate

echo "Running prisma migrate deploy..."
npx prisma migrate deploy || echo "No migrations yet / using init.sql"

echo "Starting scraper..."
npx tsx src/index.ts
