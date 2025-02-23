
const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");
const undoButton = document.getElementById("undoButton");
const submitToCommunity = document.getElementById("submitToCommunity");

// Adjust canvas size
canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.6;

let drawing = false;
let drawingHistory = [];
let lastPoints = []; // Store last touch points for smoothing


function saveState() {
    drawingHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
}

undoButton.addEventListener("click", () => {
    if (drawingHistory.length > 0) {
        ctx.putImageData(drawingHistory.pop(), 0, 0);
    }
});

function getSmoothedPoint(x, y) {
    lastPoints.push({ x, y });
    if (lastPoints.length > 10) lastPoints.shift();
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

function draw(event) {
    if (!drawing) return;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";

    let x = event.touches ? event.touches[0].clientX - canvas.getBoundingClientRect().left : event.clientX - canvas.getBoundingClientRect().left;
    let y = event.touches ? event.touches[0].clientY - canvas.getBoundingClientRect().top : event.clientY - canvas.getBoundingClientRect().top;
    let smoothPoint = getSmoothedPoint(x, y);
    ctx.lineTo(smoothPoint.x, smoothPoint.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(smoothPoint.x, smoothPoint.y);
}

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("touchstart", (e) => { e.preventDefault(); startDrawing(e); });
canvas.addEventListener("touchend", stopDrawing);
canvas.addEventListener("touchmove", (e) => { e.preventDefault(); draw(e); });

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

