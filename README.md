# Medicacion

Recordatorio de medicación desarrollado con **React Native, Expo y TypeScript** para el Parcial de Aplicaciones Móviles.

La app permite crear una cuenta local, ingresar, guardar medicamentos con un horario diario y recibir notificaciones locales. La interfaz está en español y está preparada para Android e iOS; se verificó en Android.

### Ejecutar

Requisitos: Node.js 22.13 o superior compatible con Expo SDK 58, npm y Expo Go compatible con SDK 58 en el celular, o un emulador Android.

```bash
cd Medicacion
npm ci
npm start
```

Escanear el QR con Expo Go. El celular y la computadora deben estar en la misma red. Para un emulador Android instalado, usar `npm run android`.

La primera vez, elegir **Creá tu cuenta**, registrar usuario y contraseña, e iniciar sesión. No hay cuentas precargadas. El usuario admite entre 3 y 24 letras minúsculas, números, puntos y guiones; la contraseña debe tener al menos 6 caracteres.

### Funcionalidades

- Registro, validación de credenciales, sesión persistente y cierre de sesión.
- Pantallas Home y Alta protegidas por la sesión, también al abrir una ruta directamente.
- Agregar medicamentos con nombre, hora en formato de 24 horas y una nota opcional.
- Lista ordenada por el próximo horario y tarjeta del siguiente recordatorio.
- Un recordatorio diario por medicamento, con permisos de notificaciones.
- Eliminar medicamentos con confirmación y cancelar sus avisos pendientes.
- Botón **Probar aviso en 10 segundos** para demostrar una notificación local.
- Datos separados por usuario, conservados al cerrar y volver a abrir la app.
- Estados vacíos, validaciones, indicadores de carga y mensajes de error.

Al cerrar sesión se cancelan los avisos pendientes de esa cuenta. Al volver a ingresar, se reprograman los recordatorios guardados si el dispositivo tiene permiso para notificar. Eliminar una medicación también cancela su recordatorio.

Cada registro tiene un horario diario. Para recordar un medicamento en dos horarios, se pueden crear dos registros con horas diferentes. Los nombres, horarios y notas son ingresados por el usuario.

### Notificaciones

1. Abrir la app en Android o iOS y permitir las notificaciones.
2. Guardar una medicación con el horario deseado.
3. En Home, tocar **Activar recordatorios** o **Reprogramar recordatorios**.
4. Tocar **Probar aviso en 10 segundos** y comprobar el aviso en el dispositivo.


### Pruebas y verificaciones

```bash
npm test
npm run typecheck
npm run lint
npx expo-doctor
npm run export:web
npm run export:android
```

Las pruebas cubren validación de cuentas, nombres y horarios; cambio de día y mes; autenticación; sesión; aislamiento y persistencia de datos; interacción con el componente reutilizable; programación y cancelación de notificaciones y permisos denegados.

Las pruebas de notificaciones de Jest usan mocks de la API nativa. La recepción de un aviso de prueba también se comprobó en Expo Go para Android.

### Organización

```text
src/
  app/           Pantallas y Stack protegido
  components/    Botones, campos, contenedor y tarjeta de medicamento
  context/       Sesión, estado y operaciones de la app
  services/      AsyncStorage y notificaciones nativas/web
  utils/         Validaciones y cálculo del próximo horario
  theme.ts       Colores compartidos
  types.ts       Tipos de datos
__tests__/       Tests de lógica, almacenamiento, componente y notificaciones
```

La autenticación es local. Usuarios y contraseñas se almacenan en AsyncStorage. Las cuentas y los medicamentos pertenecen a la instalación del dispositivo; no se sincronizan entre teléfonos.

### Nuevas funcionalidades

Desde **Mi rutina**, tocar **Ver ficha** en un medicamento para acceder a sus recursos.

- **Cámara y galería** con Expo ImagePicker. Permite tomar una foto, elegirla, reemplazarla y quitarla. La imagen se copia a la carpeta de documentos de la app para conservarla después de reiniciar.
- **Contactos** con Expo Contacts. Abre el selector de la agenda y guarda el nombre y el identificador del contacto elegido, por ejemplo, un médico o familiar. Permite cambiarlo y quitarlo.
- **Calendario de tomas realizadas** dentro de la app. El botón **Tomé el medicamento** guarda la fecha y hora actuales. El calendario mensual marca los días con registros y permite consultar las horas de cada día y corregir una toma registrada por error.
- **Calendario del celular** con Expo Calendar. Cada toma confirmada se puede guardar como un evento con su fecha y hora reales. Se conserva el vínculo para abrirlo desde la ficha y se evita exportar dos veces el mismo registro. Los eventos exportados se administran desde Calendario.
- **Permisos** solicitados al usar cada recurso. Los botones indican que hay una operación pendiente. Si se rechaza un permiso, la ficha muestra un mensaje. Si el acceso queda bloqueado, ofrece **Abrir ajustes**. Cancelar un selector permite continuar con la ficha.
- **Estado global** con Zustand. La sesión y los medicamentos migraron de Context a `useMedicationStore`. Sus acciones permiten agregar, actualizar y eliminar medicamentos y mantener la persistencia en AsyncStorage.
- **Edición** del nombre, horario y nota desde la ficha, con actualización del recordatorio cuando cambia el nombre o la hora.

### Consultar el historial de tomas

1. Desde **Mi rutina**, abrir **Ver ficha** en el medicamento.
2. Al tomarlo, tocar **Tomé el medicamento** para registrar ese momento.
3. Seleccionar un día del calendario para ver las tomas registradas y sus horarios. Las flechas permiten recorrer los meses y **Hoy** vuelve al día actual.
4. Para corregir un registro, tocar su botón de eliminar y confirmar la operación.

El historial se guarda por medicamento y usuario y se conserva al cerrar y volver a abrir la app. Las tomas se registran mediante la confirmación del usuario.

### Pruebas incorporadas

Se mantienen los comandos de verificación de la primera version. Se agregan pruebas para:

- Serializar altas simultáneas y recuperar el estado ante errores de almacenamiento.
- Manejar permisos pendientes, concedidos, denegados y bloqueados.
- Respetar la cancelación de los selectores y conservar las fotos en almacenamiento permanente.
- Registrar tomas con su fecha y hora reales, conservar el historial por usuario y corregir registros.
- Consultar las tomas por día, recorrer los meses y volver a la fecha actual desde el calendario.
- Seleccionar contactos y exportar tomas confirmadas al calendario del celular.
- Evitar eventos duplicados y revertir el evento creado si falla el guardado de su vínculo.
- Abrir la ficha desde la tarjeta del medicamento.

### Organización actualizada

El estado de la app pasa de `context/` a `stores/`. Se incorporan la pantalla de detalle, los servicios para los recursos del dispositivo y sus pruebas.

```text
src/
  app/           Pantallas y Stack protegido, incluida la ficha medication/[id]
  components/    Botones, campos, contenedor y tarjeta de medicamento
  stores/        Sesión, medicamentos y acciones con Zustand
  services/      AsyncStorage, notificaciones y recursos del dispositivo
  utils/         Validaciones, errores y cálculo del próximo horario
  theme.ts       Colores compartidos
  types.ts       Tipos de datos y recursos asociados al medicamento
__tests__/       Lógica, almacenamiento, componente, notificaciones, store y recursos
```

## Entrega

- Medicación proyect - Parcial 1 **https://youtube.com/shorts/GBl4vmiSJes**
- Medicación proyect - Parcial 2 **https://www.youtube.com/shorts/fGgknwuN1yw**
