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
            bikeAngle: 0,          // 0 degrees = flat. 90 degrees = vertical.
            totalBalancePoints: 0, // Your incremental currency
            multiplier: 1,

            // === NEW: Environment Coordinates (Infinite Beach Road) ===
            distanceTraveledFeet: 0, 
            positionX: 0,          // 0 is dead center of the paved road. 
            currentTerrain: "Paved Coastal Road" 
        };
    }
    return sessions[userId];
}

// === Homepage Route (Displays the updated game status) ===
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px; background-color: #f0fdf4; padding: 40px; border-radius: 10px; max-width: 600px; margin-left: auto; margin-right: auto; border: 2px solid #bbf7d0;">
            <h1 style="color: #166534;">🌊 Super73X Beach Highway Engine 🛣️</h1>
            <p style="font-size: 18px; color: #1e293b; font-weight: bold;">Backend is online and tracking physics!</p>
            <p style="color: #475569; sinze: 15px;">Character Status: White Shirt, Black Shorts riding a Super73X at 37 MPH down an endless coastal road surrounded by beach sand.</p>
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
    session.bikeAngle += 15; // Pulling up increases the angle

    // Move the player forward along the infinite road based on their 37 MPH speed
    // 37 MPH is roughly 54 feet per second
    session.distanceTraveledFeet += 54; 

    let statusMessage = `Cruising down the ${session.currentTerrain}!`;
    let pointsGained = 0;

    // PHYSICS CHECK: Did they flip backwards?
    if (session.bikeAngle >= 85) {
        statusMessage = "CRASH! You leaned too far back and looped out onto the road!";
        session.bikeAngle = 0; 
        session.isWheelieing = false;
    } else if (session.bikeAngle >= 30 && session.bikeAngle < 85) {
        // Sweet spot rewards
        pointsGained = Math.floor(session.bikeAngle * session.multiplier);
        session.totalBalancePoints += pointsGained;
        statusMessage = `Holding a perfect wheelie on the ${session.currentTerrain}!`;
    }

    res.json({
        success: true,
        bikeAngle: session.bikeAngle,
        currentSpeed: `${session.maxSpeedMPH} MPH`,
        distanceTraveled: `${session.distanceTraveledFeet} feet`,
        location: session.currentTerrain,
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

    // Safely drop the wheelie angle
    if (session.bikeAngle > 0) {
        session.bikeAngle = Math.max(0, session.bikeAngle - 25);
    }

    res.json({
        success: true,
        bikeAngle: session.bikeAngle,
        currentSpeed: `${session.maxSpeedMPH} MPH`,
        distanceTraveled: `${session.distanceTraveledFeet} feet`,
        message: session.bikeAngle === 0 ? `Super73X tires are glued flat to the ${session.currentTerrain}.` : "Braking hard! Bringing the front wheel down."
    });
});

// 4. STEER / DRIFT ENDPOINT (Allows steering between the road and the sandy beach)
app.post('/api/bike/steer', (req, res) => {
    const { userId, direction } = req.body; // direction can be "left" or "right"
    const session = sessions[userId];
    if (!session) return res.status(404).json({ error: "Player session not found" });

    if (direction === "left") session.positionX -= 10;
    if (direction === "right") session.positionX += 10;

    // Environment Rules:
    // If they steer too far off the center line (0), they go off the road and hit the sand
    if (Math.abs(session.positionX) > 20) {
        session.currentTerrain = "Sandy Beach (Heavy Drift)";
        session.multiplier = 2; // High risk sand gives double points!
    } else {
        session.currentTerrain = "Paved Coastal Road";
        session.multiplier = 1;
    }

    res.json({
        success: true,
        currentPositionX: session.positionX,
        currentTerrain: session.currentTerrain,
        message: `You steered ${direction}. You are now on the ${session.currentTerrain}.`
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Super73X Infinite Beach Highway running live on port ${PORT}`);
});
