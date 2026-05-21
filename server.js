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
            
            // Physics States based on Wheelie Life mechanics
            bikeAngle: 0,          // 0 = flat on road. 90 = vertical.
            totalDistanceFeet: 0, 
            highScoreFeet: 0,      // Tracks their longest consecutive wheelie
            isCrashed: false,
            currentStatus: "Idling on the beach road"
        };
    }
    return sessions[userId];
}

// Homepage Landing Status
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px; background-color: #fff7ed; padding: 40px; border-radius: 10px; max-width: 600px; margin-left: auto; margin-right: auto; border: 2px solid #ffedd5;">
            <h1 style="color: #c2410c;">🏁 Wheelie Life Backend Engine 🏁</h1>
            <p style="font-size: 18px; color: #1e293b; font-weight: bold;">Physics & Balance Simulator is Live</p>
            <p style="color: #475569;">Super73X E-Bike traveling down an infinite beach road at 37 MPH. Keep your wheel steady!</p>
        </div>
    `);
});

// Fetch player data
app.post('/api/bike/data', (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    res.json(getOrCreateSession(userId));
});

// WHEELIE THROTTLE BUTTON
app.post('/api/bike/wheelie', (req, res) => {
    const { userId } = req.body;
    const session = sessions[userId];
    if (!session) return res.status(404).json({ error: "Player not found" });

    // Reset crash status if they are trying to ride again
    if (session.isCrashed) {
        session.isCrashed = false;
        session.bikeAngle = 0;
        session.totalDistanceFeet = 0;
    }

    // Wheelie Life Physics: Throttling pulls the front wheel UP fast
    session.bikeAngle += 18; 

    // Calculate progress if the front wheel is in the air
    if (session.bikeAngle > 5) {
        // Traveling at 37 MPH adds roughly 54 feet per action tick
        session.totalDistanceFeet += 54;
        
        // Update high score record
        if (session.totalDistanceFeet > session.highScoreFeet) {
            session.highScoreFeet = session.totalDistanceFeet;
        }
    }

    // CRASH CHECK (Looping out)
    // In Wheelie Life, if you cross the balance point threshold (85+ degrees), you flip backwards!
    if (session.bikeAngle >= 85) {
        session.isCrashed = true;
        session.bikeAngle = 0; // Bike falls over
        session.totalDistanceFeet = 0; // Reset current run distance
        session.currentStatus = "CRASHED! You looped out backward onto the road!";
    } else if (session.bikeAngle >= 45 && session.bikeAngle <= 75) {
        session.currentStatus = "SWEET SPOT! Maintaining perfect balance point.";
    } else {
        session.currentStatus = "Wheelie is active. Lean angle increasing!";
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

// REAR BRAKE BUTTON
app.post('/api/bike/brake', (req, res) => {
    const { userId } = req.body;
    const session = sessions[userId];
    if (!session) return res.status(404).json({ error: "Player not found" });

    if (session.isCrashed) {
        return res.json({ message: "You are already crashed. Press Wheelie to restart." });
    }

    // Smoothly drops the front wheel back down to prevent a loop out
    if (session.bikeAngle > 0) {
        session.bikeAngle = Math.max(0, session.bikeAngle - 28);
    }

    // If wheel hits the ground, the current wheelie streak stops gaining distance
    if (session.bikeAngle === 0) {
        session.currentStatus = "Front wheel dropped onto the paved beach road.";
    } else {
        session.currentStatus = "Braking applied! Stabilizing front wheel angle.";
        session.totalDistanceFeet += 54; // Still moving at 37 MPH while riding the wheelie down
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
