const express = require('express');
const app = express();
app.use(express.json());

// In-memory database to store player bike states
const sessions = {};

// Helper function to initialize a player's session
function getOrCreateSession(userId) {
    if (!sessions[userId]) {
        sessions[userId] = {
            // Cosmetics / Details requested
            shirtColor: "White",
            shortsColor: "Black",
            bikeModel: "Super73X",
            maxSpeedMPH: 37,
            
            // Mechanics & Physics States
            isWheelieing: false,
            bikeAngle: 0,         // 0 degrees = flat on the ground. 90 degrees = vertical.
            totalBalancePoints: 0, // Your incremental currency
            multiplier: 1
        };
    }
    return sessions[userId];
}

// 1. GET PLAYER DATA (For loading character clothing and bike model in Roblox)
app.post('/api/bike/data', (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const session = getOrCreateSession(userId);
    res.json(session);
});

// 2. WHEELIE BUTTON ENDPOINT (Increases front-wheel angle and processes speed)
app.post('/api/bike/wheelie', (req, res) => {
    const { userId } = req.body;
    const session = sessions[userId];
    if (!session) return res.status(404).json({ error: "Player session not found" });

    session.isWheelieing = true;
    
    // Pulling up increases the bike's angle toward a wheelie
    // Every click or hold tick adds to the angle
    session.bikeAngle += 15; 

    let statusMessage = "Holding the wheelie perfectly!";
    let pointsGained = 0;

    // PHYSICS CHECK: If the angle goes past 85 degrees, they flip backward!
    if (session.bikeAngle >= 85) {
        statusMessage = "CRASH! You leaned too far back and looped out!";
        session.bikeAngle = 0; // Reset bike position
        session.isWheelieing = false;
    } else if (session.bikeAngle >= 30 && session.bikeAngle < 85) {
        // They are in the "Sweet Spot" zone, award incremental currency!
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

// 3. BRAKE BUTTON ENDPOINT (Brings the front wheel back down safely)
app.post('/api/bike/brake', (req, res) => {
    const { userId } = req.body;
    const session = sessions[userId];
    if (!session) return res.status(404).json({ error: "Player session not found" });

    // Hitting the brake drops the angle quickly to prevent looping out
    if (session.bikeAngle > 0) {
        session.bikeAngle = Math.max(0, session.bikeAngle - 25); // Drops angle safely, stops at 0
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
