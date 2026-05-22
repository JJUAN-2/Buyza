#!/usr/bin/env python3
"""
=============================================================
  ANÁLISIS ESTADÍSTICO DISTRIBUIDO – BUYZA MARKETPLACE
=============================================================
Utiliza Apache Spark (PySpark) para el procesamiento de datos
distribuido y Matplotlib/Pandas para la visualización, 
cumpliendo con los requerimientos de infraestructura.
"""

import os
import argparse
import warnings
import matplotlib
matplotlib.use('Agg')  # Para entorno de consola (VM)
import matplotlib.pyplot as plt

# Importaciones de PySpark
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, sum as spark_sum, avg, max as spark_max, min as spark_min

# Ignorar warnings visuales
warnings.filterwarnings('ignore')

def parse_args():
    p = argparse.ArgumentParser(description='Analytics Buyza con PySpark')
    p.add_argument('--host', default='127.0.0.1', help='Host MySQL (default: 127.0.0.1)')
    p.add_argument('--user', default='root', help='Usuario MySQL (default: root)')
    p.add_argument('--password', default='', help='Contraseña MySQL (default: vacío)')
    return p.parse_args()

ARGS = parse_args()

OUTPUT_DIR = 'graficas'
os.makedirs(OUTPUT_DIR, exist_ok=True)

def main():
    print('═' * 75)
    print('  🚀  ANÁLISIS ESTADÍSTICO (APACHE SPARK) – BUYZA MARKETPLACE')
    print('═' * 75)

    # 1. Inicializar Spark Session con el conector JDBC de MySQL
    print("\n[*] Iniciando nodo de procesamiento Apache Spark...")
    spark = SparkSession.builder \
        .appName("BuyzaAnalytics") \
        .config("spark.jars.packages", "mysql:mysql-connector-java:8.0.33") \
        .getOrCreate()
    
    # Reducir los logs verbosos de Spark en consola
    spark.sparkContext.setLogLevel("ERROR")

    # Configuración de conexión JDBC
    jdbc_url_base = f"jdbc:mysql://{ARGS.host}:3306/"
    connection_properties = {
        "user": ARGS.user,
        "password": ARGS.password,
        "driver": "com.mysql.cj.jdbc.Driver"
    }

    # 2. Distribución de Tipos de Usuarios (Leído desde CSV)
    print("\n[*] Procesando distribución de usuarios (Extracción desde CSV)...")
    csv_path = "usuarios_estructuras.csv"
    if os.path.exists(csv_path):
        # Lectura distribuida con PySpark
        df_usr_spark = spark.read.csv(csv_path, header=True, inferSchema=True)
        # Transformación en clúster
        roles_count_spark = df_usr_spark.groupBy("rol").count()
        
        # Convertir a Pandas ÚNICAMENTE para la gráfica
        df_roles_pd = roles_count_spark.toPandas()
        if not df_roles_pd.empty:
            print("Distribución calculada:")
            print(df_roles_pd.to_string(index=False))
            
            plt.figure(figsize=(8, 6))
            plt.pie(df_roles_pd['count'], labels=df_roles_pd['rol'], autopct='%1.1f%%', colors=['#6c63ff', '#22c55e', '#f59e0b'])
            plt.title('Distribución de Tipos de Usuarios')
            plt.savefig(f"{OUTPUT_DIR}/distribucion_usuarios_spark.png")
            plt.close()
    else:
        print(f" ⚠ Archivo {csv_path} no encontrado en el directorio actual.")

    # 3. Promedio de Precios (Extracción desde MySQL con conector JDBC)
    print("\n[*] Analizando catálogo de productos (Extracción vía JDBC)...")
    try:
        df_cat_spark = spark.read.jdbc(url=jdbc_url_base + "buyza_catalogo", table="productos", properties=connection_properties)
        
        stats = df_cat_spark.select(
            avg(col("precio")).alias("promedio"),
            spark_max(col("precio")).alias("maximo"),
            spark_min(col("precio")).alias("minimo")
        ).collect()[0]

        promedio = stats['promedio']
        
        if promedio is not None:
            print(f"  - Precio Promedio: ${stats['promedio']:,.2f}")
            print(f"  - Precio Máximo:   ${stats['maximo']:,.2f}")
            print(f"  - Precio Mínimo:   ${stats['minimo']:,.2f}")
            
            precios_pd = df_cat_spark.select("precio").toPandas()
            
            plt.figure(figsize=(8, 6))
            plt.hist(precios_pd['precio'], bins=10, color='#3b82f6', edgecolor='black', alpha=0.7)
            plt.axvline(promedio, color='red', linestyle='dashed', linewidth=1, label=f'Promedio: ${promedio:.2f}')
            plt.title('Distribución de Precios en el Catálogo')
            plt.xlabel('Precio ($)')
            plt.ylabel('Frecuencia')
            plt.legend()
            plt.savefig(f"{OUTPUT_DIR}/histograma_precios_spark.png")
            plt.close()
    except Exception as e:
        print(f" ⚠ Error obteniendo datos del catálogo vía JDBC: {e}")

    # 4. Productos Más Vendidos (JOIN distribuido en Spark)
    print("\n[*] Calculando top ventas con PySpark DataFrames (JOIN)...")
    try:
        df_ord_spark = spark.read.jdbc(url=jdbc_url_base + "buyza_ordenes", table="orden_detalles", properties=connection_properties)
        
        ventas_agrupadas = df_ord_spark.groupBy("id_producto").agg(spark_sum("cantidad").alias("total_vendido"))
        
        top_productos_spark = ventas_agrupadas.join(
            df_cat_spark,
            ventas_agrupadas.id_producto == df_cat_spark.id,
            "inner"
        ).select("nombre", "total_vendido").orderBy(col("total_vendido").desc()).limit(5)
        
        df_top_pd = top_productos_spark.toPandas()
        
        if not df_top_pd.empty:
            print("Top Productos Más Vendidos:")
            for index, row in df_top_pd.iterrows():
                print(f"  - {row['nombre']}: {row['total_vendido']} unidades")
                
            plt.figure(figsize=(10, 6))
            plt.barh(df_top_pd['nombre'], df_top_pd['total_vendido'], color='#22c55e')
            plt.gca().invert_yaxis()
            plt.title('Top Productos Más Vendidos')
            plt.xlabel('Unidades Vendidas')
            plt.tight_layout()
            plt.savefig(f"{OUTPUT_DIR}/top_productos_spark.png")
            plt.close()
        else:
            print(" ⚠ No hay datos suficientes para el cruce de ventas.")
            
    except Exception as e:
        print(f" ⚠ Error procesando órdenes vía JDBC: {e}")

    spark.stop()
    
    print('\n' + '═' * 75)
    print(f" ✔ Proceso Spark Batch finalizado. Gráficas en: {OUTPUT_DIR}/")
    print('═' * 75)

if __name__ == '__main__':
    main()