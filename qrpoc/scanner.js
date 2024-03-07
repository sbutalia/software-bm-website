document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('qr-video');
    const canvasElement = document.getElementById('qr-canvas');
    const canvas = canvasElement.getContext('2d', { willReadFrequently: true });
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
    let lastScanTime = Date.now();
    const scanDelay = 1500; // Delay between scans in millisecond
    
    function tick() {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            if (Date.now() - lastScanTime > scanDelay) {
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
                    lastScannedTime = Date.now(); // Update the last scanned time
                    showValidationFrame(code.data);
                }
            }
        }
        requestAnimationFrame(tick);
    }

    function loadLinkInWindow(data) {
        // Construct the URL using the data from the QR code
        console.log('@loadWindow -> Data from QR: ', data);
        if(data && data != ''){
            const newWindowv2 = window.open(data, '_blank');
            setTimeout(function() {
                newWindowv2.close();
            }, 3100);
        }
    }
    
    function showValidationFrame(data) {
        // Construct the URL using the data from the QR code
        console.log('Data from QR: ', data);
        if(data && data != ''){
            video.pause(); // Pause the video feed
            const validationUrl = data;
            const newWindow = window.open(validationUrl, '_blank');

            const currentDate = new Date();
            scans.unshift({ data: data, date: currentDate }); // Add to the front of the array
            scans = scans.slice(0, 10); // Keep only the last 10
            renderTable();


            setTimeout(function() {
                video.play();
                // Allow new scans after the current one has been handled
                lastScannedCode = null;
            }, 3000);

            setTimeout(function() {
                newWindow.close();
            }, 3100);
        }
    }

    let scans = [];
    function renderTable() {
        const table = document.getElementById('scans-table');
        // Clear all rows except the header
        table.innerHTML = '<tr><th>Data</th><th>Date</th></tr>';

        // Insert new rows for the scan history
        scans.slice(0, 10).forEach(scan => {
            let row = table.insertRow(1); // insert at top after header
            let cell1 = row.insertCell(0);
            let cell2 = row.insertCell(1);
            let a = document.createElement('a');
            a.href = scan.data;
            a.textContent = scan.data;
            a.target = "_blank"; // Open in new tab
            a.onclick = function() {
                loadLinkInWindow(scan.data); // Call validation frame function on click
                return false; // Prevent default action
            };
            cell1.appendChild(a);


            cell2.textContent = scan.date.toLocaleString();
        });
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
