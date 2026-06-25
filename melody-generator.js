

const scale = [
  {normal: "do", sharp: "di"},
  {normal: "re", sharp: "ri", flat: "ra"},
  {normal: "mi", flat: "ma"},
  {normal: "fa", sharp: "fi"},
  {normal: "so", sharp: "si", flat: "sa"},
  {normal: "la", sharp: "li", flat: "lo"},
  {normal: "ti", flat: "ta"}
];


const equalTempA = 440;
const absoluteChromaticScale = ["f", "g♭", "g", "a♭", "a", "b♭", "b", "c", "d♭", "d", "e♭", "e"];


const noteWidth = 25;
const noteHeight  = noteWidth / 7 * 6;
const staffStep = noteHeight / 2;
const gap = noteWidth / 3;;
const spaceWidth = noteWidth / 7 * 4;
const noteFontSize = noteWidth / 2;
document.documentElement.style.setProperty('--note-width', `${noteWidth}px`);
document.documentElement.style.setProperty('--note-height', `${noteHeight}px`);
document.documentElement.style.setProperty('--staff-step', `${staffStep}px`);
document.documentElement.style.setProperty('--gap', `${gap}px`);
document.documentElement.style.setProperty('--space-width', `${spaceWidth}px`);
document.documentElement.style.setProperty('--note-font-size', `${noteFontSize}px`);


const staveEl = document.getElementById("stave");


let melody = [];
let selected;
let key;
let chromIndexOfKey;
let steps;
let rootFreq;
let beatDuration;
let id = 1;
let history;
let lyrics;
let instrument;
let frets;


let mode;













/* ===========================
   H     H
   H     H
   HELPERS
   H     H
   H     H
=========================== */








function ToNoteObject(value) {
  id++;
  if (value === -1) return {type: "space", id: id};
  if (value === -2) return {type: "enter", id: id};
  const isObject = typeof value === "object";
  const diaDeg = isObject ? value.diaDeg : value;
  const acc = isObject && value.acc ? value.acc : null;
  return {
    type: "note",
    id: id,
    name: acc ? scale[diaDeg % 7][acc] : scale[diaDeg % 7].normal,
    diatonicDegree: diaDeg,
    chromaticDegree: calcChromDeg(diaDeg, acc),
    accidental: acc,
    lyric: isObject && value.lyric ? value.lyric : null
  }
}

function placeholderToItem(object) {
  snapshot();
  melody[selected] = object;
  const sel = melody[selected];
  melody.splice(selected + 1, 0, {type: "placeholder", diatonicDegree: 7});
  if (sel.type === "note") playSingleTone(sel.chromaticDegree);
  selected++;
  render();
  updateButtons();
  updateInstrumentNotes();
}

function snapshot() {
  history.push(JSON.stringify({ melody: melody, selected }));
  if (history.length > 10) history.shift();
}

function calcFreq(fundament, offset) {
  return fundament * Math.pow(2, offset / 12); //omdat 1 octaaf omhoog de frequentie verdubbelt  
}

function calcChromDeg(diaDeg, acc) {
  let chromDeg = 2 * diaDeg - Math.floor(diaDeg / 7) - Math.floor((diaDeg + 4) / 7);
  if (acc === "sharp") {chromDeg++};
  if (acc === "flat") {chromDeg--}; //chromatic degree calculated! 0 t/m 35
  return chromDeg;
}

function removePlaceholderRememberNote(input) {
  const clickedNoteID = melody[input].id;
  melody = melody.filter(item => item.type !== "placeholder"); //verwijder oude placeholder
  return melody.findIndex(item => {return item.id === clickedNoteID}); //index voor nieuwe placeholder
}








/* ===========================
       A
     A   A
    A     A
   A AUDIO A
   A       A
   A       A
=========================== */




const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audio = new AudioCtx();

let playingSong = false;

let currentOsc;
let currentChromDeg;


function oscillator(freq) {
  stopTone();

  const osc = audio.createOscillator();
  osc.type = "sine";
  osc.frequency.value = freq;
  
  const bassBoost = audio.createBiquadFilter();
  bassBoost.type = "lowshelf";
  bassBoost.frequency.value = 200;
  bassBoost.gain.value = 20; // dB
    
  const gain = audio.createGain();
  gain.gain.value = 1.0;
  gain.gain.exponentialRampToValueAtTime(0.05, audio.currentTime + 1);

  osc.connect(bassBoost).connect(gain).connect(audio.destination);

  osc.start();
  currentOsc = osc;
}

function startTone(chromDeg) {
  oscillator(calcFreq(rootFreq, chromDeg));
  currentChromDeg = chromDeg;
  document.getElementById(currentChromDeg).classList.add("played-key");
}

function stopTone() {
  currentOsc?.stop();
  currentOsc = null;
  document.getElementById(currentChromDeg)?.classList.remove("played-key");
  currentChromDeg = null;
}

async function playSingleTone(chromDeg) {
  startTone(chromDeg);
  await new Promise(r => setTimeout(r, 360)); //standaardlengte voor enkele noot ongeacht bpm
  stopTone();
}

async function playSong() { //Milan wil dat ik uitzoek waarom hier wel of niet een await voor moet
  //hij gaat stuk als async er niet staat en await wel, waarom is dat? - BOOKMARK

  const freqMap = new Map(
    melody.filter(item => item.type === "note")
    .map(item => [item.chromaticDegree, calcFreq(rootFreq, item.chromaticDegree)])
  );
  
  let stop = false; 
  playingSong = true;

  document.getElementById("play").textContent = "stop";
  document.getElementById("play").onclick = () => {stop = true};

  melody = melody.filter(item => item.type !== "placeholder");
  selected = 0;
  render();
  if (mode === "editMode") updateButtons();
  
    
  for (const item of melody) { //.forEach negeert awaits, vandaar for-of

    if (stop) break;

    if (item.type === "note") {
      startTone(item.chromaticDegree);
    }

    if (item.type !== "enter") {
      await new Promise(r => setTimeout(r, beatDuration));
    }

    if (selected < melody.length - 1) selected++;
    render();

  }

  await new Promise (r => setTimeout(r, 500)); //laatste noot niet abrupt afbreken
  
  stopTone();

  document.getElementById("play").textContent = "play";
  document.getElementById("play").onclick = () => {playSong()};

  selected = mode === "viewMode" ? null : melody.length - 1;

  playingSong = false;
  
  render();
  if (mode === "editMode") updateButtons();
  
}










/* ===========================
   RENDER
   R      R
   RENDER
   R    R
   R      R
   R       R
=========================== */







function render() {

  function wrapOnClicks(item, i, itemElement) {
    wrap = document.createElement("div");
    wrap.className = "wrap";
    if (mode === "editMode") {
      wrap.onclick = () => {
        if (selected !== i) {
          const clickedNoteIndex = removePlaceholderRememberNote(i);
          selected = clickedNoteIndex;
          if (item.type === "note") playSingleTone(item.chromaticDegree);
          render();
          updateButtons();
        }
        else {
          melody.push({ type: "placeholder", diatonicDegree: 7 });
          selected = melody.length - 1;
          render();
          updateButtons();
        }
      }
    }
    if (mode === "viewMode") {
      wrap.onclick = () => {
        if (item.type === "note") playSingleTone(item.chromaticDegree);
      }
    }
    wrap.appendChild(itemElement);
  }


  function startRow() {
    row = document.createElement("div");
    row.className = "stave-row";
    row.style.height = rowHeight + "px";

    for (let i = 0; i < lineCount; i++) {
      const line = document.createElement("div");
      line.className = "stave-line";
      line.style.top = staffStep + i * 2 * staffStep + "px";
      row.appendChild(line);
    }
    staveEl.appendChild(row);
    leftoverSpace = row.clientWidth - 32; //-32 want 2x 16 padding
  }


  function placeOnStave(child, width) {
    if (leftoverSpace < width) {
      startRow();
      }
    row.appendChild(child);
    leftoverSpace = leftoverSpace - width - gap;
  }

  function placeholderClasses(itemElement, item) {
    itemElement.className = "placeholder cursor " 
        + `${item.accidental}`;
      if (item.diatonicDegree === 0) {itemElement.classList.add("oct-down")};
      if (item.diatonicDegree === 14) {itemElement.classList.add("oct-up")};
  }

  function createEndCursorHover() {
    const endCursorHover = document.createElement("div");
    endCursorHover.className = "end-cursor-hover";
    endCursorHover.onclick = () => {
      melody = melody.filter(item => item.type !== "placeholder");
      melody.push({ type: "placeholder", diatonicDegree: 7});
      selected = melody.length - 1;
      render();
      updateButtons();
    }
    row.appendChild(endCursorHover);
  }







  staveEl.innerHTML = "";

  const onlyNotes = melody.filter(item => item.type === "note");

  const allDegrees = onlyNotes.map(item => item.diatonicDegree);
  const min = Math.min(...allDegrees);
  const max = Math.max(...allDegrees);

  const lineCount = onlyNotes.length ? (Math.floor((max - min) / 2) + 1) : 1;
  const rowHeight = lineCount * noteHeight;

  let row;
  let leftoverSpace;
  let itemElement;
  let wrap;

  startRow();



  melody.forEach((item, i) => {

    itemElement = document.createElement("div");

    if (item.type === "note") {
      const noteTop = (max - item.diatonicDegree) * staffStep - staffStep;
      itemElement.className =
        `note ${item.name} ${item.accidental}` +
        (i === selected ? " selected" : "");
      itemElement.textContent = item.name;
      itemElement.style.top = noteTop + "px";
      wrapOnClicks(item, i, itemElement);

      let width = noteWidth;

      if (mode === "editMode" && lyrics === true) {
        const lyric = document.createElement("input");
        lyric.type = "text";
        lyric.maxLength = 12;
        lyric.className = "lyric";
        lyric.value = item.lyric ? item.lyric : null;
        width = Math.max(29, lyric.value.length * 6.25);
        lyric.style.width = `${width}px`;
        wrap.appendChild(lyric);

        lyric.onclick = (element) => {
          element.stopPropagation();
        }

        lyric.addEventListener("input", () => {
          item.lyric = lyric.value;
          width = Math.max(29, lyric.value.length * 6.25);
          lyric.style.width = `${width}px`;
        })

        lyric.addEventListener("focus", () => {
          document.getElementsByClassName("placeholder")[0].classList.remove("cursor");
        })

        lyric.addEventListener("blur", () => {
          document.getElementsByClassName("placeholder")[0].classList.add("cursor");
        })

      }

      if (mode === "viewMode" && item.lyric) {
        const lyric = document.createElement("div");
        lyric.textContent = item.lyric;
        lyric.className = "lyric";
        width = Math.max(29, lyric.textContent.length * 6.25);
        lyric.style.width = `${width}px`;
        lyric.style.border = "none";
        wrap.appendChild(lyric);
      }

      placeOnStave(wrap, width);
    }

    if (item.type === "space") {
      itemElement.className = "space" + (i === selected ? " selected" : "");
      itemElement.style.top = (rowHeight - noteHeight * 2) / 2 + "px";
      wrapOnClicks(item, i, itemElement);
      placeOnStave(wrap, spaceWidth);
    }

    if (item.type === "enter") {
      itemElement.className = "enter" + (i === selected ? " selected" : "");
      itemElement.textContent = "↵";
      wrapOnClicks(item, i, itemElement);
      row.appendChild(wrap, noteWidth);
      startRow(); //ná het enter item
    }

    if (item.type === "placeholder") {
      placeholderClasses(itemElement, item);
      placeOnStave(itemElement, noteWidth);
    }
        
  });

  if (melody[melody.length - 1]?.type !== "placeholder" && mode === "editMode") {
    createEndCursorHover();
  }

}











/* ===========================
    BUTTONS
    B       B
    BUTTONS
    B       B
    BUTTONS
=========================== */







function buildNoteButtons() {
  const noteButtonsEl = document.getElementById("note-buttons");
  noteButtonsEl.innerHTML = "";
  scale.forEach((names, scaleDegree) => {
    const btn = document.createElement("button");
    const name = names.normal;
    btn.id = name;
    btn.textContent = name;
    btn.title = "Add " + name + " (" + (scaleDegree + 1) + ")";
    btn.onclick = () => {
      placeholderToItem(ToNoteObject({diaDeg: melody[selected].diatonicDegree + scaleDegree, acc: melody[selected].accidental}));
    }
    noteButtonsEl.appendChild(btn);
  });
}

function space() {
  placeholderToItem(ToNoteObject(-1));
}

function enter() {
  placeholderToItem(ToNoteObject(-2));
}

function backspace() {
  snapshot();

  const indexForBackspace = melody[selected].type === "placeholder" ? selected - 1 : selected; //anders delete je de placeholder zelf
  melody.splice(indexForBackspace, 1);
  if (selected !== 0) {selected--};
  if (melody[selected]?.type === "placeholder") {
    delete melody[selected].accidental;
    melody[selected].diatonicDegree = 7;
  }
  if (!melody.length) {melody.push({type: "placeholder", diatonicDegree: 7});}
  if (melody[selected].type === "note") playSingleTone(melody[selected].chromaticDegree);
  render();
  updateButtons();
  updateInstrumentNotes();
}

function sharpFlat(sharpOrFlat) {
  const sel = melody[selected];
  snapshot();
  if (sel.accidental === sharpOrFlat) {
    delete sel.accidental;
    sel.name = scale[sel.diatonicDegree % 7].normal;
  }
  else {
    sel.accidental = sharpOrFlat;
    sel.name = scale[sel.diatonicDegree % 7][sharpOrFlat];
  }
  sel.chromaticDegree = calcChromDeg(sel.diatonicDegree, sel.accidental);
  render();
  updateButtons();
  updateInstrumentNotes();
  if (sel.type === "note") playSingleTone(sel.chromaticDegree);
}

function insert() {
  const clickedNoteIndex = removePlaceholderRememberNote(selected);
  melody.splice(clickedNoteIndex, 0, {type: "placeholder", diatonicDegree: 7}); //hier invoegen
  selected = clickedNoteIndex; //ingevoegde placeholder ook selecteren
  render();
  updateButtons();
  updateInstrumentNotes();
}

function lyricMode() {
  if (lyrics === false) {
    lyrics = true;
  }
  else if (lyrics === true) {
    if (confirm("Delete your lyrics?")) {
      lyrics = false;
      melody.forEach((item) => {
        delete item.lyric;
      })
    }
  }
  document.getElementById("lyrics").classList.toggle("active", lyrics === true);
  render();
}

function undo() {
  if (!history.length) return;
  const prev = JSON.parse(history.pop());
  melody = prev.melody;
  selected = prev.selected;
  render();
  updateButtons();
  updateInstrumentNotes();
}

function clearAll() {
  if (confirm("Clear all?")) {
    snapshot();
    melody = [{ type: "placeholder", diatonicDegree: 7 }];
    selected = 0;
    render();
    updateButtons();
    updateInstrumentNotes();
  }
}

function oneStep(change) {
  snapshot();
  const sel = melody[selected];  
  sel.diatonicDegree = sel.diatonicDegree + change;
  delete sel.accidental;
  sel.name = scale[sel.diatonicDegree % 7].normal;
  sel.chromaticDegree = calcChromDeg(sel.diatonicDegree);
  render();
  updateButtons();
  updateInstrumentNotes();
  playSingleTone(sel.chromaticDegree);
}

function octave(change) {
  snapshot();
  const sel = melody[selected];  
  const possible = (sel.diatonicDegree + change  >= 0 && sel.diatonicDegree + change <= 20);    
  if (!possible) { change = 0 }; //zodat hij dan gewoon reset
  sel.diatonicDegree = sel.diatonicDegree % 7 + 7 + change; //reset + change
  sel.chromaticDegree = calcChromDeg(sel.diatonicDegree, sel.accidental);
  render();
  updateButtons();
  updateInstrumentNotes();
  if (sel.type === "note") playSingleTone(sel.chromaticDegree);
}





function updateButtons() {
  const sel = melody[selected];
  const noteOrPlaceholder = sel?.type === "note" || sel?.type === "placeholder";
  const isPlaceholder = sel?.type === "placeholder";

  document.getElementById("backspace").disabled = 
    melody === [{type: 'placeholder', diatonicDegree: 7}] || 
    (selected === 0 && isPlaceholder) ||
    playingSong;
  document.getElementById("enter").disabled = 
    selected === 0 || 
    !isPlaceholder || 
    melody[selected - 1]?.type === "enter" ||
    playingSong;
  document.getElementById("space").disabled = 
    !isPlaceholder || playingSong;
  document.getElementById("insert").disabled = 
    isPlaceholder || playingSong;
  document.getElementById("lyrics").disabled =
    playingSong;
  document.getElementById("clear").disabled =
    playingSong;
  document.getElementById("undo").disabled = 
  playingSong || !history.length;

  scale.forEach((names, index) => {
    const name = names.normal;
    document.getElementById(name).disabled = 
      !isPlaceholder || 
      (sel.type === "placeholder" && sel.accidental === "sharp" && !names.sharp) || 
      (sel.type === "placeholder" && sel.accidental === "flat" && !names.flat) ||
      playingSong;
  });

  let changes = [-1, 1];
  ["down", "up"].forEach((id, index) => {
    const change = changes[index];
    const possible = (sel?.diatonicDegree + change  >= 0 && sel?.diatonicDegree + change <= 20);
    document.getElementById(id).disabled = 
      !noteOrPlaceholder || 
      !possible || 
      sel.type === "placeholder" ||
      playingSong;
  });

  changes = [-7, 7];
  ["oct-down", "oct-up"].forEach((id, index) => {
    let change = changes[index];
    document.getElementById(id).disabled = !noteOrPlaceholder || playingSong;
  }); 

  document.getElementById("oct-down").classList.toggle( //ik snap deze toggle niet helemaal - BOOKMARK
    "active",
    sel?.diatonicDegree < 7
  );

  document.getElementById("oct-up").classList.toggle(
    "active",
    sel?.diatonicDegree >= 14
  );

  ["sharp", "flat"].forEach((id, index) => {
    document.getElementById(id).disabled = 
      !noteOrPlaceholder || 
      (sel.type === "note" && sel.accidental !== id && !scale[sel.diatonicDegree % 7][id]) ||
      playingSong;
    document.getElementById(id).classList.toggle("active", sel?.accidental === id);
  });

}













/* ===========================
    PIANO
    P     P
    PIANO
    P
    P
=========================== */


function updateInstrumentNotes() {
  if (instrument === "piano") updatePianoNotes();
  if (instrument === "bass") updateBassNotes();
}

function rebuildInstrument() {
  if (instrument === "piano") buildPiano();
  if (instrument === "bass") buildBass();
}




function compare(a, b) {
  return a.chromaticDegree - b.chromaticDegree;
}

function setNoteRange() {
  let noteRange = melody.filter(item => item.type === "note");
  if (!noteRange.length) return;
  noteRange.sort(compare);
  noteRange = [...new Map(noteRange.map(item => [item.chromaticDegree, item])).values()]; 
  //een Map filtert automatisch op uniek -> kan dit niet ook met een Set? BOOKMARK
  return noteRange;
}

function findModuloMatch(noteRange, id) {
  return noteRange.find(item => ((item.chromaticDegree + steps) % 12 === (id + steps) % 12));
}








function buildPiano() {
  
  const whiteTileWidth = 28;
  const blackTileWidth = whiteTileWidth * 3 / 5;
  const secondBlackTileGap = (whiteTileWidth * 4 - (3 * blackTileWidth)) / 4;
  const whiteTileHeight = 120;
  const blackTileHeight = whiteTileHeight * 0.6;
  document.documentElement.style.setProperty('--white-tile-width', `${whiteTileWidth}px`);
  document.documentElement.style.setProperty('--black-tile-width', `${blackTileWidth}px`);
  document.documentElement.style.setProperty('--second-black-tile-gap', `${secondBlackTileGap}px`);
  document.documentElement.style.setProperty('--white-tile-height', `${whiteTileHeight}px`);
  document.documentElement.style.setProperty('--black-tile-height', `${blackTileHeight}px`);
  
  let ForC = chromIndexOfKey < 7 ? "F" : "C";

  document.getElementById("instrument").innerHTML = "";
  let startOffset = 0;

  const instrument = document.getElementById("instrument");
  const area = document.createElement("div");
  instrument.appendChild(area);
  area.className = "piano-area";

  for (let i = 0; i < 7; i++) {
    buildOneGroup(ForC, (0 - steps + startOffset), area);
    startOffset = ForC === "F" ? startOffset + 7 : startOffset + 5;
    ForC = ForC === "F" ? "C" : "F";
  }

  updatePianoNotes();

}

function buildOneGroup(ForC, startOffset, area) {

  const map = new Map([
    ["classForF", "f-black-tile-gap"], 
    ["classForC", "c-black-tile-gap"], 
    ["maxWhiteForF", 4],
    ["maxWhiteForC", 3],
    ["maxBlackForF", 3],
    ["maxBlackForC", 2]
  ])

  const tileGroup = document.createElement("div");
  tileGroup.className = "tile-group";
  area.appendChild(tileGroup);

  const blackTileContainer = document.createElement("div");
  blackTileContainer.className = "black-tile-div " + map.get(`classFor${ForC}`);
  tileGroup.appendChild(blackTileContainer);

  singleTiles("White", startOffset, tileGroup);
  singleTiles("Black", startOffset + 1, blackTileContainer)

  function singleTiles(blackOrWhite, startOffset, parent) {
    for (let i = 0; i < map.get(`max${blackOrWhite}For${ForC}`); i++) {
      const tile = document.createElement("div");
      tile.className = `tile ${blackOrWhite.toLowerCase()}-tile`;
      const tileId = startOffset + i * 2;
      tile.id = tileId;
      tile.onclick = () => playSingleTone(tileId);
      parent.appendChild(tile);
    }
  }
}


function updatePianoNotes() {
  let noteRange = setNoteRange();
  
  isRangeWithinOctave = 
    noteRange[noteRange.length-1].chromaticDegree 
    - noteRange[0].chromaticDegree 
    < 8
  ;

  for (let i = 0 - steps; document.getElementById(i); i++) {
    document.getElementById(i).textContent = "";
    const exactMatch = noteRange.find(item => (item.chromaticDegree === i));
    const moduloMatch = 
      isRangeWithinOctave ? findModuloMatch(noteRange, i) : null
    ;

    const tile = document.getElementById(i);

    if (exactMatch) {
      tile.textContent = exactMatch.name;
      tile.classList.remove("grey-text");
    }

    else if (moduloMatch) {
      tile.textContent = moduloMatch.name;
      tile.classList.add("grey-text");
    }
  }
}




function buildBass() {
  
  document.getElementById("instrument").innerHTML = "";

  steps = (chromIndexOfKey + 1) % 12;
  
  buildString(0 - steps + 15);
  buildString(0 - steps + 10);
  buildString(0 - steps + 5);
  buildString(0 - steps);
  
  updateBassNotes();

}

function buildString(start) {
  const area = document.getElementById("instrument");

  const bassString = document.createElement("div");
  bassString.className = "bass-string";
  area.appendChild(bassString);

  for (let i = start; i <= start + 7; i++) {
    const noteMark = document.createElement("div");
    noteMark.id = i;
    noteMark.className = "note-mark"
    if (i === start) noteMark.style.borderRight = "5px solid grey";
    bassString.appendChild(noteMark);
  }
  
}

function updateBassNotes() {

  let noteRange = setNoteRange();

  const allStrings = document.getElementById("instrument").children;
  const allFrets = [];
  
  Array.from(allStrings).forEach((item) => {
    allFrets.push(...Array.from(item.children));
  })

  allFrets.forEach((element, i) => { //i = current index of allfrets array
    element.textContent = "";
    element.textContent = frets.has(i) ? findModuloMatch(noteRange, Number(element.id))?.name : null;
  })
}



//hover en click on fret to play
//css variables
//bij afspelen licht hij de verkeerde frets op










/* ===========================
   INITIALIZE
        I
        I
        I
        I
   INITIALIZE
=========================== */







initializeSomeStuff();






//NOG UITZOEKEN WAT WINDOW. PRECIES INHOUDT EN WAAROM DAT WERKT MET DE CODE UIT HOME.JS - BOOKMARK



window.newEmptySong = function() {
  document.getElementById("top-bar-view-mode").remove();
  
  mode = "editMode";
  melody = [{type: "placeholder", diatonicDegree: 7}];
  key = "c";
  selected = 0;
  history = [];
  lyrics = false;
  instrument = "piano";
  
  furtherInitialization();

  buildPiano();
  buildNoteButtons();
  updateButtons();
  keyListeners();
  render();
  
}


window.loadSong = function(song) {
  document.getElementById("editModeOnly").remove();
  document.getElementById("basicButtons").remove();
  document.getElementById("top-bar-edit-mode").remove();
  document.getElementById("key-input-area").remove();

  mode = "viewMode";
  song.melody.forEach((value) => {
    melody.push(ToNoteObject(value));
  })
  key = song.key;
  instrument = song.instrument;
  selected = null;
  frets = song.frets;

  furtherInitialization();

  document.getElementById("static-title").textContent = song.title;
  document.getElementById("static-level").textContent = "level: " + song.level;
  document.getElementById("static-key").textContent = "Key: " + song.key;

  render();
  
} //buildInstrument hoeft hier niet want dat gebeurt later bij keyChange()


function initializeSomeStuff() {
  window.addEventListener("resize", render);

  document.getElementById("keyInput").innerHTML = absoluteChromaticScale.map(key => `<option value="${key}">${key}</option>`).join("");
  //join = array to string with no separator ("")

  document.getElementById("keyInput").addEventListener("input", function () {
    key = this.value;
    keyChange();
  });

  document.getElementById("slider").addEventListener("input", function () {
    beatDuration = 60000 / this.value;
  })

}


function furtherInitialization() {
  if (mode === "editMode") document.getElementById("keyInput").value = key;
  keyChange();
  beatDuration = 280;
}


function keyChange() {
  chromIndexOfKey = absoluteChromaticScale.indexOf(key);
  steps = chromIndexOfKey % 7;
  rootFreq = calcFreq(equalTempA, chromIndexOfKey - 28);
  rebuildInstrument();
}


function keyListeners() {

  const  keyMap = new Map ([
    [" ", "space"],
    ["Enter", "enter"],
    ["Backspace", "backspace"],
    ["ArrowUp", "up"],
    ["ArrowDown", "down"]
  ])
  
  const lowerCaseMap = new Map ([
    ["s", "sharp"],
    ["f", "flat"],
    ["p", "play"],
    ["=", "oct-up"],
    ["-", "oct-down"]
  ])
  

  window.addEventListener("keydown", event => {

    keyMap.forEach(function(value, key) {
      if (event.key === key) {
        if (event.target.tagName === "INPUT") return;
        document.getElementById(value).click();
        event.preventDefault();
        return;
      }
    })

    lowerCaseMap.forEach(function(value, key) {
      if (event.key.toLowerCase() === key) {
        if (event.target.tagName === "INPUT") return;
        document.getElementById(value).click();
        event.preventDefault();
        return;
      }
    })

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      if (event.target.tagName === "INPUT") return;
      document.getElementById("undo").click(); //dit is handig want btn disable voorkomt dan ook key control als het goed is
      event.preventDefault();
      return;
    }

    if (event.key >= 1 && event.key <= 7) {
      if (event.target.tagName === "INPUT") return;
      document.getElementById(scale[event.key - 1].normal).click();
      event.preventDefault();
      return;
    }

    const leftRightMap = new Map([ //waarom werkt het niet meer als ik deze map buiten de addeventlistener plaats??? - BOOKMARK
      ["leftCondition", selected > 0],
      ["leftChange", -1],
      ["rightCondition", selected < melody.length - 1],
      ["rightChange", 1]
    ])

    function arrowLeftAndRight(condition, change) {
      if (event.target.tagName === "INPUT" || playingSong) return;
      if (melody[selected].type !== "placeholder") {
        selected = condition ? selected + change : selected;
      }
      else if (condition) {
        [melody[selected], melody[selected + change]] = [melody[selected + change], melody[selected]]; //ik snap niet dat dit werkt maar mega leip
        selected = selected + change;
      }
      event.preventDefault();
      if (melody[selected].type === "note") playSingleTone(melody[selected].chromaticDegree);
      render();
      updateButtons();
      return;
    }

    if (event.key === "ArrowLeft") {
      arrowLeftAndRight(leftRightMap.get("leftCondition"), leftRightMap.get("leftChange"));
    }

    if (event.key === "ArrowRight") {
      arrowLeftAndRight(leftRightMap.get("rightCondition"), leftRightMap.get("rightChange"));
    }

  });
}





//AAN TESTGEBRUIKERS VRAGEN:
//cursor / selection toch nog veranderen? ghost cursors? nootinvoer knop????
//note input: hover = cursor
//note selection: hover = blue area
//oct blijft aanstaan?
//play song: start vanaf geselecteerde noot of vanaf placeholder



//FOUTEN:
//tijdens afspelen moet hij meescrollen en bij noot invoegen onderaan moet hij niet naar boven springen
//bij het sluiten van de popup probeert bij de contentwindow.functie te callen??
//hover over spaces uit bij viewmode?




//VINGERZETTING
//GITAAR / UKELELE VISUAL
//melodie opslaan in client en toevoegen aan songList?

//gebruiker kiest toonsoorten en stelt vingerzetting in per toonsoort
