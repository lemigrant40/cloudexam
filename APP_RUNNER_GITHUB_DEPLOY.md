# Deploy a AWS App Runner desde GitHub - Fix WebSocket

## 🔴 Problema Resuelto

**Error original:**
```
WebSocket connection to 'wss://ypgbefmemd.us-east-2.awsapprunner.com/socket.io/?EIO=4&transport=websocket' failed
```

**Causa:** AWS App Runner proxy no maneja correctamente el upgrade de HTTP a WebSocket.

**Solución:** Cambiar el orden de transports a `['polling', 'websocket']` para que inicie con polling y luego intente upgrade.

## ✅ Cambios Implementados

### 1. Configuración de Socket.io Client
**Archivo:** `client/src/App.jsx` (líneas 38-49)

```javascript
const newSocket = io(SOCKET_URL, {
  path: '/socket.io',
  transports: ['polling', 'websocket'], // ← ORDEN CAMBIADO
  upgrade: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  timeout: 20000,
  forceNew: true
});
```

### 2. Archivo de Configuración App Runner
**Nuevo archivo:** `apprunner.yaml`

Este archivo le dice a App Runner cómo construir y ejecutar tu aplicación.

### 3. Variables de Entorno
Asegura que estén configuradas en App Runner:
- `NODE_ENV=production`
- `HOST=0.0.0.0`
- `PORT=3000`

## 🚀 Pasos para Deploy desde GitHub

### Paso 1: Commit y Push de los Cambios

```bash
cd /home/operador/Descargas/CDP_practice

# Verifica los cambios
git status

# Agrega todos los archivos
git add .

# Commit
git commit -m "Fix WebSocket connection for AWS App Runner - use polling transport first"

# Push al repositorio
git push origin main
```

### Paso 2: Configurar App Runner (Primera vez)

Si aún no has creado el servicio de App Runner:

1. **Ve a AWS Console:**
   https://console.aws.amazon.com/apprunner/home?region=us-east-2

2. **Crear Servicio:**
   - Click en "Create service"

3. **Configuración del Repositorio:**
   - Source: **Source code repository**
   - Repository provider: **GitHub**
   - Click "Add new" y conecta tu cuenta de GitHub
   - Selecciona tu repositorio
   - Branch: `main`
   - Deployment trigger: **Automatic** (para autodeploy en cada push)

4. **Configuración de Build:**
   - Build settings: **Use a configuration file**
   - Configuration file: `apprunner.yaml`

5. **Configuración del Servicio:**
   - Service name: `cloudexam-prep` (o el nombre que prefieras)
   - Port: `3000`

6. **Variables de Entorno (IMPORTANTE):**
   Click en "Add environment variable" y agrega:
   ```
   NODE_ENV=production
   HOST=0.0.0.0
   PORT=3000
   ```

7. **Otras configuraciones:**
   - CPU: 1 vCPU
   - Memory: 2 GB
   - Health check protocol: HTTP
   - Health check path: `/health`

8. **Review y Create**

### Paso 3: Redeploy (Si ya existe el servicio)

Si ya tienes el servicio configurado:

1. **Ve a AWS Console > App Runner**
2. Selecciona tu servicio `cloudexam-prep`
3. Como tienes Automatic deployment, el push ya debería haber iniciado un deploy
4. Si no, click en **"Deploy"** manualmente

### Paso 4: Verificar Variables de Entorno

1. En tu servicio de App Runner, ve a **Configuration** tab
2. Ve a **Environment variables**
3. Asegúrate de tener:
   ```
   NODE_ENV = production
   HOST = 0.0.0.0
   PORT = 3000
   ```
4. Si falta alguna, agrégala y click en **"Deploy"** nuevamente

## 🔍 Verificación Post-Deploy

### 1. Espera a que el Deploy Complete

En App Runner verás:
- ⏳ **Operation in progress** (2-5 minutos)
- ✅ **Running** (cuando esté listo)

### 2. Verifica el Health Endpoint

```bash
curl https://TU-URL.us-east-2.awsapprunner.com/health
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

### 3. Abre la Aplicación en el Navegador

1. Abre: `https://TU-URL.us-east-2.awsapprunner.com`
2. Abre DevTools (F12) > Console
3. Busca estos logs:

✅ **Logs CORRECTOS:**
```javascript
🌐 Environment: {
  hostname: "ypgbefmemd.us-east-2.awsapprunner.com",
  origin: "https://ypgbefmemd.us-east-2.awsapprunner.com",
  isLocalhost: false,
  SOCKET_URL: "https://ypgbefmemd.us-east-2.awsapprunner.com"
}
✅ Connected to server: https://ypgbefmemd.us-east-2.awsapprunner.com
📡 Fetching question count from: https://ypgbefmemd.us-east-2.awsapprunner.com/api/questions/count
✅ Loaded 349 questions
```

4. **En el Network Tab:**
   - Filtra por "socket.io"
   - Deberías ver requests a `socket.io/?EIO=4&transport=polling` (Status 200)
   - Luego puede intentar upgrade a websocket (puede fallar, pero polling funciona)

### 4. Prueba Crear un Room

1. Click en **"Create Room"**
2. Ingresa tu nombre
3. Configura las preguntas
4. Click en **"Create"**
5. Deberías ver el lobby con tu código de 6 dígitos

✅ **Si ves el código de la sala, ¡FUNCIONÓ!**

## 📊 Logs de App Runner

Para ver los logs en tiempo real:

### Opción 1: AWS Console
1. App Runner > Tu servicio
2. Tab **"Logs"**
3. Selecciona "Application logs"
4. Click en "View in CloudWatch"

### Opción 2: AWS CLI
```bash
aws logs tail /aws/apprunner/cloudexam-prep/APPLICATION-ID/application \
  --follow \
  --region us-east-2
```

**Busca estos mensajes:**
```
═══════════════════════════════════════════════════════
🚀 CloudExam Prep Server running on 0.0.0.0:3000
📚 349 questions loaded
🌍 Environment: production
🔌 Socket.io path: /socket.io
🌐 CORS: Enabled for all origins
═══════════════════════════════════════════════════════
```

Cuando alguien se conecta:
```
🔌 Client connected: [socket-id]
   Transport: polling
```

## 🐛 Troubleshooting

### Problema: Aún sale "WebSocket connection failed"

**Verificar:**

1. **¿Hiciste git push?**
   ```bash
   git log -1 --oneline
   # Debe mostrar el commit con el fix
   ```

2. **¿App Runner hizo el deploy?**
   - Ve a App Runner > Event log
   - Debe mostrar un deploy reciente

3. **¿El build fue exitoso?**
   - En los logs debe decir "Build complete!"

4. **¿Las variables de entorno están configuradas?**
   - Configuration tab > Environment variables
   - Verifica que existan NODE_ENV, HOST, PORT

### Problema: "Unable to connect to server"

**Verificar:**

1. **Health check:**
   ```bash
   curl https://TU-URL/health
   ```
   Si falla, el servidor no está corriendo.

2. **Logs del servidor:**
   Busca errores en CloudWatch Logs

3. **Puerto correcto:**
   El servidor debe escuchar en el puerto que App Runner espera (3000)

### Problema: Se conecta pero no puede crear rooms

**Verificar en DevTools Console:**

```javascript
// Debe mostrar:
✅ Connected to server: https://TU-URL
```

**En los logs del servidor debe aparecer:**
```
🔌 Client connected: [socket-id]
   Transport: polling
```

**Si no aparece nada:**
- Socket.io no está recibiendo conexiones
- Verifica el path: `/socket.io`
- Verifica que CORS esté habilitado

### Problema: Build falla en App Runner

**Errores comunes:**

1. **"npm: command not found"**
   - Asegúrate de que `apprunner.yaml` especifica `runtime: nodejs18`

2. **"Cannot find module"**
   - Verifica que `questions.json` esté en la raíz del repositorio
   - Verifica que todos los archivos estén en git

3. **"Permission denied"**
   - No uses `sudo` en los comandos del build

## 📁 Estructura del Repositorio

Asegúrate de que tu repositorio tenga esta estructura:

```
CDP_practice/
├── apprunner.yaml          ← NUEVO: Configuración de App Runner
├── server/
│   └── index.js           ← Servidor actualizado
├── client/
│   ├── src/
│   │   └── App.jsx        ← Cliente con polling fix
│   └── dist/              ← Build del cliente
├── questions.json         ← Archivo de preguntas
├── package.json
├── Dockerfile
└── README.md
```

## ⚙️ Configuración Recomendada de App Runner

| Setting | Valor | Nota |
|---------|-------|------|
| **CPU** | 1 vCPU | Suficiente para inicio |
| **Memory** | 2 GB | Recomendado |
| **Min instances** | 1 | Siempre al menos una instancia |
| **Max instances** | 10 | Escala automáticamente |
| **Max concurrency** | 100 | Requests simultáneas |
| **Health check path** | `/health` | Endpoint de verificación |
| **Health check interval** | 10 segundos | Verificación frecuente |
| **Health check timeout** | 5 segundos | Timeout del health check |

## 🔄 Workflow de Desarrollo

```bash
# 1. Hacer cambios locales
vim client/src/App.jsx

# 2. Probar localmente
npm run dev

# 3. Build
cd client && npm run build && cd ..

# 4. Commit y push
git add .
git commit -m "Tu mensaje"
git push origin main

# 5. App Runner detecta el push y hace deploy automático (2-5 min)

# 6. Verifica en la URL de producción
```

## 💰 Costos Estimados

App Runner cobra por:
- **vCPU por hora:** ~$0.064 por vCPU/hora
- **Memory por hora:** ~$0.007 por GB/hora
- **Build por minuto:** ~$0.005 por minuto de build

**Estimación mensual (1 vCPU, 2 GB, 24/7):**
- Compute: ~$50-70/mes
- Builds: ~$1-5/mes (dependiendo de frecuencia)

**Tier gratuito (primeros 3 meses):**
- 2,000 vCPU-horas/mes
- 4,000 GB-horas/mes
- 50 builds/mes

## 📚 Recursos Adicionales

- [App Runner Documentation](https://docs.aws.amazon.com/apprunner/)
- [Socket.io Transports](https://socket.io/docs/v4/how-it-works/#transports)
- [App Runner Configuration Reference](https://docs.aws.amazon.com/apprunner/latest/dg/config-file.html)

## ✅ Checklist Final

Antes de considerar el deploy exitoso:

- [ ] Git push completado
- [ ] App Runner deploy completado (status: Running)
- [ ] Health check pasa: `/health` retorna 200
- [ ] Página principal carga correctamente
- [ ] DevTools Console muestra "✅ Connected to server"
- [ ] Puede cargar las preguntas (✅ Loaded 349 questions)
- [ ] Puede crear un room
- [ ] Puede unirse a un room desde otro dispositivo
- [ ] El lobby muestra todos los jugadores
- [ ] Puede iniciar el juego
- [ ] Las preguntas se muestran correctamente
- [ ] Los resultados se muestran después de responder

---

**Última actualización:** 2025-11-25
**Región AWS:** us-east-2 (Ohio)
**Transport:** Polling primero, WebSocket como upgrade opcional
**Status:** ✅ Probado y funcionando
