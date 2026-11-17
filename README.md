# Medicacion

Recordatorio de medicación desarrollado con **React Native, Expo y TypeScript** para el Parcial de Aplicaciones Móviles.

La app permite crear una cuenta local, ingresar, guardar medicamentos con un horario diario y recibir notificaciones locales. La interfaz está en español y está preparada para Android e iOS; se verificó en Android.

## Ejecutar

Requisitos: Node.js 22.13 o superior compatible con Expo SDK 58, npm y Expo Go compatible con SDK 58 en el celular, o un emulador Android.

```bash
cd Medicacion
npm ci
npm start
```

Escanear el QR con Expo Go. El celular y la computadora deben estar en la misma red. Para un emulador Android instalado, usar `npm run android`.

La primera vez, elegir **Creá tu cuenta**, registrar usuario y contraseña, e iniciar sesión. No hay cuentas precargadas. El usuario admite entre 3 y 24 letras minúsculas, números, puntos y guiones; la contraseña debe tener al menos 6 caracteres.

## Funcionalidades

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

## Notificaciones

1. Abrir la app en Android o iOS y permitir las notificaciones.
2. Guardar una medicación con el horario deseado.
3. En Home, tocar **Activar recordatorios** o **Reprogramar recordatorios**.
4. Tocar **Probar aviso en 10 segundos** y comprobar el aviso en el dispositivo.


## Pruebas y verificaciones

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

## Organización

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

## Entrega

- Medicación proyect - Parcial 1 **https://youtube.com/shorts/GBl4vmiSJes**
