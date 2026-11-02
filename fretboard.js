import { TUNING, FRETS, pitchClass, noteAt, noteName } from './music.js';

export const positionKey = (string, fret) => `${string}:${fret}`;
export function voicingKeys(voicing) { return new Set((voicing ?? []).flatMap((fret, string) => fret === null ? [] : [positionKey(string, fret)])); }

export class Fretboard {
  constructor(element, { onSelect, onMute = null }) {
    this.element = element;
    this.positions = [];
    this.stringLabels = [];
    const fragment = document.createDocumentFragment();
    for (let fret = 0; fret <= FRETS; fret++) {
      const label = document.createElement('span');
      label.className = `fret-number${fret === 0 ? ' open-number' : ''}${fret % 12 === 0 && fret ? ' octave' : ''}`;
      label.textContent = fret;
      label.style.gridColumn = fret + 2;
      label.style.gridRow = 1;
      label.setAttribute('aria-hidden', 'true');
      fragment.append(label);
    }
    TUNING.forEach((midi, string) => {
      const label = document.createElement(onMute ? 'button' : 'span');
      label.className = `string-label${onMute ? ' mute-string' : ''}`;
      label.style.gridColumn = 1;
      label.style.gridRow = string + 2;
      const number = document.createElement('small');
      number.textContent = string + 1;
      const name = document.createElement('span');
      name.textContent = noteName(pitchClass(midi));
      label.append(number, name);
      if (onMute) { label.type = 'button'; label.addEventListener('click', () => onMute(string)); }
      else label.setAttribute('aria-hidden', 'true');
      this.stringLabels.push({ label, name, string });
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
        const position = { button, marker, string, fret, pitch: noteAt(string, fret), key: positionKey(string, fret) };
        this.positions.push(position);
        button.addEventListener('click', () => { this.setTabStop(button); onSelect(position); });
        button.addEventListener('keydown', event => {
          let nextString = string, nextFret = fret;
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
          const next = this.positions[nextString * (FRETS + 1) + nextFret].button;
          this.setTabStop(next);
          next.focus({ preventScroll: true });
          next.scrollIntoView({ block: 'nearest', inline: 'nearest' });
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
    element.append(fragment);
  }
  setTabStop(button) { for (const entry of this.positions) entry.button.tabIndex = entry.button === button ? 0 : -1; }
  focusCurrent() { this.positions.find(entry => entry.button.tabIndex === 0)?.button.focus({ preventScroll: true }); }
  update({ selected = new Set(), flats = false, showNames = false, scale = null, layers = [], overlayMode = 'shapes', voicing = null }) {
    const scalePitches = new Set(scale?.pitches ?? []);
    const layerKeys = layers.map(layer => ({ ...layer, keys: voicingKeys(layer.voicing) }));
    this.element.classList.toggle('show-all', showNames);
    for (const { button, marker, string, fret, pitch, key } of this.positions) {
      const chosen = selected.has(key);
      const inScale = scalePitches.has(pitch);
      const tonic = scale?.root === pitch;
      const memberships = layerKeys.filter(layer => overlayMode === 'tones' ? layer.pitches.includes(pitch) : layer.keys.has(key));
      const colors = [...new Set(memberships.map(layer => layer.color))];
      marker.textContent = noteName(pitch, flats);
      marker.className = `note-marker${inScale ? ' in-scale' : ''}${tonic ? ' is-tonic' : ''}${chosen ? ' is-selected' : ''}${chosen && scale && !inScale ? ' outside-scale' : ''}${colors.length ? ' has-chord-overlay' : ''}`;
      if (colors.length) {
        const gradient = colors.map((color, index) => `${color} ${index * 100 / colors.length}% ${(index + 1) * 100 / colors.length}%`).join(',');
        marker.style.setProperty('--chord-overlay', `conic-gradient(${gradient})`);
      } else marker.style.removeProperty('--chord-overlay');
      button.setAttribute('aria-pressed', String(chosen));
      const octave = Math.floor((TUNING[string] + fret) / 12) - 1;
      const description = `String ${string + 1}, ${fret === 0 ? 'open' : `fret ${fret}`}, ${noteName(pitch, flats)}${octave}${inScale ? ', in scale' : ''}${tonic ? ', tonic' : ''}${memberships.length ? `; ${memberships.map(layer => layer.label).join(', ')}` : ''}`;
      button.setAttribute('aria-label', description);
      button.title = description;
    }
    if (voicing) for (const { label, name, string } of this.stringLabels) {
      name.textContent = voicing[string] === null ? '×' : noteName(pitchClass(TUNING[string]), flats);
      label.classList.toggle('is-muted-string', voicing[string] === null);
      label.setAttribute('aria-label', voicing[string] === null ? `String ${string + 1} muted` : `Mute string ${string + 1}`);
      label.title = label.getAttribute('aria-label');
    }
  }
}
