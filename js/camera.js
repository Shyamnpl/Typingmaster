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
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) recordedChunks.push(event.data);
            };
            mediaRecorder.onstop = saveRecordingForAdmin;
            mediaRecorder.start();
            console.log("Recording started.");
        } catch (err) {
            console.error("Could not start recording.");
        }
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
            recordingIndicator.classList.add('hidden');
            // Camera light band karne ke liye
            if(mediaRecorder.stream) {
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
            }
            console.log("Recording stopped and will be saved.");
        }
    }

    function saveRecordingForAdmin() {
        if (recordedChunks.length === 0) return;
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = function() {
            const base64data = reader.result;
            const recordings = JSON.parse(localStorage.getItem('gameRecordings') || '[]');
            recordings.push({ data: base64data, timestamp: new Date().toLocaleString() });
            localStorage.setItem('gameRecordings', JSON.stringify(recordings));
            console.log('Recording saved to LocalStorage.');
        };
    }

    // game.js ko access dene ke liye
    window.startRecording = startRecording;
    window.stopRecording = stopRecording;
});