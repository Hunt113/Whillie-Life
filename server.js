const express = require('express');
const app = express();
app.use(express.json());

const sessions = {};

function getOrCreateSession(userId) {
    if (!sessions[userId]) {
        sessions[userId] = {
            shirtColor: "White",
            shortsColor: "Black",
            bikeModel: "Super73X",
            maxSpeedMPH: 37,
            bikeAngle: 0,          
            totalDistanceFeet: 0, 
            highScoreFeet: 0,      
            isCrashed: false,
            currentStatus: "Idling on the beach road"
        };
    }
    return sessions[userId];
}

// === UPDATED: Interactive Frontend Web UI ===
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Wheelie Life Simulator</title>
            <style>
                body { font-family: sans-serif; background: #e0f2fe; text-align: center; margin: 0; padding: 20px; }
                .game-container { background: white; max-width: 450px; margin: 20px auto; padding: 20px; border-radius: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                .bike-display { height: 150px; display: flex; align-items: center; justify-content: center; font-size: 50px; margin: 20px 0; background: #f1f5f9; border-radius: 10px; position: relative; overflow: hidden; }
                .road { position: absolute; bottom: 0; width: 100%; height: 10px; background: #475569; }
                .bike { transition: transform 0.1s ease; transform-origin: bottom right; }
                .btn { display: inline-block; width: 40%; padding: 15px; font-size: 18px; font-weight: bold; color: white; border: none; border-radius: 10px; margin: 10px 4%; cursor: pointer; }
                .btn-wheelie { background: #3b82f6; }
                .btn-brake { background: #ef4444; }
                .stats { font-size: 16px; color: #334155; line-height: 1.6; text-align: left; background: #f8fafc; padding: 15px; border-radius: 8px; }
                .status-msg { font-weight: bold; margin: 10px 0; min-height: 24px; }
            </style>
        </head>
        <body>
            <div class="game-container">
                <h2 style="color: #0369a1; margin-top:0;">🌊 Super73X Beach Run 🛣️</h2>
                <p style="font-size:12px; color:#64748b;">Rider: White Shirt & Black Shorts</p>
                
                <div class="bike-display">
                    <div class="bike" id="bikeIcon">🚲</div>
                    <div class="road"></div>
                </div>

                <div class="status-msg" id="statusBox" style="color: #0f172a;">Idling on the beach road</div>

                <div style="margin-bottom: 20px;">
                    <button class="btn btn-wheelie" onclick="triggerAction('wheelie')">WHEELIE</button>
                    <button class="btn btn-brake" onclick="triggerAction('brake')">BRAKE</button>
                </div>

                <div class="stats">
                    <strong>Speed:</strong> <span id="statSpeed">0 MPH</span><br>
                    <strong>Angle:</strong> <span id="statAngle">0°</span><br>
                    <strong>Current Run:</strong> <span id="statDistance">0 ft</span><br>
                    <strong>Personal Best:</strong> <span id="statBest">0 ft</span>
                </div>
            </div>

            <script>
                // Simulate a fixed user session for web testing
                const userId = "web_test_user";

                async function triggerAction(endpoint) {
                    const res = await fetch('/api/bike/' + endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: userId })
                    });
                    const data = await res.json();
                    
                    // Update HTML graphics and texts based on server data
                    const angle = data.bikeAngle || 0;
                    document.getElementById('bikeIcon').style.transform = 'rotate(-' + angle + 'deg)';
                    document.getElementById('statAngle').innerText = angle + '°';
                    document.getElementById('statSpeed').innerText = data.currentSpeed;
                    document.getElementById('statDistance').innerText = data.currentRunDistance || '0 ft';
                    document.getElementById('statBest').innerText = data.personalBest || '0 ft';
                    
                    const statusBox = document.getElementById('statusBox');
                    statusBox.innerText = data.status || data.message;
                    
                    if(data.status && data.status.includes('CRASH')) {
                        statusBox.style.color = '#ef4444';
                    } else if(data.status && data.status.includes('SWEET')) {
                        statusBox.style.color = '#16a34a';
                    } else {
                        statusBox.style.color = '#0f172a';
                    }
                }
                
                // Load initial data
                triggerAction('data');
            </script>
        </body>
        </html>
    `);
});

// 1. GET PLAYER DATA
app.post('/api/bike/data', (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    res.json(getOrCreateSession(userId));
});

// 2. WHEELIE THROTTLE BUTTON
app.post('/api/bike/wheelie', (req, res) => {
    const { userId } = req.body;
    const session = sessions[userId];
    if (!session) return res.status(404).json({ error: "Player not found" });

    if (session.isCrashed) {
        session.isCrashed = false;
        session.bikeAngle = 0;
        session.totalDistanceFeet = 0;
    }

    session.bikeAngle += 15; 

    if (session.bikeAngle > 5) {
        session.totalDistanceFeet += 54;
        if (session.totalDistanceFeet > session.highScoreFeet) {
            session.highScoreFeet = session.totalDistanceFeet;
        }
    }

    if (session.bikeAngle >= 85) {
        session.isCrashed = true;
        session.bikeAngle = 0; 
        session.totalDistanceFeet = 0; 
        session.currentStatus = "CRASH! You looped out backward!";
    } else if (session.bikeAngle >= 45 && session.bikeAngle <= 75) {
        session.currentStatus = "SWEET SPOT! Perfect balance point!";
    } else {
        session.currentStatus = "Wheelie active! Watch your balance.";
    }

    res.json({
        success: !session.isCrashed,
        bikeAngle: session.bikeAngle,
        currentSpeed: session.isCrashed ? "0 MPH" : `${session.maxSpeedMPH} MPH`,
        currentRunDistance: `${session.totalDistanceFeet} ft`,
        personalBest: `${session.highScoreFeet} ft`,
        status: session.currentStatus
    });
});

// 3. REAR BRAKE BUTTON
app.post('/api/bike/brake', (req, res) => {
    const { userId } = req.body;
    const session = sessions[userId];
    if (!session) return res.status(404).json({ error: "Player not found" });

    if (session.isCrashed) {
        return res.json({ message: "Crashed. Press WHEELIE to restart." });
    }

    if (session.bikeAngle > 0) {
        session.bikeAngle = Math.max(0, session.bikeAngle - 25);
    }

    if (session.bikeAngle === 0) {
        session.currentStatus = "Bike flat on the paved road.";
    } else {
        session.currentStatus = "Braking applied! Bringing wheel down.";
        session.totalDistanceFeet += 54; 
    }

    res.json({
        success: true,
        bikeAngle: session.bikeAngle,
        currentSpeed: `${session.maxSpeedMPH} MPH`,
        currentRunDistance: `${session.totalDistanceFeet} ft`,
        personalBest: `${session.highScoreFeet} ft`,
        status: session.currentStatus
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Wheelie Life Simulator Engine running on port ${PORT}`);
});
