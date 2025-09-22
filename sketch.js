// hanzi mapping
/* const hanzi = [
  "善",
  "随",
  "俗",
  "若",
  "水",
  "乡",
  "上",
  "入",
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
  "。",
  "。",
  "。",
];

let gridSize = 32;
let canvasSize = 640;
let originalImg = null;
let img32 = null;
let preserveAspect = true;
let statusP;
let outputTA;
let outputDiv;

function setup() {
  pixelDensity(1);
  let cnv = createCanvas(canvasSize, canvasSize);
  cnv.parent(document.body);

  document
    .getElementById("fileInput")
    .addEventListener("change", handleFileSelect);
  document.getElementById("keepAspect").addEventListener("change", (e) => {
    preserveAspect = e.target.checked;
  });

  document.getElementById("convertBtn").addEventListener("click", () => {
    if (!originalImg) {
      updateStatus("No image loaded — choose or drop an image first.");
      return;
    }
    processImage(originalImg);
    showImage();
  });

  document.getElementById("saveBtn").addEventListener("click", () => {
    saveCanvas("hanzi32", "jpg");
  });

  document.getElementById("downloadTxtBtn").addEventListener("click", () => {
    downloadTextFile();
  });

  cnv.drop(gotFile);

  // references
  statusP = document.getElementById("status");
  outputTA = document.getElementById("outputTA");
  outputDiv = document.getElementById("output");

  textAlign(LEFT, TOP);
  updateStatus("Ready. Choose or drop an image, then click Convert.");
}

function draw() {
  background(250, 240, 230);
  /*  if (originalImg) {
    push();
    let previewSize = 200;
    let sx = 10,
      sy = 10;
    let scale = Math.min(
      previewSize / originalImg.width,
      previewSize / originalImg.height
    );
    let w = originalImg.width * scale;
    let h = originalImg.height * scale;
    image(originalImg, sx, sy, w, h);
    noFill();
    stroke(0, 100);
    rect(sx - 1, sy - 1, w + 2, h + 2);
    pop();
  } */
  if (img32) {
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
        text(ch, i * vScale, j * vScale);
      }
    }
    pop();
  }
}

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
  loadImage(url, (loaded) => {
    originalImg = loaded;
    updateStatus("Image loaded — click Convert.");
    URL.revokeObjectURL(url);
  });
}

function gotFile(file) {
  if (file.type === "image") {
    loadImage(file.data, (loaded) => {
      originalImg = loaded;
      updateStatus("Image loaded (dropped) — click Convert.");
    });
  } else updateStatus("Dropped file is not an image.");
}

function processImage(loadedImage) {
  const g = createGraphics(gridSize, gridSize);
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
  updateStatus("Converted — textarea and canvas updated.");
}

function showImage() {
  if (!img32) {
    updateStatus("No processed image.");
    return;
  }
  img32.loadPixels();
  let out = "";
  for (let j = 0; j < gridSize; j++) {
    for (let i = 0; i < gridSize; i++) {
      let idx = (i + j * img32.width) * 4;
      let r = img32.pixels[idx],
        g = img32.pixels[idx + 1],
        b = img32.pixels[idx + 2];
      let bright = Math.floor((r + g + b) / 3);
      let hanidx = Math.floor(map(bright, 0, 255, 0, hanzi.length - 1));
      out += hanzi[hanidx];
    }
    out += "\n";
  }
  outputTA.value = out;
  outputDiv.innerHTML = "<pre>" + out + "</pre>";
}

function downloadTextFile() {
  if (!outputTA.value) {
    updateStatus("No text to download.");
    return;
  }
  const blob = new Blob([outputTA.value], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "hanzi32.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  updateStatus("Text downloaded.");
}

function map(n, a, b, c, d) {
  return ((n - a) * (d - c)) / (b - a) + c;
}
