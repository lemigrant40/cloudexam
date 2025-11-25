# AWS Deployment Fix - Socket.io Connection Issues

## Cambios Realizados

Los siguientes cambios se han implementado para arreglar problemas de conexión en AWS:

### 1. Configuración de Socket.io en el Servidor
**Archivo:** `server/index.js`

- ✅ Especificado `path: '/socket.io'` explícitamente
- ✅ Agregado `transports: ['websocket', 'polling']`
- ✅ Agregado `allowEIO3: true` para compatibilidad
- ✅ Mejorado logging de conexiones y errores

### 2. Configuración de Socket.io en el Cliente
**Archivo:** `client/src/App.jsx`

- ✅ Especificado `path: '/socket.io'` para coincidir con el servidor
- ✅ Agregado opciones de reconexión:
  - `reconnection: true`
  - `reconnectionDelay: 1000`
  - `reconnectionAttempts: 5`
  - `timeout: 20000`
- ✅ Mejorado manejo de errores con mensajes detallados
- ✅ Agregado logging detallado para debugging

### 3. Mejoras en el API
- ✅ Agregado endpoint `/api` para verificar que el servidor está corriendo
- ✅ Mejorado endpoint `/health` con información de entorno
- ✅ Mejorado logging en fetch de preguntas

## Pasos para Re-Deploy en AWS

### Opción 1: Re-deploy Completo (Recomendado)

```bash
# 1. Navegar al directorio del proyecto
cd /home/operador/Descargas/CDP_practice

# 2. Build del cliente
cd client && npm run build && cd ..

# 3. Construir imagen Docker
docker build -t cloudexam-prep .

# 4. Tag y push a ECR (reemplaza con tus valores)
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="tu-account-id"
REPO_NAME="cloudexam-prep"

# Authenticate con ECR
aws ecr get-login-password --region $AWS_REGION | \
    docker login --username AWS --password-stdin \
    $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Tag la imagen
docker tag cloudexam-prep:latest \
    $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO_NAME:latest

# Push a ECR
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO_NAME:latest

# 5. Actualizar App Runner
# Ve a AWS Console > App Runner > Tu servicio > "Deploy"
# O usa AWS CLI:
aws apprunner start-deployment \
    --service-arn "tu-service-arn" \
    --region $AWS_REGION
```

### Opción 2: Deploy Rápido (Si ya tienes el pipeline configurado)

```bash
# Hacer commit de los cambios
git add .
git commit -m "Fix Socket.io connection issues for AWS deployment"
git push

# Si tienes CI/CD configurado, esto automáticamente deployeará
```

## Verificación Post-Deploy

### 1. Verificar que el servidor está corriendo

```bash
# Reemplaza TU_URL con tu URL de AWS App Runner
curl https://TU_URL/health
```

Debería responder:
```json
{
  "status": "healthy",
  "rooms": 0,
  "questions": 349,
  "environment": "production",
  "timestamp": "2025-11-25T..."
}
```

### 2. Verificar el API endpoint

```bash
curl https://TU_URL/api
```

Debería responder:
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

### 3. Verificar Socket.io desde el navegador

1. Abre la consola del navegador (F12)
2. Navega a tu aplicación
3. Busca estos mensajes en la consola:
   - ✅ `✅ Connected to server: https://TU_URL`
   - ✅ `📡 Fetching question count from: https://TU_URL/api/questions/count`
   - ✅ `✅ Loaded 349 questions`

### 4. Probar crear un room

1. Haz clic en "Create Room"
2. Ingresa un nombre
3. Configura las preguntas
4. Haz clic en "Create"

Si ves el lobby con el código de la sala, ¡todo funciona!

## Troubleshooting

### Error: "Unable to connect to server"

**En el navegador (F12 > Console):**
```
❌ Connection error: timeout
```

**Solución:**
- Verifica que App Runner esté usando el puerto correcto (3000)
- Verifica las reglas de seguridad/firewall en AWS
- Asegúrate de que `NODE_ENV=production` está configurado

### Error: "Failed to fetch"

**En el navegador:**
```
❌ Error fetching question count: Failed to fetch
```

**Solución:**
- Verifica que el servidor está corriendo: `curl https://TU_URL/health`
- Verifica que los archivos estáticos se están sirviendo correctamente
- Revisa los logs de App Runner en AWS Console

### Error: "Room not found" inmediatamente después de crear

**Síntoma:**
- Creas un room pero inmediatamente dice "Room not found"

**Solución:**
- Esto indica que Socket.io no está conectado correctamente
- Verifica en la consola del navegador que hay una conexión activa
- Revisa los logs del servidor en App Runner

### Los jugadores no pueden unirse al room

**Síntoma:**
- El host crea el room exitosamente
- Los invitados obtienen "Room not found"

**Solución:**
- Asegúrate de que todos los clientes estén conectados al mismo servidor
- Verifica que no haya múltiples instancias del servidor corriendo
- En App Runner, asegúrate de tener solo 1 instancia configurada (para desarrollo)

## Logs del Servidor

Para ver logs en tiempo real en AWS App Runner:

1. Ve a AWS Console > App Runner
2. Selecciona tu servicio
3. Ve a la pestaña "Logs"
4. Selecciona "Latest logs"

Busca estos mensajes:
- `🚀 CloudExam Prep Server running on port 3000`
- `📚 349 questions loaded`
- `🔌 Client connected: [socket-id]`
- `🏠 Room created: [room-code]`

## Variables de Entorno en AWS App Runner

Asegúrate de tener configurado:

```
NODE_ENV=production
PORT=3000
```

## Notas Importantes

- El cliente automáticamente usa `window.location.origin` en producción
- No es necesario configurar `VITE_SOCKET_URL` en producción
- Socket.io ahora intenta WebSocket primero, luego polling si falla
- Las reconexiones automáticas están habilitadas (5 intentos)

## Próximos Pasos

Una vez que el deploy esté completo:

1. ✅ Prueba crear un room
2. ✅ Prueba unirte a un room desde otra ventana/dispositivo
3. ✅ Inicia una sesión y responde preguntas
4. ✅ Verifica que los resultados se muestran correctamente
5. ✅ Prueba la reconexión (desconecta/reconecta el internet)

## Recursos Adicionales

- [Socket.io Documentation](https://socket.io/docs/v4/)
- [AWS App Runner Documentation](https://docs.aws.amazon.com/apprunner/)
- Ver `AWS_DEPLOYMENT.md` para el guide completo de deployment

## Soporte

Si los problemas persisten después de estos cambios:

1. Captura los logs de la consola del navegador
2. Captura los logs del servidor de AWS App Runner
3. Verifica el network tab en las dev tools del navegador
4. Asegúrate de que el health check endpoint responde correctamente
