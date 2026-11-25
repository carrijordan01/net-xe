import { corregirTexto } from "../../src/autocorreccion.js";

describe("oraciones (formato por defecto)", () => {
  test.each([
    ["diseño de etiquetas", "Diseño de etiquetas"],
    ["fin del turno.  luego se cierra", "Fin del turno. Luego se cierra"],
    ["¿podrá trabajar sábados? sí , cuando se requiera", "¿Podrá trabajar sábados? Sí, cuando se requiera"],
    ["en caja!¿podrá?", "En caja! ¿Podrá?"],
    ["- entregar\n- revisar\n\n\n\notro párrafo", "- Entregar\n- Revisar\n\nOtro párrafo"],
    ["1. primer punto\n2. segundo punto", "1. Primer punto\n2. Segundo punto"],
    ["pago en 2 cuotas. la primera de $1.000.000. la segunda", "Pago en 2 cuotas. La primera de $1.000.000. La segunda"],
    ["comas,sin espacio y decimales 1,5", "Comas, sin espacio y decimales 1,5"]
  ])("%p → %p", (entrada, esperado) => {
    expect(corregirTexto(entrada)).toBe(esperado);
  });

  test("no cambia tras abreviaturas, iniciales ni siglas", () => {
    expect(corregirTexto("av. siempre viva 742")).toBe("Av. siempre viva 742");
    expect(corregirTexto("firma J. pérez")).toBe("Firma J. pérez");
    expect(corregirTexto("Empresa S.A. la cual paga")).toBe("Empresa S.A. la cual paga");
  });

  test("nunca quita mayúsculas existentes", () => {
    expect(corregirTexto("según IPC de Panadería SpA")).toBe("Según IPC de Panadería SpA");
  });

  test("no toca textos que empiezan con números", () => {
    expect(corregirTexto("3 meses desde la fecha de inicio")).toBe("3 meses desde la fecha de inicio");
  });
});

describe("nombres propios", () => {
  test.each([
    ["san pedro de la paz", "San Pedro de la Paz"],
    ["  maría  josé de la fuente ", "María José de la Fuente"],
    ["pérez-cotapos", "Pérez-Cotapos"],
    ["o'higgins", "O'Higgins"],
    ["de la fuente", "De la Fuente"]
  ])("%p → %p", (entrada, esperado) => {
    expect(corregirTexto(entrada, "nombrePropio")).toBe(esperado);
  });
});

describe("RUT y sin formato", () => {
  test.each([
    ["12345678k", "12.345.678-K"],
    ["9876543-2", "9.876.543-2"],
    ["12.345.678-k", "12.345.678-K"],
    ["no sé", "no sé"]
  ])("RUT %p → %p", (entrada, esperado) => {
    expect(corregirTexto(entrada, "rut")).toBe(esperado);
  });

  test("«ninguno» solo ordena espacios", () => {
    expect(corregirTexto("  123-45   comuna x ", "ninguno")).toBe("123-45 comuna x");
  });
});
