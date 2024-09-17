const expressLayouts = require('express-ejs-layouts');  
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config(); // For loading environment variables

const app = express();

// Middleware setup
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));

// Load product data from products.json
let products = [];
const loadProducts = async () => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'public', 'products.json'), 'utf-8');
        products = JSON.parse(data);
    } catch (err) {
        console.error('Error reading products.json:', err);
    }
};
loadProducts(); // Initialize products

// Load users data from users.json
const readUsersFromFile = async () => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'public', 'users.json'), 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        if (err.code === 'ENOENT') {
            return []; // Return empty array if file doesn't exist
        } else {
            throw err;
        }
    }
};

// Write users data to users.json
const writeUsersToFile = async (users) => {
    await fs.writeFile(path.join(__dirname, 'public', 'users.json'), JSON.stringify(users, null, 2));
};

// Middleware to initialize cart in session
app.use((req, res, next) => {
    res.locals.username = req.session.username;
    req.session.cart = req.session.cart || [];
    req.session.tempCart = req.session.tempCart || [];
    res.locals.cart = req.session.cart;
    res.locals.tempCart = req.session.tempCart;
    next();
});

// Middleware to ensure user exists in users.json and is logged in
const ensureLoggedInAndExists = async (req, res, next) => {
    if (!req.session.username) {
        return res.redirect('/login?errorMessage=Please log in to continue');
    }

    const users = await readUsersFromFile();
    const userExists = users.some(user => user.username === req.session.username);

    if (!userExists) {
        return res.status(403).send('User not found in the system.');
    }

    next(); // Proceed if user exists
};

// Routes
app.get('/', async (req, res) => {
    if (products.length === 0) await loadProducts();
    res.render('index', { title: 'Home', products });
});

app.get('/about', (req, res) => res.render('about', { title: 'About Us' }));
app.get('/shipping-&-returns', (req, res) => res.render('shipping-&-returns', { title: 'Shipping & Returns' }));
app.get('/store-policy', (req, res) => res.render('store-policy', { title: 'Store Policy' }));
app.get('/faq', (req, res) => res.render('faq', { title: 'FAQ' }));
app.get('/women', (req, res) => res.render('women', { title: 'Women', products }));
app.get('/men', (req, res) => res.render('men', { title: 'Men', products }));
app.get('/kids', (req, res) => res.render('kids', { title: 'Kids', products }));
app.get('/login', (req, res) => res.render('login', { title: 'Login', errorMessage: req.query.errorMessage }));

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.redirect('/error');
        res.redirect('/?loggedOut=true');
    });
});

app.get('/signup', (req, res) => res.render('signup', { title: 'Sign Up', errorMessage: req.query.errorMessage }));
app.get('/products', (req, res) => res.render('products', { title: 'All Products', products }));
app.get('/product/:code', (req, res) => {
    const product = products.find(p => p.code === req.params.code);
    if (!product) return res.status(404).send('Product not found');
    res.render('product', { title: 'Product', product });
});

app.get('/cart', (req, res) => res.render('cart', { title: 'Cart', cart: req.session.cart }));

app.get('/payment', (req, res) => {
    const cart = req.session.tempCart || req.session.cart;
    if (!cart || cart.length === 0) return res.status(404).send('No items found for payment');
    res.render('payment', { title: 'Payment Details', cart });
});

app.get('/checkout', async (req, res) => {
    const username = req.session.username;
    const users = await readUsersFromFile();
    const user = users.find(u => u.username === username);

    // Pre-fill the address if available
    const address = user ? user.address || '' : '';

    const cart = req.session.cart;
    if (!cart || cart.length === 0) return res.status(404).send('No items in cart');
    res.render('checkout', { title: 'Checkout', cart, address });
});

app.get('/confirmation', (req, res) => res.render('confirmation', { title: 'Confirmation' }));

app.post('/add-to-cart', ensureLoggedInAndExists, async (req, res) => {
    const { productCode, size, quantity } = req.body;
    const product = products.find(p => p.code === productCode);
    if (!product) return res.status(404).send('Product not found');

    const users = await readUsersFromFile();
    const username = req.session.username;
    const user = users.find(u => u.username === username);

    if (!user) return res.status(404).send('User not found');

    const existingProductIndex = user.cart.findIndex(item => item.product.code === productCode && item.size === size);
    if (existingProductIndex !== -1) {
        user.cart[existingProductIndex].quantity += parseInt(quantity, 10);
    } else {
        user.cart.push({ product, size, quantity: parseInt(quantity, 10) });
    }

    await writeUsersToFile(users);
    res.redirect('/cart');
});

app.post('/buy-now', ensureLoggedInAndExists, async (req, res) => {
    const { productCode, size, quantity } = req.body;
    const product = products.find(p => p.code === productCode);
    if (!product) return res.status(404).send('Product not found');

    req.session.tempCart = [{ 
        name: product.name, 
        quantity: parseInt(quantity, 10),
        size,
        product: { price: product.price } 
    }];
    
    res.redirect('/payment');
});

app.post('/process-payment', async (req, res) => {
    try {
        const tempCart = req.session.tempCart;
        const { address } = req.body; // Extract address from request body
        
        if (!tempCart || tempCart.length === 0) {
            return res.status(404).send('No items in cart for payment');
        }
        
        if (!address || address.trim() === '') {
            return res.status(400).send('Address is required');
        }

        const username = req.session.username;
        const users = await readUsersFromFile();
        const userIndex = users.findIndex(u => u.username === username);

        if (userIndex === -1) {
            return res.status(404).send('User not found');
        }

        users[userIndex].address = address; // Update address

        if (!users[userIndex].purchased) users[userIndex].purchased = [];
        users[userIndex].purchased.push(...tempCart);
        req.session.tempCart = null; // Clear tempCart

        await writeUsersToFile(users);

        res.redirect('/confirmation');
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/remove-from-cart', ensureLoggedInAndExists, async (req, res) => {
    const { productCode, size } = req.body;
    const username = req.session.username;
    const users = await readUsersFromFile();
    const user = users.find(u => u.username === username);

    if (!user) return res.status(404).send('User not found');

    user.cart = user.cart.filter(item => !(item.product.code === productCode && item.size === size));

    await writeUsersToFile(users);
    res.redirect('/cart');
});

app.post('/signup', async (req, res) => {
    const { username, email, password, confirmPassword, phone, gender, dob } = req.body;
    const users = await readUsersFromFile();

    if (users.some(user => user.username === username)) return res.redirect('/signup?errorMessage=Username already exists.');
    if (users.some(user => user.email === email)) return res.redirect('/signup?errorMessage=Email already exists.');
    if (password !== confirmPassword) return res.redirect('/signup?errorMessage=Passwords do not match.');

    users.push({ username, email, password, phone, gender, dob, cart: [], purchased: [] });
    await writeUsersToFile(users);

    req.session.username = username;
    req.session.cart = [];
    req.session.tempCart = [];
    res.redirect('/');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const users = await readUsersFromFile();
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) return res.redirect('/login?errorMessage=Invalid username or password.');

    req.session.username = username;
    req.session.cart = user.cart || [];
    req.session.tempCart = [];
    res.redirect('/?loggedIn=true');
});

app.post('/checkout', async (req, res) => {
    try {
        const { address } = req.body;

        if (!address || address.trim() === '') {
            return res.status(400).send('Address is required');
        }

        const username = req.session.username;
        const users = await readUsersFromFile();
        const user = users.find(u => u.username === username);

        if (!user) return res.status(404).send('User not found');

        user.address = address;

        if (!user.purchased) user.purchased = [];
        user.purchased.push(...user.cart);
        user.cart = []; // Clear cart

        await writeUsersToFile(users);

        res.redirect('/confirmation');
    } catch (error) {
        console.error('Error processing checkout:', error);
        res.status(500).send('Internal Server Error');
    }
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, HOST, () => console.log(`Server running at http://${HOST}:${PORT}`));