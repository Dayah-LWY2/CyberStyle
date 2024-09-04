const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/about', (req, res) => {
    res.render('about');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/products/women', (req, res) => {
    res.render('women');
});

app.get('/products/men', (req, res) => {
    res.render('men');
});

app.get('/products/kids', (req, res) => {
    res.render('kids');
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});