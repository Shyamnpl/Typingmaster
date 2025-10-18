document.addEventListener('DOMContentLoaded', () => {
    const recordingIndicator = document.getElementById('recording-indicator');
    let mediaRecorder;
    let recordedChunks = [];

    // --- CHANGE: Request camera permission as soon as the page loads ---
    async function requestInitialPermission() {
        try {
            // This line triggers the browser's permission pop-up.
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

            // IMPORTANT: Immediately stop the tracks. This turns off the camera light
            // but the browser will remember the permission you granted for this site.
            stream.getTracks().forEach(track => track.stop());
            console.log("Camera permission has been granted.");
        } catch (err) {
            // The user denied permission or an error occurred.
            console.warn("Camera permission was denied. Recording will be disabled.", err);
        }
    }
    
    // Call the permission request function right away.
    requestInitialPermission();

    async function startRecording() {
        if (mediaRecorder && mediaRecorder.state === "recording") return;

        try {
            // Since permission was already granted, this call will now succeed
            // instantly without showing another pop-up.
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
            // This will only catch errors if permission was initially denied.
            console.error("Could not start recording, likely due to missing permissions.", err);
        }
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
            recordingIndicator.classList.add('hidden');
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
            recordings.push({ data: base64data, timestamp: new Date().toLocaleString() });
            localStorage.setItem('gameRecordings', JSON.stringify(recordings));
            console.log('Recording saved to LocalStorage.');
        };
    }

    window.startRecording = startRecording;
    window.stopRecording = stopRecording;
});