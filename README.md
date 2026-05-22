<<<<<<< HEAD
<<<<<<< HEAD
# 🛒 Buyza - Marketplace con Microservicios

## 📌 Descripción

**Buyza** es una plataforma tipo marketplace desarrollada bajo arquitectura de **microservicios**, donde los usuarios pueden registrarse como compradores o vendedores, publicar productos, realizar compras y gestionar pagos.

El sistema implementa autenticación con **JWT**, control de roles y comunicación entre servicios mediante HTTP.

---

## 🧩 Arquitectura
![Arquitectura](Arquitectura.jpeg)

El sistema está dividido en los siguientes microservicios:

* 🔐 **Usuarios** → Registro, login, roles y estados
* 📦 **Catálogo** → Gestión de productos
* 🧾 **Órdenes** → Creación y gestión de compras
* 💳 **Pagos** → Procesamiento de pagos
* 💰 **Crédito** → Gestión de cupos de crédito

Cada microservicio tiene su propia base de datos.

---

## 🗄️ Bases de Datos

* `buyza_usuarios`
* `buyza_catalogo`
* `buyza_ordenes`
* `buyza_pagos`
* `buyza_credito`

---

## 👤 Roles de Usuario

### 🛍️ Comprador

* Puede ver catálogo
* Puede comprar productos
* Puede pagar órdenes

### 🏪 Vendedor

* Puede publicar productos
* Puede editar y desactivar productos
* **Sus productos se aprueban automáticamente si su cuenta está activa**

### 🛠️ Admin

* Aprueba vendedores
* Puede aprobar productos manualmente (aunque ya no es necesario normalmente)

---

## 🔐 Autenticación

Se usa **JWT (JSON Web Token)**.

### Características:

* El token incluye:

  * `id`
  * `rol`
* Se envía en cada request:

```
Authorization: Bearer <token>
```

### Expiración:

* Configurada actualmente en:

```
7 días
```

### Manejo en frontend:

* Si el token expira:

```js
if (res.status === 403) {
    cerrarSesion();
    window.location.href = 'login.html';
}
```

---

## 🔄 Flujo del Sistema

### 1. Registro

* Comprador → activo automáticamente
* Vendedor → estado `pendiente`

### 2. Aprobación

* Admin cambia estado a `activo`

### 3. Publicación de producto

* Si vendedor está activo:
  ✅ Producto se aprueba automáticamente
* Si no:
  ⏳ Queda pendiente

### 4. Compra

* Se crea orden
* Se descuenta stock

### 5. Pago

* Se registran abonos
* Cuando se completa:

  * Orden pasa a `pagada`
  * Se descuenta crédito

---

## 📡 Endpoints principales

### Usuarios

* `POST /api/usuarios/register`
* `POST /api/usuarios/login`
* `GET /api/usuarios/perfil`
* `PUT /api/usuarios/:id/estado`

---

### Catálogo

* `GET /api/catalogo`
* `GET /api/catalogo/:id`
* `POST /api/catalogo` (vendedor)
* `PUT /api/catalogo/:id`
* `PUT /api/catalogo/:id/desactivar`
* `PUT /api/catalogo/:id/aprobar` (admin)

---

### Órdenes

* `POST /api/ordenes`
* `GET /api/ordenes/:id`
* `PUT /api/ordenes/:id/estado`

---

### Pagos

* `POST /api/pagos/procesar`
* `GET /api/pagos/estado-cuenta/:id_orden`

---

### Crédito

* `POST /api/credito/usar`
* `GET /api/credito/:usuario_id`

---

## ⚙️ Tecnologías

* Node.js
* Express
* MySQL
* JWT
* Axios
* HTML + JS (Frontend simple)
* Vagrant (entorno VM)

---

## 🚨 Problemas resueltos

### ✔️ Error 404 + HTML en respuesta

* Causado por rutas incorrectas → solucionado

### ✔️ JWT expirado

* Se aumentó expiración a `7d`
* Manejo en frontend agregado

### ✔️ Error `cantidad null`

* Se corrigió envío desde frontend (`stock → cantidad`)

### ✔️ Productos no visibles

* Se eliminó aprobación manual innecesaria
* Ahora depende del estado del vendedor

### ✔️ Error de módulos

* Nombres inconsistentes (`productosController → catalogoController`)

---

## 🚀 Mejoras futuras

* Refresh tokens (mejor que tokens largos)
* Subida real de imágenes (no URL)
* Panel admin UI
* Logs centralizados
* Dockerización

---

## ▶️ Ejecución

Cada microservicio:

```bash
npm install
node src/index.js
```

---

## 📌 Notas importantes

* Cada servicio corre en un puerto distinto:

  * Usuarios → 3001
  * Catálogo → 3002
  * Órdenes → 3003
  * Pagos → 3004
  * Crédito → 3005

* Comunicación interna por IP:

```
192.168.100.X
```

---

Si quieres, en el siguiente paso te puedo dejar el README aún más pro (nivel presentación final) con:

* diagramas de arquitectura
* flujo visual tipo UML
* y narrativa para sustentar el proyecto 🔥
=======
# Buyza
>>>>>>> d06cd9293664ea0def0c4c85998b397f30f9fd20
