# Fix para Error "WebSocket Error" en AWS

## ❌ Error Actual
```
Unable to connect to server: websocket error
```

## ✅ Cambios Implementados

### 1. **Detección Automática de Entorno**
**Archivo:** `client/src/App.jsx` (líneas 12-20)

**Antes:**
```javascript
const SOCKET_URL = import.meta.env.PROD ? window.location.origin : 'http://localhost:3000';
```

**Después:**
```javascript
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const SOCKET_URL = isLocalhost ? 'http://localhost:3000' : window.location.origin;
```

**Por qué:** `import.meta.env.PROD` no siempre se establece correctamente. La nueva detección verifica directamente el hostname.

### 2. **Servidor Escucha en Todas las Interfaces**
**Archivo:** `server/index.js` (líneas 674-685)

**Cambio:**
```javascript
const HOST = '0.0.0.0'; // Escucha en todas las interfaces
httpServer.listen(PORT, HOST, () => {
  // ...
});
```

**Por qué:** AWS necesita que el servidor escuche en `0.0.0.0` para aceptar conexiones externas.

### 3. **Configuración Robusta de Socket.io**

**Servidor:**
```javascript
const io = new Server(httpServer, {
  path: '/socket.io',
  cors: {
    origin: "*",
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});
```

**Cliente:**
```javascript
const newSocket = io(SOCKET_URL, {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  timeout: 20000
});
```

## 🚀 Instrucciones de Deployment

### Paso 1: Build del Cliente
```bash
cd /home/operador/Descargas/CDP_practice
cd client && npm run build && cd ..
```

### Paso 2: Usar el Script de Deployment

**Opción A - Con Variables de Entorno:**
```bash
export AWS_REGION="us-east-1"
export AWS_ACCOUNT_ID="tu-account-id"
export REPO_NAME="cloudexam-prep"

./deploy-to-aws.sh
```

**Opción B - Inline:**
```bash
AWS_REGION=us-east-1 AWS_ACCOUNT_ID=123456789012 ./deploy-to-aws.sh
```

### Paso 3: Deploy en App Runner

**Opción 1 - AWS Console:**
1. Ve a: https://console.aws.amazon.com/apprunner
2. Selecciona tu servicio
3. Click en "Deploy"
4. Espera 5-10 minutos

**Opción 2 - AWS CLI:**
```bash
aws apprunner start-deployment \
  --service-arn "arn:aws:apprunner:REGION:ACCOUNT:service/SERVICE-NAME/SERVICE-ID" \
  --region us-east-1
```

## 🔍 Verificación Post-Deployment

### 1. Health Check
```bash
curl https://TU-URL.awsapprunner.com/health
```

**Respuesta esperada:**
```json
{
  "status": "healthy",
  "rooms": 0,
  "questions": 349,
  "environment": "production",
  "timestamp": "2025-11-25T..."
}
```

### 2. API Check
```bash
curl https://TU-URL.awsapprunner.com/api
```

**Respuesta esperada:**
```json
{
  "name": "CloudExam Prep API",
  "version": "1.0.0",
  "status": "running",
  "endpoints": {
    "health": "/health",
    "rooms": "/api/rooms",
    "questionCount": "/api/questions/count"
  }
}
```

### 3. Verificación en el Navegador

Abre la consola del navegador (F12) y busca estos logs:

✅ **Logs Correctos:**
```
🌐 Environment: {
  hostname: "tu-url.awsapprunner.com",
  origin: "https://tu-url.awsapprunner.com",
  isLocalhost: false,
  SOCKET_URL: "https://tu-url.awsapprunner.com"
}
✅ Connected to server: https://tu-url.awsapprunner.com
📡 Fetching question count from: https://tu-url.awsapprunner.com/api/questions/count
✅ Loaded 349 questions
```

❌ **Logs con Error:**
```
❌ Connection error: websocket error
```

## 🐛 Troubleshooting

### Error: "WebSocket Error" persiste

**Verificaciones:**

1. **Verifica que el servidor está escuchando correctamente:**
   - En los logs de App Runner, busca: `🚀 CloudExam Prep Server running on 0.0.0.0:3000`
   - Si dice `localhost:3000`, el build no se hizo correctamente

2. **Verifica la URL en el navegador:**
   - Abre la consola del navegador
   - Busca el log `🌐 Environment:`
   - Verifica que `SOCKET_URL` apunta a tu dominio de AWS (no a localhost)

3. **Verifica CORS:**
   - En los logs del servidor, busca: `🌐 CORS: Enabled for all origins`

4. **Verifica los transports:**
   - En los logs de conexión del servidor: `Transport: polling` o `Transport: websocket`
   - Si no ves ninguno, Socket.io no está recibiendo conexiones

### Error: "Failed to fetch"

**Causa:** El frontend no puede alcanzar el backend

**Solución:**
1. Verifica que App Runner está corriendo:
   ```bash
   aws apprunner list-services --region us-east-1
   ```

2. Verifica que el servicio está "RUNNING":
   ```bash
   aws apprunner describe-service --service-arn "YOUR_ARN"
   ```

3. Verifica el health check en AWS Console

### Error: Socket se conecta pero no puede crear rooms

**Causa:** Problema con los eventos de Socket.io

**Debug:**
1. En los logs del servidor, busca:
   ```
   🔌 Client connected: [socket-id]
   Transport: [websocket|polling]
   ```

2. Cuando intentas crear un room, busca:
   ```
   🏠 Room created: [6-digit-code]
   ```

3. Si no aparece, revisa el callback del emit en el cliente

## 📊 Logs del Servidor en AWS

Para ver los logs en tiempo real:

```bash
# Usando AWS CLI
aws logs tail /aws/apprunner/SERVICE-NAME/SERVICE-ID/application \
  --follow \
  --region us-east-1
```

**O en AWS Console:**
1. Ve a App Runner > Tu servicio > Logs
2. Selecciona "Application logs"
3. Click en "View in CloudWatch"

## ⚙️ Variables de Entorno en App Runner

Asegúrate de tener configuradas:

| Variable | Valor | Requerida |
|----------|-------|-----------|
| `NODE_ENV` | `production` | ✅ Sí |
| `PORT` | `3000` | ❌ No (default) |
| `HOST` | `0.0.0.0` | ❌ No (default) |

## 🎯 Checklist de Deployment

Antes de hacer deploy, verifica:

- [ ] Build del cliente completado: `cd client && npm run build`
- [ ] Archivo `client/dist/index.html` existe
- [ ] Archivo `questions.json` existe en la raíz
- [ ] Docker image construida localmente: `docker build -t cloudexam-prep .`
- [ ] Probado localmente: `docker run -p 3000:3000 -e NODE_ENV=production cloudexam-prep`
- [ ] Image pusheada a ECR
- [ ] App Runner deployment iniciado
- [ ] Health check pasa: `/health` retorna 200
- [ ] API endpoint responde: `/api` retorna JSON
- [ ] Frontend carga: página principal se ve
- [ ] Socket.io conecta: logs en consola muestran "✅ Connected"
- [ ] Crear room funciona
- [ ] Unirse a room funciona

## 🔐 Seguridad

### CORS en Producción (Opcional - Más Seguro)

Si quieres restringir CORS solo a tu dominio:

```javascript
// En server/index.js
const io = new Server(httpServer, {
  path: '/socket.io',
  cors: {
    origin: process.env.ALLOWED_ORIGIN || "*",
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});
```

Luego en App Runner, agrega la variable de entorno:
```
ALLOWED_ORIGIN=https://tu-url.awsapprunner.com
```

## 📱 Testing desde Múltiples Dispositivos

1. **Crea un room desde tu computadora**
2. **Copia el código de 6 dígitos**
3. **Únete desde tu teléfono usando el código**
4. **Verifica que ambos aparecen en el lobby**

Si esto funciona, ¡todo está correcto!

## 🆘 Soporte Adicional

Si después de estos pasos aún tienes problemas:

1. **Captura screenshots de:**
   - Consola del navegador (F12 > Console)
   - Network tab (F12 > Network) filtrando por "socket.io"
   - Logs de App Runner

2. **Incluye:**
   - URL de tu aplicación
   - Versión de Node.js: `node --version`
   - Región de AWS
   - Timestamp del error

3. **Comandos útiles:**
   ```bash
   # Ver imagen en ECR
   aws ecr describe-images \
     --repository-name cloudexam-prep \
     --region us-east-1

   # Ver estado del servicio
   aws apprunner describe-service \
     --service-arn "YOUR_ARN" \
     --region us-east-1 \
     --query 'Service.Status'

   # Ver logs recientes
   aws logs tail /aws/apprunner/SERVICE/ID/application \
     --since 1h \
     --region us-east-1
   ```

## ✨ Cambios Clave vs Versión Anterior

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Detección Prod** | `import.meta.env.PROD` | Verifica hostname directamente |
| **Socket URL** | Variable de entorno | Auto-detecta según hostname |
| **Servidor Host** | Sin especificar | `0.0.0.0` explícito |
| **Logging** | Básico | Detallado con debugging |
| **Transports** | Solo config cliente | Config en cliente y servidor |
| **Reconexión** | Default | Configurada explícitamente |

---

**Última actualización:** 2025-11-25
**Versión:** 2.0
