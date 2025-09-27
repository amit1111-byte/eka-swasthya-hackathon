// client/script.js
document.addEventListener('DOMContentLoaded', () => {
    // This is the URL where our backend server is running.
    const API_URL = 'https://eka-swasthya-server.onrender.com/api';

    // --- LOGIC FOR LOGIN PAGE (index.html) ---
    if (document.getElementById('loginBtn')) {
        document.getElementById('loginBtn').addEventListener('click', async () => {
            const healthId = document.getElementById('healthIdInput').value;
            if (!healthId) return alert('Please enter a Health ID.');
            
            try {
                // We don't need the response, just making sure the user exists/is created
                await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ healthId })
                });
                // Save the current user's ID in the browser so we remember who is logged in
                sessionStorage.setItem('currentHealthId', healthId);
                window.location.href = 'profile.html';
            } catch (err) {
                alert('Login failed. Please make sure the backend server is running.');
            }
        });
    }

    // --- LOGIC FOR PROFILE PAGE (profile.html) ---
    if (document.getElementById('saveProfileBtn')) {
        const currentHealthId = sessionStorage.getItem('currentHealthId');
        if (!currentHealthId) return window.location.href = 'index.html';

        document.getElementById('welcomeMessage').textContent = `Welcome, ${currentHealthId}!`;

        // Generate the QR Code using the library
        new QRCode(document.getElementById("qrcode"), {
            text: currentHealthId,
            width: 128,
            height: 128
        });

        const fullNameInput = document.getElementById('fullName');
        const ageInput = document.getElementById('age');
        const bloodGroupInput = document.getElementById('bloodGroup');
        const allergiesInput = document.getElementById('allergies');
        const conditionsInput = document.getElementById('conditions');
        const recordsListDiv = document.getElementById('recordsList');

        // Function to get data from the server and display it
        const loadUserData = async () => {
            try {
                const res = await fetch(`${API_URL}/user/${currentHealthId}`);
                const data = await res.json();
                
                fullNameInput.value = data.profile.fullName || '';
                ageInput.value = data.profile.age || '';
                bloodGroupInput.value = data.profile.bloodGroup || '';
                allergiesInput.value = data.profile.allergies || '';
                conditionsInput.value = data.profile.conditions || '';

                recordsListDiv.innerHTML = '';
                if (data.records && data.records.length > 0) {
                    data.records.forEach(record => {
                        const p = document.createElement('p');
                        p.innerHTML = `<strong>Note from ${record.doctor}:</strong> ${record.note}`;
                        recordsListDiv.appendChild(p);
                    });
                } else {
                    recordsListDiv.innerHTML = '<p>No records found.</p>';
                }
            } catch (err) {
                console.error("Failed to load user data", err);
            }
        };

        // Function to send updated profile data to the server
        document.getElementById('saveProfileBtn').addEventListener('click', async () => {
            const profileData = {
                fullName: fullNameInput.value,
                age: ageInput.value,
                bloodGroup: bloodGroupInput.value,
                allergies: allergiesInput.value,
                conditions: conditionsInput.value,
            };
            try {
                await fetch(`${API_URL}/user/${currentHealthId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(profileData)
                });
                alert('Profile saved successfully!');
            } catch (err) {
                alert('Failed to save profile.');
            }
        });

        loadUserData(); // Load the user's data when the page opens
    }

    // --- LOGIC FOR DOCTOR PAGE (doctor.html) ---
    if (document.getElementById('fetchBtn')) {
        const patientIdInput = document.getElementById('patientIdInput');
        
        const displayPatientData = (data) => {
            document.getElementById('pName').textContent = data.profile.fullName || 'N/A';
            document.getElementById('pAge').textContent = data.profile.age || 'N/A';
            document.getElementById('pBloodGroup').textContent = data.profile.bloodGroup || 'N/A';
            document.getElementById('pAllergies').textContent = data.profile.allergies || 'N/A';
            document.getElementById('pConditions').textContent = data.profile.conditions || 'N/A';
            document.getElementById('patientDataCard').style.display = 'block';
        };
        
        const fetchPatientData = async (patientId) => {
             if (!patientId) return alert('Health ID is empty.');
             try {
                const res = await fetch(`${API_URL}/user/${patientId}`);
                if (!res.ok) throw new Error('Patient not found');
                const data = await res.json();
                displayPatientData(data);
            } catch (err) {
                alert('Could not fetch data for this Health ID.');
            }
        };

        // --- QR Code Scanner Logic ---
        const onScanSuccess = (decodedText, decodedResult) => {
            console.log(`Scan result: ${decodedText}`);
            html5QrcodeScanner.clear(); // Stop scanning once successful
            patientIdInput.value = decodedText; // Put the scanned ID in the input box
            fetchPatientData(decodedText); // Fetch data for the scanned ID
        };
        
        const html5QrcodeScanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 }, false);
        html5QrcodeScanner.render(onScanSuccess);

        // Allow manual fetching too
        document.getElementById('fetchBtn').addEventListener('click', () => fetchPatientData(patientIdInput.value));

        // Logic for adding a new record
        document.getElementById('addRecordBtn').addEventListener('click', async () => {
            const patientId = patientIdInput.value;
            const newRecordNote = document.getElementById('newRecordInput').value;
            if (!patientId) return alert('No patient selected.');
            if (!newRecordNote) return alert('Please write a note.');

            try {
                await fetch(`${API_URL}/records/${patientId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ note: newRecordNote, doctor: 'Dr. Amit' })
                });
                alert('Record added successfully!');
                document.getElementById('newRecordInput').value = '';
                // Optional: Re-fetch data to show the new record instantly
                fetchPatientData(patientId); 
            } catch (err) {
                alert('Failed to add record.');
            }
        });
    }
});