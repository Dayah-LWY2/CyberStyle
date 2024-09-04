const express = require('express');
const app = express();

app.set('view engine', 'ejs');
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

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});