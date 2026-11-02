import { noteName } from './music.js';
import { Fretboard, voicingKeys } from './fretboard.js';
import { CHORD_TYPES, PROGRESSIONS, emptyVoicing, voicingPitches, voicingBass, detectChords, chordLabel, chordPitches, qualityFits, matchProgressions, possibleKeys, findVoicing, buildProgression, normalizeSavedChord } from './harmony.js';

const $ = selector => document.querySelector(selector);
const STORAGE_KEY = 'guitar-utilities-sequence-v1';
const MAX_CHORDS = 64;
const el = (tag, className = '', text = '') => { const element = document.createElement(tag); if (className) element.className = className; if (text) element.textContent = text; return element; };
const voicingText = voicing => voicing ? [...voicing].reverse().map(fret => fret === null ? '×' : fret).join(' ') : 'No compact shape';
const identityKey = chord => `${chord.root}:${chord.quality}`;
let counter = 0;
const nextId = () => `chord-${Date.now()}-${++counter}`;
const keyName = (tonic, mode, flats, patternId) => `${noteName(tonic, flats)} ${patternId === 'mixolydian-rock' ? 'mixolydian' : mode}`;

export function initChords({ getFlats }) {
  const state = { draft: emptyVoicing(), identity: '', customRoot: null, showNames: false, saved: [], source: 'current', pattern: PROGRESSIONS[0], anchorIndex: null, powerOverride: null, result: null, signature: '', visible: new Set(), overlayMode: 'shapes' };
  let storageAvailable = true;
  let storedSequence = null;
  try { storedSequence = sessionStorage.getItem(STORAGE_KEY); } catch { storageAvailable = false; }
  try {
    const raw = JSON.parse(storedSequence || '[]');
    if (Array.isArray(raw)) state.saved = raw.slice(0, MAX_CHORDS).map(normalizeSavedChord).filter(Boolean).map(chord => ({ ...chord, id: nextId() }));
  } catch { /* Ignore invalid saved data without affecting in-memory use. */ }
  const board = new Fretboard($('#chord-fretboard'), {
    onSelect: ({ string, fret }) => { state.draft[string] = state.draft[string] === fret ? null : fret; state.identity = ''; status(''); render(); },
    onMute: string => { state.draft[string] = null; state.identity = ''; status(''); render(); }
  });
  for (const pattern of PROGRESSIONS) { const option = el('option', '', `${pattern.name} — ${pattern.steps.map(step => step.roman).join(' – ')}`); option.value = pattern.id; $('#progression-template').append(option); }

  function status(message) { $('#chord-status').textContent = message; }
  function persist() {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.saved.map(({ id, ...chord }) => chord))); }
    catch { storageAvailable = false; }
    $('#storage-note').hidden = storageAvailable;
  }
  function draftChord() {
    const pitches = voicingPitches(state.draft);
    if (pitches.length < 2) return null;
    const candidates = detectChords(state.draft);
    if (state.identity !== 'custom') {
      const detected = candidates.find(chord => identityKey(chord) === state.identity) ?? candidates[0];
      if (detected) { state.identity = identityKey(detected); return detected; }
    }
    state.identity = 'custom';
    if (!pitches.includes(state.customRoot)) state.customRoot = voicingBass(state.draft);
    return { root: state.customRoot, quality: 'custom', pitches, bass: voicingBass(state.draft), voicing: [...state.draft] };
  }
  function sourceChord(current) {
    if (state.source === 'current') return current;
    const saved = state.saved.find(chord => chord.id === state.source);
    if (saved) return saved;
    state.source = 'current'; return current;
  }
  function resetBuilder() { state.anchorIndex = null; state.result = null; state.signature = ''; state.visible.clear(); state.powerOverride = null; }
  function updateBuilder(source) {
    const canUsePower = state.pattern.steps.every(step => chordPitches(0, step.quality).includes(7));
    const powerMode = canUsePower && (state.powerOverride ?? source?.quality === 'power');
    $('#power-mode').checked = !!powerMode; $('#power-mode').disabled = !canUsePower;
    $('#power-mode').title = canUsePower ? 'Keep the entered anchor; use root-and-fifth chords for the other steps' : 'This pattern contains a diminished fifth, so power-chord mode is unavailable';
    state.result = state.anchorIndex !== null ? buildProgression(state.pattern, state.anchorIndex, source, powerMode) : null;
    const signature = state.result ? `${state.pattern.id}|${state.anchorIndex}|${state.result.chords.map(chord => `${identityKey(chord)}:${chord.voicing?.join(',')}`).join('|')}` : '';
    if (signature !== state.signature) { state.signature = signature; state.visible = new Set(state.result?.chords.map((_, index) => index) ?? []); }
    return powerMode;
  }

  function renderDraft(current) {
    const flats = getFlats(), pitches = voicingPitches(state.draft), candidates = detectChords(state.draft);
    $('#draft-name').textContent = current ? chordLabel(current, flats) : 'No chord';
    $('#draft-notes').textContent = current ? `${pitches.map(pitch => noteName(pitch, flats)).join(' · ')}  |  Bass: ${noteName(current.bass, flats)}` : 'Select at least two different notes.';
    $('#chord-clear').disabled = !state.draft.some(fret => fret !== null);
    $('#save-chord').disabled = !current || state.saved.length >= MAX_CHORDS;
    $('#save-chord').title = state.saved.length >= MAX_CHORDS ? `The temporary list holds up to ${MAX_CHORDS} chords` : 'Add this chord to the sequence, then clear the fretboard';
    const select = $('#chord-identity'); select.replaceChildren(); select.disabled = !current;
    if (!current) { const option = el('option', '', 'Select notes first'); option.value = ''; select.append(option); }
    else {
      for (const candidate of candidates) { const option = el('option', '', chordLabel(candidate, flats)); option.value = identityKey(candidate); select.append(option); }
      const custom = el('option', '', 'Custom note set'); custom.value = 'custom'; select.append(custom); select.value = state.identity;
    }
    const custom = current?.quality === 'custom'; $('#custom-root').hidden = !custom; $('#custom-root-label').hidden = !custom;
    const rootSelect = $('#custom-root'); rootSelect.replaceChildren();
    if (custom) for (const pitch of pitches) { const option = el('option', '', noteName(pitch, flats)); option.value = pitch; rootSelect.append(option); }
    rootSelect.value = String(state.customRoot);
  }

  function renderSaved() {
    const flats = getFlats(), list = $('#saved-chords'); list.replaceChildren();
    $('#sequence-count').textContent = state.saved.length; $('#sequence-empty').hidden = !!state.saved.length; $('#sequence-clear').disabled = !state.saved.length; $('#storage-note').hidden = storageAvailable;
    state.saved.forEach((chord, index) => {
      const item = el('li', 'saved-chord'); item.dataset.chordId = chord.id;
      const load = el('button', 'saved-load'); load.type = 'button'; load.dataset.loadChord = chord.id; load.setAttribute('aria-label', `Load chord ${index + 1}: ${chordLabel(chord, flats)} into the fretboard`);
      load.append(el('span', 'saved-index', String(index + 1)), el('strong', '', chordLabel(chord, flats)), el('span', 'voicing-text', voicingText(chord.voicing)));
      load.addEventListener('click', () => {
        const voicing = chord.voicing ?? (chord.quality !== 'custom' ? findVoicing(chord.root, chord.quality) : null);
        if (!voicing) { status('No fretboard shape is available for this note set.'); return; }
        state.draft = [...voicing]; state.identity = chord.quality === 'custom' ? 'custom' : identityKey(chord); state.customRoot = chord.root; state.source = 'current';
        status(`Loaded ${chordLabel(chord, flats)}. Saving will append a new chord.`); render();
        if ($('.chord-board-card').getBoundingClientRect().bottom < 0) $('.chord-board-card').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      });
      const actions = el('div', 'saved-actions');
      for (const [direction, symbol] of [[-1, '←'], [1, '→']]) {
        const move = el('button', 'mini-button', symbol); move.type = 'button'; move.disabled = index + direction < 0 || index + direction >= state.saved.length;
        move.setAttribute('aria-label', `Move chord ${index + 1} ${direction < 0 ? 'left' : 'right'}`); move.title = move.getAttribute('aria-label'); move.dataset.move = direction;
        move.addEventListener('click', () => {
          [state.saved[index], state.saved[index + direction]] = [state.saved[index + direction], state.saved[index]]; persist(); render();
          $(`[data-chord-id="${chord.id}"] .saved-load`)?.focus({ preventScroll: true }); status('Chord order updated.');
        }); actions.append(move);
      }
      const remove = el('button', 'mini-button remove-chord', '×'); remove.type = 'button'; remove.setAttribute('aria-label', `Remove chord ${index + 1}: ${chordLabel(chord, flats)}`); remove.title = 'Remove chord';
      remove.addEventListener('click', () => {
        state.saved.splice(index, 1); persist(); render(); const remaining = [...list.querySelectorAll('.saved-load')];
        if (remaining.length) remaining[Math.min(index, remaining.length - 1)].focus({ preventScroll: true }); else $('#sequence-example').focus({ preventScroll: true }); status('Chord removed.');
      }); actions.append(remove); item.append(load, actions); list.append(item);
    });
  }

  function analysisRow(title, numerals, badge = '') {
    const row = el('div', 'analysis-result'), heading = el('div', 'analysis-row-heading'); heading.append(el('strong', '', title));
    if (badge) heading.append(el('span', 'analysis-tag', badge)); row.append(heading, el('p', 'roman-line', numerals.join(' – '))); return row;
  }
  function renderAnalysis() {
    const flats = getFlats(), matches = matchProgressions(state.saved), keys = possibleKeys(state.saved), container = $('#progression-matches'); container.replaceChildren();
    $('#key-readings').hidden = !keys.length;
    if (state.saved.length < 2) { $('#analysis-note').textContent = 'Save at least two chords to analyze their order.'; return; }
    $('#analysis-note').textContent = state.saved.some(chord => chord.quality === 'power') ? 'Power chords leave thirds unspecified. The results are possible readings, not a unique key.' : 'Chord order is used; rhythm is not. More than one reading may fit.';
    if (!matches.length) container.append(el('p', 'panel-note', 'No common pattern matches this order. This can still be a valid progression. See key readings below when available.'));
    matches.forEach((match, index) => {
      const title = `${match.pattern.name} · ${keyName(match.tonic, match.pattern.mode, flats, match.pattern.id)}`;
      const badge = match.complete ? (match.exactQualities ? 'Full match' : 'Chord-family match') : `Partial · ${state.saved.length}/${match.pattern.steps.length}`;
      const row = analysisRow(title, match.numerals, badge);
      if (match.start) row.append(el('span', 'subtle-label', `Starts at step ${match.start + 1} of the template`));
      if (index < 4) container.append(row);
    });
    if (matches.length > 4) {
      const details = el('details', 'more-matches'), summary = el('summary', '', `Show ${matches.length - 4} more matches`); details.append(summary);
      for (const match of matches.slice(4)) details.append(analysisRow(`${match.pattern.name} · ${keyName(match.tonic, match.pattern.mode, flats, match.pattern.id)}`, match.numerals, match.complete ? 'Full cycle' : 'Partial'));
      container.append(details);
    }
    $('#key-summary').textContent = `Possible key readings (${keys.length})`;
    const keyResults = $('#key-results'); keyResults.replaceChildren();
    for (const key of keys) keyResults.append(analysisRow(`${noteName(key.tonic, flats)} ${key.type.name.toLowerCase()}`, key.numerals));
    if (keys.length && state.saved.some(chord => chord.quality === 'power')) keyResults.append(el('p', 'panel-note', 'For power chords, numeral case follows the suggested key; the played chord still has no third.'));
  }

  function renderBuilder(source, powerMode) {
    const flats = getFlats(), select = $('#builder-source'); select.replaceChildren();
    const current = draftChord(), currentOption = el('option', '', `Current fretboard${current ? ` — ${chordLabel(current, flats)}` : ' — no chord'}`); currentOption.value = 'current'; select.append(currentOption);
    state.saved.forEach((chord, index) => { const option = el('option', '', `${index + 1}. ${chordLabel(chord, flats)}`); option.value = chord.id; select.append(option); }); select.value = state.source;
    const steps = $('#anchor-steps'); steps.replaceChildren(); let compatibleCount = 0;
    state.pattern.steps.forEach((step, index) => {
      const compatible = !!source && qualityFits(source, step.quality); if (compatible) compatibleCount++;
      const button = el('button', `anchor-step${state.result && state.anchorIndex === index ? ' is-anchor' : ''}`); button.type = 'button'; button.disabled = !compatible;
      button.append(el('small', '', String(index + 1)), el('strong', '', step.roman));
      button.setAttribute('aria-pressed', String(!!state.result && state.anchorIndex === index));
      const required = CHORD_TYPES.find(type => type.id === step.quality).name.toLowerCase();
      button.title = !source ? 'Enter or load a chord first' : compatible ? `Use ${chordLabel(source, flats)} as ${step.roman} (step ${index + 1})` : `This degree requires a ${required} chord`;
      button.setAttribute('aria-label', `Step ${index + 1}, ${step.roman}. ${button.title}`);
      button.addEventListener('click', () => { state.anchorIndex = index; render(); $('#anchor-steps').children[index]?.focus({ preventScroll: true }); status(`Progression built from ${chordLabel(source, flats)} at step ${index + 1}.`); }); steps.append(button);
    });
    $('#anchor-hint').textContent = !source ? 'Enter or load a chord to choose its place in the progression.' : !compatibleCount ? `${chordLabel(source, flats)} does not fit any degree of this template. Try another pattern or chord interpretation.` : state.result ? `Anchor: ${chordLabel(source, flats)} at step ${state.anchorIndex + 1}. ${powerMode ? 'Other steps use power chords.' : 'Other steps use the template chord types.'}` : `Click an available degree to place ${chordLabel(source, flats)} there.`;
    $('#builder-result').hidden = !state.result; $('#overlay-toolbar').hidden = !state.result;
    const generated = $('#generated-chords'), toggles = $('#overlay-toggles'); generated.replaceChildren(); toggles.replaceChildren();
    if (!state.result) return;
    const result = state.result;
    $('#builder-key').textContent = keyName(result.tonic, result.pattern.mode, flats, result.pattern.id);
    for (let index = 0; index < result.chords.length; index++) {
      const chord = result.chords[index], color = result.colors[index], visible = state.visible.has(index);
      const toggle = () => { if (state.visible.has(index)) state.visible.delete(index); else state.visible.add(index); render(); };
      const card = el('button', `generated-chord${visible ? '' : ' is-hidden'}${index === result.anchorIndex ? ' is-anchor' : ''}`); card.type = 'button'; card.style.setProperty('--chord-color', color); card.dataset.generatedIndex = index;
      card.setAttribute('aria-pressed', String(visible)); card.setAttribute('aria-label', `${visible ? 'Hide' : 'Show'} step ${index + 1}, ${chordLabel(chord, flats)} on the fretboard`);
      card.append(el('span', 'generated-degree', `${index + 1} · ${result.pattern.steps[index].roman}`), el('strong', '', chordLabel(chord, flats)), el('span', 'voicing-text', voicingText(chord.voicing)));
      if (index === result.anchorIndex) card.append(el('span', 'anchor-label', 'Anchor'));
      card.addEventListener('click', () => { toggle(); $(`[data-generated-index="${index}"]`)?.focus({ preventScroll: true }); }); generated.append(card);
      const small = el('button', `overlay-toggle${visible ? '' : ' is-hidden'}`); small.type = 'button'; small.style.setProperty('--chord-color', color); small.dataset.overlayIndex = index; small.setAttribute('aria-pressed', String(visible));
      small.textContent = `${index + 1}. ${chordLabel(chord, flats)}`; small.setAttribute('aria-label', card.getAttribute('aria-label'));
      small.addEventListener('click', () => { toggle(); $(`[data-overlay-index="${index}"]`)?.focus({ preventScroll: true }); }); toggles.append(small);
    }
    $('#toggle-overlays').textContent = state.visible.size ? 'Hide all' : 'Show all';
    const noShape = result.chords.some(chord => !chord.voicing);
    $('#builder-note').textContent = noShape ? 'Some chords have no compact shape. Switch to All chord tones to see their notes.' : 'Shapes read from low E to high E. Shared positions on the fretboard have multiple color sectors.';
    $('#add-progression').disabled = state.saved.length + result.chords.length > MAX_CHORDS;
    $('#add-progression').title = state.saved.length + result.chords.length > MAX_CHORDS ? `The temporary list holds up to ${MAX_CHORDS} chords` : 'Append all steps in this order to the saved sequence';
  }

  function render() {
    const current = draftChord(), source = sourceChord(current), powerMode = updateBuilder(source);
    renderDraft(current); renderSaved(); renderAnalysis(); renderBuilder(source, powerMode);
    const layers = state.result ? state.result.chords.flatMap((chord, index) => state.visible.has(index) ? [{ ...chord, color: state.result.colors[index], label: `step ${index + 1}: ${chordLabel(chord, getFlats())}` }] : []) : [];
    board.update({ selected: voicingKeys(state.draft), flats: getFlats(), showNames: state.showNames, layers, overlayMode: state.overlayMode, voicing: state.draft });
  }

  $('#chord-show-names').addEventListener('change', event => { state.showNames = event.target.checked; render(); });
  $('#chord-identity').addEventListener('change', event => { state.identity = event.target.value; render(); });
  $('#custom-root').addEventListener('change', event => { state.customRoot = Number(event.target.value); render(); });
  $('#chord-clear').addEventListener('click', () => { state.draft = emptyVoicing(); state.identity = ''; status('Fretboard cleared.'); render(); });
  $('#chord-example').addEventListener('click', () => { state.draft = [null, null, null, 2, 2, 0]; state.identity = ''; state.source = 'current'; resetBuilder(); $('#chord-fretboard-scroll').scrollLeft = 0; status('Loaded E5.'); render(); });
  $('#save-chord').addEventListener('click', () => {
    const chord = draftChord(); if (!chord || state.saved.length >= MAX_CHORDS) return;
    const saved = { ...chord, pitches: [...chord.pitches], voicing: [...chord.voicing], id: nextId() }; state.saved.push(saved);
    if (state.source === 'current' && state.result) state.source = saved.id;
    state.draft = emptyVoicing(); state.identity = ''; persist(); render(); board.focusCurrent(); status(`${chordLabel(chord, getFlats())} saved. Fretboard cleared.`);
  });
  $('#sequence-clear').addEventListener('click', () => { state.saved = []; persist(); render(); status('Saved sequence cleared.'); });
  $('#sequence-example').addEventListener('click', () => {
    if (state.saved.length) return;
    state.saved = [4, 11, 1, 9].map(root => ({ root, quality: 'power', pitches: chordPitches(root, 'power').sort((a, b) => a - b), bass: root, voicing: findVoicing(root, 'power', 3), id: nextId() }));
    state.source = state.saved[0].id; resetBuilder(); persist(); render(); status(`Loaded ${state.saved.map(chord => chordLabel(chord, getFlats())).join(' – ')}.`);
  });
  $('#builder-source').addEventListener('change', event => { state.source = event.target.value; resetBuilder(); render(); });
  $('#progression-template').addEventListener('change', event => { state.pattern = PROGRESSIONS.find(pattern => pattern.id === event.target.value); resetBuilder(); render(); });
  $('#power-mode').addEventListener('change', event => { state.powerOverride = event.target.checked; render(); });
  $('#overlay-mode').addEventListener('change', event => { state.overlayMode = event.target.value; render(); });
  $('#toggle-overlays').addEventListener('click', () => { if (state.visible.size) state.visible.clear(); else state.result?.chords.forEach((_, index) => state.visible.add(index)); render(); });
  $('#add-progression').addEventListener('click', () => {
    if (!state.result || state.saved.length + state.result.chords.length > MAX_CHORDS) return;
    const count = state.result.chords.length; state.saved.push(...state.result.chords.map(chord => ({ ...chord, pitches: [...chord.pitches], voicing: chord.voicing ? [...chord.voicing] : null, id: nextId() }))); persist(); render(); status(`Added ${count} chords to the sequence.`);
  });
  render();
  return { render };
}
