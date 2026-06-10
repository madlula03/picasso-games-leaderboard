const STORAGE_KEY = 'leaderboard_players';
const DATE_KEY = 'leaderboard_date';

 function getTodayDate() {
    return new Date().toISOString().split('T')[0]; // '2026-06-10'
  }

function formatDate(dateStr){
    if(!dateStr) return '-';
    const [y,m,d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

function formatDateLong(dateStr){
    if(!dateStr) return '';
    const date = new Date(dateStr  +  'T00:00:00');
    return date.toLocaleDateString('en-ZA',{
        weekday: 'long',day: 'numeric',month: 'long', year: 'numeric'
    });

}

 function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

    let players = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [
    { id: Date.now() + 1, name: 'Alice', score: 9800, date: getTodayDate() },
    { id: Date.now() + 2, name: 'Bob',   score: 7500, date: getTodayDate() },
    { id: Date.now() + 3, name: 'Cindy', score: 6200, date: getTodayDate() },
  ];

   function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
  }

   function checkAndReset() {
    const today         = getTodayDate();
    const lastSavedDate = localStorage.getItem(DATE_KEY);

     if (lastSavedDate !== today) {
      // New day — reset all scores to 0, keep player names
      players = players.map(p => ({ ...p, score: 0, date: today }));
      localStorage.setItem(DATE_KEY, today);
      save();

       const banner = document.getElementById('reset_banner');
      banner.classList.add('show');
      setTimeout(() => banner.classList.remove('show'), 5000);
    }
  }


   function scheduleResetAtMidnight() {
    const now      = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight - now;

    setTimeout(() => {
      checkAndReset();
      render();
      scheduleResetAtMidnight(); // reschedule for next midnight
    }, msUntilMidnight);
  }


    function getRankDisplay(position) {
    if (position === 1) return { html: '🥇', cls: 'gold' };
    if (position === 2) return { html: '🥈', cls: 'silver' };
    if (position === 3) return { html: '🥉', cls: 'bronze' };
    return { html: `#${position}`, cls: 'other' };
  }


    function render() {
    const today = getTodayDate();

    // Update header and today label
    document.getElementById('header-date').textContent =
      'Scores for ' + formatDateLong(today);
    document.getElementById('today_label').textContent = formatDate(today);

    const list   = document.getElementById('player-list');
    const badge  = document.getElementById('count-badge');
    const sorted = [...players].sort((a, b) => b.score - a.score);

    badge.textContent = `${sorted.length} player${sorted.length !== 1 ? 's' : ''}`;

      if (sorted.length === 0) {
      list.innerHTML = `
        <li class="empty-state">
          <div class="empty-icon">🏆</div>
          No players yet. Add one above!
        </li>`;
      return;
    }

    list.innerHTML = sorted.map((player, index) => {
      const pos  = index + 1;
      const rank = getRankDisplay(pos);
      return `
        <li class="player-item ${pos === 1 ? 'first-place' : ''}">
          <span class="rank ${rank.cls}">${rank.html}</span>
          <span class="player-name">${escapeHtml(player.name)}</span>
          <span class="player-score">${player.score.toLocaleString()}</span>
          <span class="player-date">${formatDate(player.date)}</span>
          <button class="btn-delete" onclick="deletePlayer(${player.id})" title="Remove player">✕</button>
        </li>`;
    }).join('');
  }

 function addPlayer() {
    const nameInput  = document.getElementById('input-name');
    const scoreInput = document.getElementById('input-score');

    const name  = nameInput.value.trim();
    const score = parseInt(scoreInput.value, 10);

    if (!name) { showError('Please enter a player name.'); return; }
    if (isNaN(score) || scoreInput.value.trim() === '') { showError('Please enter a valid score.'); return; }
    if (score < 0) { showError('Score cannot be negative.'); return; }

    players.push({ id: Date.now(), name, score, date: getTodayDate() });
    save();
    render();


   nameInput.value  = '';
    scoreInput.value = '';
    document.getElementById('error-msg').textContent = '';
    nameInput.focus();
  }

  function deletePlayer(id) {
    players = players.filter(p => p.id !== id);
    save();
    render();
  }  
  
  function showError(msg) {
    const el = document.getElementById('error-msg');
    el.textContent = msg;
    setTimeout(() => { el.textContent = ''; }, 3000);
  }

  // ── Init ─────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    ['input-name', 'input-score'].forEach(id => {
      document.getElementById(id).addEventListener('keydown', e => {
        if (e.key === 'Enter') addPlayer();
      });
    });

    checkAndReset();           // reset if it's a new day
    render();                  // draw the leaderboard
    scheduleResetAtMidnight(); // auto-reset if left open past midnight
  });

