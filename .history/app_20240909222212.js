const express = require('express');
const session = require('express-session');
const app = express();
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config(); // For loading environment variables

// Middleware
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));

// Load product data from products.json
let products = [];
(async () => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'public', 'products.json'), 'utf-8');
        products = JSON.parse(data);
    } catch (err) {
        console.error('Error reading products.json:', err);
    }
})();

// Middleware to initialize cart in session
app.use((req, res, next) => {
    if (!req.session.cart) {
        req.session.cart = [];
    }
    res.locals.cart = req.session.cart;
    next();
});

// Routes
app.get('/', (req, res) => res.render('index', { title: 'Home' }));

app.get('/about', (req, res) => res.render('about', { title: 'About Us' }));

app.get('/women', (req, res) => res.render('women', { title: 'Women', products }));

app.get('/men', (req, res) => res.render('men', { title: 'Men', products }));

app.get('/kids', (req, res) => res.render('kids', { title: 'Kids', products }));

app.get('/login', (req, res) => res.render('login', { title: 'Login' }));

app.get('/signup', (req, res) => res.render('signup', { title: 'Sign Up' }));

app.get('/products', (req, res) => res.render('products', { title: 'All Products', products }));

app.get('/product/:code', (req, res) => {
    const product = products.find(p => p.code === req.params.code);
    if (!product) {
        return res.status(404).send('Product not found');
    }
    res.render('product', { product });
});

app.get('/cart', (req, res) => res.render('cart', { cart: req.session.cart }));

app.post('/add-to-cart', (req, res) => {
    const { productCode, size, quantity } = req.body;
    const product = products.find(p => p.code === productCode);

    if (!product) {
        return res.status(404).send('Product not found');
    }

    const existingProductIndex = req.session.cart.findIndex(
        item => item.product.code === productCode && item.size === size
    );

    if (existingProductIndex !== -1) {
        req.session.cart[existingProductIndex].quantity += parseInt(quantity, 10);
    } else {
        req.session.cart.push({
            product,
            size,
            quantity: parseInt(quantity, 10)
        });
    }

    res.redirect('/cart');
});

app.post('/remove-from-cart', (req, res) => {
    const { productCode, size } = req.body;
    req.session.cart = req.session.cart.filter(
        item => !(item.product.code === productCode && item.size === size)
    );
    res.redirect('/cart');
});

app.post('/signup', (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).send('Passwords do not match.');
    }

    // Placeholder for database logic
    console.log(`New user registered: ${username}, ${email}`);

    res.redirect('/login');
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});