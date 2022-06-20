const port = 80;

const express = require('express');
const http = require('http');
const request = require('request');
const hostile = require('hostile');
const win = require('node-windows');
const jsdom = require('jsdom');
const fs = require('fs');
const { Server } = require("socket.io");
const axios = require('axios').default;

if (hostile.get(false).findIndex(e => e[1] == 'redirects') < 0) {
    console.log("Creating local domain 'redirects'");
    win.elevate(`node ${__dirname}/hostfile.js`, {}, () => {
        console.log("The domain 'redirects' has been added");
    });
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);

/**
 * @typedef {Object} Host
 * @property {string} title
 * @property {string} domain
 * @property {number} id
 * @property {string} ip
 * @property {number} port
 * @property {boolean} static
 * @property {boolean} hidden
 * @property {boolean} default
 * @property {string} icon
 * @property {boolean} online
 */

/** @type {Array<Host>} */
const hosts = [
    {
        title: "Redirects",
        domain: "redirects",
        id: -1,
        ip: "127.0.0.1",
        port: -1,
        static: true,
        hidden: true,
        default: false,
        icon: "globe",
    },
    {
        title: "Web One",
        domain: "webone",
        id: 1234,
        ip: "127.0.0.1",
        port: 3000,
        static: false,
        hidden: false,
        default: true,
        icon: "globe",
    },
    {
        title: "Web Two",
        domain: "webtwo",
        id: 4321,
        ip: "127.0.0.1",
        port: 3001,
        static: false,
        hidden: false,
        default: false,
        icon: "globe",
    },
];

app.use((req, res, next) => {
    const domain = req.header('Host');

    /** @type {"GET"|"POST"|"PUT"|"DELETE"|"HEAD"} */
    const method = req.method.toUpperCase();
    const protocol = req.protocol;
    const path = req.url;

    const host = hosts.find(e => e.domain == domain) || hosts.find(e => e.default) || null;

    if (!host)
        return res.send('Error: No fallback domain. Contact adminitrator for fix');

    if (host.port < 0)
        return next();

    var uri = `${protocol}://${domain}:${host.port}${path}`;
    try {
        switch (method) {
            case "GET":
                return request.get(uri).on('error', err => res.send(err)).pipe(res);
            case "POST":
                return request.post(uri).on('error', err => res.send(err)).pipe(res);
            case "PUT":
                return request.put(uri).on('error', err => res.send(err)).pipe(res);
            case "DELETE":
                return request.delete(uri).on('error', err => res.send(err)).pipe(res);
            case "HEAD":
                return request.head(uri).on('error', err => res.send(err)).pipe(res);
            default:
                return res.send(`${method} is not a supported method`);
        }
    } catch(err) {
        res.send(`${domain} with port ${port} is not running`);
    }
});

app.get('/style.css', (req, res) => res.sendFile(`${__dirname}/controlpanel/style.css`));
app.get('/app.js', (req, res) => res.sendFile(`${__dirname}/controlpanel/app.js`));
app.get('/', (req, res) => {
    const dom = new jsdom.JSDOM(fs.readFileSync(`${__dirname}/controlpanel/index.html`));
    const $ = require('jquery')(dom.window);

    getHostData().then(h => {
        h.forEach(e => {
            if (e.hidden) return;
            $('.processes').append(`
                <div class="process" procid="${e.id}" domain="${e.domain}">
                    <i class="bi bi-${e.icon}"></i>
                    <div class="info">
                        <p id="title">${e.title}</p>
                        <p id="domain">${e.domain}</p>
                        <div class="bottom">
                            <p id="status" status="${e.online ? 'running' : 'stopped'}">${e.online ? 'Running' : 'Stopped'}</p>
                            <p id="port">${e.ip}:${e.port}</p>
                        </div>
                    </div>
                </div>
            `);
        });

        $('.processes').append(`
            <div class="process new-process">
                <div class="ui">
                    <i class="bi bi-plus-circle-dotted"></i>
                    <p id="desc">Add new redirect</p>
                </div>
            </div>
        `);

        res.send(dom.serialize());
    });
});

app.get('/edit/style.css', (req, res) => res.sendFile(`${__dirname}/controlpanel/edit/style.css`));
app.get('/edit/app.js', (req, res) => res.sendFile(`${__dirname}/controlpanel/edit/app.js`));
app.get('/edit/:proc', (req, res) => {
    const host = hosts.find(e => e.id == req.params.proc);

    if (!host)
        return res.send('Unknown host id');

    const dom = new jsdom.JSDOM(fs.readFileSync(`${__dirname}/controlpanel/edit/index.html`));
    const $ = require('jquery')(dom.window);

    $('#subtitle').text(`Editing ${host.title}`);
    $('.settings .icon-container i').attr('class', `bi bi-${host.icon}`);
    $('.settings .icon-container #icon').attr('value', host.icon);
    $('.settings #title').attr('value', host.title);
    $('.settings #domain').attr('value', host.domain);
    $('.settings #ip1').attr('value', host.ip.split('.')[0]);
    $('.settings #ip2').attr('value', host.ip.split('.')[1]);
    $('.settings #ip3').attr('value', host.ip.split('.')[2]);
    $('.settings #ip4').attr('value', host.ip.split('.')[3]);
    $('.settings #port').attr('value', host.port);
    if (host.default) $('.settings #default').attr('checked', true);

    console.log(hosts);

    res.send(dom.serialize());
});

app.get('/new', (req, res) => {
    const id = Math.floor(Math.random() * 89999999) + 10000000;
    hosts.push({
        title: "New site",
        domain: "site.new",
        id: id,
        ip: "127.0.0.1",
        port: 8080,
        static: false,
        hidden: false,
        default: false,
        icon: "globe",
    });
    res.redirect(`/edit/${id}`);
});

app.get('/save', (req, res) => {
    const host = hosts.find(e => e.id == req.query.id);

    if (!host)
        return res.send({ success: false, reason: "Host was not found" });

    host.title = req.query.title;
    host.domain = req.query.domain;
    host.icon = req.query.icon;
    host.ip = req.query.ip;
    host.port = req.query.port;
    host.default = req.query.default;

    res.send({success: true});
});

app.get('/delete/:proc', (req, res) => {
    const index = hosts.findIndex(e => e.id == req.params.proc);
    if (index < 0)
        return res.send({ success: false, reason: "Host was not found" });
    hosts.splice(index, 1);
    res.send({ success: true });
});

app.get('/iconlist', (req, res) => res.send(JSON.parse(fs.readFileSync(`${__dirname}/iconlist.json`))));
app.get('/iconchooser', (req, res) => res.sendFile(`${__dirname}/iconChooser.js`));

setInterval(() => {
    getStatus().then(status => {
        io.emit("status", status);
    });
}, 5000);

io.on('connection', socket => {
    socket.on('status', (callback) => {
        getStatus().then(data => {
            callback(data);
        });
    })
    socket.on('status only', (port, callback) => {
        getStatus(port).then(data => {
            callback(data);
        });
    })
});

server.listen(port, () => {
    console.log(`Listening to *:${port}`);
});

/**
 * @param {number} port 
 * @returns {Promise<boolean|Array<boolean>>}
 */
async function getStatus(port = null) {
    return new Promise(async (resolve, reject) => {
        var arr = [];
        if (!port) {
            for (var i = 0; i < hosts.length; i++) {
                const con = await getStatus(hosts[i].port);
                arr.push({
                    "domain": hosts[i].domain,
                    "status": con,
                });
            }
            return resolve(arr);
        }
        axios.get(`http://127.0.0.1${port > 0 ? `:${port}` : ''}`).then(() => resolve(true)).catch(() => resolve(false));
    });
}

/**
 * @param {string} domain 
 * @returns {Promise<Host|Array<Host>>}
 */
async function getHostData(id = null) {
    return new Promise(async (resolve, reject) => {
        if (!id) {
            var arr = [];
            for (var i = 0; i < hosts.length; i++) {
                const host = await getHostData(hosts[i].id);
                arr.push(host);
            }
            return resolve(arr);
        }
        const host = hosts.find(e => e.id == id);
        const status = await getStatus(host.port);
        resolve({
            ...host,
            online: status,
        });
    });
}