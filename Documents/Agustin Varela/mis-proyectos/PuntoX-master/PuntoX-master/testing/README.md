# Testing en PuntoX

Esta carpeta contiene todos los tests del proyecto.

## Estructura

```
testing/
├── utils/              # Utilidades y mocks para testing
│   └── mocks.ts       # Mocks de Prisma, Auth, etc.
├── validations/        # Tests de schemas Zod
│   └── producto.schema.test.ts
├── lib/               # Tests de utilidades
│   ├── pagination.test.ts
│   └── calculos.test.ts
├── api/               # Tests de API routes (próximamente)
├── hooks/             # Tests de custom hooks (próximamente)
└── components/        # Tests de componentes React (próximamente)
```

## Ejecutar tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar en modo watch
npm run test:watch

# Ejecutar con UI
npm run test:ui

# Ejecutar con coverage
npm run test:coverage

# Ejecutar tests específicos
npm test testing/validations
npm test testing/lib
```

## Convenciones

- Los archivos de test deben terminar en `.test.ts` o `.test.tsx`
- Usar `describe` para agrupar tests relacionados
- Usar `it` o `test` para casos individuales
- Usar mocks de `testing/utils/mocks.ts` cuando sea posible

## Prioridades

1. ✅ Validaciones (Zod schemas)
2. ✅ Utilidades (pagination, calculos)
3. ⏳ API Routes (crítico)
4. ⏳ Hooks personalizados
5. ⏳ Componentes React
