document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('qr-video');
    const canvasElement = document.getElementById('qr-canvas');
    const canvas = canvasElement.getContext('2d');
    const resultElement = document.getElementById('result');
    const validationFrame = document.getElementById('validation-frame');

    // Use the MediaDevices API to access the camera
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(function(stream) {
            video.srcObject = stream;
            video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
            video.play();
            requestAnimationFrame(tick);
        });

    let lastScannedCode = null;
    
    function tick() {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvasElement.hidden = false;
            canvasElement.height = video.videoHeight;
            canvasElement.width = video.videoWidth;
            canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
            var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
            var code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });
            if (code && code.data !== lastScannedCode) {
                lastScannedCode = code.data;
                showValidationFrame(code.data);
            }
        }
        requestAnimationFrame(tick);
    }
    
    function showValidationFrame(data) {
        // Construct the URL using the data from the QR code
        console.log('Data from QR: ', data);
        if(data && data != ''){
            video.pause(); // Pause the video feed
            const validationUrl = data;
            const newWindow = window.open(validationUrl, '_blank');
            setTimeout(function() {
                video.play();
                // Allow new scans after the current one has been handled
                lastScannedCode = null;
            }, 6000);


            setTimeout(function() {
                newWindow.close();
            }, 7000);
        }
    }
    function validateQRCode(data) {
        // Insert the correct parameters into the URL based on the scanned QR data
        const validationUrl = `https://chs--partial.sandbox.my.site.com/QRValidator/validate?c__r=${encodeURIComponent(data.c__r)}&c__gs=${data.c__gs}&c__cs=${data.c__cs}&c__t=${data.c__t}`;
    
        // Make a fetch request to the validation URL
        fetch(validationUrl)
        .then(response => response.text()) // Assuming the response is plain text
        .then(html => {
            // Here you would need to parse the HTML to extract the relevant message.
            // This is a simple placeholder example; actual implementation may vary.
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const message = doc.querySelector('body').innerText.trim();
            displayValidationMessage(message);
        })
        .catch((error) => {
            console.error('Error:', error);
            displayValidationMessage("Failed to validate QR Code.");
        });
    }
    
    function displayValidationMessage(message) {
        resultElement.textContent = message;
        setTimeout(resetScanner, 10000); // Reset after 10 seconds
    }
    
    function resetScanner() {
        video.play();
        resultElement.textContent = "Scan a QR Code";
        // Make sure to clear any previous validation results if needed
    }
    
    // Rest of your code to handle video streaming and QR code scanning...
    
});
