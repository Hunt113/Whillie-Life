   const express = require('express');
   const app = express();
   app.use(express.json());

   const players = {};

   app.post('/api/player/data', (req, res) => {
       const { userId } = req.body;
       if (!userId) return res.status(400).json({ error: "Missing userId" });
       if (!players[userId]) {
           players[userId] = { balancePower: 1, totalBalance: 0, currentBike: "Rusty Bicycle", multiplier: 1 };
       }
       res.json(players[userId]);
   });

   app.post('/api/player/train', (req, res) => {
       const { userId } = req.body;
       const player = players[userId];
       if (!player) return res.status(404).json({ error: "Player not found" });
       const gained = player.balancePower * player.multiplier;
       player.totalBalance += gained;
       res.json({ success: true, totalBalance: player.totalBalance, gained: gained });
   });

   const PORT = process.env.PORT || 3000;
   app.listen(PORT, () => { console.log(`Engine running on port ${PORT}`); });
