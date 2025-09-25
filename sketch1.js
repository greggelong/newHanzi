/* const hanzi = [
  "滴",
  "涌",
  "泉",
  "思",
  "汗",
  "禾",
  "文",
  "下",
  "土",
  "。",
  "。",
  "。",
  "。",
]; */

const hanzi = [
  "滴",
  "涌",
  "泉",
  "思",
  "汗",
  "禾",
  "文",
  "下",
  "土",
  "一",
  "一",
  "一",
];

let gridSize = 32;
let canvasSize = 640;
let originalImg = null; // uploaded image (p5.Image)
let img32 = null; // processed 32x32 p5.Image
let preserveAspect = true;

let statusP, outputTA, outputDivPre;

// store last generated outputs so download functions do not re-process
let lastGridText = "";
let lastInstructionsGrouped = ""; // string (already sorted/grouped)
let myFont;
function preload() {
  // Load a custom font before the sketch starts
  myFont = loadFont("cs.ttf");
}

// --------- p5 setup ----------
function setup() {
  pixelDensity(1);
  textFont(myFont);
  let cnv = createCanvas(canvasSize, canvasSize);
  cnv.parent(document.body);

  // hook DOM elements
  document
    .getElementById("fileInput")
    .addEventListener("change", handleFileSelect);
  document
    .getElementById("keepAspect")
    .addEventListener("change", (e) => (preserveAspect = e.target.checked));
  document.getElementById("convertBtn").addEventListener("click", () => {
    if (!originalImg) {
      updateStatus("No image loaded — choose or drop an image");
      return;
    }
    processImage(originalImg);
    showImage();
  });
  document
    .getElementById("saveBtn")
    .addEventListener("click", () => saveCanvas("hanzi32", "jpg"));
  document
    .getElementById("downloadTxtBtn")
    .addEventListener("click", downloadTextFile);
  document
    .getElementById("downloadInstrBtn")
    .addEventListener("click", downloadInstructions);

  // drag + drop onto canvas
  cnv.drop(gotFile);

  statusP = document.getElementById("status");
  outputTA = document.getElementById("outputTA");
  outputDivPre = document.querySelector("#output pre");

  textAlign(LEFT, TOP);
  updateStatus("Ready. Choose or drop an image, then click Convert.");
}

// keep canvas minimal UI: we only draw the generated characters (no preview)
function draw() {
  background(250, 240, 230);
  if (!img32) return;

  push();
  let vScale = width / gridSize;
  textSize(vScale);
  fill(0);
  noStroke();

  img32.loadPixels();
  for (let j = 0; j < gridSize; j++) {
    for (let i = 0; i < gridSize; i++) {
      let idx = (i + j * img32.width) * 4;
      let r = img32.pixels[idx],
        g = img32.pixels[idx + 1],
        b = img32.pixels[idx + 2];
      let bright = Math.floor((r + g + b) / 3);
      let hanidx = Math.floor(map(bright, 0, 255, 0, hanzi.length - 1));
      let ch = hanzi[hanidx];
      text(ch, i * vScale, (j + 1) * vScale);
    }
  }
  pop();
}

// --------- helpers ----------
function updateStatus(txt) {
  statusP.innerText = txt;
}

function handleFileSelect(e) {
  const f = e.target.files[0];
  if (!f) return;
  if (!f.type.startsWith("image")) {
    updateStatus("Not an image.");
    return;
  }
  const url = URL.createObjectURL(f);
  loadImage(
    url,
    (loaded) => {
      originalImg = loaded;
      updateStatus("Image loaded — click Convert.");
      URL.revokeObjectURL(url);
    },
    (err) => {
      console.error(err);
      updateStatus("Error loading image");
    }
  );
}

function gotFile(file) {
  if (file.type === "image") {
    loadImage(file.data, (loaded) => {
      originalImg = loaded;
      updateStatus("Image loaded (dropped) — click Convert.");
    });
  } else updateStatus("Dropped file is not an image.");
}

// processImage -> make a 32x32 image and store it as img32
function processImage(loadedImage) {
  const g = createGraphics(gridSize, gridSize);
  g.pixelDensity(1);
  g.background(255);

  if (preserveAspect) {
    const scale = Math.min(
      gridSize / loadedImage.width,
      gridSize / loadedImage.height
    );
    const w = Math.max(1, Math.floor(loadedImage.width * scale));
    const h = Math.max(1, Math.floor(loadedImage.height * scale));
    const x = Math.floor((gridSize - w) / 2);
    const y = Math.floor((gridSize - h) / 2);
    g.image(loadedImage, x, y, w, h);
  } else {
    g.image(loadedImage, 0, 0, gridSize, gridSize);
  }

  img32 = g.get();
  updateStatus("Converted — ready. You can view, save, or download.");
}

// return column letters: 0 -> A, 25 -> Z, 26 -> AA, 27 -> AB, ...
function colToLetters(n) {
  let s = "";
  while (n >= 0) {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

// showImage -> builds both the grid text and the grouped instructions (once) and updates DOM
function showImage() {
  if (!img32) {
    updateStatus("No processed image.");
    return;
  }

  img32.loadPixels();
  let out = "";
  let grouped = {}; // ch -> [coords]

  for (let j = 0; j < gridSize; j++) {
    for (let i = 0; i < gridSize; i++) {
      let idx = (i + j * img32.width) * 4;
      let r = img32.pixels[idx],
        g = img32.pixels[idx + 1],
        b = img32.pixels[idx + 2];
      let bright = Math.floor((r + g + b) / 3);
      let hanidx = Math.floor(map(bright, 0, 255, 0, hanzi.length - 1));
      let ch = hanzi[hanidx];

      out += ch;

      if (ch !== "一") {
        // ROW = letter, COLUMN = number
        const rowLetter = colToLetters(j); // row letter
        const colNumber = i + 1; // column number
        const coord = `${rowLetter}${colNumber}`;
        if (!grouped[ch]) grouped[ch] = [];
        grouped[ch].push(coord);
      }
    }
    out += "\n";
  }

  // prepare sorted grouped instructions string
  const keys = Object.keys(grouped).sort();
  let instrOut = "";
  for (let k of keys) {
    instrOut += `${k}: ${grouped[k].join(", ")}\n`;
  }

  // store last outputs
  lastGridText = out;
  lastInstructionsGrouped = instrOut;

  // update DOM
  outputTA.value = lastGridText;
  outputDivPre.textContent = lastGridText; // preserve literal formatting
  outputTA.dataset.instructions = lastInstructionsGrouped;

  updateStatus("Displayed — grid + instructions ready to download.");
}

// Download the ASCII grid (what's in the textarea)
function downloadTextFile() {
  if (!lastGridText) {
    updateStatus("No text to download. Convert an image first.");
    return;
  }
  const blob = new Blob([lastGridText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "hanzi32.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  updateStatus("Grid text downloaded.");
}

// Download the grouped sorted instructions (skips filler)
function downloadInstructions() {
  if (!lastInstructionsGrouped) {
    updateStatus("No instructions to download. Convert an image first.");
    return;
  }
  const blob = new Blob([lastInstructionsGrouped], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "hanzi32_instructions.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  updateStatus("Sorted instructions downloaded.");
}
