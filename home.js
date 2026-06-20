
let songList = [];
let id = 1;

function newSong(title, key, level, instrument, melody) {
    const song = {
        title: title,
        key: key,
        level: level,
        instrument: instrument,
        melody: melody
    }
    songList.push(song);
    return song;
}


newSong("Shape of you - Ed Sheeran", "g", 1, "piano", 
  [5, -1, -1, 7, -1, -1, 5, -1,
  5, -1, -1, 7, -1, -1, 5, -1, 
  5, -1, -1, 7, -1, -1, 5, -1, 
  6, -1, -1, 5, -1, -1, 4, -1]
);

newSong("Beethovens 5th Symphony", "g", 1, "piano", 
  [9, 9, 9, 7,
  -1, -1, -1, -1, -1, -1, -1, -1,
  8, 8, 8, 6]
);

newSong("Super Mario Bros tune", "d", 3, "piano",
  [9, 9, -1, 9, -1, 7, 9, -1, 11, -1, -1, -1, 4, -1, -1, -1, 
  7, -1, -1, 4, -1, -1, 2, -1, -1, 5, -1, 6, -1, {diaDeg: 6, acc: "flat"}, 5, -1, 
  4, 9, -1, 11, 12, -1, 10, 11, -1, 9, -1, 7, 8, 6
  ]
);

newSong("Nokia ringtone", "a", 2, "piano",
  [11, 10, 5, -1, 6, -1, 9, 8, 3, -1, 4, -1, 8, 7, 2, -1, 4, -1, 7]
)

newSong("Somebody that I used to know - Gotye", "f", 2, "piano",
  [4, -1, 4, -1, 8, -1, 8, -1, 9, 10, 11, 9, 8, -1, -1, -1, 
    7, -1, 7, -1, 6, -1, 6, -1, 5, -1, 5, -1, 4]
)

newSong("Star Wars theme song", "a# / b♭", 2, "piano",
  [7, -1, -1, -1, -1, -1, 11, -1, -1, -1, -1, -1, 
    10, 9, 8, 14, -1, -1, -1, -1, -1, 11, -1, -1, 
    10, 9, 8, 14, -1, -1, -1, -1, -1, 11, -1, -1, 
    10, 9, 10, 8
  ]
)

newSong("My heart will go on", "e", 1, "piano",
  [{diaDeg: 7, lyric: "Near,"}, -1, -1, -1, -1, -1, -1, -1, 
  {diaDeg: 8, lyric: "far,"}, -1, -1, -1, -1, -1, {diaDeg: 4, lyric: "where -"}, -1,
  {diaDeg: 11, lyric: "e -"}, -1, -1, -1, {diaDeg: 10, lyric: "ver"}, -1, {diaDeg: 9, lyric: "you"}, {diaDeg: 8, lyric: "are"}
  ]
)



const generatorPopup = document.getElementById("generator-popup");
const iframe = document.getElementById("iframe");

document.getElementById("open-popup").onclick = () => {
  iframe.src = "melody-generator.html";
  iframe.onload = () => {
      iframe.contentWindow.newEmptySong();
    }
  generatorPopup.style.display = "flex";
};

document.getElementById("close-popup").onclick = () => {
  generatorPopup.style.display = "none";
  iframe.src = "";
};



const listGeneratorPopup = document.getElementById("list-generator-popup");
const listIframe = document.getElementById("list-iframe");
const songListEl = document.querySelector("#song-list tbody")

songList.forEach(song => {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${song.title}</td>
    <td>${song.level}</td>
    <td>${song.instrument}</td>
  `;

  row.className = "table-row"

  row.onclick = () => {
    listIframe.src = "melody-generator.html"; 
    listIframe.onload = () => {
      listIframe.contentWindow.loadSong(song);
    }
    listGeneratorPopup.style.display = "flex";  
    
  };

  songListEl.appendChild(row);

});


document.getElementById("list-close-popup").onclick = () => {
  listGeneratorPopup.style.display = "none";
  listIframe.src = "";
}
