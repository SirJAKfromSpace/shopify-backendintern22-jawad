// IMPORTS
const express = require('express')
const cors = require('cors')
const ejsLayouts = require('express-ejs-layouts')
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { parse } = require('json2csv');
const morgan = require('morgan')


// CONSTANTS
const PORT = process.env.PORT || 3001
const REGEX_ALPHANUM = /^[a-z0-9 ]+$/i
const DB_JSON_FILE = './public/inventory.json'

// INITS
const app = express()
app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use(ejsLayouts)
app.set('view engine', 'ejs')
app.set('view options', { delimiter: '?' })
app.use(express.static(__dirname + '/public'))
app.use(morgan('[:date[clf]] :method :url - :status :response-time ms :remote-addr'))


// ROUTES

app.get('/', (req, res) => res.render('index', { msg: "Welcome to the Logistics Company portal!", type: "primary" }))

// TODO - handling inventory from db should be a separate express router
// const inventoryRouter = require('./routes/inventory')
// app.use('/inv', inventoryRouter)

app.get('/invman', (req, res) => res.render('manager', { list: getList() }))

app.post('/invman', (req, res) => {
    const invlist = getList()
    if (!req.body.itemname || !REGEX_ALPHANUM.test(req.body.itemname) || req.body.itemname.length > 50) {
        return res.render('manager', { list: invlist, msg: "Item must contain a valid alphanumeric name of 50 characters to be added", type: "danger" })
        // TODO replace with proper connect-flash msgs
    }
    if (!req.body.itemqty || req.body.itemqty < 1 || req.body.itemqty > 1000) {
        return res.render('manager', { list: invlist, msg: "Item Quantity must be a valid number between 1 and 1000", type: "danger" })
        // TODO replace with proper connect-flash msgs
    }

    invlist.items.push({ id: uuidv4(), name: req.body.itemname, qty: req.body.itemqty })
    writeList(invlist)
    return res.render('manager', { list: invlist, msg: "A New Item has been Added", type: "success" })
})

app.post('/invman/update', (req, res) => {
    const invlist = getList()
    if (!req.body.itemid) {
        return res.render('manager', { list: invlist, msg: "Item edited must have an item ID", type: "danger" })
        // TODO replace with proper connect-flash msgs
    }
    if (!req.body.itemname || !REGEX_ALPHANUM.test(req.itemname)) {
        return res.render('manager', { list: invlist, msg: "Item must contain a valid alphanum name to be edited", type: "danger" })
        // TODO replace with proper connect-flash msgs
    }
    if (!req.body.itemqty || req.body.itemqty < 1 || req.body.itemqty > 1000) {
        return res.render('manager', { list: invlist, msg: "Item Quantity must be a valid number between 1 and 1000", type: "danger" })
        // TODO replace with proper connect-flash msgs
    }

    var doneChanging = false
    invlist.items.forEach(function (item, index) {
        if (item.id === req.body.itemid) {
            invlist.items[index].name = req.body.itemname
            invlist.items[index].qty = req.body.itemqty
            doneChanging = true
        }
    });
    if (doneChanging) {
        writeList(invlist)
        return res.render('manager', { list: invlist, msg: "Item has been Changed", type: "success" })
    }
    else return res.render('manager', { list: invlist, msg: "Item could not be found and thus no changes", type: "danger" })
})

app.get('/invman/delete', (req, res) => {
    const invlist = getList()
    if (!req.query.id) {
        return res.render('manager', { list: invlist, msg: "Item cannot be deleted without item ID", type: "danger" })
        // TODO replace with proper connect-flash msgs
    }
    console.log(req.query.id);

    var doneChanging = false
    var i = 0
    invlist.items.forEach(function (item, index) {
        if (item.id === req.query.id) {
            i = index
            doneChanging = true
        }
    });

    if (doneChanging) {
        invlist.items.splice(i, 1)
        writeList(invlist)
        return res.render('manager', { list: invlist, msg: "Item has been Changed", type: "success" })
    }
    else return res.render('manager', { list: invlist, msg: "Item could not be found and thus no changes", type: "danger" })
})

function getList() {
    const data = fs.readFileSync(DB_JSON_FILE)
    let list = JSON.parse(data);
    list.inventoryname = "Shopify Summer22 Backend Intern Challenge"
    return list
}

function writeList(json) {
    let data = JSON.stringify(json);
    fs.writeFileSync(DB_JSON_FILE, data);
}

app.get('/csv', (req, res) => {
    const fields = ['qty', 'name', 'id'];
    const opts = { fields };
    try {
        const csv = parse(getList().items, opts);
        console.log(csv);
        res.header('Content-Type', 'text/csv');
        res.attachment('inventory.csv');
        return res.send(csv);
    } catch (err) {
        console.error(err);
    }
})



app.get('*', (req, res) => res.render('index', { msg: "Error 404 - Sorry! Page Not Found", type: "danger" }))

app.listen(PORT, console.log(`\nServer started on port ${PORT}`))
