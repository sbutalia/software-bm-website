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
                        handleQRCode(code.data);
                        isProcessingScan = false; // Release the lock after processing
                    }, 500); // Adjust the timeout to control the debounce delay
                    
                }
            }
        }
        setTimeout(requestAnimationFrame, tickDelay, tick);
    }
    
// Function to handle the QR code data and make an API call
async function handleQRCode(data) {
    console.log('Data from QR: ', data);
    
    if(data && data != ''){
            beepSound.play();
            video.pause(); // Pause the video feed
            
            const params = new URLSearchParams(data.slice(data.indexOf('?') + 1));
            const resId = params.get('c__r');
            const guestSpot = params.get('c__gs');
            const checksum = params.get('c__cs');

            console.log("params: ", params);

            const url = 'https://paper-coffee-mouse.glitch.me/validate-qr';
            const queryParams = {
                language: 'en-US',
                asGuest: 'true',
                htmlEncode: 'false'
            };

            const payload = {
                    "type": "ml",
                    "resId": resId,
                    "guestSpot": guestSpot,
                    "checksum": checksum
                };

            try {
                const response = await fetch(url + '?' + new URLSearchParams(queryParams), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                        // Include additional headers if necessary, like authorization headers
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const responseData = await response.json();
                // Process response and add status to the scans array
                const status = responseData; // Adjust according to the actual response structure
                addScan({ data: data, date: new Date(), status: status });

                resetVideo();

            } catch (error) {
                console.error('Error during QR code validation:', error);
                resetVideo();
            }
        }
}

function resetVideo(){
    setTimeout(function() {
        video.play();
        // Allow new scans after the current one has been handled
        lastScannedCode = null;
    }, 3000);

}

// Function to add a new scan and render the table
function addScan(scan) {
    // Add the new scan to the start of the array
    scans.push(scan);
    // If the array exceeds 10 scans, remove the oldest
    if (scans.length > 10) {
        scans.pop();
    }
    // Render the table with the new scan data
    renderTable();
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
            let cellResID = row.insertCell(0);
            let cellStatus = row.insertCell(1);
            let cellDate = row.insertCell(2);
            let cellLink = row.insertCell(3);
            
            // Assuming 'scan' is an object with 'data' and 'date' properties
            cellResID.textContent = scan.status.returnValue.parametersSent.resId;
            cellStatus.innerHTML = scan.status.returnValue.messageToDisplay;
            cellDate.textContent = scan.date.toLocaleString();
            cellLink.innerHTML = `<a href="${scan.data}" target="_blank"> Open </a>`;
        };
        
    }
    
});
