const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');


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
    res.render('women', { title: 'Women', products});
});

app.get('/men', (req, res) => {
    res.render('men', { title: 'Men', products });
});

app.get('/kids', (req, res) => {
    res.render('kids', { title: 'Kids', products });
});

app.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
});

app.get('/signup', (req, res) => {
    res.render('signup', { title: 'Sign Up' });
});

// Load product data from products.json
let products;
try {
    const data = fs.readFileSync(path.join(__dirname, 'public', 'products.json'), 'utf-8');
    products = JSON.parse(data);
} catch (err) {
    console.error('Error reading products.json:', err);
    products = []; // Fallback to an empty array if there's an error
}

app.get('/products', (req, res) => {
    res.render('products', { title: 'All Products', products });
});

app.post('/signup', (req, res) => {
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).send('Passwords do not match.');
    }

    // Placeholder for database logic
    console.log(`New user registered: ${username}, ${email}`);

    // Redirect to a success page or login
    res.redirect('/login');
});

app.get('/product/:code', (req, res) => {
    const product = products.find(p => p.code === req.params.code);
    if (product) {
            res.render('product', { title: product.name, product });
    } else {
        res.status(404).send('Product not found');
    }
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});