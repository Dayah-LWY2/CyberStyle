const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config(); // For loading environment variables

const app = express();

// Middleware setup
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));

// File paths
const usersFilePath = path.join(__dirname, 'public', 'users.json');
const productsFilePath = path.join(__dirname, 'public', 'products.json');

// Function to read and write user and product data
async function getUsers() {
    try {
        const data = await fs.readFile(usersFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        if (err.code === 'ENOENT') {
            return []; // Return empty array if file doesn't exist
        }
        throw err;
    }
}

async function saveUsers(users) {
    await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));
}

async function getProducts() {
    try {
        const data = await fs.readFile(productsFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        if (err.code === 'ENOENT') {
            return []; // Return empty array if file doesn't exist
        }
        throw err;
    }
}

// Middleware to initialize cart in session
app.use((req, res, next) => {
    res.locals.username = req.session.username;
    if (!req.session.cart) {
        req.session.cart = [];
    }
    if (!req.session.tempCart) {
        req.session.tempCart = [];
    }
    res.locals.cart = req.session.cart;
    res.locals.tempCart = req.session.tempCart;
    next();
});

// Routes
app.get('/', async (req, res) => {
    const products = await getProducts();
    const specificProductCodes = ['1', '2', '3']; // IDs of specific products
    const specificProducts = products.filter(p => specificProductCodes.includes(p.code)) || [];
    res.render('index', { title: 'Home', products, specificProducts });
});

app.get('/about', (req, res) => res.render('about', { title: 'About Us' }));
app.get('/shipping-&-returns', (req, res) => res.render('shipping-&-returns', { title: 'Shipping & Returns' }));
app.get('/faq', (req, res) => res.render('faq', { title: 'FAQ' }));
app.get('/women', async (req, res) => {
    const products = await getProducts();
    res.render('women', { title: 'Women', products });
});
app.get('/men', async (req, res) => {
    const products = await getProducts();
    res.render('men', { title: 'Men', products });
});
app.get('/kids', async (req, res) => {
    const products = await getProducts();
    res.render('kids', { title: 'Kids', products });
});
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
app.get('/products', async (req, res) => {
    const products = await getProducts();
    res.render('products', { title: 'All Products', products });
});
app.get('/product/:code', async (req, res) => {
    const products = await getProducts();
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

// POST routes
app.post('/add-to-cart', async (req, res) => {
    const { productCode, size, quantity } = req.body;
    const products = await getProducts();
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

app.post('/buy-now', async (req, res) => {
    const { productCode, size, quantity } = req.body;
    const products = await getProducts();
    const product = products.find(p => p.code === productCode);

    if (!product) {
        return res.status(404).send('Product not found');
    }

    const tempCart = [{
        name: product.name,
        size,
        quantity: parseInt(quantity, 10),
        product: {
            price: product.price
        }
    }];

    req.session.tempCart = tempCart;

    // Redirect to payment page
    res.redirect('/payment');
});

app.post('/process-direct-payment', async (req, res) => {
    const { username, productId, size, quantity, address, paymentMethod } = req.body;
    const products = await getProducts();
    const users = await getUsers();

    const user = users.find(user => user.username === username);
    const product = products.find(p => p.id === productId);

    if (!user || !product) {
        return res.status(404).send('User or product not found.');
    }

    const totalPrice = product.price * quantity;

    const purchasedItem = {
        productId,
        name: product.name,
        size,
        quantity,
        price: product.price,
        totalPrice,
        purchaseDate: new Date().toISOString()
    };

    if (!user.purchased) {
        user.purchased = [];
    }
    user.purchased.push(purchasedItem);

    // Remove from temporary cart if it exists
    if (user.cart) {
        user.cart = user.cart.filter(item => !(item.product.id === productId && item.size === size));
    }

    await saveUsers(users);

    res.redirect('/payment-success');
});

app.post('/process-checkout', async (req, res) => {
    const { username, address, paymentMethod } = req.body;
    const users = await getUsers();
    const user = users.find(user => user.username === username);

    if (!user || !user.cart || user.cart.length === 0) {
        return res.status(404).send('Cart is empty or user not found.');
    }

    const products = await getProducts();

    user.cart.forEach(item => {
        const product = products.find(p => p.id === item.product.id);

        if (product) {
            const totalPrice = product.price * item.quantity;

            const purchasedItem = {
                productId: item.product.id,
                name: product.name,
                size: item.size,
                quantity: item.quantity,
                price: product.price,
                totalPrice,
                purchaseDate: new Date().toISOString()
            };

            if (!user.purchased) {
                user.purchased = [];
            }
            user.purchased.push(purchasedItem);
        }
    });

    // Clear the cart after purchase
    user.cart = [];

    await saveUsers(users);

    res.redirect('/checkout-success');
});

app.post('/remove-from-cart', (req, res) => {
    const { productCode, size } = req.body;
    req.session.cart = req.session.cart.filter(
        item => !(item.product.code === productCode && item.size === size)
    );
    res.redirect('/cart');
});

app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    const users = await getUsers();

    if (users.find(user => user.username === username)) {
        return res.redirect('/signup?errorMessage=Username already taken');
    }

    users.push({ username, password, cart: [], purchased: [] });
    await saveUsers(users);

    req.session.username = username;
    res.redirect('/');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const users = await getUsers();

    const user = users.find(user => user.username === username && user.password === password);
    if (!user) {
        return res.redirect('/login?errorMessage=Invalid username or password');
    }

    req.session.username = username;
    res.redirect('/');
});

app.get('/payment-success', (req, res) => res.send('<h1>Payment Successful!</h1><p>Your direct purchase has been processed.</p>'));
app.get('/checkout-success', (req, res) => res.send('<h1>Checkout Successful!</h1><p>Your cart has been processed and items have been purchased.</p>'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
