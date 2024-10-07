const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const bcrypt = require('bcrypt');
const csurf = require('csurf');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const app = express();

// Set up view engine and middleware
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Added to parse JSON requests

// CSRF protection
app.use(csurf());

// Session setup
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Only set secure cookies in production
    }
}));

// Helper functions for file operations
const loadFile = async (filename) => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'public', filename), 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Error loading ${filename}:`, err);
        return [];
    }
};

const writeFile = async (filename, data) => {
    await fs.writeFile(path.join(__dirname, 'public', filename), JSON.stringify(data, null, 2));
};

// Load initial product and page data
let products = [], pages = [];
(async () => {
    products = await loadFile('products.json');
    pages = await loadFile('pages.json');
})();

// Middleware to expose session data to views
app.use((req, res, next) => {
    res.locals = {
        username: req.session.username,
        cart: req.session.cart || [],
        csrfToken: req.csrfToken()
    };
    next();
});

// Middleware to ensure the user is logged in
const ensureLoggedIn = async (req, res, next) => {
    if (!req.session.username) {
        return res.redirect('/login?errorMessage=Please log in');
    }
    const users = await loadFile('users.json');
    if (!users.some(u => u.username === req.session.username)) {
        return res.status(403).send('User not found');
    }
    next();
};

// Routes
app.get('/', (req, res) => res.render('index', { title: 'Home', products }));
app.get('/login', (req, res) => res.render('login', { errorMessage: req.query.errorMessage }));

// Additional routes for informational pages
app.get('/about', (req, res) => res.render('about', { title: 'About Us' }));
app.get('/shipping-&-returns', (req, res) => res.render('shipping-&-returns', { title: 'Shipping & Returns' }));
app.get('/store-policy', (req, res) => res.render('store-policy', { title: 'Store Policy' }));
app.get('/faq', (req, res) => res.render('faq', { title: 'FAQ' }));

// Handle user login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const users = await loadFile('users.json');
    const user = users.find (u => u.username === username)

    if (user && await bcrypt.compare(password, u.password)) {
        req.session.username = user.username;
        res.redirect('/');
    } else {
        res.redirect('/login?errorMessage=Invalid credentials');
    }
});

// Handle user signup
app.post('/signup', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.redirect('/signup?errorMessage=Passwords do not match');
    }

    const users = await loadFile('users.json');
    if (users.some(u => u.username === username)) {
        return res.redirect('/signup?errorMessage=Username exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, email, password: hashedPassword, cart: [] });
    await writeFile('users.json', users);
    res.redirect('/login');
});

// Display the user's cart
app.get('/cart', ensureLoggedIn, async (req, res) => {
    const users = await loadFile('users.json');
    const user = users.find(u => u.username === req.session.username);
    const detailedCart = user.cart.map(item => ({ ...products.find(p => p.code === item.productCode), ...item }));
    res.render('cart', { cart: detailedCart });
});

// Add items to the cart
app.post('/add-to-cart', ensureLoggedIn, async (req, res) => {
    const { productCode, size, quantity } = req.body;
    const users = await loadFile('users.json');
    const user = users.find(u => u.username === req.session.username);
    const itemIndex = user.cart.findIndex(i => i.productCode === productCode && i.size === size);

    if (itemIndex !== -1) {
        user.cart[itemIndex].quantity += parseInt(quantity);
    } else {
        user.cart.push({ productCode, size, quantity: parseInt(quantity) });
    }

    await writeFile('users.json', users);
    res.redirect('/cart');
});

// Remove items from the cart
app.post('/remove-from-cart', ensureLoggedIn, async (req, res) => {
    const { productCode, size } = req.body;
    const users = await loadFile('users.json');
    const user = users.find(u => u.username === req.session.username);
    user.cart = user.cart.filter(i => !(i.productCode === productCode && i.size === size));
    
    await writeFile('users.json', users);
    res.redirect('/cart');
});

// Process payment
app.post('/process-payment', ensureLoggedIn, async (req, res) => {
    const { address, useRewards } = req.body;
    if (!address || address.trim() === '') {
        return res.status(400).send('Address is required');
    }

    const users = await loadFile('users.json');
    const user = users.find(u => u.username === req.session.username);
    let totalSpent = user.cart.reduce((sum, i) => sum + products.find(p => p.code === i.productCode).price * i.quantity, 0);

    // Deduct rewards if used
    if (useRewards === 'true' && user.rewardsPoints) {
        const discount = Math.min(user.rewardsPoints * 0.01, totalSpent);
        totalSpent -= discount;
        user.rewardsPoints -= Math.floor(discount * 100);
    }

    // Clear cart and save changes
    user.cart = [];
    await writeFile('users.json', users);
    res.redirect('/confirmation');
});

// Show confirmation page
app.get('/confirmation', ensureLoggedIn, (req, res) => res.render('confirmation'));

// Route to handle search
app.get('/search', (req, res) => {
    const query = req.query.q ? req.query.q.toLowerCase() : '';
    const filter = req.query.filter || 'none';

    let matchedProducts = products.filter(product => 
        (!query || product.name.toLowerCase().includes(query)) && product.category !== 'new'
    );

    // Apply sorting filter
    const sortOptions = {
        'price-asc': (a, b) => a.price - b.price,
        'price-desc': (a, b) => b.price - a.price,
        'date-popular': (a, b) => b.popularity - a.popularity,
        'date-latest': (a, b) => new Date(b.dateAdded) - new Date(a.dateAdded),
        'date-oldest': (a, b) => new Date(a.dateAdded) - new Date(b.dateAdded)
    };

    if (filter in sortOptions) matchedProducts.sort(sortOptions[filter]);

    const matchedPages = pages.filter(page => page.name.toLowerCase().includes(query));
    res.render('searchResults', { results: [...matchedProducts, ...matchedPages], query, filter });
});

// General error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));