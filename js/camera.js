// js/camera.js

// --- Global variables for recording ---
let mediaRecorder;
let recordedChunks = [];
let stream;

// This function will be called when the game starts
async function startRecording() {
    try {
        // Access the user's camera and microphone
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        // Create a new MediaRecorder instance
        mediaRecorder = new MediaRecorder(stream);

        // Event listener for when data is available
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        // Event listener for when recording stops
        mediaRecorder.onstop = async () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            
            // --- YAHAN SE BADLAAV SHURU HOTA HAI ---
            // Ab hum video ko server par upload karenge (maan lijiye aapke paas yeh function hai)
            // Yeh function video upload karke public URL dega
            try {
                // IMPORTANT: Replace this with your actual Cloudinary upload logic
                const uploadedUrl = await uploadToCloudinary(blob); 

                if (uploadedUrl) {
                    const newRecording = {
                        url: uploadedUrl,
                        timestamp: new Date().toLocaleString() // Unique timestamp
                    };

                    // PURANA CODE (localStorage wala)
                    /*
                    const recordings = JSON.parse(localStorage.getItem('gameRecordings') || '[]');
                    recordings.push(newRecording);
                    localStorage.setItem('gameRecordings', JSON.stringify(recordings));
                    console.log('Recording saved to localStorage.');
                    */

                    // NAYA CODE: Server API ko call karke database mein save karna
                    console.log('Saving recording to the server...');
                    await fetch('/api/addRecording', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newRecording),
                    });
                    console.log('Recording successfully saved to the server.');
                }
            } catch (error) {
                console.error('Failed to upload or save recording:', error);
            }
            
            // --- YAHAN PAR BADLAAV KHATM HOTA HAI ---

            // Clean up
            recordedChunks = [];
        };

        // Start recording
        mediaRecorder.start();
        console.log('Recording started.');

    } catch (error) {
        console.error('Error starting recording:', error);
    }
}

// This function will be called when the game ends or is quit
async function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        // Stop all media tracks to turn off the camera light
        stream.getTracks().forEach(track => track.stop());
        console.log('Recording stopped.');
    }
}

// Dummy function for Cloudinary upload - Replace with your actual implementation
async function uploadToCloudinary(blob) {
    console.log("Uploading to Cloudinary...");
    // Aapka Cloudinary upload logic yahan aayega
    // Yeh ek example URL hai. Aapko yahan se aane wala real URL istemal karna hai.
    // For example:
    // const formData = new FormData();
    // formData.append('file', blob);
    // formData.append('upload_preset', 'YOUR_PRESET');
    // const response = await fetch('https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/video/upload', {
    //     method: 'POST',
    //     body: formData
    // });
    // const data = await response.json();
    // return data.secure_url;

    // For now, returning a placeholder
    return 'https://res.cloudinary.com/demo/video/upload/v1689266232/samples/elephants.webm';
}

// Make functions available globally if needed (e.g., in game.js)
window.startRecording = startRecording;
window.stopRecording = stopRecording;