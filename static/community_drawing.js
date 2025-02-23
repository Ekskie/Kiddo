const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");
const brushButton = document.getElementById("brushButton");
const eraserButton = document.getElementById("eraserButton");
const brushSizeInput = document.getElementById("brushSize");
const undoButton = document.getElementById("undoButton");
const submitToCommunity = document.getElementById("submitToCommunity");
const smoothingSlider = document.getElementById("smoothingSlider");
const smoothingValue = document.getElementById("smoothingValue");
const clearCanvasButton = document.getElementById("clearCanvas");
const brushColorPicker = document.getElementById("brushColor");
const brushTypeSelector = document.getElementById("brushType");

// Adjust canvas size
canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.6;

let drawing = false;
let drawingHistory = [];
let lastPoints = [];
let brushSize = 5;
let erasing = false;
let smoothingLevel = parseInt(smoothingSlider.value, 10);

// Save canvas state
function saveState() {
    drawingHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
}

// Undo button functionality
undoButton.addEventListener("click", () => {
    if (drawingHistory.length > 0) {
        ctx.putImageData(drawingHistory.pop(), 0, 0);
    }
});

eraserButton.addEventListener("click", () => {
    erasing = true;
    ctx.globalCompositeOperation = "destination-out"; // Proper erasing ✅
});

clearCanvasButton.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
    drawingHistory = []; // Reset history
});

brushButton.addEventListener("click", () => {
    erasing = false;
    ctx.globalCompositeOperation = "source-over"; // Reset to normal drawing
});

// Brush size change
brushSizeInput.addEventListener("input", (event) => {
    brushSize = event.target.value;
});

// Update brush color when the user selects a color
brushColorPicker.addEventListener("input", () => {
    ctx.strokeStyle = brushColorPicker.value;
});

brushTypeSelector.addEventListener("change", () => {
    updateBrushStyle();
});

smoothingSlider.addEventListener("input", () => {
    smoothingLevel = parseInt(smoothingSlider.value, 10);
    smoothingValue.textContent = smoothingLevel; // Update displayed value
});

function getSmoothedPoint(x, y) {
    lastPoints.push({ x, y });
    if (lastPoints.length > smoothingLevel) lastPoints.shift();
    return {
        x: lastPoints.reduce((sum, p) => sum + p.x, 0) / lastPoints.length,
        y: lastPoints.reduce((sum, p) => sum + p.y, 0) / lastPoints.length,
    };
}

function startDrawing(event) {
    drawing = true;
    saveState();
    lastPoints = [];
    draw(event);
}

function stopDrawing() {
    drawing = false;
    ctx.beginPath();
    lastPoints = [];
}

function updateBrushStyle() {
    let brushType = brushTypeSelector.value;
    
    if (brushType === "solid") {
        ctx.setLineDash([]); // Solid line
    } else if (brushType === "dotted") {
        ctx.setLineDash([1, 10]); // Dotted
    } else if (brushType === "dashed") {
        ctx.setLineDash([10, 10]); // Dashed
    } else if (brushType === "calligraphy") {
        ctx.setLineDash([]); // No dash, but apply a dynamic width
        ctx.lineWidth = Math.random() * 5 + 3; // Random thickness for effect
    }
}


function draw(event) {
    if (!drawing) return;
    updateBrushStyle(); // Apply selected brush style

    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";

    let x = event.touches ? event.touches[0].clientX - canvas.getBoundingClientRect().left : event.clientX - canvas.getBoundingClientRect().left;
    let y = event.touches ? event.touches[0].clientY - canvas.getBoundingClientRect().top : event.clientY - canvas.getBoundingClientRect().top;
    let smoothPoint = getSmoothedPoint(x, y);
    ctx.lineTo(smoothPoint.x, smoothPoint.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(smoothPoint.x, smoothPoint.y);
}

// Mouse and Touch Events
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("touchstart", (e) => { e.preventDefault(); startDrawing(e); });
canvas.addEventListener("touchend", stopDrawing);
canvas.addEventListener("touchmove", (e) => { e.preventDefault(); draw(e); });

// Submit to Community with Username Prompt
submitToCommunity.addEventListener("click", () => {
    const username = prompt("Enter your name for the community gallery:", "Anonymous") || "Anonymous";
    const dataUrl = canvas.toDataURL();

    fetch("/upload_drawing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, username })
    })
    .then(response => response.json())
    .then((data) => { 
        if (data.status === "success") {
            alert("Submitted to Community Gallery!");
        } else {
            alert("Error: " + data.message);
        }
    })
    .catch(error => console.error("Fetch error:", error));
});
