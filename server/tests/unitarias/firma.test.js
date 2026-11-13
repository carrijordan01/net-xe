import { errorFormatoPin, hashContenido } from "../../src/firma.js";

const contrato = {
  id: 7,
  tipo: "INDEFINIDO",
  solicitanteId: 1,
  contraparteId: 2,
  datos: { cargo: "Analista", ciudad: "Santiago" },
  modalidad: "TRACTO_SUCESIVO",
  fechaTermino: null,
  documentos: []
};

describe("hashContenido", () => {
  test("devuelve una huella SHA-256 en hexadecimal", () => {
    expect(hashContenido(contrato)).toMatch(/^[0-9a-f]{64}$/);
  });

  test("no depende del orden de las claves de los datos", () => {
    const reordenado = { ...contrato, datos: { ciudad: "Santiago", cargo: "Analista" } };
    expect(hashContenido(reordenado)).toBe(hashContenido(contrato));
  });

  test("cambia si cambia cualquier dato acordado", () => {
    const base = hashContenido(contrato);
    expect(hashContenido({ ...contrato, datos: { ...contrato.datos, cargo: "Gerente" } })).not.toBe(base);
    expect(hashContenido({ ...contrato, modalidad: "EJECUCION_INMEDIATA" })).not.toBe(base);
    expect(hashContenido({ ...contrato, fechaTermino: "2027-01-31T00:00:00.000Z" })).not.toBe(base);
    expect(hashContenido({ ...contrato, contraparteId: 3 })).not.toBe(base);
  });

  test("ignora lo que no es contenido (estado, fechas de sistema)", () => {
    const conEstado = { ...contrato, estado: "FIRMADO", updatedAt: new Date() };
    expect(hashContenido(conEstado)).toBe(hashContenido(contrato));
  });

  test("incluye los documentos adjuntos sin importar su orden", () => {
    const base = hashContenido(contrato);
    const conDocs = { ...contrato, documentos: [{ hash: "aaa" }, { hash: "bbb" }] };
    const invertidos = { ...contrato, documentos: [{ hash: "bbb" }, { hash: "aaa" }] };
    expect(hashContenido(conDocs)).not.toBe(base);
    expect(hashContenido(invertidos)).toBe(hashContenido(conDocs));
  });

  test("exige que los documentos vengan cargados", () => {
    const sinDocumentos = { ...contrato };
    delete sinDocumentos.documentos;
    expect(() => hashContenido(sinDocumentos)).toThrow(/documentos/);
  });
});

describe("errorFormatoPin", () => {
  test.each(["482915", "739204", "100200"])("acepta %s", (pin) => {
    expect(errorFormatoPin(pin)).toBeNull();
  });

  test.each([
    ["12345", "corto"],
    ["1234567", "largo"],
    ["12a456", "con letras"],
    [482915, "número en vez de texto"],
    [undefined, "vacío"]
  ])("rechaza %p (%s)", (pin) => {
    expect(errorFormatoPin(pin)).toMatch(/6 dígitos/);
  });

  test.each(["000000", "777777", "123456", "456789", "987654", "543210"])("rechaza el PIN simple %s", (pin) => {
    expect(errorFormatoPin(pin)).toMatch(/simple/);
  });
});
