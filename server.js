const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.static('public'));

let matches = [];
let previousScores = {};

function getLiveMatches() {
  const hour = new Date().getHours();
  const all = [];

  if (hour >= 19 && hour <= 23) {
    all.push(
      { id: '1', home: 'Galatasaray', away: 'Fenerbahçe', homeScore: Math.floor(Math.random()*4), awayScore: Math.floor(Math.random()*3), status: 'live', minute: Math.floor(Math.random()*90)+1, league: 'Süper Lig', flag: '🇹🇷' },
      { id: '2', home: 'Beşiktaş', away: 'Trabzonspor', homeScore: Math.floor(Math.random()*3), awayScore: Math.floor(Math.random()*3), status: 'live', minute: Math.floor(Math.random()*90)+1, league: 'Süper Lig', flag: '🇹🇷' }
    );
  }

  all.push(
    { id: '3', home: 'Real Madrid', away: 'Barcelona', homeScore: 1, awayScore: 2, status: 'finished', minute: 90, league: 'La Liga', flag: '🇪🇸' },
    { id: '4', home: 'Man City', away: 'Arsenal', homeScore: null, awayScore: null, status: 'upcoming', minute: null, league: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', time: '22:00' },
    { id: '5', home: 'Inter', away: 'Milan', homeScore: null, awayScore: null, status: 'upcoming', minute: null, league: 'Serie A', flag: '🇮🇹', time: '21:45' }
  );

  return all;
}

function update() {
  const newMatches = getLiveMatches();
  
  newMatches.forEach(m => {
    if (m.status === 'live' && Math.random() > 0.75) {
      if (Math.random() > 0.5) m.homeScore++;
      else m.awayScore++;
      m.minute = Math.min(m.minute + Math.floor(Math.random()*8)+1, 90);
      if (m.minute >= 90) m.status = 'finished';
    }
  });

  newMatches.forEach(m => {
    if (m.status !== 'live') return;
    const old = previousScores[m.id] || 0;
    const now = (m.homeScore||0) + (m.awayScore||0);
    if (now > old && old > 0) {
      io.emit('goalAlert', { match: m, message: `⚽ GOOOL! ${m.home} ${m.homeScore}-${m.awayScore} ${m.away} (${m.minute}')` });
    }
    previousScores[m.id] = now;
  });

  matches = newMatches;
  io.emit('matchesUpdate', matches);
}

io.on('connection', socket => socket.emit('matchesUpdate', matches));

setInterval(update, 15000);
setTimeout(update, 2000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('⚽ Port:', PORT));
