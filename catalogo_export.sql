-- MySQL dump 10.13  Distrib 8.0.45, for Linux (x86_64)
--
-- Host: localhost    Database: buyza_catalogo
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
-- Table structure for table `productos`
--

DROP TABLE IF EXISTS `productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_vendedor` int NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text,
  `precio` decimal(10,2) NOT NULL,
  `cantidad` int NOT NULL DEFAULT '0',
  `activo` tinyint(1) DEFAULT '1',
  `aprobado` tinyint(1) DEFAULT '0',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES (1,1,'iPhone 15 Pro','Titanium design, A17 Pro chip, 128GB storage',999.00,50,1,1,'2026-04-05 03:32:21'),(2,1,'Sony WH-1000XM5','Wireless Noise Canceling Headphones, 30-hour battery',348.00,120,1,1,'2026-04-05 03:32:21'),(3,2,'Samsung Galaxy S24 Ultra','AI features, S Pen included, 256GB Titanium Gray',1299.99,30,1,1,'2026-04-05 03:32:21'),(4,2,'MacBook Air M3','13-inch laptop, 8GB Unified Memory, 256GB SSD',1099.00,15,1,1,'2026-04-05 03:32:21'),(5,3,'Logitech MX Master 3S','Wireless Performance Mouse, Ultra-quiet scrolling',99.00,200,1,1,'2026-04-05 03:32:21'),(6,3,'Nintendo Switch OLED','7-inch OLED screen, Neon Red/Neon Blue',349.99,45,1,1,'2026-04-05 03:32:21'),(7,4,'Kindle Paperwhite','6.8-inch display, waterproof, adjustable warm light',149.99,80,1,1,'2026-04-05 03:32:21'),(8,4,'Dell UltraSharp U2723QE','27-inch 4K USB-C Hub Monitor, IPS Black technology',579.00,25,1,1,'2026-04-05 03:32:21'),(9,5,'GoPro HERO12 Black','5.3K60 Ultra HD Video, HDR, Waterproof action cam',399.99,60,1,1,'2026-04-05 03:32:21'),(10,5,'Keychron K2 Wireless','Mechanical Keyboard, RGB Backlight, Gateron Brown',79.00,100,1,1,'2026-04-05 03:32:21'),(11,17,'iPhone 17 Air','Apple Inc.',1500.00,12,1,1,'2026-04-07 00:48:28'),(12,17,'iPhone 16 Plus','Apple Inc.',1000.00,6,1,1,'2026-04-07 01:02:59'),(13,17,'Macbook Pro M4','Apple Inc.',5000.00,10,1,1,'2026-04-07 01:04:32');
/*!40000 ALTER TABLE `productos` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-22  4:40:49
