var MOVIES = [
  {id:'barsama', title:'برشامة',        genre:'كوميدي',        year:2026, runtime:'1h 50m', pg:'+12', score:7.8, director:'خالد دياب',         cast:'هشام ماجد، باسم سمرة، ريهام عبد الغفور', desc:'أحداث كوميدية داخل لجنة امتحان ثانوية عامة، حين تتحول أجواء الانضباط إلى فوضى عارمة بسبب الغش الجماعي.',  price:120},
  {id:'safari',  title:'سفاح التجمع',  genre:'تشويق · جريمة', year:2026, runtime:'1h 25m', pg:'+18', score:5.2, director:'محمد صلاح العزب', cast:'أحمد الفيشاوي، صابرين، سينتيا خليفة',       desc:'جريمة غامضة تهز الرأي العام بعد اكتشاف سلسلة من الضحايا المرتبطين بشخص واحد في منطقة التجمع.',          price:130},
  {id:'egybest', title:'إيجي بست',     genre:'دراما',          year:2026, runtime:'1h 55m', pg:'+12', score:7.6, director:'مروان عبد المنعم', cast:'أحمد مالك، سلمى أبو ضيف، مروان بابلو',     desc:'قصة مستوحاة من وقائع حقيقية حول تأسيس موقع إيجي بست — المنصة التي هزت حقوق الملكية في العالم العربي.',  price:120},
  {id:'family',  title:'فاميلي بيزنس', genre:'كوميدي',         year:2026, runtime:'1h 45m', pg:'+12', score:5.8, director:'وائل إحسان',        cast:'محمد سعد، غادة عادل، هايدي كرم',           desc:'عائلة فقيرة تتسلل للعمل سراً في منزل عائلة ثرية دون أن يعلم أحد بصلة القرابة بينهم، في كوميديا اجتماعية.', price:110},
  {id:'kolonia', title:'كولونيا',       genre:'دراما',          year:2026, runtime:'1h 50m', pg:'+16', score:8.1, director:'محمد صيام',          cast:'أحمد مالك، كامل الباشا، مايان السيد',       desc:'ليلة واحدة تجمع أباً وابنه بعد سنوات من الصمت، تكشف أسراراً مطمورة في رحلة نفسية مكثفة عن التسامح.',   price:120},
];
var COMING = [
  {id:'asd',     title:'أسد',              genre:'تاريخي · دراما',  year:2026, price:130},
  {id:'jawaza',  title:'جوازة ولا جنازة', genre:'كوميدي · رومانسي', year:2026, price:120},
  {id:'sada',    title:'السادة الأفاضل',  genre:'كوميدي اجتماعي',  year:2026, price:120},
  {id:'safari2', title:'7 Dogs',           genre:'أكشن · جريمة',    year:2026, price:140},
];
var TIMES = ['10:00','12:30','14:00','17:30','20:00','22:30'];
var ROWS  = ['A','B','C','D','E','F','G','H'];

var isLoggedIn = false, currentUser = '', currentMovie = null;
var selectedDate = null, selectedTime = TIMES[0], selectedSeats = [];

// ─── API helper ──────────────────────────────────────────────────────────────
function api(params, cb) {
  var form = new FormData();
  Object.keys(params).forEach(function(k) { form.append(k, params[k]); });
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'api.php');
  xhr.onload = function() {
    try { cb(JSON.parse(xhr.responseText)); }
    catch(e) { cb({ok: false, msg: 'Server error.'}); }
  };
  xhr.onerror = function() { cb({ok: false, msg: 'Network error.'}); };
  xhr.send(form);
}

function apiGet(params, cb) {
  var qs = Object.keys(params).map(function(k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
  }).join('&');
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'api.php?' + qs);
  xhr.onload = function() {
    try { cb(JSON.parse(xhr.responseText)); }
    catch(e) { cb({ok: false, msg: 'Server error.'}); }
  };
  xhr.onerror = function() { cb({ok: false, msg: 'Network error.'}); };
  xhr.send();
}

// ─── Page navigation ─────────────────────────────────────────────────────────
function go(page) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.getElementById('page-' + page).classList.add('active');
  window.scrollTo(0, 0);
  if (page === 'home') renderHome();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
function login() {
  var email = document.getElementById('login-email').value.trim();
  var pass  = document.getElementById('login-pass').value.trim();
  var err   = document.getElementById('login-err');
  if (!email || !pass) { showErr(err, 'Enter email and password.'); return; }
  err.style.display = 'none';

  api({action:'login', email:email, password:pass}, function(res) {
    if (!res.ok) { showErr(err, res.msg); return; }
    isLoggedIn = true; currentUser = res.name;
    updateNavbar(); showToast('Welcome, ' + currentUser + '!'); go('home');
  });
}

function signup() {
  var fn  = document.getElementById('signup-fn').value.trim();
  var ln  = document.getElementById('signup-ln').value.trim();
  var em  = document.getElementById('signup-email').value.trim();
  var pw  = document.getElementById('signup-pass').value.trim();
  var cp  = document.getElementById('signup-confirm').value.trim();
  var err = document.getElementById('signup-err');
  if (!fn || !ln || !em || !pw || !cp) { showErr(err, 'Fill in all fields.');                return; }
  if (pw.length < 8)                   { showErr(err, 'Password must be at least 8 chars.'); return; }
  if (pw !== cp)                        { showErr(err, 'Passwords do not match.');            return; }
  err.style.display = 'none';

  api({action:'signup', name:fn+' '+ln, email:em, password:pw}, function(res) {
    if (!res.ok) { showErr(err, res.msg); return; }
    isLoggedIn = true; currentUser = res.name.split(' ')[0];
    updateNavbar(); showToast('Welcome, ' + currentUser + '!'); go('home');
  });
}

function logout() {
  api({action:'logout'}, function() {
    isLoggedIn = false; currentUser = '';
    updateNavbar(); go('login');
  });
}

function updateNavbar() {
  document.getElementById('signin-btn').style.display = isLoggedIn ? 'none'   : 'block';
  document.getElementById('user-label').style.display = isLoggedIn ? 'inline' : 'none';
  document.getElementById('user-label').textContent   = currentUser + ' · Sign Out';
}

// ─── Home ─────────────────────────────────────────────────────────────────────
function renderHome() {
  renderGrid('current-movies', MOVIES, false);
  renderGrid('coming-movies',  COMING, true);
}

function renderGrid(id, list, isComingSoon) {
  var html = '';
  for (var i = 0; i < list.length; i++) {
    var m = list[i];
    var bottom = isComingSoon
      ? '<div style="font-size:11px;color:gold;margin-top:5px">Coming Soon</div>'
      : '<button class="btn" style="margin-top:7px;padding:5px 12px;font-size:12px" onclick="event.stopPropagation();openMovie(\'' + m.id + '\')">Book</button>';
    html += '<div class="movie-card" onclick="openMovie(\'' + m.id + '\')">'
          + '<div class="card-title">' + m.title + '</div>'
          + '<div class="card-sub">' + (m.score ? '<span>★' + m.score + '</span> ' : '') + m.genre.split('·')[0].trim() + ' · ' + m.year + '</div>'
          + bottom + '</div>';
  }
  document.getElementById(id).innerHTML = html;
}

function search(val) {
  var err = document.getElementById('search-err');
  if (!val) { err.style.display = 'none'; renderGrid('current-movies', MOVIES, false); return; }
  if (val.length < 3) { showErr(err, 'Enter at least 3 characters.'); return; }
  err.style.display = 'none';
  var results = MOVIES.filter(function(m) { return m.title.toLowerCase().indexOf(val.toLowerCase()) !== -1; });
  if (!results.length) { showErr(err, 'No results for "' + val + '".'); }
  renderGrid('current-movies', results, false);
}

// ─── Movie detail ─────────────────────────────────────────────────────────────
function openMovie(id) {
  var all = MOVIES.concat(COMING);
  currentMovie = null;
  for (var i = 0; i < all.length; i++) { if (all[i].id === id) { currentMovie = all[i]; break; } }
  if (!currentMovie) return;

  selectedDate = null; selectedTime = TIMES[0]; selectedSeats = [];

  document.getElementById('detail-title').textContent    = currentMovie.title;
  document.getElementById('detail-year').textContent     = currentMovie.year     || '—';
  document.getElementById('detail-runtime').textContent  = currentMovie.runtime  || '—';
  document.getElementById('detail-pg').textContent       = currentMovie.pg       || '—';
  document.getElementById('detail-score').textContent    = currentMovie.score    || '—';
  document.getElementById('detail-director').textContent = currentMovie.director || '—';
  document.getElementById('detail-cast').textContent     = currentMovie.cast     || '—';
  document.getElementById('detail-desc').textContent     = currentMovie.desc     || '—';
  document.getElementById('detail-price').textContent    = 'EGP ' + (currentMovie.price || 120) + ' / ticket';

  var genresEl = document.getElementById('detail-genres');
  genresEl.innerHTML = '';
  currentMovie.genre.split('·').forEach(function(g) {
    var span = document.createElement('span');
    span.className = 'genre-tag'; span.textContent = g.trim(); genresEl.appendChild(span);
  });

  buildPills('date-pills', 7, function(pill, i) {
    var DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var MONS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var d = new Date(); d.setDate(d.getDate() + i);
    var lbl = DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONS[d.getMonth()];
    pill.innerHTML = '<div class="day-name">' + DAYS[d.getDay()] + '</div>'
                   + '<div class="day-num">' + d.getDate() + '</div>'
                   + '<div class="day-mon">' + MONS[d.getMonth()] + '</div>';
    if (i === 0) selectedDate = lbl;
    return function() { selectedDate = lbl; };
  });

  buildPills('time-pills', TIMES.length, function(pill, i) {
    pill.textContent = TIMES[i];
    return function() { selectedTime = TIMES[i]; };
  });

  go('detail');
}

function buildPills(containerId, count, setup) {
  var container = document.getElementById(containerId);
  container.innerHTML = '';
  for (var i = 0; i < count; i++) {
    var pill = document.createElement('div');
    pill.className = 'pill' + (i === 0 ? ' selected' : '');
    var fn = setup(pill, i);
    (function(btn, cb) {
      btn.onclick = function() {
        container.querySelectorAll('.pill').forEach(function(p) { p.classList.remove('selected'); });
        btn.classList.add('selected'); cb();
      };
    })(pill, fn);
    container.appendChild(pill);
  }
}

// ─── Seats ────────────────────────────────────────────────────────────────────
function goSeats() {
  if (!selectedDate || !selectedTime) { showToast('Pick a date and time.'); return; }
  var dt = selectedDate + ' · ' + selectedTime;
  document.getElementById('seats-title').textContent  = currentMovie.title;
  document.getElementById('seats-info').textContent   = dt + ' · Hall 1';
  document.getElementById('sum-movie').textContent    = currentMovie.title;
  document.getElementById('sum-datetime').textContent = dt;
  selectedSeats = [];
  // Fetch real taken seats from server
  apiGet({action:'get_seats', movie_id:currentMovie.id, date:selectedDate, time:selectedTime}, function(res) {
    var takenFromServer = (res.ok && res.seats) ? res.seats : [];
    buildSeatGrid(takenFromServer);
    updateSummary();
    go('seats');
  });
}

function buildSeatGrid(takenSeats) {
  var taken = new Set(takenSeats);
  var grid  = document.getElementById('seat-grid');
  grid.innerHTML = '';
  for (var r = 0; r < ROWS.length; r++) {
    var lbl = document.createElement('div');
    lbl.className = 'row-label'; lbl.textContent = ROWS[r]; grid.appendChild(lbl);
    for (var c = 1; c <= 12; c++) {
      var sid  = ROWS[r] + c;
      var seat = document.createElement('div');
      seat.className = 'seat ' + (taken.has(sid) ? 'taken' : 'available');
      if (!taken.has(sid)) { (function(el, id) { el.onclick = function() { toggleSeat(el, id); }; })(seat, sid); }
      grid.appendChild(seat);
    }
  }
}

function toggleSeat(el, seatId) {
  if (el.classList.contains('picked')) {
    el.classList.replace('picked', 'available');
    selectedSeats = selectedSeats.filter(function(s) { return s !== seatId; });
  } else {
    el.classList.replace('available', 'picked');
    selectedSeats.push(seatId);
  }
  updateSummary();
}

function updateSummary() {
  var n = selectedSeats.length, p = currentMovie.price || 120;
  document.getElementById('sum-seats').textContent      = n ? selectedSeats.join(', ') : 'None selected';
  document.getElementById('sum-price-unit').textContent = 'EGP ' + p + ' × ' + n;
  document.getElementById('sum-total').textContent      = 'EGP ' + (n * p);
}

// ─── Checkout ─────────────────────────────────────────────────────────────────
function goCheckout() {
  if (!selectedSeats.length) { showToast('Select at least one seat.'); return; }
  if (!isLoggedIn) { showToast('Sign in to continue.'); go('login'); return; }
  var n = selectedSeats.length, p = currentMovie.price || 120;
  document.getElementById('order-title').textContent   = currentMovie.title;
  document.getElementById('order-details').innerHTML   = selectedDate + '<br>' + selectedTime + '<br>Seats: ' + selectedSeats.join(', ');
  document.getElementById('order-tickets').textContent = n + ' × EGP ' + p;
  document.getElementById('order-total').textContent   = 'EGP ' + (n * p + 15);
  document.getElementById('co-name').value             = currentUser;
  go('checkout');
}

function formatCard(input) {
  var v = input.value.replace(/\D/g, '').slice(0, 16);
  input.value = v.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(input) {
  var v = input.value.replace(/\D/g, '').slice(0, 4);
  input.value = v.length >= 2 ? v.slice(0, 2) + ' / ' + v.slice(2) : v;
}

function pay() {
  var name   = document.getElementById('co-name').value.trim();
  var card   = document.getElementById('co-card').value.replace(/\s/g, '');
  var expiry = document.getElementById('co-expiry').value;
  var cvv    = document.getElementById('co-cvv').value;
  var err    = document.getElementById('pay-err');
  if (!name || card.length < 16 || expiry.length < 7 || cvv.length < 3) { err.style.display = 'block'; return; }
  err.style.display = 'none';

  var btn = event.target; btn.textContent = 'Processing…'; btn.disabled = true;
  var total = selectedSeats.length * (currentMovie.price || 120) + 15;

  api({
    action:   'book',
    movie_id: currentMovie.id,
    movie:    currentMovie.title,
    date:     selectedDate,
    time:     selectedTime,
    seats:    selectedSeats.join(','),
    total:    total
  }, function(res) {
    btn.textContent = 'Confirm & Pay'; btn.disabled = false;
    if (!res.ok) { showErr(err, res.msg || 'Booking failed.'); return; }

    document.getElementById('ticket-id').textContent    = 'Booking ' + res.booking_id;
    document.getElementById('ticket-movie').textContent = currentMovie.title;
    document.getElementById('ticket-date').textContent  = selectedDate;
    document.getElementById('ticket-time').textContent  = selectedTime;
    document.getElementById('ticket-seats').textContent = selectedSeats.join(', ');
    document.getElementById('ticket-name').textContent  = name;
    document.getElementById('ticket-total').textContent = 'EGP ' + total;
    go('ticket');
  });
}

// ─── Booking history ──────────────────────────────────────────────────────────
function goHistory() {
  if (!isLoggedIn) { showToast('Sign in to view your bookings.'); go('login'); return; }
  apiGet({action:'get_bookings'}, function(res) {
    renderHistory(res.ok ? res.bookings : []);
    go('history');
  });
}

function renderHistory(list) {
  var empty = document.getElementById('history-empty');
  var table = document.getElementById('history-table');
  if (!list || !list.length) { empty.style.display = 'block'; table.style.display = 'none'; return; }
  empty.style.display = 'none'; table.style.display = 'table';
  document.getElementById('history-tbody').innerHTML = list.map(function(b) {
    return '<tr><td style="color:gold">' + b.id + '</td><td>' + b.movie + '</td><td>' + b.date + '</td><td>' + b.time + '</td><td>' + b.seats + '</td><td>EGP ' + b.total + '</td><td><span class="badge-green">Confirmed</span></td></tr>';
  }).join('');
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function showErr(el, msg) { el.textContent = msg; el.style.display = 'block'; }

function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg; t.style.display = 'block';
  setTimeout(function() { t.style.display = 'none'; }, 2800);
}

// ─── Init: restore session on page load ───────────────────────────────────────
apiGet({action:'session'}, function(res) {
  if (res.ok) {
    isLoggedIn = true; currentUser = res.name.split(' ')[0];
    updateNavbar(); go('home');
  } else {
    renderHome();
  }
});
