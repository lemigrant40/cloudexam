# CloudExam Prep - Changelog

## Version 1.1.0 (2025-11-24)

### ✨ New Features

#### 1. Código de Sala de 6 Dígitos
- **Antes:** Códigos de 4 letras (ej: "XKPQ")
- **Ahora:** Códigos de 6 dígitos numéricos (ej: "123456")
- **Beneficio:** Más fácil de compartir por teléfono o mensajes

#### 2. Selección de Rango de Preguntas
El anfitrión ahora puede elegir qué preguntas practicar en la sesión:

**Tres modos disponibles:**

1. **Todas las Preguntas**
   - Practica el conjunto completo de preguntas
   - Ejemplo: Todas las 150 preguntas

2. **Rango (Inicio → Fin)**
   - Define pregunta inicial y final
   - Ejemplo: Preguntas 50 a 75 (26 preguntas)
   - Caso de uso: Enfocarse en un capítulo específico

3. **Cantidad (Inicio + N)**
   - Define pregunta inicial y cantidad de preguntas
   - Ejemplo: Comenzar en pregunta 25, practicar 15 preguntas
   - Caso de uso: Sesiones cortas de práctica

### 🎨 Mejoras de UI

#### Pantalla de Creación de Sala
- Nuevo selector visual de rango de preguntas
- Tres botones grandes para elegir el modo
- Inputs numéricos para configurar el rango
- Preview en tiempo real del rango seleccionado
- Validación automática de rangos

#### Lobby (Sala de Espera)
- Nueva sección "Practice Session" que muestra:
  - Pregunta inicial (#)
  - Pregunta final (#)
  - Total de preguntas en la sesión
- Diseño visual con colores azules para destacar la información

#### Pantalla de Preguntas
- Muestra el número de pregunta en la sesión (1/25)
- Muestra el número original de la pregunta (#68)
- Ayuda a los estudiantes a referenciar preguntas específicas

### 🔧 Cambios Técnicos

#### Backend (server/index.js)
```javascript
// Nuevo: Generación de código de 6 dígitos
function generateRoomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Nuevo: Evento room:create acepta questionRange
socket.on('room:create', ({ playerName, questionRange }, callback) => {
  // Filtrado de preguntas según el modo:
  // - 'all': Todas las preguntas
  // - 'range': Rango start-end
  // - 'count': Start + count
});

// Nuevo: Room structure incluye:
{
  questionRange: { start, end, total },
  filteredQuestions: [...]
}
```

#### Frontend (client/src/)

**HomeScreen.jsx:**
- Nuevos estados para gestionar rango de preguntas
- UI de selección de rango con 3 modos
- Input de código de 6 dígitos numéricos
- Validación en tiempo real

**App.jsx:**
- Actualizado `handleCreateRoom(name, questionRange)`
- Pasa el objeto questionRange al backend

**Lobby.jsx:**
- Nueva sección visual mostrando el rango seleccionado

**QuestionScreen.jsx:**
- Muestra número de pregunta original cuando difiere del número en sesión

### 📊 Casos de Uso

#### Caso 1: Práctica Enfocada por Tema
```
Modo: Range
Start: 1
End: 30
Resultado: Preguntas 1-30 (Storage & HDFS)
```

#### Caso 2: Repaso Rápido
```
Modo: Count
Start: 50
Count: 10
Resultado: 10 preguntas empezando desde la 50
```

#### Caso 3: Examen Completo
```
Modo: All Questions
Resultado: Todas las 150 preguntas
```

#### Caso 4: Práctica de Preguntas Difíciles
```
Modo: Range
Start: 100
End: 150
Resultado: Últimas 50 preguntas (usualmente más difíciles)
```

### 🔄 Flujo Actualizado

**Anfitrión:**
1. Click "Create Room"
2. Ingresar nombre
3. Seleccionar modo de rango de preguntas
4. Configurar rango (si aplica)
5. Ver preview del rango
6. Crear sala → Recibe código de 6 dígitos
7. Compartir código con invitados

**Invitados:**
1. Click "Join Room"
2. Ingresar código de 6 dígitos
3. Ingresar nombre
4. Unirse a sala

**Lobby:**
- Todos ven el rango de preguntas seleccionado
- Anfitrión inicia cuando está listo

### 📝 Ejemplo de Uso

```bash
# Terminal del anfitrión
npm run dev

# Navegador del anfitrión
1. Crear Sala
2. Nombre: "María"
3. Modo: Range
4. Start: 25
5. End: 50
6. Código generado: "384729"

# WhatsApp/Slack
María: "Únanse a la sala 384729"

# Navegador de invitados
1. Unirse a Sala
2. Código: 384729
3. Nombre: "Juan"

# Lobby muestra:
📚 Practice Session
Start: #25
End: #50
Total: 26
```

### ⚠️ Breaking Changes

#### Código de Sala
- **Antes:** `room:create` aceptaba solo `playerName: string`
- **Ahora:** `room:create` acepta `{ playerName, questionRange }`

Si tienes clientes legacy, necesitarán actualizarse.

#### Formato de Join
- **Antes:** Código de 4 letras (A-Z)
- **Ahora:** Código de 6 dígitos (0-9)

### 🐛 Bugs Corregidos
- Ninguno (nueva funcionalidad)

### 🔮 Próximas Mejoras (v1.2.0)
- [ ] Guardar rangos favoritos
- [ ] Historial de sesiones de práctica
- [ ] Estadísticas por rango de preguntas
- [ ] Modo aleatorio (shuffle questions)
- [ ] Exportar resultados por rango

---

## Version 1.0.0 (2025-11-24)

### 🎉 Lanzamiento Inicial

- ✅ Sistema de salas en tiempo real
- ✅ Roles Host/Invitado
- ✅ Sincronización de preguntas
- ✅ Temporizador de 60 segundos
- ✅ Votación en tiempo real
- ✅ Visualización de resultados
- ✅ Explicaciones detalladas
- ✅ Responsive design
- ✅ Docker deployment

---

## Migración de v1.0 a v1.1

### Backend
No se requieren cambios en la base de datos (no hay BD).

### Frontend
Actualizar cliente a nueva versión:
```bash
cd client
npm install
npm run build
```

### Deployment
```bash
# Rebuild Docker image
docker build -t cloudexam-prep:1.1.0 .

# Push to registry
docker push YOUR_REGISTRY/cloudexam-prep:1.1.0

# Update App Runner
aws apprunner start-deployment --service-arn YOUR_SERVICE_ARN
```

### Compatibilidad
- ✅ Códigos de sala legacy NO funcionarán (formato cambió)
- ✅ Salas activas se limpiarán al actualizar
- ✅ Sin pérdida de datos (no hay persistencia)

---

*Para más información, ver README.md y QUICKSTART.md*
