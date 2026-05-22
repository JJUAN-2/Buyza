"""
analisis_spark.py — Buyza Marketplace Analytics con PySpark
Lee datos de los CSV exportados de las bases de datos MySQL
y genera reportes estadísticos en JSON para el dashboard.

Uso:
  python analisis_spark.py

Salida:
  /spark-results/estadisticas.json
"""

from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col, count, sum as spark_sum, avg, max as spark_max,
    month, year, date_format, desc, when, round as spark_round,
    to_timestamp
)
import json
import os
import sys
from datetime import datetime

# ─── Configuración ────────────────────────────────────────────────────────────
OUTPUT_DIR = os.environ.get("SPARK_RESULTS_DIR", "/spark-results")
DATA_DIR   = os.environ.get("SPARK_DATA_DIR",    "/spark-data")

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ─── Iniciar SparkSession (modo local) ────────────────────────────────────────
spark = SparkSession.builder \
    .appName("BuyzaMarketplaceAnalytics") \
    .master("local[*]") \
    .config("spark.driver.memory", "512m") \
    .config("spark.executor.memory", "512m") \
    .config("spark.sql.shuffle.partitions", "4") \
    .getOrCreate()

spark.sparkContext.setLogLevel("WARN")

print(f"[Spark] Sesión iniciada — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

# ─── Cargar CSVs ──────────────────────────────────────────────────────────────
def cargar_csv(nombre, schema_hint=None):
    path = os.path.join(DATA_DIR, nombre)
    if not os.path.exists(path):
        print(f"[WARN] No se encontró {path}, usando datos vacíos")
        return None
    return spark.read.option("header", "true") \
                     .option("inferSchema", "true") \
                     .csv(path)

df_usuarios  = cargar_csv("usuarios.csv")
df_productos = cargar_csv("productos.csv")
df_ordenes   = cargar_csv("ordenes.csv")
df_detalles  = cargar_csv("orden_detalles.csv")
df_pagos     = cargar_csv("pagos.csv")
df_creditos  = cargar_csv("creditos.csv")
df_movs      = cargar_csv("movimientos_credito.csv")

resultados = {
    "generado_en": datetime.now().isoformat(),
    "spark_version": spark.version
}

# ─── 1. RESUMEN GENERAL ───────────────────────────────────────────────────────
print("[Spark] Calculando resumen general...")

resumen = {}

if df_usuarios is not None:
    resumen["total_usuarios"]   = df_usuarios.count()
    resumen["compradores"]      = df_usuarios.filter(col("rol") == "comprador").count()
    resumen["vendedores"]       = df_usuarios.filter(col("rol") == "vendedor").count()
    resumen["admins"]           = df_usuarios.filter(col("rol") == "admin").count()
    resumen["usuarios_activos"] = df_usuarios.filter(col("estado") == "activo").count()
    resumen["usuarios_pendientes"] = df_usuarios.filter(col("estado") == "pendiente").count()

if df_productos is not None:
    resumen["total_productos"]   = df_productos.count()
    resumen["productos_activos"] = df_productos.filter(col("activo") == 1).count()
    avg_precio = df_productos.agg(spark_round(avg("precio"), 2)).collect()[0][0]
    resumen["precio_promedio"]   = float(avg_precio) if avg_precio else 0

if df_ordenes is not None:
    resumen["total_ordenes"]   = df_ordenes.count()
    resumen["ordenes_pagadas"] = df_ordenes.filter(col("estado") == "pagada").count()
    resumen["ordenes_pendientes"] = df_ordenes.filter(col("estado") == "pendiente").count()
    total_rev = df_ordenes.filter(col("estado") == "pagada") \
                          .agg(spark_round(spark_sum("total"), 2)).collect()[0][0]
    resumen["ingresos_totales"] = float(total_rev) if total_rev else 0

if df_pagos is not None:
    resumen["total_pagos"]  = df_pagos.count()
    total_pagado = df_pagos.agg(spark_round(spark_sum("monto"), 2)).collect()[0][0]
    resumen["monto_total_pagado"] = float(total_pagado) if total_pagado else 0

resultados["resumen"] = resumen

# ─── 2. TOP 5 PRODUCTOS MÁS VENDIDOS ─────────────────────────────────────────
print("[Spark] Calculando productos más vendidos...")

if df_detalles is not None and df_productos is not None:
    top_prods = df_detalles \
        .groupBy("id_producto") \
        .agg(
            spark_sum("cantidad").alias("unidades_vendidas"),
            spark_round(spark_sum(col("cantidad") * col("precio_unitario")), 2).alias("ingresos")
        ) \
        .orderBy(desc("unidades_vendidas")) \
        .limit(5)

    # Join con nombres de productos
    top_con_nombre = top_prods.join(
        df_productos.select(col("id").alias("id_producto"), col("nombre")),
        on="id_producto", how="left"
    )

    resultados["top_productos"] = [
        {
            "id": r["id_producto"],
            "nombre": r["nombre"] or f"Producto #{r['id_producto']}",
            "unidades_vendidas": int(r["unidades_vendidas"]),
            "ingresos": float(r["ingresos"] or 0)
        }
        for r in top_con_nombre.collect()
    ]
else:
    resultados["top_productos"] = []

# ─── 3. INGRESOS POR MES ──────────────────────────────────────────────────────
print("[Spark] Calculando ingresos por mes...")

if df_ordenes is not None:
    df_ord_ts = df_ordenes.withColumn("fecha_ts", to_timestamp("fecha"))
    ingresos_mes = df_ord_ts \
        .filter(col("estado") == "pagada") \
        .withColumn("mes", date_format("fecha_ts", "yyyy-MM")) \
        .groupBy("mes") \
        .agg(
            spark_round(spark_sum("total"), 2).alias("ingresos"),
            count("id").alias("num_ordenes")
        ) \
        .orderBy("mes")

    resultados["ingresos_por_mes"] = [
        {
            "mes": r["mes"],
            "ingresos": float(r["ingresos"] or 0),
            "num_ordenes": int(r["num_ordenes"])
        }
        for r in ingresos_mes.collect()
    ]
else:
    resultados["ingresos_por_mes"] = []

# ─── 4. DISTRIBUCIÓN DE ROLES DE USUARIO ─────────────────────────────────────
print("[Spark] Calculando distribución de usuarios...")

if df_usuarios is not None:
    dist_roles = df_usuarios \
        .groupBy("rol") \
        .agg(count("id").alias("cantidad")) \
        .orderBy(desc("cantidad"))

    resultados["distribucion_roles"] = [
        {"rol": r["rol"], "cantidad": int(r["cantidad"])}
        for r in dist_roles.collect()
    ]
else:
    resultados["distribucion_roles"] = []

# ─── 5. MÉTODOS DE PAGO MÁS USADOS ───────────────────────────────────────────
print("[Spark] Calculando métodos de pago...")

if df_pagos is not None:
    metodos = df_pagos \
        .groupBy("metodo_pago") \
        .agg(
            count("id").alias("usos"),
            spark_round(spark_sum("monto"), 2).alias("monto_total")
        ) \
        .orderBy(desc("usos"))

    resultados["metodos_pago"] = [
        {
            "metodo": r["metodo_pago"],
            "usos": int(r["usos"]),
            "monto_total": float(r["monto_total"] or 0)
        }
        for r in metodos.collect()
    ]
else:
    resultados["metodos_pago"] = []

# ─── 6. ANÁLISIS DE CRÉDITO ───────────────────────────────────────────────────
print("[Spark] Calculando análisis de crédito...")

if df_creditos is not None:
    credito_stats = df_creditos.agg(
        spark_round(avg("cupo_total"), 2).alias("cupo_promedio"),
        spark_round(avg("cupo_disponible"), 2).alias("disponible_promedio"),
        spark_round(spark_sum("cupo_total") - spark_sum("cupo_disponible"), 2).alias("cupo_usado_total"),
        count("id").alias("total_lineas")
    ).collect()[0]

    resultados["credito"] = {
        "cupo_promedio":       float(credito_stats["cupo_promedio"] or 0),
        "disponible_promedio": float(credito_stats["disponible_promedio"] or 0),
        "cupo_usado_total":    float(credito_stats["cupo_usado_total"] or 0),
        "total_lineas":        int(credito_stats["total_lineas"])
    }
else:
    resultados["credito"] = {}

# ─── 7. ESTADO DE ÓRDENES (para gráfica de dona) ─────────────────────────────
if df_ordenes is not None:
    estados = df_ordenes \
        .groupBy("estado") \
        .agg(count("id").alias("cantidad"))

    resultados["estados_ordenes"] = [
        {"estado": r["estado"], "cantidad": int(r["cantidad"])}
        for r in estados.collect()
    ]
else:
    resultados["estados_ordenes"] = []

# ─── 8. PRECIO PROMEDIO POR CATEGORÍA (simulado por vendedor) ─────────────────
if df_productos is not None:
    por_vendedor = df_productos \
        .groupBy("id_vendedor") \
        .agg(
            count("id").alias("num_productos"),
            spark_round(avg("precio"), 2).alias("precio_promedio"),
            spark_round(spark_sum(col("precio") * col("cantidad")), 2).alias("valor_inventario")
        ) \
        .orderBy(desc("num_productos")) \
        .limit(5)

    resultados["inventario_por_vendedor"] = [
        {
            "vendedor_id": int(r["id_vendedor"]),
            "num_productos": int(r["num_productos"]),
            "precio_promedio": float(r["precio_promedio"] or 0),
            "valor_inventario": float(r["valor_inventario"] or 0)
        }
        for r in por_vendedor.collect()
    ]
else:
    resultados["inventario_por_vendedor"] = []

# ─── Guardar resultados ───────────────────────────────────────────────────────
output_path = os.path.join(OUTPUT_DIR, "estadisticas.json")
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(resultados, f, ensure_ascii=False, indent=2)

print(f"[Spark] ✅ Resultados guardados en: {output_path}")

spark.stop()
print("[Spark] Sesión finalizada.")
