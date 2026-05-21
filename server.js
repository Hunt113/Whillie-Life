const express = require('express');
const app = express();
app.use(express.json());

// In-memory database to store player bike states
const sessions = {};

// Helper function to initialize a player's session
function getOrCreateSession(userId) {
    if (!sessions[userId]) {
        sessions[userId] = {
            shirtColor: "White",
            shortsColor: "Black",
            bikeModel: "Super73X",
            maxSpeedMPH: 37,
            
            // Mechanics & Physics States
            isWheelieing: false,
            bikeAngle: 0,         // 0 degrees = flat. 90 degrees = vertical.
            totalBalancePoints: 0, // Your incremental currency
            multiplier: 1
        };
    }
    return sessions[userId];
}

// === FIX: Homepage Route to replace "Cannot GET /" ===
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
            <h1 style="color: #2b6cb0;">🌊 Super73X Beach Engine 🚲</h1>
            <p style="font-size: 18px; color: #4a5568;">Your backend is live, online, and running perfectly!</p>
            <p style="color: #718096; font-size: 14px;">Connect your Roblox game to this URL to start popping wheelies at 37 MPH.</p>
        </div>
    `);
});

// 1. GET PLAYER DATA
app.post('/api/bike/data', (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const session = getOrCreateSession(userId);
    res.json(session);
});

// 2. WHEELIE BUTTON ENDPOINT
app.post('/api/bike/wheelie', (req, res) => {
    const { userId } = req.body;
    const session = sessions[userId];
    if (!session) return res.status(404).json({ error: "Player session not found" });

    session.isWheelieing = true;
    session.bikeAngle += 15; 

    let statusMessage = "Holding the wheelie perfectly!";
    let pointsGained = 0;

    if (session.bikeAngle >= 85) {
        statusMessage = "CRASH! You leaned too far back and looped out!";
        session.bikeAngle = 0; 
        session.isWheelieing = false;
    } else if (session.bikeAngle >= 30 && session.bikeAngle < 85) {
        pointsGained = Math.floor(session.bikeAngle * session.multiplier);
        session.totalBalancePoints += pointsGained;
    } else {
        statusMessage = "Front wheel is barely off the ground. Pull up more!";
    }

    res.json({
        success: true,
        bikeAngle: session.bikeAngle,
        currentSpeed: `${session.maxSpeedMPH} MPH`,
        totalBalancePoints: session.totalBalancePoints,
        pointsGained: pointsGained,
        message: statusMessage
    });
});

// 3. BRAKE BUTTON ENDPOINT
app.post('/api/bike/brake', (req, res) => {
    const { userId } = req.body;
    const session = sessions[userId];
    if (!session) return res.status(404).json({ error: "Player session not found" });

    if (session.bikeAngle > 0) {
        session.bikeAngle = Math.max(0, session.bikeAngle - 25);
    }

    res.json({
        success: true,
        bikeAngle: session.bikeAngle,
        currentSpeed: `${session.maxSpeedMPH} MPH`,
        message: session.bikeAngle === 0 ? "Bike is flat on the beach." : "Braking! Front wheel coming down."
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Super73X Beach Engine running live on port ${PORT}`);
});
