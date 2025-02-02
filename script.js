let canvas = new fabric.Canvas('mainCanvas');
let isDrawing = false;
let currentTool = 'brush';

// Image Upload
document.getElementById('imageInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = function(f) {
        fabric.Image.fromURL(f.target.result, img => {
            canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
                scaleX: canvas.width / img.width,
                scaleY: canvas.height / img.height
            });
        });
    };
    reader.readAsDataURL(file);
});

// Drawing Tools
canvas.on('mouse:down', (o) => {
    isDrawing = true;
    const pointer = canvas.getPointer(o.e);
    draw(pointer.x, pointer.y);
});

canvas.on('mouse:move', (o) => {
    if (!isDrawing) return;
    const pointer = canvas.getPointer(o.e);
    draw(pointer.x, pointer.y);
});

canvas.on('mouse:up', () => {
    isDrawing = false;
});

function draw(x, y) {
    const circle = new fabric.Circle({
        left: x - 5,
        top: y - 5,
        radius: document.getElementById('brushSize').value,
        fill: currentTool === 'brush' ? 'rgba(0,255,0,0.5)' : 'transparent',
        selectable: false
    });
    canvas.add(circle);
}

// Conversion Function
function convertBackground() {
    const img = canvas.backgroundImage;
    const imageData = img._element;
    
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    ctx.drawImage(imageData, 0, 0);
    
    const maskCanvas = document.createElement('canvas');
    const maskCtx = maskCanvas.getContext('2d');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    
    canvas.forEachObject(obj => {
        if (obj instanceof fabric.Circle) {
            maskCtx.beginPath();
            maskCtx.arc(obj.left, obj.top, obj.radius, 0, Math.PI * 2);
            maskCtx.fillStyle = 'white';
            maskCtx.fill();
        }
    });

    const finalCtx = tempCanvas.getContext('2d');
    const imageDataPixels = finalCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    
    for (let i = 0; i < imageDataPixels.data.length; i += 4) {
        const maskX = Math.floor((i/4) % tempCanvas.width * (maskCanvas.width/tempCanvas.width));
        const maskY = Math.floor((i/4 / tempCanvas.width) * (maskCanvas.height/tempCanvas.height));
        const maskPixel = maskCtx.getImageData(maskX, maskY, 1, 1).data;
        
        if (maskPixel[3] === 0) {
            const avg = (imageDataPixels.data[i] + imageDataPixels.data[i+1] + imageDataPixels.data[i+2]) / 3;
            imageDataPixels.data[i] = avg;
            imageDataPixels.data[i+1] = avg;
            imageDataPixels.data[i+2] = avg;
        }
    }
    
    finalCtx.putImageData(imageDataPixels, 0, 0);
    canvas.setBackgroundImage(tempCanvas.toDataURL(), canvas.renderAll.bind(canvas));
}

// Download
function downloadImage() {
    const link = document.createElement('a');
    link.download = 'converted-image.png';
    link.href = canvas.toDataURL();
    link.click();
}
