const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");
const undoButton = document.createElement("button");
undoButton.innerText = "Undo";
document.body.insertBefore(undoButton, document.getElementById("submitTrace"));

// Adjust canvas size
canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.6;

let drawing = false;
const shapeImage = new Image();
const shapeName = canvas.getAttribute("data-shape");
let drawingHistory = [];
let lastPoints = []; // Store last touch points for smoothing

// Load reference image for tracing
shapeImage.src = `/static/images/${shapeName}.png`;
shapeImage.onload = function () {
    drawReferenceImage();
};

// Function to draw the reference image with correct aspect ratio
function drawReferenceImage() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const imgWidth = shapeImage.width;
    const imgHeight = shapeImage.height;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    let scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);
    let newWidth = imgWidth * scale;
    let newHeight = imgHeight * scale;

    let xOffset = (canvasWidth - newWidth) / 2;
    let yOffset = (canvasHeight - newHeight) / 2;

    ctx.globalAlpha = 0.3;
    ctx.drawImage(shapeImage, xOffset, yOffset, newWidth, newHeight);
    ctx.globalAlpha = 1.0;
}

// Save drawing state
function saveState() {
    drawingHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
}

// Undo last action
undoButton.addEventListener("click", () => {
    if (drawingHistory.length > 0) {
        ctx.putImageData(drawingHistory.pop(), 0, 0);
    }
});

// Function to smooth touch input
function getSmoothedPoint(x, y) {
    lastPoints.push({ x, y });

    if (lastPoints.length > 10) {
        lastPoints.shift(); // Keep only the last 5 points
    }

    // Calculate average position
    let avgX = lastPoints.reduce((sum, p) => sum + p.x, 0) / lastPoints.length;
    let avgY = lastPoints.reduce((sum, p) => sum + p.y, 0) / lastPoints.length;

    return { x: avgX, y: avgY };
}

// Drawing logic
function startDrawing(event) {
    drawing = true;
    saveState();
    lastPoints = []; // Clear previous touch points
    draw(event);
}

function stopDrawing() {
    drawing = false;
    ctx.beginPath();
    lastPoints = [];
}

function draw(event) {
    if (!drawing) return;

    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";

    let x, y;
    if (event.touches) {
        x = event.touches[0].clientX - canvas.getBoundingClientRect().left;
        y = event.touches[0].clientY - canvas.getBoundingClientRect().top;
    } else {
        x = event.clientX - canvas.getBoundingClientRect().left;
        y = event.clientY - canvas.getBoundingClientRect().top;
    }

    // Get stabilized point
    let smoothPoint = getSmoothedPoint(x, y);

    ctx.lineTo(smoothPoint.x, smoothPoint.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(smoothPoint.x, smoothPoint.y);
}

// Mouse events
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mousemove", draw);

// Touch events (for mobile)
canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    startDrawing(e);
});
canvas.addEventListener("touchend", stopDrawing);
canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    draw(e);
});

function calculateAccuracy() {
    const userImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    // Redraw the reference image onto the temporary canvas
    const imgWidth = shapeImage.width;
    const imgHeight = shapeImage.height;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    let scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);
    let newWidth = imgWidth * scale;
    let newHeight = imgHeight * scale;

    let xOffset = (canvasWidth - newWidth) / 2;
    let yOffset = (canvasHeight - newHeight) / 2;

    tempCtx.drawImage(shapeImage, xOffset, yOffset, newWidth, newHeight);
    const referenceImageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);

    let matchingPixels = 0;
    let extraPixels = 0;
    let shapePixels = 0;
    let totalDrawnPixels = 0;

    for (let i = 0; i < userImageData.data.length; i += 4) {
        const userAlpha = userImageData.data[i + 3]; // User-drawn pixel opacity
        const refAlpha = referenceImageData.data[i + 3]; // Reference shape opacity

        if (refAlpha > 100) {
            shapePixels++; // Count shape pixels
        }

        if (userAlpha > 50) {
            totalDrawnPixels++; // Count user-drawn pixels

            if (refAlpha > 50) {
                matchingPixels++; // Pixel matches the shape
            } else {
                extraPixels++; // Pixel drawn outside the shape
            }
        }
    }

    if (totalDrawnPixels === 0) return 0;

    let matchScore = (matchingPixels / shapePixels) * 100;
    let penalty = (extraPixels / totalDrawnPixels) * 50; // Reduce penalty strength

    let finalScore = matchScore - penalty;
    return Math.max(0, Math.min(finalScore, 100)).toFixed(2);
}

// Submit button to evaluate tracing accuracy
document.getElementById("submitTrace").addEventListener("click", () => {
    const accuracy = calculateAccuracy();

    fetch("/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: accuracy })
    })
    .then(response => response.json())
    .then(() => {
        document.getElementById("scoreDisplay").innerText = `Your Score: ${accuracy}%`;
    });
});
