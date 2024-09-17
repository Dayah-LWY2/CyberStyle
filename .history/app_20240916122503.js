const expressLayouts = require('express-ejs-layouts');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config(); // For loading environment variables

const app = express();

// Middleware setup
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
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

// Initialize products data
loadProducts();

// Load users data from users.json
async function readUsersFromFile() {
    try {
        const data = await fs.readFile(path.join(__dirname, 'public', 'users.json'), 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        if (err.code === 'ENOENT') {
            return []; // Return empty array if file doesn't exist or error occurs
        } else {
            throw err;
        }
    }
}

// Write users data to users.json
async function writeUsersToFile(users) {
    await fs.writeFile(path.join(__dirname, 'public', 'users.json'), JSON.stringify(users, null, 2));
}

// Middleware to initialize cart in session
app.use((req, res, next) => {
    res.locals.username = req.session.username;
    if (!req.session.cart) {
        req.session.cart = [];
    }
    res.locals.cart = req.session.cart;
    next();
});

// Routes
app.get('/', async (req, res) => {
    // Ensure products are loaded
    if (products.length === 0) {
        await loadProducts();
    }

    const specificProductCodes = ['1', '2', '3']; // IDs of specific products
    const specificProducts = products.filter(p => specificProductCodes.includes(p.code)) || [];
    res.render('index', { title: 'Home', products, specificProducts });
});


app.get('/search', (req, res) => {
    const { query, category, sortBy } = req.query;

    // Initialize filteredProducts as an empty array
    let filteredProducts = [];

    // Only perform filtering if there are search parameters
    if (query || category || sortBy) {
        filteredProducts = products;

        if (query) {
            filteredProducts = filteredProducts.filter(product =>
                product.name.toLowerCase().includes(query.toLowerCase()) ||
                product.page.toLowerCase().includes(query.toLowerCase())
            );
        }

        if (category && category !== "") {
            filteredProducts = filteredProducts.filter(product => product.category === category);
        }

        if (sortBy) {
            filteredProducts.sort((a, b) => {
                switch (sortBy) {
                    case 'newest':
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    case 'oldest':
                        return new Date(a.createdAt) - new Date(b.createdAt);
                    case 'popular':
                        return b.popularity - a.popularity;
                    default:
                        return 0;
                }
            });
        }
    }

    // Render the search results page, passing the filtered products
    res.render('search-results', {
        title: 'Search Results',
        products: filteredProducts
    });
});





app.get('/about', (req, res) => res.render('about', { title: 'About Us' }));
app.get('/shipping-&-returns', (req, res) => res.render('shipping-&-returns', { title: 'Shipping & Returns' }));
app.get('/women', (req, res) => res.render('women', { title: 'Women', products }));
app.get('/men', (req, res) => res.render('men', { title: 'Men', products }));
app.get('/kids', (req, res) => res.render('kids', { title: 'Kids', products }));
app.get('/login', (req, res) => {
    const errorMessage = req.query.errorMessage;
    res.render('login', { title: 'Login', errorMessage });
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/error');
        }
        res.redirect('/?loggedOut=true');
    });
});

app.get('/signup', (req, res) => {
    const errorMessage = req.query.errorMessage; // Retrieve error message from query params
    res.render('signup', { title: 'Sign Up', errorMessage }); // Pass error message to the template
});

app.get('/products', (req, res) => res.render('products', { title: 'All Products', products }));

app.get('/product/:code', (req, res) => {
    const product = products.find(p => p.code === req.params.code);
    if (!product) {
        return res.status(404).send('Product not found');
    }
    res.render('product', { title: 'Product', product });
});

app.get('/cart', (req, res) => res.render('cart', { title: 'Cart', cart: req.session.cart }));

app.get('/payment', (req, res) => {
    const cart = req.session.tempCart || req.session.cart;
    if (!cart || cart.length === 0) {
        return res.status(404).send('No items found for payment');
    }
    res.render('payment', { title: 'Payment Details', cart });
});

app.get('/checkout', (req, res) => {
    const cart = req.session.cart;
    if (!cart || cart.length === 0) {
        return res.status(404).send('No items in cart');
    }
    res.render('checkout', { title: 'Checkout', cart });
});

app.get('/confirmation', (req, res) => res.render('confirmation', { title: 'Confirmation' }));

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

app.post('/buy-now', (req, res) => {
    const { productCode, size, quantity } = req.body;
    const product = products.find(p => p.code === productCode);

    if (!product) {
        return res.status(404).send('Product not found');
    }

    const tempCart = [{
        name: product.name,
        quantity: parseInt(quantity, 10),
        product: {
            price: product.price
        }
    }];

    req.session.tempCart = tempCart;

    // Redirect to payment page
    res.redirect('/payment');
});

app.post('/process-payment', async (req, res) => {
    const { paymentMethod } = req.body;
    const tempCart = req.session.tempCart;

    if (!tempCart || tempCart.length === 0) {
        return res.status(404).send('No items in cart for payment');
    }

    if (paymentMethod === 'online-banking') {
        // Handle online banking payment (e.g., Stripe)
    } else if (paymentMethod === 'cod') {
        // Handle cash on delivery payment
    }

    // Clear temporary cart after payment
    req.session.tempCart = null;

    res.redirect('/confirmation');
});

app.post('/remove-from-cart', (req, res) => {
    const { productCode, size } = req.body;
    req.session.cart = req.session.cart.filter(
        item => !(item.product.code === productCode && item.size === size)
    );
    res.redirect('/cart');
});

app.post('/signup', async (req, res) => {
    const { username, email, password, confirmPassword, phone, gender, dob } = req.body;
    const users = await readUsersFromFile();

    // Check if the username and email already exists
    const existingUsername = users.find(user => user.username === username);
    const existingUserEmail = users.find(user => user.email === email);
    if (existingUsername) {
        return res.redirect('/signup?errorMessage=Username already exists.');
    } else if (existingUserEmail) {
        return res.redirect('/signup?errorMessage=Email already exists.');
    }

    // Check if passwords match
    if (password !== confirmPassword) {
        return res.redirect('/signup?errorMessage=Passwords do not match. Please try again.');
    }

    // Add new user to the users array
    users.push({ username, email, password, phone, gender, dob });
  
    // Write updated users array to the JSON file
    await writeUsersToFile(users);

    // Redirect to login page after successful signup
    res.redirect('/login');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const users = await readUsersFromFile();
  
    // Check if the user exists and the password matches
    const user = users.find(user => user.username === username && user.password === password);
    
    if (user) {
        req.session.username = user.username;
        res.redirect('/?loggedIn=true');
    } else {
        res.redirect('/login?errorMessage=Invalid username or password. Please try again.');
    }
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
