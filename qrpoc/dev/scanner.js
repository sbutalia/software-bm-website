document.addEventListener('DOMContentLoaded', () => {
    let isProcessingScan = false;
    let lastScannedCode = null;
    let lastScanTime = Date.now();
    let scans = [];

    //Prod
    //const BACKEND_URL = 'https://paper-coffee-mouse.glitch.me';

    //Dev
    const BACKEND_URL = 'https://bitter-witty-saturnalia.glitch.me/';

    const scanDelay = 800; // Delay between scans in millisecond
    const tickDelay = 60; // Delay between camera ticks in millisecond

    const beepSound = document.getElementById('beep-sound');
    
    const video = document.getElementById('qr-video');
    const canvasElement = document.getElementById('qr-canvas');
    const canvas = canvasElement.getContext('2d', { willReadFrequently: true });
    const resultElement = document.getElementById('result');
    const validationFrame = document.getElementById('validation-frame');
    var myInfo = {
        ip: null,
        lat: null,
        long: null,
        browserType: navigator.userAgent,
        timestamp: new Date().toISOString(),
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        operatingSystem: navigator.platform,
        browserVersion: navigator.appVersion,
        deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
        referrerURL: document.referrer || 'None'
    }

    //On load get this info
    fetch('https://api.ipify.org?format=json')
    .then(response => response.json())
    .then(data => {
        console.log('Your IP address is:', data.ip);
        myInfo.ip = data.ip;
        // Now you can send this IP address back to your server if needed.
    })
    .catch(error => {
        console.error('Error fetching the IP address:', error);
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
            // Now you can send this location back to your server if needed.
            myInfo.lat = latitude;
            myInfo.long = longitude;
          },
          (error) => {
            console.error('Geolocation API error:', error);
          },
          { enableHighAccuracy: true } // Requests the best possible results.
        );
    }
    
    // Use the MediaDevices API to access the camera
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(function(stream) {
            video.srcObject = stream;
            video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
            video.play();
            setTimeout(requestAnimationFrame, tickDelay, tick);
        });

    function showLoader() {
        document.getElementById('loader').style.display = 'block';
    }

    function hideLoader() {
        document.getElementById('loader').style.display = 'none';
    }

    function clearCanvas(canvas, context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
    }    
    
    function pauseCanvas(){
        beepSound.play();
        showLoader();
        
        canvasElement.style.visibility = 'hidden'; // Make the video element visible again
        //video.pause(); // Pause the video feed
        clearCanvas(canvasElement, canvas);
    }
    
    function resetCanvas(){
        setTimeout(function() {
            hideLoader();
            canvasElement.style.visibility = 'visible'; // Make the video element visible again
            isProcessingScan = false; // Release the lock after processing
            // Allow new scans after the current one has been handled
            lastScannedCode = null;
        }, 800);
    }

    function tick() {
        if (isProcessingScan) {
            requestAnimationFrame(tick);
            return;
        }        
        
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            //DEBUG Log
            //console.log(new Date(), ' at Tick');

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
                    lastScanTime = Date.now(); // Update the last scanned time
                    
                    // Process the scan with some delay to debounce
                    setTimeout(() => {
                        handleQRCode(code.data);   
                    }, 700); // Adjust the timeout to control the debounce delay
                    
                }
            
        }
        setTimeout(requestAnimationFrame, tickDelay, tick);
    }

       
    // Function to handle the QR code data and make an API call
    async function handleQRCode(data, upCellElem) {
        console.log('Data from QR: ', data);
        
        if(data && data != ''){
               
                const params = new URLSearchParams(data.slice(data.indexOf('?') + 1));
                console.log("qr params: ", params);
                
                const resId = params.get('c__r');
                const guestSpot = params.get('c__gs');
                const checksum = params.get('c__cs');
                const facilityId = params.get('c__fid');
                const upgrade = params.get('up');
                
                const type = params.get('c__t'); // Added to handle different types
                const productCode = params.get('c__pcd'); // Only used for type 'p'

                if(!upgrade){
                    pauseCanvas();
                }

                let payload = {
                    "type": type,
                    "facilityId": facilityId,
                    "myinfo": myInfo
                };

                // Add parameters based on type
                if (type === 'ml' || type === 'mlm') {
                    payload.resId = resId;
                    payload.guestSpot = guestSpot;
                    payload.checksum = checksum;
                } else if (type === 'p') {
                    payload.productCode = productCode;
                }

                if(upgrade)
                    payload.up = upgrade;

                console.log("payload: ", payload);

                const queryParams = {
                    language: 'en-US',
                    asGuest: 'true',
                    htmlEncode: 'false'
                };

                try {
                    const response = await fetch(BACKEND_URL + '/validate-qr' + '?' + new URLSearchParams(queryParams), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const responseData = await response.json();
                    const status = responseData;

                    console.log(responseData)

                    if(!upgrade){
                        addScan({ data: data, date: new Date(), status: status });
                        resetCanvas();
                    }
                    else{
                        upCellElem.innerHTML = `<span class="c-green">Upgraded to Sandwich!</span>`;
                    }

                } catch (error) {
                    console.error('Error during QR code validation:', error);
                    resetCanvas();
                }
            }
            else{
                resetCanvas();
            }
    }



    // Function to add a new scan and render the table
    function addScan(scan) {
        // Add the new scan to the start of the array
        scans.push(scan);
        // If the array exceeds 10 scans, remove the oldest
        if (scans.length > 10) {
            scans.shift();
        }
        // Render the table with the new scan data
        renderTable();
    }

    function showValidationFrame(data) {
        // Construct the URL using the data from the QR code
        console.log('Data from QR: ', data);
        if(data && data != ''){
            //video.pause(); // Pause the video feed
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
            let cellActions = row.insertCell(4);
            
            // Assuming 'scan' is an object with 'data' and 'date' properties
            cellResID.textContent = scan.status.returnValue.parametersSent.resId;
            cellStatus.innerHTML = scan.status.returnValue.messageToDisplay;
            cellDate.textContent = scan.date.toLocaleString();
            cellLink.innerHTML = `<a href="${scan.data}" target="_blank"> Open </a>`;

            
            let actionsButton = document.createElement('button');
            actionsButton.innerHTML = '⋯';
            actionsButton.className = 'three-dots'; // Add a class to the button
            cellActions.appendChild(actionsButton);
            
            let optionsList = document.createElement('ul');
            optionsList.className = 'options-menu'; // Add a class to the menu
            optionsList.style.display = 'none'; // Hide the menu by default
            cellActions.appendChild(optionsList);
            
            let options = ['Upgrade to Sandwich']; // Add more options here
            options.forEach(option => {
              let optionElement = document.createElement('li');
              optionElement.textContent = option;
              optionsList.appendChild(optionElement);
              optionElement.addEventListener('click', event => {
                // Handle option click here
                console.log(`Option clicked: ${option}`);

                cellActions.innerHTML = `Processing Request...`;

                scan.data += `&up=1`;
                handleQRCode(scan.data, cellActions);

                optionsList.style.display = 'none';
                actionsButton.style.display = 'none';
              });
            });
            
            actionsButton.addEventListener('click', event => {
              // Toggle the menu visibility
              optionsList.style.display = optionsList.style.display === 'none' ? 'block' : 'none';
            });
            


            // Check the status message and apply color accordingly
            if (scan.status.returnValue.messageToDisplay.includes("expired")) {
                cellStatus.classList.add('status-expired');
            } else {
                cellStatus.classList.add('status-ok');
            } 
            
            
        };
        
    }

});

  