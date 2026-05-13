<?php
session_start();
require_once 'db.php';

header('Content-Type: application/json');

function resp(bool $ok, array $data = []): void {
    echo json_encode(array_merge(['ok' => $ok], $data));
    exit;
}

$action = $_POST['action'] ?? $_GET['action'] ?? '';
$db     = get_db();

// ─── SIGN UP ─────────────────────────────────────────────────
if ($action === 'signup') {
    $name  = trim($_POST['name']  ?? '');
    $email = trim($_POST['email'] ?? '');
    $pass  = $_POST['password']   ?? '';

    if (!$name || !$email || !$pass)
        resp(false, ['msg' => 'Fill in all fields.']);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL))
        resp(false, ['msg' => 'Invalid email.']);
    if (strlen($pass) < 8)
        resp(false, ['msg' => 'Password must be at least 8 characters.']);

    $stmt = $db->prepare('SELECT id FROM users WHERE email = :e');
    $stmt->execute([':e' => $email]);
    if ($stmt->fetch()) resp(false, ['msg' => 'Email already registered.']);

    $hash = password_hash($pass, PASSWORD_DEFAULT);
    $stmt = $db->prepare('INSERT INTO users (name, email, password) VALUES (:n, :e, :p)');
    $stmt->execute([':n' => $name, ':e' => $email, ':p' => $hash]);

    $_SESSION['user_id']    = (int)$db->lastInsertId();
    $_SESSION['user_email'] = $email;
    $_SESSION['user_name']  = $name;
    resp(true, ['name' => $name, 'email' => $email]);
}

// ─── LOGIN ────────────────────────────────────────────────────
if ($action === 'login') {
    $email = trim($_POST['email'] ?? '');
    $pass  = $_POST['password']   ?? '';

    if (!$email || !$pass) resp(false, ['msg' => 'Enter email and password.']);

    $stmt = $db->prepare('SELECT * FROM users WHERE email = :e');
    $stmt->execute([':e' => $email]);
    $row = $stmt->fetch();

    if (!$row || !password_verify($pass, $row['password']))
        resp(false, ['msg' => 'Invalid email or password.']);

    $_SESSION['user_id']    = (int)$row['id'];
    $_SESSION['user_email'] = $row['email'];
    $_SESSION['user_name']  = $row['name'];
    resp(true, ['name' => $row['name'], 'email' => $row['email']]);
}

// ─── LOGOUT ───────────────────────────────────────────────────
if ($action === 'logout') {
    session_destroy();
    resp(true);
}

// ─── SESSION CHECK ────────────────────────────────────────────
if ($action === 'session') {
    if (!empty($_SESSION['user_email']))
        resp(true, ['name' => $_SESSION['user_name'], 'email' => $_SESSION['user_email']]);
    resp(false);
}

// ─── GET TAKEN SEATS ─────────────────────────────────────────
// Returns taken seat labels for a given movie + date + time.
if ($action === 'get_seats') {
    $movie_key = $_GET['movie_id'] ?? '';
    $date      = $_GET['date']     ?? '';
    $time      = $_GET['time']     ?? '';

    if (!$movie_key || !$date || !$time) resp(false, ['msg' => 'Missing params.']);

    // Resolve showtime_id (may not exist yet — that's fine, means no seats taken)
    $stmt = $db->prepare('
        SELECT st.id
        FROM showtimes st
        JOIN movies m ON m.id = st.movie_id
        WHERE m.movie_key = :mk
          AND st.show_date = :d
          AND st.show_time = :t
    ');
    $stmt->execute([':mk' => $movie_key, ':d' => $date, ':t' => $time]);
    $showtime = $stmt->fetch();

    if (!$showtime) { resp(true, ['seats' => []]); }

    $stmt = $db->prepare('SELECT seat FROM taken_seats WHERE showtime_id = :sid');
    $stmt->execute([':sid' => $showtime['id']]);
    $seats = $stmt->fetchAll(PDO::FETCH_COLUMN);
    resp(true, ['seats' => $seats]);
}

// ─── BOOK ─────────────────────────────────────────────────────
if ($action === 'book') {
    if (empty($_SESSION['user_id'])) resp(false, ['msg' => 'Not logged in.']);

    $movie_key = $_POST['movie_id'] ?? '';
    $movie     = $_POST['movie']    ?? '';
    $date      = $_POST['date']     ?? '';
    $time      = $_POST['time']     ?? '';
    $seats_raw = $_POST['seats']    ?? '';
    $total     = (int)($_POST['total'] ?? 0);

    if (!$movie_key || !$movie || !$date || !$time || !$seats_raw || !$total)
        resp(false, ['msg' => 'Missing booking data.']);

    $seat_list = array_values(array_filter(array_map('trim', explode(',', $seats_raw))));
    if (empty($seat_list)) resp(false, ['msg' => 'No seats selected.']);

    // ── Get or create the movie row ──
    $stmt = $db->prepare('SELECT id FROM movies WHERE movie_key = :mk');
    $stmt->execute([':mk' => $movie_key]);
    $movie_row = $stmt->fetch();
    if (!$movie_row) {
        // Fallback: insert a minimal movie record if somehow missing
        $stmt = $db->prepare('INSERT IGNORE INTO movies (movie_key, title) VALUES (:mk, :t)');
        $stmt->execute([':mk' => $movie_key, ':t' => $movie]);
        $movie_id = (int)$db->lastInsertId();
    } else {
        $movie_id = (int)$movie_row['id'];
    }

    // ── Get or create the showtime row ──
    $stmt = $db->prepare('
        INSERT IGNORE INTO showtimes (movie_id, show_date, show_time)
        VALUES (:mid, :d, :t)
    ');
    $stmt->execute([':mid' => $movie_id, ':d' => $date, ':t' => $time]);

    $stmt = $db->prepare('
        SELECT id FROM showtimes
        WHERE movie_id = :mid AND show_date = :d AND show_time = :t
    ');
    $stmt->execute([':mid' => $movie_id, ':d' => $date, ':t' => $time]);
    $showtime_id = (int)$stmt->fetchColumn();

    // ── Check no seat is already taken ──
    foreach ($seat_list as $seat) {
        $stmt = $db->prepare('SELECT id FROM taken_seats WHERE showtime_id = :sid AND seat = :s');
        $stmt->execute([':sid' => $showtime_id, ':s' => $seat]);
        if ($stmt->fetch())
            resp(false, ['msg' => 'Seat ' . $seat . ' was just taken. Please pick another.']);
    }

    // ── Insert booking ──
    $booking_ref = '#HC-' . rand(8800, 8999);
    $stmt = $db->prepare('
        INSERT INTO bookings (booking_ref, user_id, showtime_id, seats, total_price)
        VALUES (:ref, :uid, :sid, :seats, :total)
    ');
    $stmt->execute([
        ':ref'   => $booking_ref,
        ':uid'   => $_SESSION['user_id'],
        ':sid'   => $showtime_id,
        ':seats' => implode(', ', $seat_list),
        ':total' => $total,
    ]);
    $booking_id = (int)$db->lastInsertId();

    // ── Mark seats as taken (linked to booking via FK) ──
    $ins = $db->prepare('
        INSERT IGNORE INTO taken_seats (showtime_id, booking_id, seat)
        VALUES (:sid, :bid, :s)
    ');
    foreach ($seat_list as $seat) {
        $ins->execute([':sid' => $showtime_id, ':bid' => $booking_id, ':s' => $seat]);
    }

    resp(true, ['booking_id' => $booking_ref]);
}

// ─── GET BOOKINGS (history) ───────────────────────────────────
if ($action === 'get_bookings') {
    if (empty($_SESSION['user_id'])) resp(false, ['msg' => 'Not logged in.']);

    $stmt = $db->prepare('
        SELECT
            b.booking_ref,
            m.title        AS movie,
            st.show_date   AS date,
            st.show_time   AS time,
            b.seats,
            b.total_price  AS total,
            b.status,
            b.created_at
        FROM bookings b
        JOIN showtimes st ON st.id = b.showtime_id
        JOIN movies    m  ON m.id  = st.movie_id
        WHERE b.user_id = :uid
        ORDER BY b.id DESC
    ');
    $stmt->execute([':uid' => $_SESSION['user_id']]);
    $rows = $stmt->fetchAll();

    $list = array_map(fn($r) => [
        'id'    => $r['booking_ref'],
        'movie' => $r['movie'],
        'date'  => $r['date'],
        'time'  => $r['time'],
        'seats' => $r['seats'],
        'total' => $r['total'],
    ], $rows);

    resp(true, ['bookings' => $list]);
}

resp(false, ['msg' => 'Unknown action.']);
