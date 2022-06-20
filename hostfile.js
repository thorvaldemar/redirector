const hostile = require('hostile');

if (hostile.get(false).findIndex(e => e[1] == 'redirects') < 0) {
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