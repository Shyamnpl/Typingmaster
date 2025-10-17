document.addEventListener('DOMContentLoaded', () => {
    const recordingIndicator = document.getElementById('recording-indicator');
    let mediaRecorder;
    let recordedChunks = [];

    async function startRecording() {
        // Don't start a new recording if one is already active
        if (mediaRecorder && mediaRecorder.state === "recording") {
            console.log("Recording is already in progress.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            
            recordingIndicator.classList.remove('hidden');
            recordedChunks = []; // Clear previous recording chunks

            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) recordedChunks.push(event.data);
            };
            
            mediaRecorder.onstop = saveRecordingForAdmin;
            mediaRecorder.start();
            console.log("Recording started automatically.");

        } catch (err) {
            console.error("Error accessing camera: ", err);
            // Non-intrusively log the error, as the user didn't explicitly ask for this
        }
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
            recordingIndicator.classList.add('hidden');
            // Stop camera stream tracks to turn off the camera light
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            console.log("Recording stopped.");
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
            
            recordings.push({
                // Store as Base64 string, which is more stable in localStorage than blob URLs
                data: base64data, 
                timestamp: new Date().toLocaleString()
            });
            
            localStorage.setItem('gameRecordings', JSON.stringify(recordings));
            console.log('Recording saved to LocalStorage.');
        };
    }

    // Expose functions globally so game.js can call them
    window.startRecording = startRecording;
    window.stopRecording = stopRecording;
});