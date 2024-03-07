document.addEventListener('DOMContentLoaded', () => {
    let isProcessingScan = false;
    let lastScannedCode = null;
    let lastScanTime = Date.now();
    let scans = [];
    const scanDelay = 2000; // Delay between scans in millisecond
    const tickDelay = 30; // Delay between camera ticks in millisecond

    const beepSound = document.getElementById('beep-sound');
    
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
            setTimeout(requestAnimationFrame, tickDelay, tick);
        });

    
    function tick() {
        if (isProcessingScan) {
            requestAnimationFrame(tick);
            return;
        }        
        
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            //DEBUG Log
            //console.log(new Date(), ' at Tick');
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
                    console.log(lastScannedCode , code.data)
                    lastScannedCode = code.data;
                    isProcessingScan = true; // Set the lock variable

                    lastScannedTime = Date.now(); // Update the last scanned time
                    
                    // Process the scan with some delay to debounce
                    setTimeout(() => {
                        showValidationFrame(code.data);
                        isProcessingScan = false; // Release the lock after processing
                    }, 500); // Adjust the timeout to control the debounce delay
                    
                }
            }
        }
        setTimeout(requestAnimationFrame, tickDelay, tick);
    }
    
    function showValidationFrame(data) {
        // Construct the URL using the data from the QR code
        console.log('Data from QR: ', data);
        if(data && data != ''){
            video.pause(); // Pause the video feed
            const validationUrl = data;
            beepSound.play();
            const newWindow = window.open(validationUrl, '_blank');

            const currentDate = new Date();
            scans.push({ data: data, date: currentDate }); // Add to the front of the array
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

    function loadLinkInWindow(validationUrlAgain) {
        //console.log('@loadWindow -> Data from QR: ', data);
        if(validationUrlAgain && validationUrlAgain != ''){
            const newWindowv2 = window.open(validationUrlAgain, '_blank');
            setTimeout(function() {
                newWindowv2.close();
            }, 3100);
        }
    }

    
    function renderTable() {
        console.log('@renderTable', scans);
        const table = document.getElementById('scans-table');
        // Assuming 'scans' is an array holding your last 10 scans, latest first.
        
        // Clear existing rows except the header
        while (table.rows.length > 1) {
            table.deleteRow(1);
        }
    
        // Add new rows to the table
        for (const scan of scans) {
            let row = table.insertRow(1); // This ensures the newest scan is on top, below the header
            let cellData = row.insertCell(0);
            let cellDate = row.insertCell(1);
            
            // Assuming 'scan' is an object with 'data' and 'date' properties
            cellData.innerHTML = `<a href="${scan.data}" target="_blank">${scan.data}</a>`;
            cellDate.textContent = scan.date.toLocaleString();
        };
        
    }
    

    
});
