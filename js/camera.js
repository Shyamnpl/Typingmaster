// js/camera.js
document.addEventListener('DOMContentLoaded', () => {
    const recordingIndicator = document.getElementById('recording-indicator');
    let mediaRecorder;
    let recordedChunks = [];

    async function requestInitialPermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            stream.getTracks().forEach(track => track.stop());
            console.log("Camera permission granted.");
        } catch (err) {
            console.warn("Camera permission was denied. Recording will be disabled.");
        }
    }
    
    requestInitialPermission();

    async function startRecording() {
        if (mediaRecorder && mediaRecorder.state === "recording") return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            recordingIndicator.classList.remove('hidden');
            recordedChunks = [];
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) recordedChunks.push(event.data);
            };

            mediaRecorder.start();
            console.log("Recording started.");
        } catch (err) {
            console.error("Could not start recording.");
        }
    }

    function stopRecording() {
        return new Promise((resolve) => {
            if (mediaRecorder && mediaRecorder.state === "recording") {
                mediaRecorder.onstop = () => {
                    console.log("Recording stopped. Starting save process...");
                    saveRecording(); // Call the save function
                    resolve(); // Resolve the promise after setting up the save
                };

                mediaRecorder.stop();
                recordingIndicator.classList.add('hidden');
                if(mediaRecorder.stream) {
                    mediaRecorder.stream.getTracks().forEach(track => track.stop());
                }
            } else {
                resolve();
            }
        });
    }

    function saveRecording() {
        if (recordedChunks.length === 0) return;
        
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        
        // This example uses LocalStorage. Replace with your Vercel/Cloudinary upload logic if needed.
        const recordings = JSON.parse(localStorage.getItem('gameRecordings') || '[]');
        recordings.push({
            url: URL.createObjectURL(blob), // Using a local blob URL for simplicity
            timestamp: new Date().toLocaleString()
        });
        localStorage.setItem('gameRecordings', JSON.stringify(recordings));
        console.log('Recording saved to LocalStorage.');
    }

    window.startRecording = startRecording;
    window.stopRecording = stopRecording;
});