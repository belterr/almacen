# 📦 Sistema de Pedidos con Verificación de Stock

## 🔄 Flujo del Proceso

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐      ┌─────────────┐
│   Cliente   │─────>│ Intermediario│─────>│   Almacén   │─────>│   Nosotros  │
│  (Frontend) │      │   (Externo)  │      │  (Externo)  │      │  (Webhook)  │
└─────────────┘      └──────────────┘      └─────────────┘      └─────────────┘
      │                      │                      │                      │
      │ 1. Tramitar          │                      │                      │
      │    pedido            │                      │                      │
      ├──────────────────────>                      │                      │
      │                      │ 2. Consultar         │                      │
      │                      │    stock             │                      │
      │                      ├──────────────────────>                      │
      │                      │                      │ 3. Verificar         │
      │                      │                      │    inventario        │
      │                      │                      │ 4. PROCESAR          │
      │                      │                      │    Y ENVIAR          │
      │                      │                      │                      │
      │                      │                      │ 5. Notificar         │
      │                      │                      │    (ya enviado)      │
      │                      │                      ├──────────────────────>
      │                      │                      │                      │
      │ 6. Monitorear        │                      │  6. Actualizar       │
      │    estado            │                      │     estado           │
      │<─────────────────────┼──────────────────────┴──────────────────────┘
```

## 📝 Descripción del Flujo

### 1. Cliente solicita tramitar pedido

El usuario hace clic en "Tramitar pedido" en el carrito.

**Frontend:**
- Crea una orden pendiente en Convex
- Obtiene un `orderId` único
- Estado inicial: `"pending"`

### 2. Llamada al Intermediario (Externo)

El frontend llama a **nuestra API intermediaria** que actúa como proxy para evitar problemas de CORS.

**Endpoint de nuestra API (proxy):**
```
POST /api/intermediario/verificar-stock
```

**Esta API luego llama al intermediario externo:**
```
POST https://tu-intermediario.com/api/verificar-stock
```

**Ventajas de usar nuestra API como proxy:**
- ✅ Evita problemas de CORS
- ✅ Permite agregar lógica de validación
- ✅ Facilita logging y debugging
- ✅ Oculta credenciales sensibles del cliente

**Payload que enviamos:**

El intermediario espera recibir **un producto a la vez**. Si hay múltiples productos, hacemos múltiples llamadas.

**Formato por cada producto:**
```json
{
  "product_id": "k17...",
  "quantity": 2
}
```

**Ejemplo con múltiples productos:**
- Producto 1: `{ "product_id": "k17abc", "quantity": 2 }`
- Producto 2: `{ "product_id": "k18def", "quantity": 1 }`
- Se hacen 2 llamadas separadas al intermediario

**Nota:** Solo se envía `product_id` y `quantity` por producto.

### 3. Intermediario consulta al Almacén

El intermediario (fuera de nuestro control) se comunica con el almacén para verificar stock.

### 4. Almacén verifica, procesa y notifica

El almacén verifica el stock y **si hay disponibilidad, automáticamente procesa el envío del producto**.

Cuando el almacén llama a nuestra API webhook con `hasStock: true`, significa que:
- ✅ Verificó que hay stock disponible
- ✅ Ya procesó el pedido
- ✅ El producto está en proceso de envío

**Webhook que debemos proporcionar:**
```
POST https://tu-dominio.com/api/webhook/almacen-respuesta
```

**Payload que el almacén nos envía:**
```json
{
  "orderId": "ORD-1731267890-abc123",
  "sessionId": "session_xxx",
  "hasStock": true,
  "products": [
    {
      "productId": "k17...",
      "quantity": 2,
      "availableStock": 10
    }
  ],
  "message": "Stock disponible"
}
```

### 5. Procesamiento de la respuesta

Cuando recibimos la notificación del almacén:

**Si `hasStock = true`:**
- ✅ El almacén **ya procesó y envió el pedido**
- Actualizamos el estado de la orden a `"confirmed"`
- Vaciamos el carrito automáticamente
- Mostramos notificación de éxito al usuario: "¡Pedido confirmado y enviado!"

**Si `hasStock = false`:**
- ❌ No hay stock disponible
- Actualizamos el estado de la orden a `"rejected"`
- Mostramos notificación de error con productos sin stock
- El carrito permanece intacto para que el usuario pueda modificar su pedido

## 🗄️ Base de Datos (Convex)

### Tabla: `pendingOrders`

```typescript
{
  _id: Id<"pendingOrders">,
  sessionId: string,
  orderId: string,
  products: Array<{
    productId: string,
    quantity: number,
    price: number
  }>,
  totalAmount: number,
  status: "pending" | "confirmed" | "rejected",
  createdAt: number,
  _creationTime: number
}
```

### Índices:
- `by_session`: Para obtener órdenes por sessionId
- `by_orderId`: Para buscar orden específica
- `by_status`: Para filtrar por estado

## 🔌 APIs Implementadas (Nuestro lado)

### 1. API Proxy para llamar al intermediario

**Ruta:** `/api/intermediario/verificar-stock`  
**Método:** `POST`  
**Descripción:** Proxy que llama al intermediario externo (evita CORS)

**Request del frontend:**
```json
{
  "orderId": "string",
  "sessionId": "string",
  "products": Array<{ productId: string, quantity: number }>,
  "totalAmount": number,
  "webhookUrl": "string"
}
```

**Acciones:**
1. Valida que `NEXT_PUBLIC_INTERMEDIARIO_URL` esté configurada
2. **Itera sobre cada producto del carrito**
3. Por cada producto, hace una llamada separada al intermediario
4. Envía solo `product_id` y `quantity`
5. Retorna array con todas las respuestas

**Payload enviado al intermediario por producto:**
```json
{
  "product_id": "string",
  "quantity": number
}
```

**Importante:** 
- Una llamada por producto
- No se envía información de orden, sesión o webhook
- El intermediario debe identificar internamente cómo responder

**Response:**
```json
{
  "success": true,
  "message": "Solicitud enviada al intermediario correctamente",
  "data": { ...respuesta del intermediario... }
}
```

### 2. Webhook para recibir respuesta del almacén

**Ruta:** `/api/webhook/almacen-respuesta`  
**Método:** `POST`  
**Descripción:** Recibe la confirmación o rechazo del almacén

**Configuración CORS:**
- ✅ Incluye headers CORS para permitir llamadas externas
- ✅ Soporta preflight requests (OPTIONS)
- ⚠️ En producción, especifica el dominio del almacén en `Access-Control-Allow-Origin`

**Request esperado del almacén:**
```json
{
  "orderId": "string",
  "sessionId": "string",
  "hasStock": boolean,
  "products": Array,
  "message": "string (opcional)"
}
```

**Response que devolvemos:**
```json
{
  "success": true,
  "message": "Confirmación recibida correctamente",
  "data": {
    "orderId": "...",
    "sessionId": "...",
    "status": "confirmed",
    "receivedAt": "2025-11-10T..."
  }
}
```

**Acciones internas:**
1. Actualiza estado en Convex (`confirmed` = producto enviado, `rejected` = sin stock)
2. Si `hasStock = true`, limpia el carrito (el pedido ya está en camino)
3. Registra logs para auditoría y seguimiento

## 🎯 Funciones de Convex

### `orders.createPendingOrder`

Crea una orden pendiente antes de llamar al intermediario.

```typescript
await createPendingOrder({ sessionId: "session_xxx" });
```

**Retorna:**
```typescript
{
  success: true,
  orderId: "ORD-...",
  sessionId: "session_xxx",
  products: [...],
  totalAmount: 3999.98
}
```

### `orders.updateOrderStatus`

Actualiza el estado de una orden cuando el almacén responde.

```typescript
await updateOrderStatus({
  orderId: "ORD-...",
  status: "confirmed" // o "rejected"
});
```

### `orders.getPendingOrders`

Obtiene órdenes pendientes de un usuario para monitoreo.

```typescript
await getPendingOrders({ sessionId: "session_xxx" });
```

### `orders.getOrderStatus`

Consulta el estado de una orden específica.

```typescript
await getOrderStatus({ orderId: "ORD-..." });
```

## 🎨 Interfaz de Usuario

### Estados del botón "Tramitar pedido"

1. **Normal**: `"Tramitar pedido"`
2. **Procesando**: `"Consultando stock..."` + spinner
3. **Esperando**: Toast "Esperando respuesta del almacén"

### Notificaciones (Toast)

**Consultando:**
```typescript
toast.info("Consultando stock...", {
  description: "Esperando respuesta del almacén",
  duration: 10000,
  icon: <Clock className="animate-pulse" />
});
```

**Confirmado:**
```typescript
toast.success("¡Pedido confirmado y enviado!", {
  description: `Tu pedido está en camino. Orden: ${orderId}`,
  icon: <CheckCircle2 />
});
```

**Rechazado:**
```typescript
toast.error("Stock insuficiente", {
  description: "El almacén no tiene stock disponible",
  icon: <XCircle />
});
```

## ⚙️ Configuración

### Variables de Entorno

```env
# URL del intermediario (externo)
NEXT_PUBLIC_INTERMEDIARIO_URL=https://tu-intermediario.com/api/verificar-stock

# URL de Convex
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud
```

### URL del Webhook

Debes proporcionar esta URL al intermediario/almacén:

```
https://tu-dominio.com/api/webhook/almacen-respuesta
```

**En desarrollo local (con ngrok):**
```
https://abc123.ngrok.io/api/webhook/almacen-respuesta
```

## 🔐 Seguridad

### Recomendaciones:

1. **Validar origen**: Verificar que las peticiones al webhook vengan del almacén
2. **Token de autenticación**: Agregar header `Authorization` en el webhook
3. **Timeout**: Las órdenes pendientes más de X tiempo deben expirar
4. **Logs**: Registrar todas las transacciones para auditoría

### Ejemplo con validación:

```typescript
export async function POST(request: NextRequest) {
  // Validar token
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.ALMACEN_SECRET_TOKEN;
  
  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json(
      { success: false, message: "No autorizado" },
      { status: 401 }
    );
  }
  
  // ... resto del código
}
```

## 📊 Monitoreo

### useEffect para monitorear cambios

El frontend escucha cambios en tiempo real:

```typescript
useEffect(() => {
  if (pendingOrders && currentOrderId) {
    const order = pendingOrders.find(o => o.orderId === currentOrderId);
    
    if (order?.status === "confirmed") {
      // Mostrar éxito y limpiar
    } else if (order?.status === "rejected") {
      // Mostrar error
    }
  }
}, [pendingOrders, currentOrderId]);
```

## 🧪 Testing

### 1. Simular webhook del almacén (desarrollo)

```bash
curl -X POST http://localhost:3000/api/webhook/almacen-respuesta \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-123",
    "sessionId": "session_xxx",
    "hasStock": true,
    "products": [],
    "message": "Stock disponible"
  }'
```

### 2. Verificar logs

```
✅ [ALMACÉN → NOSOTROS] Respuesta recibida del almacén
Order ID: ORD-123
Session ID: session_xxx
Tiene stock: true
✅ Orden ORD-123 actualizada a estado: confirmed
```

## 🚀 Despliegue

### Checklist:

- [ ] Configurar `NEXT_PUBLIC_INTERMEDIARIO_URL` con URL real
- [ ] Proporcionar URL del webhook al intermediario/almacén
- [ ] Agregar token de seguridad para webhook
- [ ] Configurar CORS si es necesario
- [ ] Monitorear logs en producción
- [ ] Configurar alertas para órdenes pendientes > 5 minutos

## 📞 Información para el Intermediario/Almacén

### Datos que esperamos recibir al webhook:

**URL del webhook (que nosotros proporcionamos):**  
`https://tu-dominio.com/api/webhook/almacen-respuesta`  
**Método:** `POST`  
**Content-Type:** `application/json`

**Body esperado:**
```json
{
  "orderId": "string (requerido)",
  "sessionId": "string (requerido)",
  "hasStock": boolean (requerido),
  "products": [
    {
      "productId": "string",
      "quantity": number,
      "availableStock": number
    }
  ],
  "message": "string (opcional)"
}
```

**Response que devolvemos:**
```json
{
  "success": boolean,
  "message": "string"
}
```

---

### Datos que enviamos al intermediario:

**URL del intermediario (que ellos nos proporcionan):**  
Configurada en `NEXT_PUBLIC_INTERMEDIARIO_URL`

**Método:** `POST`  
**Content-Type:** `application/json`

**Body que enviamos al intermediario:**

**Por cada producto en el carrito:**
```json
{
  "product_id": "1",
  "quantity": 2
}
```

**Campos:**
- `product_id`: ID externo del producto (externalId) que el intermediario/almacén reconoce
- `quantity`: Cantidad solicitada

**Importante:** 
- Se hace una llamada HTTP separada por cada producto
- El `product_id` enviado es el `externalId` del producto (ej: "1", "2", "3")
- Nuestro sistema mantiene un mapeo entre el ID interno de Convex y el `externalId`
- Los productos deben tener configurado el campo `externalId` en la base de datos

---

**Última actualización:** 10 de Noviembre, 2025
