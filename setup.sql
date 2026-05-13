-- ============================================================
--  Honey's Cinema — Full Database Schema
--  Run once: mysql -u root -p < setup.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS honeys_cinema
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE honeys_cinema;

-- ─── 1. USERS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id         INT          AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(120) NOT NULL,
    email      VARCHAR(180) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── 2. MOVIES ───────────────────────────────────────────────
-- Stores every film (current + coming soon).
-- movie_key matches the JS id field (e.g. 'barsama', 'safari').
CREATE TABLE IF NOT EXISTS movies (
    id          INT          AUTO_INCREMENT PRIMARY KEY,
    movie_key   VARCHAR(50)  NOT NULL UNIQUE,   -- matches JS id
    title       VARCHAR(200) NOT NULL,
    genre       VARCHAR(100),
    release_year SMALLINT,
    runtime     VARCHAR(20),
    pg_rating   VARCHAR(10),
    score       DECIMAL(3,1),
    director    VARCHAR(150),
    cast_list   TEXT,
    description TEXT,
    price       INT          NOT NULL DEFAULT 120,
    status      ENUM('now_showing','coming_soon') NOT NULL DEFAULT 'now_showing',
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── 3. SHOWTIMES ────────────────────────────────────────────
-- Each row = one screening slot (movie + date + time + hall).
CREATE TABLE IF NOT EXISTS showtimes (
    id         INT         AUTO_INCREMENT PRIMARY KEY,
    movie_id   INT         NOT NULL,
    show_date  DATE        NOT NULL,
    show_time  TIME        NOT NULL,
    hall       VARCHAR(30) NOT NULL DEFAULT 'Hall 1',
    total_seats SMALLINT   NOT NULL DEFAULT 96,   -- 8 rows × 12 seats
    UNIQUE KEY unique_slot (movie_id, show_date, show_time, hall),
    CONSTRAINT fk_showtime_movie
        FOREIGN KEY (movie_id) REFERENCES movies(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── 4. BOOKINGS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
    id          INT          AUTO_INCREMENT PRIMARY KEY,
    booking_ref VARCHAR(20)  NOT NULL UNIQUE,     -- e.g. #HC-8842
    user_id     INT          NOT NULL,
    showtime_id INT          NOT NULL,
    seats       VARCHAR(255) NOT NULL,            -- comma-separated e.g. "A1, A2"
    total_price INT          NOT NULL,
    status      ENUM('confirmed','cancelled') NOT NULL DEFAULT 'confirmed',
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_booking_showtime
        FOREIGN KEY (showtime_id) REFERENCES showtimes(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── 5. TAKEN SEATS ──────────────────────────────────────────
-- One row per individual seat that is reserved.
CREATE TABLE IF NOT EXISTS taken_seats (
    id          INT         AUTO_INCREMENT PRIMARY KEY,
    showtime_id INT         NOT NULL,
    booking_id  INT         NOT NULL,
    seat        VARCHAR(10) NOT NULL,
    UNIQUE KEY unique_seat (showtime_id, seat),
    CONSTRAINT fk_seat_showtime
        FOREIGN KEY (showtime_id) REFERENCES showtimes(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_seat_booking
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── SEED: movies ────────────────────────────────────────────
INSERT IGNORE INTO movies (movie_key, title, genre, release_year, runtime, pg_rating, score, director, cast_list, description, price, status) VALUES
('barsama', 'برشامة',        'كوميدي',              2026, '1h 50m', '+12', 7.8, 'خالد دياب',         'هشام ماجد، باسم سمرة، ريهام عبد الغفور', 'أحداث كوميدية داخل لجنة امتحان ثانوية عامة، حين تتحول أجواء الانضباط إلى فوضى عارمة بسبب الغش الجماعي.',  120, 'now_showing'),
('safari',  'سفاح التجمع',  'تشويق · جريمة',       2026, '1h 25m', '+18', 5.2, 'محمد صلاح العزب', 'أحمد الفيشاوي، صابرين، سينتيا خليفة',       'جريمة غامضة تهز الرأي العام بعد اكتشاف سلسلة من الضحايا المرتبطين بشخص واحد في منطقة التجمع.',          130, 'now_showing'),
('egybest', 'إيجي بست',     'دراما',                2026, '1h 55m', '+12', 7.6, 'مروان عبد المنعم', 'أحمد مالك، سلمى أبو ضيف، مروان بابلو',     'قصة مستوحاة من وقائع حقيقية حول تأسيس موقع إيجي بست — المنصة التي هزت حقوق الملكية في العالم العربي.',  120, 'now_showing'),
('family',  'فاميلي بيزنس', 'كوميدي',               2026, '1h 45m', '+12', 5.8, 'وائل إحسان',        'محمد سعد، غادة عادل، هايدي كرم',           'عائلة فقيرة تتسلل للعمل سراً في منزل عائلة ثرية دون أن يعلم أحد بصلة القرابة بينهم، في كوميديا اجتماعية.', 110, 'now_showing'),
('kolonia', 'كولونيا',       'دراما',                2026, '1h 50m', '+16', 8.1, 'محمد صيام',          'أحمد مالك، كامل الباشا، مايان السيد',       'ليلة واحدة تجمع أباً وابنه بعد سنوات من الصمت، تكشف أسراراً مطمورة في رحلة نفسية مكثفة عن التسامح.',   120, 'now_showing'),
('asd',     'أسد',           'تاريخي · دراما',       2026, NULL,     NULL,  NULL, NULL, NULL, NULL, 130, 'coming_soon'),
('jawaza',  'جوازة ولا جنازة','كوميدي · رومانسي',   2026, NULL,     NULL,  NULL, NULL, NULL, NULL, 120, 'coming_soon'),
('sada',    'السادة الأفاضل','كوميدي اجتماعي',      2026, NULL,     NULL,  NULL, NULL, NULL, NULL, 120, 'coming_soon'),
('safari2', '7 Dogs',        'أكشن · جريمة',         2026, NULL,     NULL,  NULL, NULL, NULL, NULL, 140, 'coming_soon');
