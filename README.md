🎬 Honey's Cinema
A full-stack cinema ticket booking web application built with HTML, CSS, JavaScript, PHP, and MySQL. Users can browse currently showing and upcoming Egyptian films, select dates and showtimes, pick seats on a visual layout, and complete a checkout to receive a digital ticket.

Features

User authentication — register and log in with email and password; passwords are securely hashed with password_hash()
Movie catalogue — browse "Now Showing" and "Coming Soon" films with genre, rating, and score information
Movie search — search films by title (minimum 3 characters required)
Date & showtime selection — choose from the next 7 days and 6 daily time slots
Visual seat picker — 8-row × 12-column hall layout; taken seats are fetched live from the database to prevent double-booking
Checkout & payment form — card number, expiry, and CVV formatting with client-side validation
Digital ticket — a styled booking confirmation with a unique reference number (e.g. #HC-8842) displayed after successful booking
Booking history — authenticated users can view all their past bookings in a table
Session persistence — the app restores the user session on page load via a session API call


Tech Stack
LayerTechnologyFrontendHTML5, CSS3, Vanilla JavaScriptBackendPHP 8+DatabaseMySQL (via PDO)FontGoogle Fonts — Cairo (Arabic/Latin)Local serverXAMPP (Apache + MySQL)

Project Structure
honey's-cinema/
├── cinema.html     # Single-page application shell (all page views)
├── cinema.css      # All styles — dark cinema theme, RTL layout
├── cinema.js       # All client-side logic (navigation, API calls, rendering)
├── api.php         # REST-style API endpoint (actions via POST/GET)
├── db.php          # PDO database connection (singleton)
└── setup.sql       # Database schema + seed data for 9 movies

Database Schema
The database (honeys_cinema) has four tables:

users — registered accounts (name, email, hashed password)
movies — movie catalogue with metadata (key, title, genre, runtime, price, status)
showtimes — scheduled screenings (movie, date, time, hall) — created on first booking
bookings — each confirmed reservation (reference, user, showtime, seats, total price)
taken_seats — individual seat records per showtime, with a unique constraint to prevent double-booking


Getting Started
Prerequisites

XAMPP (or any Apache + PHP + MySQL stack)
A modern web browser (Chrome, Edge, or Safari)

Installation

Clone or download this repository into your XAMPP htdocs folder:

   C:/xampp/htdocs/honeys-cinema/

Start XAMPP — ensure Apache and MySQL are running.
Set up the database — open phpMyAdmin (http://localhost/phpmyadmin) and import setup.sql, or run it directly in the SQL tab. This will:

Create the honeys_cinema database
Create all four tables
Seed 9 movies (5 now showing, 4 coming soon)


Configure the database connection (if needed) — open db.php and update credentials:

php   define('DB_HOST', 'localhost');
   define('DB_NAME', 'honeys_cinema');
   define('DB_USER', 'root');
   define('DB_PASS', '');   // XAMPP default: no password

Open the app in your browser:

   http://localhost/honeys-cinema/cinema.html

API Reference
All requests go to api.php. POST requests use FormData; GET requests use query strings.
ActionMethodDescriptionsignupPOSTRegister a new userloginPOSTAuthenticate a userlogoutPOSTDestroy the sessionsessionGETCheck if a session is activeget_seatsGETFetch taken seats for a showtimebookPOSTReserve seats and create a bookingget_bookingsGETRetrieve booking history for the logged-in user
All responses are JSON with an ok boolean field and additional data or a msg error string.

Seat Numbering
The hall has 8 rows (A–H) × 12 columns (1–12), giving 96 seats per showtime. Seats are identified by row + column, e.g. A1, C7, H12.

Known Limitations & Future Improvements

Payment is simulated — the checkout form validates card format client-side but does not connect to a real payment gateway
No admin panel — movie and showtime management currently requires direct database edits; an admin dashboard is planned per the SRS
No poster images — the movie cards display text only; adding image support would improve the browsing experience
Booking reference collisions — references are generated with rand(8800, 8999), which is a small range; a UUID or sequence-based approach is recommended for production
No HTTPS enforcement — should be enabled in production per the security requirements in the SRS


Team
Developed as a group academic project at AAST (Arab Academy for Science, Technology & Maritime Transport).

License
This project was created for educational purposes. Feel free to use or adapt it for learning.
