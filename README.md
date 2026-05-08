# Sistema de Caja — Fit Supps

POS local para **Fit Supps SpA.** — punto de venta, inventario, clientes, documentos tributarios y analíticas, sin backend ni base de datos externa.

## Stack

- **React 18** + **Vite 5**
- **localStorage** como base de datos local (sin servidor)
- **html2pdf.js** para exportar documentos a PDF (carga bajo demanda)

## Módulos

| Módulo | Descripción |
|---|---|
| Terminal | Cobro con escáner o búsqueda manual, canales de venta, medios de pago |
| Inventario | CRUD de productos con código de barras, precio, marca y variante |
| Clientes | Registro de clientes con RUT, giro y dirección |
| Documentos | Notas de venta, boletas y facturas — vista previa, impresión, PDF, WhatsApp y correo |
| Gastos | Registro y plantillas de gastos recurrentes con imputación automática mensual |
| Analíticas | KPIs de ventas, tendencia de productos más vendidos, productos detenidos |

## Instalación local

```bash
npm install
npm run dev
```

La app queda disponible en `http://localhost:5173`.

## Build de producción

```bash
npm run build
npm run preview   # para verificar el build localmente
```

Los archivos generados quedan en `dist/`.

## Despliegue en Vercel

1. Importar el repositorio en [vercel.com](https://vercel.com)
2. Configurar el proyecto con:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Hacer clic en **Deploy**

No se requieren variables de entorno.

> Todos los datos se guardan en el `localStorage` del navegador. Cada usuario ve sus propios datos — no hay sincronización entre dispositivos.