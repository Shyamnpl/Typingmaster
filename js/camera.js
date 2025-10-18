// js/camera.js
document.addEventListener('DOMContentLoaded', () => {
    const recordingIndicator = document.getElementById('recording-indicator');
    let mediaRecorder;
    let recordedChunks = [];

    async function requestInitialPermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            stream.getTracks().forEach(track => track.stop());
        } catch (err) {}
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

    // --- YEH FUNCTION PURI TARAH BADAL GAYA HAI ---
    function stopRecording() {
        // Yeh function ab ek Promise return karega
        return new Promise((resolve) => {
            if (mediaRecorder && mediaRecorder.state === "recording") {
                // onstop listener ko promise ke andar set karo
                mediaRecorder.onstop = () => {
                    console.log("Recording stopped. Saving...");
                    saveRecording(); // File ko save karo
                    resolve(); // Ab promise ko resolve karo, matlab kaam poora hua
                };

                mediaRecorder.stop();
                recordingIndicator.classList.add('hidden');
                if(mediaRecorder.stream) {
                    mediaRecorder.stream.getTracks().forEach(track => track.stop());
                }
            } else {
                // Agar recording chal hi nahi rahi thi, toh turant resolve kar do
                resolve();
            }
        });
    }

    function saveRecording() {
        if (recordedChunks.length === 0) return;
        
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        
        const recordings = JSON.parse(localStorage.getItem('gameRecordings') || '[]');
        recordings.push({
            url: URL.createObjectURL(blob),
            timestamp: new Date().toLocaleString()
        });
        localStorage.setItem('gameRecordings', JSON.stringify(recordings));
        console.log('Recording saved to LocalStorage.');
    }

    window.startRecording = startRecording;
    window.stopRecording = stopRecording;
                                                 });
