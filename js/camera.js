// js/camera.js (NAYA, SAHI CODE)

// --- Global variables for recording ---
let mediaRecorder;
let recordedChunks = [];
let stream;

// This function will be called when the game starts
async function startRecording() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            
            try {
                // Step 1: Naye function se video ko Cloudinary par upload karo
                console.log('Uploading recorded video to Cloudinary...');
                document.getElementById('quitButton').textContent = "Uploading..."; // User ko feedback do
                
                const uploadedUrl = await uploadToCloudinary(blob); 

                if (uploadedUrl) {
                    // Step 2: Asli URL ko apne server/database mein save karo
                    const newRecording = {
                        url: uploadedUrl,
                        timestamp: new Date().toLocaleString()
                    };
                    
                    console.log('Saving recording URL to the server...');
                    await fetch('/api/addRecording', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newRecording),
                    });
                    console.log('Recording successfully saved!');
                }
            } catch (error) {
                console.error('Failed to upload or save recording:', error);
                alert('Sorry, there was an error uploading your recording.');
            } finally {
                 document.getElementById('quitButton').textContent = "Quit"; // Button ko wapas theek karo
            }
            
            recordedChunks = [];
        };

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
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        console.log('Recording stopped.');
    }
}

// ===== YEH FUNCTION POORI TARAH SE BADAL GAYA HAI =====
async function uploadToCloudinary(blob) {
    // APNI CLOUDINARY DETAILS YAHAN DAALEIN
    const CLOUD_NAME = "dublbe56c"; // Yahan apna Cloudinary Cloud Name daalein
    const UPLOAD_PRESET = "my_game_uploads"; // Yahan apna Unsigned Upload Preset ka naam daalein

    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', UPLOAD_PRESET);

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`;

    try {
        const response = await fetch(cloudinaryUrl, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Cloudinary upload failed.');
        }

        const data = await response.json();
        console.log('Upload successful, URL:', data.secure_url);
        return data.secure_url; // Asli video ka URL yahan se milega
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        return null; // Error hone par null return karo
    }
}

// Make functions available globally
window.startRecording = startRecording;
window.stopRecording = stopRecording;