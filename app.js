import { SCALE_TYPES, noteAt, noteName, scaleNotes, containsNotes } from './music.js';
import { Fretboard } from './fretboard.js';
import { initChords } from './chords.js';

const $ = selector => document.querySelector(selector);
const state = { selected: new Set(), active: null, flats: false, showNames: false };
const totalScales = SCALE_TYPES.length * 12;
const scaleButtons = [], headings = [];
const fullScaleName = (type, root) => `${noteName(root, state.flats)} ${type.name.toLowerCase()}`;
const selectedPitches = () => new Set([...state.selected].map(key => noteAt(...key.split(':').map(Number))));
const scaleBoard = new Fretboard($('#fretboard'), { onSelect: position => {
  if (state.selected.has(position.key)) state.selected.delete(position.key); else state.selected.add(position.key);
  renderScales();
} });

function createScaleTable() {
  for (let root = 0; root < 12; root++) {
    const heading = document.createElement('th'); heading.scope = 'col'; heading.className = 'tonic-heading';
    headings.push(heading); $('#tonic-headings').append(heading);
  }
  SCALE_TYPES.forEach((type, index) => {
    const row = document.createElement('tr'); row.className = `scale-row${index > 0 && type.family !== SCALE_TYPES[index - 1].family ? ' group-start' : ''}`;
    const label = document.createElement('th'); label.scope = 'row';
    const name = document.createElement('strong'); name.textContent = type.name;
    const subtitle = document.createElement('small'); subtitle.textContent = type.subtitle; label.append(name, subtitle); row.append(label);
    for (let root = 0; root < 12; root++) {
      const cell = document.createElement('td'), button = document.createElement('button'); button.type = 'button'; button.className = 'scale-button';
      button.dataset.scale = type.id; button.dataset.root = root; button.tabIndex = index === 0 && root === 0 ? 0 : -1;
      scaleButtons.push({ button, type, root });
      const setTabStop = target => { for (const entry of scaleButtons) entry.button.tabIndex = entry.button === target ? 0 : -1; };
      button.addEventListener('click', () => {
        setTabStop(button);
        const wasActive = state.active?.type.id === type.id && state.active.root === root;
        state.active = wasActive ? null : { type, root }; renderScales();
        const card = $('#scale-panel .fretboard-card');
        if (!wasActive && card.getBoundingClientRect().bottom < 0) card.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      });
      button.addEventListener('keydown', event => {
        let nextRow = index, nextRoot = root;
        switch (event.key) {
          case 'ArrowLeft': nextRoot = Math.max(0, root - 1); break;
          case 'ArrowRight': nextRoot = Math.min(11, root + 1); break;
          case 'ArrowUp': nextRow = Math.max(0, index - 1); break;
          case 'ArrowDown': nextRow = Math.min(SCALE_TYPES.length - 1, index + 1); break;
          case 'Home': nextRoot = 0; break;
          case 'End': nextRoot = 11; break;
          default: return;
        }
        event.preventDefault(); const target = scaleButtons[nextRow * 12 + nextRoot].button;
        setTabStop(target); target.focus({ preventScroll: true }); target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
      cell.append(button); row.append(cell);
    }
    $('#scale-rows').append(row);
  });
}

function renderSelection(pitches) {
  $('#note-count').textContent = pitches.size; $('#clear').disabled = !state.selected.size;
  const chips = $('#selected-notes'), focusedPitch = document.activeElement?.dataset.removePitch; chips.replaceChildren();
  if (!pitches.size) { const placeholder = document.createElement('span'); placeholder.className = 'empty-selection'; placeholder.textContent = 'Click the fretboard to add notes'; chips.append(placeholder); }
  for (const pitch of [...pitches].sort((a, b) => a - b)) {
    const chip = document.createElement('button'); chip.className = 'note-chip'; chip.dataset.removePitch = pitch;
    chip.setAttribute('aria-label', `Remove ${noteName(pitch, state.flats)} from every selected position`); chip.textContent = noteName(pitch, state.flats);
    const cross = document.createElement('span'); cross.textContent = '×'; cross.setAttribute('aria-hidden', 'true'); chip.append(cross);
    chip.addEventListener('click', () => {
      for (const position of scaleBoard.positions) if (position.pitch === pitch) state.selected.delete(position.key);
      renderScales(); const nextChip = chips.querySelector('button'); if (nextChip) nextChip.focus({ preventScroll: true }); else scaleBoard.focusCurrent();
    });
    chips.append(chip);
  }
  if (focusedPitch !== undefined) chips.querySelector(`[data-remove-pitch="${focusedPitch}"]`)?.focus({ preventScroll: true });
}

function renderScales() {
  const pitches = selectedPitches(), activePitches = new Set(state.active ? scaleNotes(state.active.type, state.active.root) : []);
  scaleBoard.update({ selected: state.selected, flats: state.flats, showNames: state.showNames, scale: state.active ? { root: state.active.root, pitches: [...activePitches] } : null }); renderSelection(pitches);
  headings.forEach((heading, root) => {
    const primary = noteName(root, state.flats), alternative = noteName(root, !state.flats); heading.textContent = primary;
    if (primary !== alternative) { const small = document.createElement('small'); small.textContent = alternative; heading.append(small); }
  });
  let matches = 0;
  for (const { button, type, root } of scaleButtons) {
    const compatible = containsNotes(type, root, pitches), active = state.active?.type.id === type.id && state.active.root === root;
    if (compatible) matches++;
    button.textContent = noteName(root, state.flats); button.className = `scale-button${compatible ? '' : ' is-muted'}${active ? ' is-active' : ''}`; button.setAttribute('aria-pressed', String(active));
    const label = `${fullScaleName(type, root)}. ${compatible ? 'Contains all selected notes' : 'Does not contain all selected notes'}. ${active ? 'Hide overlay' : 'Show on fretboard'}`; button.setAttribute('aria-label', label); button.title = label;
  }
  $('#match-badge').replaceChildren(document.createTextNode(`${matches} `)); const total = document.createElement('span'); total.textContent = `/ ${totalScales}`; $('#match-badge').append(total);
  $('#no-matches').hidden = matches !== 0;
  $('#results-description').textContent = pitches.size ? `${matches} of ${totalScales} scales contain every selected note. Dimmed scales can still be compared.` : `All ${totalScales} scales are available. Select notes to filter them.`;
  $('#scale-inspector').hidden = !state.active; if (!state.active) return;
  const { type, root } = state.active; $('#active-scale-name').textContent = fullScaleName(type, root);
  const missing = [...pitches].filter(pitch => !activePitches.has(pitch)), fit = $('#active-scale-fit'); fit.classList.toggle('is-warning', !!missing.length);
  fit.textContent = !pitches.size ? `${type.intervals.length} notes` : missing.length ? `Outside scale: ${missing.map(pitch => noteName(pitch, state.flats)).join(' · ')}` : 'Contains all selected notes';
  const list = $('#active-scale-notes'); list.replaceChildren();
  scaleNotes(type, root).forEach((pitch, index) => {
    const note = document.createElement('span'); note.className = 'scale-note'; note.textContent = noteName(pitch, state.flats);
    const degree = document.createElement('small'); degree.textContent = type.degrees[index]; note.append(degree);
    note.title = `${index === 0 ? 'Tonic' : `Degree ${type.degrees[index]}`}: ${noteName(pitch, state.flats)}`; list.append(note);
  });
}

createScaleTable(); renderScales();
const chords = initChords({ getFlats: () => state.flats });
$('#clear').addEventListener('click', () => { state.selected.clear(); renderScales(); });
$('#show-names').addEventListener('change', event => { state.showNames = event.target.checked; renderScales(); });
for (const [id, flats] of [['sharps', false], ['flats', true]]) $(`#${id}`).addEventListener('click', () => {
  state.flats = flats;
  $('#sharps').classList.toggle('is-current', !flats); $('#sharps').setAttribute('aria-pressed', String(!flats)); $('#flats').classList.toggle('is-current', flats); $('#flats').setAttribute('aria-pressed', String(flats)); renderScales(); chords.render();
});
$('#example').addEventListener('click', () => { state.selected = new Set(['5:0', '5:3', '4:2']); state.active = null; $('#fretboard-scroll').scrollLeft = 0; renderScales(); });
$('#hide-scale').addEventListener('click', () => { const previous = scaleButtons.find(entry => entry.type.id === state.active?.type.id && entry.root === state.active.root); state.active = null; renderScales(); previous?.button.focus({ preventScroll: true }); });
const tabs = [$('#scales-tab'), $('#chords-tab')];
function switchTool(index, focus = false) {
  tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; });
  $('#scale-panel').hidden = index !== 0; $('#chord-panel').hidden = index !== 1; history.replaceState(null, '', index ? '#chords' : '#scales'); if (focus) tabs[index].focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => switchTool(index));
  tab.addEventListener('keydown', event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); switchTool(event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - index, true); } });
});
window.addEventListener('hashchange', () => switchTool(location.hash === '#chords' ? 1 : 0)); switchTool(location.hash === '#chords' ? 1 : 0);
const dialog = $('#help-dialog');
$('#help-open').addEventListener('click', () => dialog.showModal()); $('#help-close').addEventListener('click', () => dialog.close()); $('#help-done').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target !== dialog) return; const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); });
