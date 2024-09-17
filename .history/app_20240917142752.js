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
    res.locals.cart = req.session.cart;
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

app.get('/cart', ensureLoggedInAndExists, async (req, res) => {
    const users = await readUsersFromFile();
    const user = users.find(u => u.username === req.session.username);
    const cart = user ? user.cart : [];

    res.render('cart', { title: 'Cart', cart });
});

app.get('/payment', (req, res) => {
    const cart = req.session.cart;
    if (!cart || cart.length === 0) return res.status(404).send('No items found for payment');
    res.render('payment', { title: 'Payment Details', cart });
});

app.get('/checkout', (req, res) => {
    const cart = req.session.cart;
    if (!cart || cart.length === 0) return res.status(404).send('No items in cart');
    res.render('checkout', { title: 'Checkout', cart });
});

app.get('/confirmation', (req, res) => res.render('confirmation', { title: 'Confirmation' }));

app.post('/add-to-cart', ensureLoggedInAndExists, async (req, res) => {
    const { productCode, size, quantity } = req.body;
    const product = products.find(p => p.code === productCode);
    if (!product) return res.status(404).send('Product not found');

    // Create the cart item in the desired format
    const cartItem = {
        name: product.name,
        code: product.code,
        quantity: parseInt(quantity, 10),
        size,
        price: product.price,
        images: product.images
    };

    // Check if the item already exists in the session cart
    const existingProductIndex = req.session.cart.findIndex(item => item.code === productCode && item.size === size);
    if (existingProductIndex !== -1) {
        req.session.cart[existingProductIndex].quantity += parseInt(quantity, 10);
    } else {
        req.session.cart.push(cartItem);
    }
    
    // Update users.json
    const users = await readUsersFromFile();
    const user = users.find(u => u.username === req.session.username);
    user.cart = req.session.cart;
    await writeUsersToFile(users);
    
    res.redirect('/cart');
});

app.post('/process-checkout', async (req, res) => {
    // Handle payment initialization and options here

    // Process checkout
    const users = await readUsersFromFile();
    const user = users.find(u => u.username === req.session.username);

    user.purchased = user.purchased || [];
    user.purchased.push(...req.session.cart);
    user.cart = [];

    await writeUsersToFile(users);

    // Clear the session cart
    req.session.cart = [];
    res.redirect('/confirmation');
});

app.post('/buy-now', ensureLoggedInAndExists, async (req, res) => {
    const { productCode, size, quantity, address } = req.body;
    const product = products.find(p => p.code === productCode);
    if (!product) return res.status(404).send('Product not found');

    // Add the item to the main cart in users.json
    const users = await readUsersFromFile();
    const user = users.find(u => u.username === req.session.username);
    if (!user.cart) user.cart = [];

    // Create a cart item
    const cartItem = { 
        name: product.name, 
        quantity: parseInt(quantity, 10),
        size,
        product: {
            price: product.price,
            images: product.images // Include product images
        } 
    };

    // Push the item to the main cart
    user.cart.push(cartItem);

    // Update users.json
    await writeUsersToFile(users);

    // Redirect to payment page
    res.redirect('/payment');
});

app.post('/process-payment', async (req, res) => {
    // Handle payment logic here

    // Fetch the user and their cart
    const users = await readUsersFromFile();
    const user = users.find(u => u.username === req.session.username);

    if (!user.cart || user.cart.length === 0) return res.status(404).send('No items in cart for payment');

    // Remove the most recent item from the main cart
    const mostRecentItem = user.cart.pop(); // Get and remove the most recent item

    // Move the purchased item to the purchased section
    user.purchased = user.purchased || [];
    user.purchased.push(mostRecentItem);

    // Update users.json
    await writeUsersToFile(users);

    // Redirect to confirmation page
    res.redirect('/confirmation');
});

app.post('/remove-from-cart', async (req, res) => {
    const { productCode, size } = req.body;
    const username = req.session.username; // Retrieve username from session

    if (!username) {
        return res.redirect('/login?errorMessage=Please log in to continue');
    }

    try {
        // Read users data from users.json
        const users = await readUsersFromFile();

        // Find the user and update their cart
        const userIndex = users.findIndex(user => user.username === username);
        if (userIndex === -1) {
            return res.status(404).send('User not found');
        }

        const user = users[userIndex];
        user.cart = user.cart || []; // Initialize cart if it does not exist
        user.cart = user.cart.filter(item => !(item.product.code === productCode && item.size === size));

        // Write updated user data back to users.json
        await writeUsersToFile(users);

        // Update the session cart
        req.session.cart = req.session.cart.filter(item => !(item.product.code === productCode && item.size === size));

        res.redirect('/cart');
    } catch (error) {
        console.error('Error updating cart:', error.message); // Log the error message
        console.error(error.stack); // Log the stack trace for more details
        res.status(500).send('Internal server error');
    }
});

app.post('/signup', async (req, res) => {
    const { username, email, password, confirmPassword, phone, gender, dob } = req.body;
    const users = await readUsersFromFile();

    if (users.some(user => user.username === username)) return res.redirect('/signup?errorMessage=Username already exists.');
    if (users.some(user => user.email === email)) return res.redirect('/signup?errorMessage=Email already exists.');
    if (password !== confirmPassword) return res.redirect('/signup?errorMessage=Passwords do not match.');

    users.push({ username, email, password, phone, gender, dob });
    await writeUsersToFile(users);
    res.redirect('/login?signedUp=true');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const users = await readUsersFromFile();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        req.session.username = user.username;
        res.redirect('/?loggedIn=true');
    } else {
        res.redirect('/login?errorMessage=Invalid username or password.');
    }
});

app.post('/checkout', ensureLoggedInAndExists, async (req, res) => {
    const { address } = req.body;
    const username = req.session.username;
    const users = await readUsersFromFile();
    const user = users.find(u => u.username === username);
    user.address = address;
    await writeUsersToFile(users);
    res.redirect('/confirmation');
});

// Start the server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
app.listen(PORT, HOST, () => console.log(`Server running at http://${HOST}:${PORT}`));
