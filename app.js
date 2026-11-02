import { TUNING, FRETS, SCALE_TYPES, pitchClass, noteAt, noteName, scaleNotes, containsNotes } from './music.js';

const $ = selector => document.querySelector(selector);
const state = { selected: new Set(), active: null, flats: false, showNames: false };
const totalScales = SCALE_TYPES.length * 12;
const positions = [];
const scaleButtons = [];
const headings = [];
const board = $('#fretboard');
const rows = $('#scale-rows');
const keyOf = (string, fret) => `${string}:${fret}`;
const selectedPitches = () => new Set([...state.selected].map(key => {
  const [string, fret] = key.split(':').map(Number);
  return noteAt(string, fret);
}));
const fullScaleName = (type, root) => `${noteName(root, state.flats)} — ${type.name.toLowerCase()}`;

function moveTabStop(button, collection) {
  for (const entry of collection) entry.button.tabIndex = entry.button === button ? 0 : -1;
}

function createFretboard() {
  const fragment = document.createDocumentFragment();
  for (let fret = 0; fret <= FRETS; fret++) {
    const number = document.createElement('span');
    number.className = `fret-number${fret === 0 ? ' open-number' : ''}${fret === 12 || fret === 24 ? ' octave' : ''}`;
    number.textContent = fret;
    number.style.gridColumn = fret + 2;
    number.style.gridRow = 1;
    number.setAttribute('aria-hidden', 'true');
    fragment.append(number);
  }
  TUNING.forEach((midi, string) => {
    const label = document.createElement('span');
    label.className = 'string-label';
    label.style.gridColumn = 1;
    label.style.gridRow = string + 2;
    label.innerHTML = `<small>${string + 1}</small>${noteName(pitchClass(midi))}`;
    label.setAttribute('aria-hidden', 'true');
    fragment.append(label);
    for (let fret = 0; fret <= FRETS; fret++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `fret-cell${fret === 0 ? ' open-fret' : ''}`;
      button.style.gridColumn = fret + 2;
      button.style.gridRow = string + 2;
      button.style.setProperty('--string-width', `${0.8 + string * 0.27}px`);
      button.dataset.string = string;
      button.dataset.fret = fret;
      button.dataset.pitch = noteAt(string, fret);
      button.tabIndex = string === 0 && fret === 0 ? 0 : -1;
      const marker = document.createElement('span');
      marker.className = 'note-marker';
      marker.setAttribute('aria-hidden', 'true');
      button.append(marker);
      const position = { button, marker, string, fret, pitch: noteAt(string, fret), key: keyOf(string, fret) };
      positions.push(position);
      button.addEventListener('click', () => {
        moveTabStop(button, positions);
        if (state.selected.has(position.key)) state.selected.delete(position.key);
        else state.selected.add(position.key);
        render();
      });
      button.addEventListener('keydown', event => {
        let nextString = string;
        let nextFret = fret;
        switch (event.key) {
          case 'ArrowLeft': nextFret = Math.max(0, fret - 1); break;
          case 'ArrowRight': nextFret = Math.min(FRETS, fret + 1); break;
          case 'ArrowUp': nextString = Math.max(0, string - 1); break;
          case 'ArrowDown': nextString = Math.min(5, string + 1); break;
          case 'Home': nextFret = 0; break;
          case 'End': nextFret = FRETS; break;
          default: return;
        }
        event.preventDefault();
        const target = positions.find(entry => entry.string === nextString && entry.fret === nextFret).button;
        moveTabStop(target, positions);
        target.focus({ preventScroll: true });
        target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
      fragment.append(button);
    }
  });
  for (const fret of [3, 5, 7, 9, 12, 15, 17, 19, 21, 24]) {
    const marker = document.createElement('span');
    marker.className = `fret-marker${fret % 12 === 0 ? ' double' : ''}`;
    marker.style.gridColumn = fret + 2;
    marker.style.gridRow = 8;
    marker.setAttribute('aria-hidden', 'true');
    fragment.append(marker);
  }
  board.append(fragment);
}

function createScaleTable() {
  for (let root = 0; root < 12; root++) {
    const heading = document.createElement('th');
    heading.scope = 'col';
    heading.className = 'tonic-heading';
    headings.push(heading);
    $('#tonic-headings').append(heading);
  }
  SCALE_TYPES.forEach((type, index) => {
    const row = document.createElement('tr');
    row.className = `scale-row${index > 0 && type.family !== SCALE_TYPES[index - 1].family ? ' group-start' : ''}`;
    const label = document.createElement('th');
    label.scope = 'row';
    const name = document.createElement('strong');
    name.textContent = type.name;
    const subtitle = document.createElement('small');
    subtitle.textContent = type.subtitle;
    label.append(name, subtitle);
    row.append(label);
    for (let root = 0; root < 12; root++) {
      const cell = document.createElement('td');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'scale-button';
      button.dataset.scale = type.id;
      button.dataset.root = root;
      button.tabIndex = index === 0 && root === 0 ? 0 : -1;
      scaleButtons.push({ button, type, root });
      button.addEventListener('click', () => {
        moveTabStop(button, scaleButtons);
        const wasActive = state.active?.type.id === type.id && state.active.root === root;
        state.active = wasActive ? null : { type, root };
        render();
        if (!wasActive && $('.fretboard-card').getBoundingClientRect().bottom < 0) {
          $('.fretboard-card').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
        }
      });
      button.addEventListener('keydown', event => {
        let nextRow = index;
        let nextRoot = root;
        switch (event.key) {
          case 'ArrowLeft': nextRoot = Math.max(0, root - 1); break;
          case 'ArrowRight': nextRoot = Math.min(11, root + 1); break;
          case 'ArrowUp': nextRow = Math.max(0, index - 1); break;
          case 'ArrowDown': nextRow = Math.min(SCALE_TYPES.length - 1, index + 1); break;
          case 'Home': nextRoot = 0; break;
          case 'End': nextRoot = 11; break;
          default: return;
        }
        event.preventDefault();
        const target = scaleButtons[nextRow * 12 + nextRoot].button;
        moveTabStop(target, scaleButtons);
        target.focus({ preventScroll: true });
        target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
      cell.append(button);
      row.append(cell);
    }
    rows.append(row);
  });
}

function renderFretboard(pitches, activePitches) {
  board.classList.toggle('show-all', state.showNames);
  for (const position of positions) {
    const { button, marker, string, fret, pitch, key } = position;
    const selected = state.selected.has(key);
    const inScale = activePitches.has(pitch);
    const tonic = state.active?.root === pitch;
    marker.textContent = noteName(pitch, state.flats);
    marker.className = `note-marker${inScale ? ' in-scale' : ''}${tonic ? ' is-tonic' : ''}${selected ? ' is-selected' : ''}${selected && state.active && !inScale ? ' outside-scale' : ''}`;
    button.setAttribute('aria-pressed', String(selected));
    const octave = Math.floor((TUNING[string] + fret) / 12) - 1;
    const description = `${string + 1}-я струна, ${fret === 0 ? 'открытая' : `${fret}-й лад`}, ${noteName(pitch, state.flats)}${octave}${inScale ? ', входит в гамму' : ''}${tonic ? ', тоника' : ''}`;
    button.setAttribute('aria-label', description);
    button.title = description;
  }
  $('#note-count').textContent = pitches.size;
  $('#clear').disabled = state.selected.size === 0;
  const chips = $('#selected-notes');
  const focusedPitch = document.activeElement?.dataset.removePitch;
  chips.replaceChildren();
  if (!pitches.size) {
    const placeholder = document.createElement('span');
    placeholder.className = 'empty-selection';
    placeholder.textContent = 'Нажмите на гриф, чтобы добавить ноты';
    chips.append(placeholder);
  }
  for (const pitch of [...pitches].sort((a, b) => a - b)) {
    const chip = document.createElement('button');
    chip.className = 'note-chip';
    chip.dataset.removePitch = pitch;
    chip.setAttribute('aria-label', `Убрать ноту ${noteName(pitch, state.flats)} со всего грифа`);
    chip.textContent = noteName(pitch, state.flats);
    const cross = document.createElement('span');
    cross.textContent = '×';
    cross.setAttribute('aria-hidden', 'true');
    chip.append(cross);
    chip.addEventListener('click', () => {
      for (const position of positions) if (position.pitch === pitch) state.selected.delete(position.key);
      render();
      const nextChip = chips.querySelector('button');
      (nextChip || positions.find(entry => entry.button.tabIndex === 0).button).focus({ preventScroll: true });
    });
    chips.append(chip);
  }
  if (focusedPitch !== undefined) chips.querySelector(`[data-remove-pitch="${focusedPitch}"]`)?.focus({ preventScroll: true });
}

function renderTable(pitches) {
  headings.forEach((heading, root) => {
    const primary = noteName(root, state.flats);
    const alternative = noteName(root, !state.flats);
    heading.textContent = primary;
    if (primary !== alternative) {
      const small = document.createElement('small');
      small.textContent = alternative;
      heading.append(small);
    }
  });
  let matches = 0;
  for (const { button, type, root } of scaleButtons) {
    const compatible = containsNotes(type, root, pitches);
    const active = state.active?.type.id === type.id && state.active.root === root;
    if (compatible) matches++;
    button.textContent = noteName(root, state.flats);
    button.className = `scale-button${compatible ? '' : ' is-muted'}${active ? ' is-active' : ''}`;
    button.setAttribute('aria-pressed', String(active));
    const label = `${fullScaleName(type, root)}. ${compatible ? 'Содержит все выбранные ноты' : 'Не содержит все выбранные ноты'}. ${active ? 'Скрыть подсветку' : 'Показать на грифе'}`;
    button.setAttribute('aria-label', label);
    button.title = label;
  }
  $('#match-badge').replaceChildren(document.createTextNode(`${matches} `));
  const total = document.createElement('span');
  total.textContent = `/ ${totalScales}`;
  $('#match-badge').append(total);
  $('#no-matches').hidden = matches !== 0;
  $('#results-description').textContent = pitches.size
    ? `Содержат все выбранные ноты: ${matches} из ${totalScales} гамм. Потухшие тоже можно сравнить.`
    : `Все ${totalScales} гамм доступны. Добавьте ноты, чтобы сузить поиск.`;
}

function renderInspector(pitches, activePitches) {
  $('#scale-inspector').hidden = !state.active;
  if (!state.active) return;
  const { type, root } = state.active;
  $('#active-scale-name').textContent = fullScaleName(type, root);
  const missing = [...pitches].filter(pitch => !activePitches.has(pitch));
  const fit = $('#active-scale-fit');
  fit.classList.toggle('is-warning', missing.length > 0);
  fit.textContent = !pitches.size ? `${type.intervals.length} нот · полупрозрачная подсветка`
    : missing.length ? `Не входят: ${missing.map(pitch => noteName(pitch, state.flats)).join(' · ')}`
    : 'Содержит все ваши ноты';
  const list = $('#active-scale-notes');
  list.replaceChildren();
  scaleNotes(type, root).forEach((pitch, index) => {
    const note = document.createElement('span');
    note.className = 'scale-note';
    note.textContent = noteName(pitch, state.flats);
    const degree = document.createElement('small');
    degree.textContent = type.degrees[index];
    note.append(degree);
    note.title = `${index === 0 ? 'Тоника' : `Ступень ${type.degrees[index]}`}: ${noteName(pitch, state.flats)}`;
    list.append(note);
  });
}

function render() {
  const pitches = selectedPitches();
  const activePitches = new Set(state.active ? scaleNotes(state.active.type, state.active.root) : []);
  renderFretboard(pitches, activePitches);
  renderTable(pitches);
  renderInspector(pitches, activePitches);
  $('#sharps').classList.toggle('is-current', !state.flats);
  $('#sharps').setAttribute('aria-pressed', String(!state.flats));
  $('#flats').classList.toggle('is-current', state.flats);
  $('#flats').setAttribute('aria-pressed', String(state.flats));
}

$('#clear').addEventListener('click', () => { state.selected.clear(); render(); });
$('#show-names').addEventListener('change', event => { state.showNames = event.target.checked; render(); });
$('#sharps').addEventListener('click', () => { state.flats = false; render(); });
$('#flats').addEventListener('click', () => { state.flats = true; render(); });
$('#example').addEventListener('click', () => {
  state.selected = new Set(['5:0', '5:3', '4:2']);
  state.active = null;
  $('#fretboard-scroll').scrollLeft = 0;
  render();
});
$('#hide-scale').addEventListener('click', () => {
  const previous = scaleButtons.find(entry => entry.type.id === state.active?.type.id && entry.root === state.active.root);
  state.active = null;
  render();
  previous?.button.focus({ preventScroll: true });
});
const dialog = $('#help-dialog');
$('#help-open').addEventListener('click', () => dialog.showModal());
$('#help-close').addEventListener('click', () => dialog.close());
$('#help-done').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const box = dialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
});

createFretboard();
createScaleTable();
render();
