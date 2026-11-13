import fs from "node:fs";
import {
  CAMPOS_COMUNES, TIPOS_CONTRATO, describirCambios, listarPlantillas, nombreContrato, validarContrato
} from "../../src/catalogo/plantillas.js";
import { DATOS_INDEFINIDO } from "../datos.js";

describe("catálogo de plantillas", () => {
  test("tiene las 16 plantillas acordadas, sin tipos repetidos", () => {
    expect(TIPOS_CONTRATO).toHaveLength(16);
    expect(new Set(TIPOS_CONTRATO).size).toBe(16);
    expect(TIPOS_CONTRATO).toContain("CONTRATO_SIMPLE");
  });

  test("coincide exactamente con el enum ContractType de Prisma", () => {
    const esquema = fs.readFileSync(new URL("../../prisma/schema.prisma", import.meta.url), "utf8");
    const bloque = esquema.match(/enum ContractType \{([^}]*)\}/)[1];
    const enumPrisma = bloque.split(/\s+/).filter(Boolean);
    expect([...enumPrisma].sort()).toEqual([...TIPOS_CONTRATO].sort());
  });

  test("cada campo tiene nombre, etiqueta y tipo, sin nombres repetidos por plantilla", () => {
    for (const plantilla of listarPlantillas()) {
      const campos = [...CAMPOS_COMUNES, ...plantilla.campos];
      for (const campo of campos) {
        expect(campo).toEqual(expect.objectContaining({ nombre: expect.any(String), etiqueta: expect.any(String) }));
      }
      const nombres = campos.map((c) => c.nombre);
      expect(new Set(nombres).size).toBe(nombres.length);
    }
  });
});

describe("validarContrato", () => {
  test("acepta datos completos y descarta campos desconocidos", () => {
    const r = validarContrato({ tipo: "INDEFINIDO", datos: { ...DATOS_INDEFINIDO, campoInventado: "x" }, modalidad: "TRACTO_SUCESIVO" });
    expect(r.errores).toEqual({});
    expect(r.datos).not.toHaveProperty("campoInventado");
    expect(r.modalidad).toBe("TRACTO_SUCESIVO");
  });

  test("normaliza textos y números", () => {
    const r = validarContrato({ tipo: "INDEFINIDO", datos: { ...DATOS_INDEFINIDO, cargo: "  Analista  ", horasSemanales: "40" } });
    expect(r.datos.cargo).toBe("Analista");
    expect(r.datos.horasSemanales).toBe(40);
  });

  test("informa cada campo obligatorio que falta", () => {
    const r = validarContrato({ tipo: "INDEFINIDO", datos: { ciudad: "Santiago" } });
    expect(r.errores).toHaveProperty("cargo");
    expect(r.errores).toHaveProperty("fechaInicio");
    expect(r.errores.cargo).toMatch(/obligatorio/);
  });

  test("rechaza un tipo inexistente", () => {
    expect(validarContrato({ tipo: "HIPOTECA", datos: {} }).errores).toEqual({ tipo: "Tipo de contrato no válido" });
  });

  test("valida montos, fechas y modalidad", () => {
    const r = validarContrato({
      tipo: "INDEFINIDO",
      datos: { ...DATOS_INDEFINIDO, remuneracionMensual: 1000.5, fechaInicio: "2026-13-45" },
      modalidad: "A_VECES"
    });
    expect(r.errores.remuneracionMensual).toMatch(/entero/);
    expect(r.errores.fechaInicio).toMatch(/fecha/);
    expect(r.errores.modalidad).toBe("Modalidad no válida");
  });

  test("la fecha de término no puede ser anterior a la de inicio", () => {
    const r = validarContrato({ tipo: "INDEFINIDO", datos: DATOS_INDEFINIDO, fechaTermino: "2026-10-01" });
    expect(r.errores.fechaTermino).toMatch(/anterior/);
  });
});

describe("describirCambios y nombreContrato", () => {
  test("lista las etiquetas de los datos que cambiaron", () => {
    const guardado = { datos: DATOS_INDEFINIDO, modalidad: null, fechaTermino: null };
    const nuevo = validarContrato({ tipo: "INDEFINIDO", datos: { ...DATOS_INDEFINIDO, cargo: "Gerente" }, modalidad: "TRACTO_SUCESIVO" });
    expect(describirCambios("INDEFINIDO", guardado, nuevo)).toEqual(["Cargo", "Modalidad"]);
  });

  test("el contrato simple usa su propio título", () => {
    expect(nombreContrato({ tipo: "CONTRATO_SIMPLE", datos: { titulo: "Diseño de etiquetas" } })).toBe("Diseño de etiquetas");
    expect(nombreContrato({ tipo: "INDEFINIDO", datos: {} })).toMatch(/indefinido/i);
  });
});
