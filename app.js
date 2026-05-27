const KM_PER_MILE = 0.621371;

// --- Conversion helpers ---

function milesToKm(miles) {
  return miles / KM_PER_MILE;
}

function kmToMiles(km) {
  return km * KM_PER_MILE;
}

function toMiles(value, unit) {
  return unit === 'km' ? kmToMiles(value) : value;
}

function fromMiles(miles, unit) {
  return unit === 'km' ? milesToKm(miles) : miles;
}

// --- Time formatting ---

function parseTime(hh, mm, ss) {
  return (parseInt(hh, 10) || 0) * 3600
       + (parseInt(mm, 10) || 0) * 60
       + (parseInt(ss, 10) || 0);
}

function formatTime(totalSeconds) {
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function formatPace(secondsPerUnit) {
  const s = Math.round(secondsPerUnit);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

// --- Core calculations ---

function calcPaceFromTime(distanceMiles, totalSeconds) {
  return totalSeconds / distanceMiles;
}

function calcTimeFromPace(distanceMiles, secondsPerMile) {
  return distanceMiles * secondsPerMile;
}

function buildSplits(distanceMiles, secondsPerMile, intervalMiles, displayUnit) {
  const splits = [];
  let covered = 0;
  let splitNum = 1;
  while (covered < distanceMiles - 0.0001) {
    const segmentMiles = Math.min(intervalMiles, distanceMiles - covered);
    covered += segmentMiles;
    const splitTime = segmentMiles * secondsPerMile;
    const elapsed = covered * secondsPerMile;
    const displayDist = fromMiles(covered, displayUnit);
    splits.push({
      num: splitNum++,
      distance: displayDist,
      splitTime,
      elapsed,
      partial: segmentMiles < intervalMiles - 0.0001,
    });
  }
  return splits;
}

// --- Validation ---

function showError(msg) {
  const el = document.getElementById('error-msg');
  el.textContent = msg;
  el.style.display = 'block';
  document.getElementById('results').style.display = 'none';
}

function clearError() {
  const el = document.getElementById('error-msg');
  el.textContent = '';
  el.style.display = 'none';
}

// --- Preset distances ---

function selectPreset(value, unit) {
  document.getElementById('distance').value = value;
  document.getElementById('dist-unit').value = unit;
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.toggle('selected',
      btn.dataset.value === String(value) && btn.dataset.unit === unit);
  });
}

// --- UI state ---

let activeMode = 'time-to-pace';
let lastSecondsMile = null;

function updatePaceDisplay() {
  if (lastSecondsMile === null || document.getElementById('results').style.display === 'none') return;
  const paceUnit = document.querySelector('.unit-btn.active').dataset.unit;
  const secondsPerUnit = paceUnit === 'km'
    ? lastSecondsMile * KM_PER_MILE
    : lastSecondsMile;
  document.getElementById('result-value').textContent = `${formatPace(secondsPerUnit)} / ${paceUnit}`;
}

function setMode(mode) {
  activeMode = mode;
  document.getElementById('btn-time-to-pace').classList.toggle('active', mode === 'time-to-pace');
  document.getElementById('btn-pace-to-time').classList.toggle('active', mode === 'pace-to-time');
  document.getElementById('section-time').style.display = mode === 'time-to-pace' ? 'block' : 'none';
  document.getElementById('section-pace-out').style.display = mode === 'time-to-pace' ? 'block' : 'none';
  document.getElementById('section-pace').style.display = mode === 'pace-to-time' ? 'block' : 'none';
  document.getElementById('results').style.display = 'none';
  lastSecondsMile = null;
  clearError();
}

function toggleSplits() {
  const show = document.getElementById('show-splits').checked;
  document.getElementById('splits-interval').style.display = show ? 'flex' : 'none';
}

// --- Main calculate ---

function calculate() {
  clearError();

  const distVal = parseFloat(document.getElementById('distance').value);
  const distUnit = document.getElementById('dist-unit').value;

  if (isNaN(distVal) || distVal <= 0) {
    return showError('Please enter a valid distance greater than 0.');
  }

  const distanceMiles = toMiles(distVal, distUnit);
  let secondsPerMile;

  if (activeMode === 'time-to-pace') {
    const hh = document.getElementById('time-hh').value;
    const mm = document.getElementById('time-mm').value;
    const ss = document.getElementById('time-ss').value;
    const total = parseTime(hh, mm, ss);
    if (total <= 0) {
      return showError('Please enter a valid total time.');
    }
    secondsPerMile = calcPaceFromTime(distanceMiles, total);
    lastSecondsMile = secondsPerMile;
    const paceUnit = document.querySelector('.unit-btn.active').dataset.unit;
    const secondsPerUnit = paceUnit === 'km'
      ? secondsPerMile * KM_PER_MILE
      : secondsPerMile;
    document.getElementById('result-label').textContent = 'Pace';
    document.getElementById('result-value').textContent =
      `${formatPace(secondsPerUnit)} / ${paceUnit}`;
  } else {
    const pmm = document.getElementById('pace-mm').value;
    const pss = document.getElementById('pace-ss').value;
    const paceUnit = document.getElementById('pace-unit').value;
    if (pmm === '' && pss === '') {
      return showError('Please enter a pace.');
    }
    const paceSeconds = parseTime(0, pmm, pss);
    if (paceSeconds <= 0) {
      return showError('Please enter a valid pace greater than 0.');
    }
    if (parseInt(pss, 10) > 59) {
      return showError('Seconds must be between 0 and 59.');
    }
    // paceSeconds is seconds per mile or per km depending on paceUnit
    secondsPerMile = paceUnit === 'km'
      ? paceSeconds / KM_PER_MILE
      : paceSeconds;
    const totalSeconds = calcTimeFromPace(distanceMiles, secondsPerMile);
    document.getElementById('result-label').textContent = 'Total Time';
    document.getElementById('result-value').textContent = formatTime(totalSeconds);
  }

  document.getElementById('results').style.display = 'block';

  // Splits
  const splitsContainer = document.getElementById('splits-container');
  splitsContainer.innerHTML = '';

  if (document.getElementById('show-splits').checked) {
    const intVal = parseFloat(document.getElementById('interval-val').value);
    const intUnit = document.getElementById('interval-unit').value;
    if (isNaN(intVal) || intVal <= 0) {
      return showError('Please enter a valid splits interval greater than 0.');
    }
    const intervalMiles = toMiles(intVal, intUnit);
    if (intervalMiles > distanceMiles) {
      return showError('Splits interval cannot be larger than the total distance.');
    }

    const splits = buildSplits(distanceMiles, secondsPerMile, intervalMiles, intUnit);
    const table = document.createElement('table');
    table.innerHTML = `
      <thead>
        <tr>
          <th>#</th>
          <th>Distance (${intUnit})</th>
          <th>Split Time</th>
          <th>Elapsed</th>
        </tr>
      </thead>
    `;
    const tbody = document.createElement('tbody');
    splits.forEach(s => {
      const tr = document.createElement('tr');
      if (s.partial) tr.classList.add('partial');
      tr.innerHTML = `
        <td>${s.num}</td>
        <td>${s.distance.toFixed(2)}</td>
        <td>${formatTime(s.splitTime)}</td>
        <td>${formatTime(s.elapsed)}</td>
      `;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    splitsContainer.appendChild(table);
  }
}

// --- Init ---

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.unit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updatePaceDisplay();
    });
  });
  document.getElementById('btn-time-to-pace').addEventListener('click', () => setMode('time-to-pace'));
  document.getElementById('btn-pace-to-time').addEventListener('click', () => setMode('pace-to-time'));
  document.getElementById('show-splits').addEventListener('change', toggleSplits);
  document.getElementById('calc-btn').addEventListener('click', calculate);
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => selectPreset(btn.dataset.value, btn.dataset.unit));
  });
  document.getElementById('distance').addEventListener('input', () => {
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('selected'));
  });
  setMode('time-to-pace');
});
