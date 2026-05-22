#!/bin/bash
# exportar_datos_spark.sh
# Exporta las tablas de MySQL de cada microservicio a CSV para PySpark
# Ejecutar DENTRO del servidor Ubuntu1 en la carpeta ~/Buyza/

echo "📦 Exportando datos para análisis Spark..."

mkdir -p ./spark-data

# Función para exportar tabla MySQL a CSV usando docker exec
exportar_tabla() {
  local SERVICIO=$1   # nombre del servicio en Swarm, ej: buyza_stack_db-usuarios
  local DB=$2         # nombre de la base de datos
  local TABLA=$3      # nombre de la tabla
  local ARCHIVO=$4    # nombre del archivo CSV de salida

  echo "  → Exportando $DB.$TABLA..."

  # Obtener el container ID del servicio
  CONTAINER=$(docker ps --filter "name=${SERVICIO}" --format "{{.ID}}" | head -1)

  if [ -z "$CONTAINER" ]; then
    echo "  ⚠️  No se encontró container para $SERVICIO"
    return
  fi

  docker exec "$CONTAINER" mysql -uroot -e \
    "SELECT * FROM ${DB}.${TABLA}" \
    --batch --silent 2>/dev/null | \
    sed 's/\t/,/g' | \
    awk 'NR==1{print} NR>1{print}' \
    > "./spark-data/${ARCHIVO}"

  if [ $? -eq 0 ]; then
    echo "  ✅ Guardado: spark-data/${ARCHIVO}"
  else
    echo "  ❌ Error exportando $TABLA"
  fi
}

# Exportar cada tabla
exportar_tabla "buyza_stack_db-usuarios"  "buyza_usuarios"  "usuarios"           "usuarios.csv"
exportar_tabla "buyza_stack_db-catalogo"  "buyza_catalogo"  "productos"          "productos.csv"
exportar_tabla "buyza_stack_db-ordenes"   "buyza_ordenes"   "ordenes"            "ordenes.csv"
exportar_tabla "buyza_stack_db-ordenes"   "buyza_ordenes"   "orden_detalles"     "orden_detalles.csv"
exportar_tabla "buyza_stack_db-pagos"     "buyza_pagos"     "pagos"              "pagos.csv"
exportar_tabla "buyza_stack_db-credito"   "buyza_credito"   "creditos"           "creditos.csv"
exportar_tabla "buyza_stack_db-credito"   "buyza_credito"   "movimientos_credito" "movimientos_credito.csv"

echo ""
echo "✅ Exportación completada. Archivos en ./spark-data/"
ls -lh ./spark-data/
