// scripts/visualizer.js
let audioContext, analyser, source, dataArray;
let canvas, canvasCtx;
let animationFrameId;
let isInitialized = false;

function init(audioElement, canvasElement) {
    try {
        canvas = canvasElement;
        canvasCtx = canvas.getContext('2d');
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        source = audioContext.createMediaElementSource(audioElement);

        source.connect(analyser);
        analyser.connect(audioContext.destination);

        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        isInitialized = true;
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    } catch (e) {
        console.error("Web Audio API não suportada.", e);
        canvas.style.display = 'none';
    }
}

function resizeCanvas() {
    if (!canvas) return;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}

function draw() {
    if (!isInitialized) return;

    animationFrameId = requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);

    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / dataArray.length) * 1.5;
    let x = 0;
    const gradient = canvasCtx.createLinearGradient(0, 0, canvas.width, 0);
    const accent1 = getComputedStyle(document.documentElement).getPropertyValue('--accent-color-1').trim();
    const accent2 = getComputedStyle(document.documentElement).getPropertyValue('--accent-color-2').trim();
    gradient.addColorStop(0, `${accent1}cc`); // 80% opacity
    gradient.addColorStop(1, `${accent2}cc`);

    for (let i = 0; i < dataArray.length; i++) {
        const barHeight = dataArray[i] / 2.5;
        canvasCtx.fillStyle = gradient;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
    }
}

function start() {
    if (!isInitialized) return;
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    cancelAnimationFrame(animationFrameId);
    draw();
}

function stop() {
    if (!isInitialized) return;
    cancelAnimationFrame(animationFrameId);
    if (canvasCtx && canvas) {
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

export { init, start, stop };
