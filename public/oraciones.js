/* =========================================================
   FE Y ESPERANZA — LÓGICA DE LA PÁGINA "ORACIONES"
   Lee el contenido desde data/oraciones-data.js y lo muestra
   según la fecha seleccionada (hoy por defecto).
   No es necesario editar este archivo para agregar oraciones:
   todo el contenido se administra en data/oraciones-data.js
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];

  const dateHeading = document.getElementById('prayerDateHeading');
  const dateLabel = document.getElementById('prayerDateLabel');
  const prevBtn = document.getElementById('prayerPrevDay');
  const nextBtn = document.getElementById('prayerNextDay');
  const todayBtn = document.getElementById('prayerTodayBtn');
  const datePicker = document.getElementById('prayerDatePicker');

  const CATEGORIES = ['manana', 'noche', 'familia', 'agradecimiento', 'sanidad', 'dificil'];

  if (!dateHeading || !window.ORACIONES_BANCO) return; // Esta página no está presente en este documento

  function pad(n) { return String(n).padStart(2, '0'); }

  function keyFor(date) {
    return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function dayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    return Math.floor(diff / 86400000);
  }

  function formatDateEs(date) {
    return `${DIAS[date.getDay()]}, ${date.getDate()} de ${MESES[date.getMonth()]}`;
  }

  function toInputValue(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function getPrayer(date, category) {
    const key = keyFor(date);
    const special = window.ORACIONES_ESPECIALES && window.ORACIONES_ESPECIALES[key];
    if (special && special[category]) {
      return { texto: special[category], versiculo: special.versiculo || '' };
    }
    const bank = window.ORACIONES_BANCO[category] || [];
    if (!bank.length) return { texto: '', versiculo: '' };
    const idx = dayOfYear(date) % bank.length;
    return bank[idx];
  }

  function render(date) {
    dateHeading.textContent = formatDateEs(date);
    if (dateLabel) {
      const isToday = toInputValue(date) === toInputValue(new Date());
      dateLabel.textContent = isToday ? 'Oración de hoy' : 'Oración para el';
    }
    if (datePicker) datePicker.value = toInputValue(date);

    CATEGORIES.forEach(cat => {
      const textEl = document.getElementById(`prayer-${cat}-text`);
      const verseEl = document.getElementById(`prayer-${cat}-verse`);
      const data = getPrayer(date, cat);
      if (textEl) textEl.textContent = data.texto;
      if (verseEl) verseEl.textContent = data.versiculo ? `— ${data.versiculo}` : '';
    });

    // Actualiza la URL para poder compartir la oración de un día concreto
    const url = new URL(window.location);
    url.searchParams.set('fecha', toInputValue(date));
    window.history.replaceState({}, '', url);
  }

  // Fecha inicial: la que venga en la URL (?fecha=AAAA-MM-DD) o el día de hoy
  let currentDate = new Date();
  const params = new URLSearchParams(window.location.search);
  const fechaParam = params.get('fecha');
  if (fechaParam && /^\d{4}-\d{2}-\d{2}$/.test(fechaParam)) {
    const parsed = new Date(fechaParam + 'T00:00:00');
    if (!isNaN(parsed)) currentDate = parsed;
  }

  render(currentDate);

  if (prevBtn) prevBtn.addEventListener('click', () => {
    currentDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() - 1);
    render(currentDate);
  });

  if (nextBtn) nextBtn.addEventListener('click', () => {
    currentDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + 1);
    render(currentDate);
  });

  if (todayBtn) todayBtn.addEventListener('click', () => {
    currentDate = new Date();
    render(currentDate);
  });

  if (datePicker) datePicker.addEventListener('change', () => {
    if (!datePicker.value) return;
    currentDate = new Date(datePicker.value + 'T00:00:00');
    render(currentDate);
  });
});
