const port = 80;

import express from 'express';
import * as http from 'http';
import * as request from 'request';
import * as hostile from 'hostile';

// const express = require('express');
// const http = require('http');
// const request = require('request');
// const hostile = require('hostile');

if (hostile.get(false).findIndex(e => e[1] == 'redirects') < 0) {
    console.log("Creating local domain 'redirects'");
    hostile.set('127.0.0.1', 'redirects', err => {
        if (err) {
            if (err.message.split(':')[0] == 'EPERM') {
                console.log("Failed to create local domain. Operation was not permitted.");
                console.log("You need to run this as an administrator.");
                console.log("You can also manually add the domain by adding:");
                console.log("\t127.0.0.1\tredirects");
                console.log(`To the file: ${hostile.HOSTS}`);
                return;
            }
            console.log(err.message);
        }
    });
}

const app = express();
http.createServer(app);

/**
 * @typedef {Object} Host
 * @property {string} title
 * @property {string} domain
 * @property {number} port
 * @property {boolean} static
 * @property {boolean} hidden
 * @property {boolean} default
 */

/** @type {Array<Host>} */
const hosts = [
    {
        title: "Redirects",
        domain: "redirects",
        port: -1,
        static: true,
        hidden: true,
        default: false,
    },
    {
        title: "Web One",
        domain: "webone",
        port: 3000,
        static: false,
        hidden: false,
        default: true,
    },
    {
        title: "Web Two",
        domain: "webtwo",
        port: 3001,
        static: false,
        hidden: false,
        default: false,
    },
];

app.use((req, res, next) => {
    const domain = req.header('Host');

    /** @type {"GET"|"POST"|"PUT"|"DELETE"|"HEAD"} */
    const method = req.method.toUpperCase();
    const protocol = req.protocol;
    const path = req.url;

    const host = hosts.find(e => e.domain == domain) || hosts.find(e => e.default);

    if (!host)
        return res.send('Error: No fallback domain. Contact adminitrator for fix');

    if (host.port < 0)
        return next();

    var uri = `${protocol}://${domain}:${host.port}${path}`;
    switch (method) {
        case "GET":
            return request.get(uri).pipe(res);
        case "POST":
            return request.post(uri).pipe(res);
        case "PUT":
            return request.put(uri).pipe(res);
        case "DELETE":
            return request.delete(uri).pipe(res);
        case "HEAD":
            return request.head(uri).pipe(res);
        default:
            return res.send(`${method} is not a supported method`);
    }
});

app.get('/', (req, res) => {
    res.send('Controlpanel');
});

app.listen(port, () => {
    console.log(`Listening to *:${port}`);
});