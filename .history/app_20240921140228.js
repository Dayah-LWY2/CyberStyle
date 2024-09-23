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

// Load page data from pages.json
let pages = [];
const loadPages = async () => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'public', 'pages.json'), 'utf-8');
        pages = JSON.parse(data);
    } catch (err) {
        console.error('Error reading pages.json:', err);
    }
};
loadPages();

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
    res.render('index', { title: 'Home', products, filter: null });
});

app.get('/about', (req, res) => res.render('about', { title: 'About Us', filter: null }));
app.get('/shipping-&-returns', (req, res) => res.render('shipping-&-returns', { title: 'Shipping & Returns', filter: null }));
app.get('/store-policy', (req, res) => res.render('store-policy', { title: 'Store Policy', filter: null }));
app.get('/faq', (req, res) => res.render('faq', { title: 'FAQ', filter: null }));
app.get('/women', (req, res) => res.render('women', { title: 'Women', products, filter: null }));
app.get('/men', (req, res) => res.render('men', { title: 'Men', products, filter: null }));
app.get('/kids', (req, res) => res.render('kids', { title: 'Kids', products, filter: null }));
app.get('/login', (req, res) => res.render('login', { title: 'Login', errorMessage: req.query.errorMessage, filter: null }));

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.redirect('/error');
        res.redirect('/?loggedOut=true');
    });
});

app.get('/signup', (req, res) => res.render('signup', { title: 'Sign Up', errorMessage: req.query.errorMessage, filter: null }));
app.get('/products', (req, res) => res.render('products', { title: 'All Products', products, filter: null }));
app.get('/product/:code', async (req, res) => {
    const product = products.find(p => p.code === req.params.code);
    if (!product) return res.status(404).send('Product not found');

    const users = await readUsersFromFile();
    const loggedInUser = req.session.username
    const hasReviewed = user && product.reviews && product.reviews.some(review => review.username === loggedInUser);
    res.render('product', { title: 'Product', product, users, loggedInUser, hasReviewed, filter: null });
});

app.get('/cart', (req, res) => res.render('cart', { title: 'Cart', cart: req.session.cart, filter: null }));

app.get('/payment', async (req, res) => {
    const username = req.session.username; 
    const users = await readUsersFromFile();
    const user = users.find(u => u.username === username);
    const address = user ? user.address || '' : '';

    const cart = req.session.tempCart || req.session.cart;
    if (!cart || cart.length === 0) return res.status(404).send('No items found for payment');
    res.render('payment', { title: 'Payment Details', cart, address, filter: null });
});

app.get('/checkout', async (req, res) => {
    const username = req.session.username;  
    const users = await readUsersFromFile();
    const user = users.find(u => u.username === username);
    const address = user ? user.address || '' : '';

    const cart = req.session.cart;
    if (!cart || cart.length === 0) return res.status(404).send('No items in cart');
    res.render('checkout', { title: 'Checkout', cart, address, filter: null });
});

app.get('/confirmation', (req, res) => res.render('confirmation', { title: 'Confirmation', filter: null }));

app.get('/search', (req, res) => {
    const query = req.query.q ? req.query.q.toLowerCase() : '';
    const filter = req.query.filter || 'none';

    if (!query && filter === 'none') {
        return res.redirect('/products');
    }

    let matchedProducts = [];
    let matchedPages = [];

    if (query) {
        matchedProducts = products.filter(product => 
            product.name.toLowerCase().includes(query) &&
            product.category !== 'new'
        );

        matchedPages = pages.filter(page =>
            page.name.toLowerCase().includes(query)
        );
    } else {
        matchedProducts = products.filter(product => product.category !== 'new');
    }

    switch (filter) {
        case 'price-asc':
            matchedProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            matchedProducts.sort((a, b) => b.price - a.price);
            break;
        case 'date-popular':
            matchedProducts.sort((a, b) => b.popularity - a.popularity);
            break;
        case 'date-latest':
            matchedProducts.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
            break;
        case 'date-oldest':
            matchedProducts.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
            break;
        default:
            break;
    }

    let results = [];
    if (query) {
        results = matchedProducts.concat(matchedPages);
    } else {
        results = matchedProducts;
    }

    res.render('searchResults', { title: 'Search Results', results, query, filter });
});

// Autocomplete Suggestions Route
app.get('/autocomplete', (req, res) => {
    const query = req.query.q ? req.query.q.toLowerCase() : '';
    if (!query) {
        return res.json([]);
    }

    const matchedProducts = products.filter(product => 
        product.name.toLowerCase().includes(query)
    );

    const matchedPages = pages.filter(page =>
        page.name.toLowerCase().includes(query)
    );

    const suggestions = matchedProducts.map(product => ({
        type: 'product',
        name: product.name,
        url: `/product/${product.code}`
    })).concat(matchedPages.map(page => ({
        type: 'page',
        name: page.name,
        url: page.url
    })));

    res.json(suggestions);
});

// Review submission logic
app.post('/product/:code/review', ensureLoggedInAndExists, async (req, res) => {
    const productCode = req.params.code;
    const product = products.find(p => String(p.code) === String(productCode)); // Ensure both are compared as strings

    if (product) {
        // Validate form data
        if (!req.body.rating || !req.body.comment) {
            return res.status(400).send('All fields are required.');
        }

        const rating = parseInt(req.body.rating);
        if (rating < 1 || rating > 5) {
            return res.status(400).send('Rating must be between 1 and 5.');
        }

        // Check if the user has purchased the product
        const users = await readUsersFromFile();
        const user = users.find(u => u.username === req.session.username);
        if (!user || !user.purchased.includes(productCode)) {
            return res.status(403).send('You can only review products you have purchased.');
        }

        // Add the review to the product
        const review = {
            username: req.session.username,
            rating,
            comment: req.body.comment,
            date: new Date()
        };

        if (!product.reviews) {
            product.reviews = [];
        }
        product.reviews.push(review);
        
        // Save updated products data back to JSON file
        await fs.writeFile(path.join(__dirname, 'public', 'products.json'), JSON.stringify(products, null, 2));

        res.redirect(`/product/${product.code}?reviewSubmitted=true`);
    } else {
        res.status(404).send('Product not found');
    }
});

// Existing routes for adding to cart, buying now, and processing payments
app.post('/add-to-cart', ensureLoggedInAndExists, (req, res) => {
    const { productCode, size, quantity } = req.body;
    const product = products.find(p => p.code === productCode);
    if (!product) return res.status(404).send('Product not found');

    const existingProductIndex = req.session.cart.findIndex(item => item.product.code === productCode && item.size === size);
    if (existingProductIndex !== -1) {
        req.session.cart[existingProductIndex].quantity += parseInt(quantity, 10);
    } else {
        req.session.cart.push({ product, size, quantity: parseInt(quantity, 10) });
    }
    res.redirect('/cart');
});

app.post('/buy-now', ensureLoggedInAndExists, (req, res) => {
    const { productCode, size, quantity } = req.body;
    const product = products.find(p => p.code === productCode);
    if (!product) return res.status(404).send('Product not found');

    req.session.tempCart = [{ 
        name: product.name, 
        quantity: parseInt(quantity, 10),
        size,
        product: { 
            code: product.code,
            price: product.price 
        } 
    }];
    
    res.redirect('/payment');
});

// Payment processing routes
app.post('/process-payment', async (req, res) => {
    try {
        const { address } = req.body;

        if (!address || address.trim() === '') {
            return res.status(400).send('Address is required');
        }

        const username = req.session.username;
        const users = await readUsersFromFile();
        const userIndex = users.findIndex(u => u.username === username);
        const tempCart = req.session.tempCart;

        if (!tempCart || tempCart.length === 0) {
            return res.status(404).send('No items in cart for payment');
        }

        // Clear temp cart after processing payment
        req.session.tempCart = null;

        if (userIndex !== -1) {
            users[userIndex].address = address;

            // Initialize purchased array if it doesn't exist
            if (!users[userIndex].purchased) {
                users[userIndex].purchased = [];
            }

            // Update user's purchased products
            tempCart.forEach(item => {
                if (item.product && item.product.code) {
                    users[userIndex].purchased.push(item.product.code);
                } else {
                    console.error('Invalid product or missing product code:', item);
                }
            });

            await writeUsersToFile(users);
            res.redirect('/confirmation');
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Remove from cart
app.post('/remove-from-cart', (req, res) => {
    const { productCode, size } = req.body;
    req.session.cart = req.session.cart.filter(item => !(item.product.code === productCode && item.size === size));
    res.redirect('/cart');
});

// Sign up and login routes
app.post('/signup', async (req, res) => {
    const { username, email, password, confirmPassword, phone, gender, dob } = req.body;
    const users = await readUsersFromFile();

    if (users.some(user => user.username === username)) return res.redirect('/signup?errorMessage=Username already exists.');
    if (users.some(user => user.email === email)) return res.redirect('/signup?errorMessage=Email already exists.');
    if (password !== confirmPassword) return res.redirect('/signup?errorMessage=Passwords do not match.');

    users.push({ username, email, password, phone, gender, dob, purchased: [] }); // Initialize purchased as an empty array
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

// Checkout processing
app.post('/process-checkout', async (req, res) => {
    try {
        const { address } = req.body;

        if (!address || address.trim() === '') {
            return res.status(400).send('Address is required');
        }

        const username = req.session.username;
        const users = await readUsersFromFile();
        const userIndex = users.findIndex(u => u.username === username);
        const cart = req.session.cart;

        if (!cart || cart.length === 0) return res.status(404).send('No items in cart for payment');

        // Handle payment logic
        req.session.cart = null;

        if (userIndex !== -1) {
            users[userIndex].address = address;
            // Update user's purchased products
            cart.forEach(item => {
                users[userIndex].purchased.push(item.product.code);
            });
            await writeUsersToFile(users);
            res.redirect('/confirmation');
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error('Error processing checkout:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
app.listen(PORT, HOST, () => console.log(`Server running at http://${HOST}:${PORT}`));