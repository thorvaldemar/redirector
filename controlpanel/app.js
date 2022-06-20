const icons = [];

const socket = io();
socket.on('status', statuses => {
    statuses.forEach(status => {
        $(`.processes .process[domain="${status.domain}"] .info #status`)
            .attr('status', status.status ? 'running' : 'stopped')
            .text(status.status ? 'Running' : 'Stopped');
    });
});

$(() => {
    $('.processes .process:not(.new-process)').on('click', function() {
        location.href = `/edit/${$(this).attr('procid')}`;
    });

    $('.processes .process.new-process').on('click', () => {
        location.href = `/new`;
    });
});