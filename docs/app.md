# ERP · Shell: qué hace

## Responsabilidades

- Iniciar y renovar la sesión con Keycloak y compartir el token con los microfrontends.
- Mostrar el diseño común (barra superior, menú lateral) y el menú según el rol.
- Cargar cada microfrontend en su ruta (`/obras`, `/materiales`, `/supervision`).
- Aislar fallas: si un microfrontend no carga, mostrar un aviso solo en su espacio.
- Ofrecer el paso a las otras aplicaciones de la plataforma sin volver a iniciar sesión.
- Capa 1: funcionar como PWA (consultar lo ya cargado y guardar el borrador de planilla sin conexión).

## Usuarios

Administración, residente y gerente.

## Qué no hace

- No tiene pantallas de negocio.
- No llama a los servicios directamente.
