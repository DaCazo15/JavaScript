document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('start-btn');
    const initialScreen = document.getElementById('initial-screen');
    const welcomeScreen = document.getElementById('welcome-screen');
    const cameraScreen = document.getElementById('camera-screen');
    const titleH2 = document.querySelector('h2');
    titleH2.style.display = 'none';

    // Mostrar pantalla de bienvenida al hacer clic en el botón de inicio
    startBtn.addEventListener('click', () => {
        initialScreen.style.display = 'none';
        welcomeScreen.style.display = 'flex';
        
        // Ocultar pantalla de bienvenida después de 2 segundos
        setTimeout(() => {
            welcomeScreen.style.display = 'none';
            titleH2.style.display = 'block';
            cameraScreen.style.display = 'block';
            initCamera();
        }, 2000);
    });

    // Variables globales
    let stream = null;
    let isDrawing = false;
    let currentColor = '#ff0000';
    
    // Inicializar la cámara
    async function initCamera() {
        const video = document.getElementById('video');
        const errorElement = document.getElementById('camera-error');
        const captureBtn = document.getElementById('capture-btn');
        
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }, 
                audio: false 
            });
            video.srcObject = stream;
            errorElement.style.display = 'none';
            
            // Configurar canvas de dibujo
            setupDrawCanvas();
            
            // Redimensionar canvas cuando cambia el tamaño de la ventana
            window.addEventListener('resize', setupDrawCanvas);
            
            // Inicializar eventos después de que la cámara esté lista
            initEvents();
            
        } catch (err) {
            console.error("Error al acceder a la cámara: ", err);
            errorElement.textContent = "Error al acceder a la cámara. Por favor, asegúrate de permitir el acceso.";
            errorElement.style.display = 'block';
            captureBtn.disabled = true;
        }
    }
    
    // Configurar el canvas de dibujo
    function setupDrawCanvas() {
        const drawCanvas = document.getElementById('draw-canvas');
        const container = document.getElementById('camera-container');
        drawCanvas.width = container.offsetWidth;
        drawCanvas.height = container.offsetHeight;
        
        const ctx = drawCanvas.getContext('2d');
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }
    
    // Inicializar eventos
    function initEvents() {
        const video = document.getElementById('video');
        const captureBtn = document.getElementById('capture-btn');
        const returnBtn = document.getElementById('return-btn');
        const downloadBtn = document.getElementById('download-btn');
        const canvas = document.getElementById('canvas');
        const photo = document.getElementById('photo');
        const drawCanvas = document.getElementById('draw-canvas');
        const ctx = drawCanvas.getContext('2d');
        const colorBtns = document.querySelectorAll('.color-btn');
        
        // Eventos de dibujo (ratón y táctil)
        drawCanvas.addEventListener('mousedown', startDrawing);
        drawCanvas.addEventListener('mousemove', draw);
        drawCanvas.addEventListener('mouseup', stopDrawing);
        drawCanvas.addEventListener('mouseout', stopDrawing);
        drawCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        drawCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        drawCanvas.addEventListener('touchend', stopDrawing);
        
        function handleTouchStart(e) {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            drawCanvas.dispatchEvent(mouseEvent);
        }
        
        function handleTouchMove(e) {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            drawCanvas.dispatchEvent(mouseEvent);
        }
        
        function startDrawing(e) {
            isDrawing = true;
            draw(e);
        }
        
        function draw(e) {
            if (!isDrawing) return;
            const rect = drawCanvas.getBoundingClientRect();
            const scaleFactor = drawCanvas.width / rect.width;
            
            const x = (e.clientX - rect.left) * scaleFactor;
            const y = (e.clientY - rect.top) * scaleFactor;
            
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, y);
        }
        
        function stopDrawing() {
            isDrawing = false;
            ctx.beginPath();
        }
        
        // Cambiar colores
        colorBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                colorBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentColor = btn.dataset.color;
                ctx.strokeStyle = currentColor;
            });
        });
        
        // Capturar foto
        captureBtn.addEventListener('click', function() {
            if (video.srcObject) {
                video.style.display = 'none';
                photo.style.display = 'block';
                
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Asegurar que el canvas de dibujo tenga el mismo tamaño
                drawCanvas.width = canvas.width;
                drawCanvas.height = canvas.height;
                
                photo.src = canvas.toDataURL('image/png');
                captureBtn.style.display = 'none';
                returnBtn.style.display = 'flex';
                downloadBtn.style.display = 'flex';
                photo.classList.add('photo-captured');
                document.body.classList.add('edit-mode');
            }
        });
        
        // Descargar imagen (incluyendo dibujos)
        downloadBtn.addEventListener('click', function() {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            
            // 1. Dibujar la foto capturada
            tempCtx.drawImage(canvas, 0, 0);
            
            // 2. Dibujar los trazos del canvas de dibujo
            tempCtx.drawImage(drawCanvas, 0, 0);
            
            // Crear enlace de descarga
            const link = document.createElement('a');
            link.download = 'davincy-foto-' + new Date().getTime() + '.png';
            link.href = tempCanvas.toDataURL('image/png');
            link.click();
        });
        
        // Volver a la cámara
        returnBtn.addEventListener('click', function() {
            video.style.display = 'block';
            photo.style.display = 'none';
            captureBtn.style.display = 'flex';
            returnBtn.style.display = 'none';
            downloadBtn.style.display = 'none';
            photo.classList.remove('photo-captured');
            document.body.classList.remove('edit-mode');
            ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        });
    }
    
    // Liberar recursos de la cámara al salir
    window.addEventListener('beforeunload', function() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    });
});