// Cache de nodos usados en toda la app
export const DOM = {
  // Header
  mainHeader: document.getElementById('mainHeader'),
  statusHeader: document.getElementById('statusHeader'),
  subtituloHeader: document.getElementById('subtituloHeader'),

  // Horarios y pill
  tasaFecha: document.getElementById('tasaFecha'), // nombre nuevo
  get tasaFechaEl() { return this.tasaFecha; },    // alias por compatibilidad

  // Step containers
  step1Origen: document.getElementById('step1Origen'),
  step2Destino: document.getElementById('step2Destino'),
  step1: document.getElementById('step1'),
  step2: document.getElementById('step2'),

  // Tasa card
  tasaWrap: document.getElementById('tasaWrap'),
  tasaTitulo: document.getElementById('tasaTitulo'),
  tasaValue: document.getElementById('tasaValue'),
  tasaCard: document.getElementById('tasaCard'),
  tasaAdvertencia: document.getElementById('tasaAdvertencia'),
  tasaAdvertenciaTexto: document.getElementById('tasaAdvertenciaTexto'),
  tasaConfirmacion: document.getElementById('tasaConfirmacion'),
  tasaConfirmacionTexto: document.getElementById('tasaConfirmacionTexto'),

  // BCV UI
  bcvBox: document.getElementById("bcvBox"),
  bcvTitulo: document.getElementById("bcvTitulo"),
  btnBcvUsd: document.getElementById("btnBcvUsd"),
  btnBcvEur: document.getElementById("btnBcvEur"),
  btnBcvCustom: document.getElementById("btnBcvCustom"),
  bcvCustomRow: document.getElementById("bcvCustomRow"),
  bcvTasaCustom: document.getElementById("bcvTasaCustom"),
  bcvCustomHelp: document.getElementById("bcvCustomHelp"),

  // Botones principales
  btnEnviar: document.getElementById('btnEnviar'),
  btnLlegar: document.getElementById('btnLlegar'),
  btnLlegarBCV: document.getElementById("btnLlegarBCV"),
  btnCalcular: document.getElementById('btnCalcular'),
  btnRecalcular: document.getElementById('btnRecalcular'),
  btnWhats: document.getElementById('btnWhats'),
  btnVolverGlobal: document.getElementById('btnVolverGlobal'),

  // Inputs / ayudas
  inputMonto: document.getElementById('inputMonto'),
  ayudaMonto: document.getElementById('ayudaMonto'),
  errorMonto: document.getElementById('errorMonto'),
  preguntaMonto: document.getElementById('preguntaMonto'),

  // Listas dinámicas
  origenBtns: document.getElementById('origenBtns'),
  destinoBtns: document.getElementById('destinoBtns'),

  // Loader / resultado
  loader: document.getElementById('calculando'),
  resultado: document.getElementById('resultado'),
  resText: document.getElementById('resText'),
  resTextContainer: document.getElementById('resTextContainer'),

  // Compartir
  btnCompartir: document.getElementById('btnCompartir'),
  menuCompartir: document.getElementById('menuCompartir'),
  opcionTexto: document.getElementById('opcionTexto'),
  opcionImagen: document.getElementById('opcionImagen'),

  // Otros
  soundSuccess: document.getElementById('soundSuccess'),
  toastMensaje: document.getElementById('toastMensaje'),
  pillHorario: document.getElementById('pillHorario'),
};
