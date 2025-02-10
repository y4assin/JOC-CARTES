# Juego de Cartas - Documentación del Desarrollo

## Descripción
Este proyecto es un juego de cartas multijugador en tiempo real que utiliza WebSockets para la comunicación entre clientes y servidor. El desarrollo comenzó en un servidor local con Laravel, pero posteriormente se decidió separar el juego en un servicio independiente para facilitar el mantenimiento y mejorar la escalabilidad. Finalmente, se migró a Railway con un dominio personalizado.

---

## Evolución del Proyecto

### 1. Configuración Inicial del Servidor
- **Primera Petición**: Configurar el juego dentro de un servidor Laravel.
- **Problema**: Laravel no estaba diseñado para manejar WebSockets de manera eficiente junto con el backend del juego.
- **Solución**: Se separó el juego en una carpeta independiente dentro del servidor.
- **Razón**: Mantener una estructura modular y evitar problemas derivados del framework Laravel al manejar WebSockets.

### 2. Migración a Railway
- **Segunda Petición**: Desplegar el juego en una plataforma en la nube.
- **Problema**: El servidor local presentaba limitaciones en cuanto a disponibilidad y escalabilidad.
- **Cambios realizados**:
  - Implementación de WebSockets en un entorno optimizado.
  - Ajuste del puerto del servidor a `3001` para compatibilidad con Railway.
  - Configuración de un dominio personalizado `joc.yassineelbakali.com`.
- **Razón**: Se necesitaba una infraestructura más robusta para producción y mejor gestión del servicio.

### 3. Gestión de Turnos
- **Tercera Petición**: Mejorar la lógica de los turnos.
- **Problema**: En Railway, los turnos no se actualizaban correctamente, generando errores en la sincronización de jugadores.
- **Solución implementada**:
  - Reescritura de la lógica de turnos con mejor control de estados.
  - Implementación de validaciones para evitar saltos de turnos indebidos.
  - Manejo de desconexiones para evitar bloqueos de partida.
- **Razón**: Mejorar la jugabilidad y evitar problemas de sincronización en entornos de producción.

### 4. Primera Optimización Móvil
- **Cuarta Petición**: Adaptar la interfaz a dispositivos móviles.
- **Problema**: La interfaz aparecía cortada en pantallas pequeñas.
- **Solución**:
  - Aplicación de estilos CSS para ajustar el contenido a diferentes tamaños de pantalla.
  - Ajuste de márgenes y paddings para mejorar la disposición de los elementos.
- **Razón**: Mejorar la experiencia de usuario en dispositivos móviles.

### 5. Ajuste de Cartas Superiores
- **Quinta Petición**: Corregir el tamaño de las cartas en la pantalla.
- **Problema**: Las cartas superiores eran demasiado grandes y afectaban la visibilidad de las cartas inferiores.
- **Solución**:
  - Reducción del tamaño de las cartas superiores para mejorar la distribución del contenido.
- **Razón**: Evitar problemas de superposición y mejorar la jugabilidad en diferentes resoluciones.

### 6. Centrado de Contenido
- **Sexta Petición**: Mejorar la disposición visual del juego.
- **Problema**: En algunas pantallas, los elementos se mostraban desalineados.
- **Solución**:
  - Se aplicaron ajustes en CSS para centrar verticalmente el contenido y mejorar la alineación general.
- **Razón**: Proporcionar una mejor experiencia visual y una interfaz más equilibrada.

---

## Uso de Inteligencia Artificial en el Desarrollo

### Herramientas Utilizadas
Durante el desarrollo del juego, se utilizaron herramientas de inteligencia artificial para optimizar el proceso de programación y resolución de problemas:

- **ChatGPT-4o**: Se usó principalmente para obtener sugerencias sobre implementación de WebSockets y estructura del código.
- **Cursor (de pago)**: Herramienta más eficiente que ChatGPT en la edición de código. Permite modificar fragmentos específicos sin necesidad de regenerar el código completo.

### Proceso de Desarrollo con IA
1. **Consulta de soluciones**:
   - Se utilizaron prompts en ChatGPT-4o para explorar distintas formas de implementar WebSockets en Node.js.
   - ChatGPT a menudo sugería soluciones generales, pero requería múltiples iteraciones para afinar detalles específicos.
2. **Uso de Cursor para cambios rápidos**:
   - A diferencia de ChatGPT, Cursor permitió realizar ajustes en tiempo real sin necesidad de regenerar el código completo.
   - Esto resultó más eficiente al refactorizar partes del código como la lógica de turnos y la gestión de desconexiones.
3. **Investigación adicional**:
   - Aunque la IA proporcionó sugerencias, fue necesario investigar documentación oficial de WebSockets y Railway para afinar detalles.
   - Algunas soluciones iniciales no funcionaron como se esperaba, por lo que se reformularon los prompts y se hicieron ajustes manuales.

### Lecciones Aprendidas
- **ChatGPT-4o** es útil para obtener ideas generales, pero requiere muchas iteraciones para lograr soluciones precisas.
- **Cursor es más eficiente para realizar cambios específicos** en código sin necesidad de rehacerlo todo.
- **No se puede depender completamente de la IA**: Es importante verificar la documentación y realizar pruebas para asegurar que las implementaciones funcionen correctamente.
- **La combinación de IA y revisión manual** resulta en un desarrollo más rápido y eficiente.

---

## Despliegue
- **URL**: [joc.yassineelbakali.com](http://joc.yassineelbakali.com)

---

## Mantenimiento
- Monitorizar logs del servidor WebSocket para detectar posibles errores.
- Verificar conexiones de jugadores y detectar desconexiones inesperadas.
- Comprobar el rendimiento del juego en distintos dispositivos y navegadores.
- Optimizar el código y la infraestructura en función del crecimiento del proyecto.
