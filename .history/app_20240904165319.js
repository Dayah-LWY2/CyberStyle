const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');

app.set('view engine', 'ejs');
app.use(expressLayouts); // Add this line
app.use(express.static('public'));

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

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Perform login logic here
    if (username === 'admin' && password === 'password') {
        res.send('Login successful');
    } else {
        res.send('Login failed');
    }
});

app.get('/cart', (req, res) => {
    res.render('cart', { title: 'Cart' });
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});