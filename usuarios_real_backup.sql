-- MySQL dump 10.13  Distrib 8.0.45, for Linux (x86_64)
--
-- Host: localhost    Database: marketplace_usuarios
-- ------------------------------------------------------
-- Server version	8.0.45-0ubuntu0.22.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cuotas_pendientes`
--

DROP TABLE IF EXISTS `cuotas_pendientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cuotas_pendientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `compra_id` int DEFAULT NULL,
  `monto_total` decimal(10,2) NOT NULL,
  `monto_por_cuota` decimal(10,2) NOT NULL,
  `cuotas_totales` int NOT NULL,
  `cuotas_pagadas` int DEFAULT '0',
  `estado` enum('al_dia','en_mora') DEFAULT 'al_dia',
  `fecha_compra` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `fk_cuotas_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cuotas_pendientes`
--

LOCK TABLES `cuotas_pendientes` WRITE;
/*!40000 ALTER TABLE `cuotas_pendientes` DISABLE KEYS */;
INSERT INTO `cuotas_pendientes` VALUES (1,16,NULL,999.00,999.00,1,0,'al_dia','2026-04-05 04:19:27'),(2,18,NULL,999.00,999.00,1,1,'al_dia','2026-04-08 17:06:50');
/*!40000 ALTER TABLE `cuotas_pendientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos_credito`
--

DROP TABLE IF EXISTS `movimientos_credito`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientos_credito` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `tipo` enum('compra','pago','aumento_cupo') NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `cuotas` int DEFAULT '1',
  `cupo_antes` decimal(10,2) DEFAULT NULL,
  `cupo_despues` decimal(10,2) DEFAULT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `fecha` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `fk_movimientos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_credito`
--

LOCK TABLES `movimientos_credito` WRITE;
/*!40000 ALTER TABLE `movimientos_credito` DISABLE KEYS */;
INSERT INTO `movimientos_credito` VALUES (1,16,'compra',999.00,1,100000.00,99001.00,'Compra en 1 cuota(s)','2026-04-05 04:19:27'),(2,18,'compra',999.00,1,100000.00,99001.00,'Compra en 1 cuota(s)','2026-04-08 17:06:50'),(3,18,'pago',999.00,1,99001.00,100000.00,'Pago cuota 1 de 1','2026-04-08 17:08:04');
/*!40000 ALTER TABLE `movimientos_credito` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('admin','comprador','vendedor') DEFAULT 'comprador',
  `estado` enum('activo','pendiente','rechazado') DEFAULT 'activo',
  `fecha_registro` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cupo_total` decimal(10,2) DEFAULT '100000.00',
  `cupo_disponible` decimal(10,2) DEFAULT '100000.00',
  `cupo_usado` decimal(10,2) DEFAULT '0.00',
  `veces_cupo_completo` int DEFAULT '0',
  `compras_completadas` int DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Admin Principal','admin@marketplace.com','$2b$10$duHeMdpQCUGr3UHdPIjpe.b6O1gsmJolXITP8oZEluZk4W/LutEUm','admin','activo','2026-03-23 20:14:53',100000.00,100000.00,0.00,0,0),(2,'Admin Buyza','admin@buyza.com','$2b$10$duHeMdpQCUGr3UHdPIjpe.b6O1gsmJolXITP8oZEluZk4W/LutEUm','admin','activo','2026-03-23 20:14:53',100000.00,100000.00,0.00,0,0),(3,'Juan Test','juan@test.com','$2b$10$hp1ioh/Efwhvxis24dFWz.gScB4HFVyLaDD1xr3T0S9c0sgcZju5K','comprador','activo','2026-03-23 20:14:53',150000.00,150000.00,0.00,0,0),(4,'Cristian Test','cristian@test.com','$2b$10$RsgUQxvFzqGO06J2GuU92e04G3R2yl2FiIVICmi3EHLw1HOKVMdzu','comprador','activo','2026-03-23 20:14:53',100000.00,100000.00,0.00,0,0),(5,'cuenta2','cuenta2@gmail.com','$2b$10$yWzfstlyqvqqWpLNVh2ccezMyMAz76giivsrex/y/N/AocUOVZmC6','comprador','activo','2026-04-03 21:15:52',100000.00,100000.00,0.00,0,0),(6,'Daniel Contreras','dcontreras@gmail.com','$2b$10$N3dzxysbZ/dXFOwqPWJlGeH4GwmxKTRWo4fCNHrOkTKCnK/ClJgaG','comprador','activo','2026-04-03 21:19:28',100000.00,100000.00,0.00,0,0),(7,'correo3','correo3@gmail.com','$2b$10$x71dPy7Nbe1UXj.NKZwvVejELKYdMmtr/7a5kOejMC5SK5qG0OKRO','comprador','activo','2026-04-03 22:07:36',100000.00,100000.00,0.00,0,0),(8,'CUENTA1','cuenta1@gmail.com','$2b$10$3qtm4LBZvgpe6k.QeXWRTuAizXqpqzRpjXMGuwc85voeYktifaJY6','comprador','activo','2026-04-04 04:15:14',100000.00,100000.00,0.00,0,0),(9,'Daniel Test','test@correo.com','$2b$10$bNmU8v9Z/PKPCWXoyOIubeKJw3lXuzZ./VNaBrIjQG5tvAUZO3FMi','comprador','activo','2026-04-04 04:23:01',100000.00,100000.00,0.00,0,0),(10,'test1','test1@gmail.com','$2b$10$6ogogjXzuVqiYfV03UwLcO0GyJDQaZsJfpsDaNqp4ivE7vi5gFxXa','comprador','activo','2026-04-04 04:38:23',100000.00,100000.00,0.00,0,0),(11,'test0','test0@test.com','$2b$10$xeQo0Yw4rT35dedT2Dmw1uk5U0pEiL/ulU81XLdeaGXRbea.d3oty','comprador','activo','2026-04-04 04:50:58',100000.00,100000.00,0.00,0,0),(12,'cuenta0','cuenta0@gmail.com','$2b$10$zuJZ4whjNDdhSypon2NUiOOzgmllIRpTQu8VbQH/bprCxbNJ9qORW','comprador','activo','2026-04-04 17:17:15',100000.00,100000.00,0.00,0,0),(13,'test1','test1@test.com','$2b$10$xSsD3By8X09Mtbqa.7b7ue.vy410sU29Kqu.cUUkatdoon45E4VJO','comprador','activo','2026-04-04 17:27:24',100000.00,100000.00,0.00,0,0),(14,'cuenta0','cuenta0@mail.com','$2b$10$i19Qt8f2tF77Ylt8IW0zMOF6jB7qqAn.RNzApGTV5X8dyqHGrfJr.','comprador','activo','2026-04-04 17:33:58',100000.00,100000.00,0.00,0,0),(15,'cuenta11','cuenta11@mail.com','$2b$10$b0kLEsVqGONno0VhQsfyhuEXLGXZH9bJtzMU6pwDxQOTRAdIadjfi','comprador','activo','2026-04-05 03:58:21',100000.00,100000.00,0.00,0,0),(16,'cuenta12','cuenta12@mail.com','$2b$10$cIkurvBPH0Ae114HQaeWfe10CU3fdW2dv.bGpRfRfLAGdUG5s4I1.','comprador','activo','2026-04-05 04:11:12',100000.00,99001.00,0.00,0,0),(17,'cuenta01','cuenta01@mail.com','$2b$10$V7J0VKtnI4XZU.Fiqdfsu./YclFpRC2PkfvpDdyXA.k42.XLlqz4u','vendedor','activo','2026-04-05 04:20:40',100000.00,100000.00,0.00,0,0),(18,'cuenta23','cuenta23@mail.com','$2b$10$Y7ougU9eKXa1A1RYmwd4KuH/MmdefegqLgLs.37oYWWuHm7zo/D/K','comprador','activo','2026-04-08 15:56:52',100000.00,100000.00,0.00,0,1),(19,'dcontreras','dcontrerass@gmail.com','$2b$10$a5Mw/bvafUY9X5zOsFfxguvJpo1S7hum.L/c23u.dBoKN614XEYxi','comprador','activo','2026-04-21 18:26:54',100000.00,100000.00,0.00,0,0);
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-22  4:39:32
