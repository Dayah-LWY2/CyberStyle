const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');

// Middleware
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.render('index', { title: 'Home' });
});

app.get('/about', (req, res) => {
    res.render('about', { title: 'About Us' });
});

app.get('/women', (req, res) => {
    res.render('women', { title: 'Women' });
});

app.get('/men', (req, res) => {
    res.render('men', { title: 'Men' });
});

app.get('/kids', (req, res) => {
    res.render('kids', { title: 'Kids' });
});

app.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
});

app.get('/signup', (req, res) => {
    res.render('signup', { title: 'Sign Up' });
});

app.post('/signup', (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    // Simple validation logic
    if (!username || !email || !password || !confirmPassword) {
        return res.status(400).send('All fields are required.');
    }

    if (password !== confirmPassword) {
        return res.status(400).send('Passwords do not match.');
    }

    // Placeholder for database logic
    console.log(`New user registered: ${username}, ${email}`);

    // Redirect to a success page or login
    res.redirect('/login');
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});