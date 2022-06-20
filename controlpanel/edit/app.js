$(() => {
    $('header .home').on('click', () => location.href = '/');

    $('.settings').on('submit', function(e) {
        e.preventDefault();
        $.getJSON('/save', {
            id: location.href.split('/').pop(),
            icon: $(this.icon).val(),
            title: $(this.title).val(),
            domain: $(this.domain).val(),
            ip: $("#ip1, #ip2, #ip3, #ip4").map((i, e) => $(e).val()).get().join('.'),
            port: $(this.port).val(),
            default: $(this.default).is(':checked'),
        }, data => {
            if (!data.success)
                alert(`Failed: ${data.reason}`);
            alert("Saved");
        });
    });

    $('.settings .delete').on('click', () => {
        if (!confirm('Are you sure you want to delete this host?'))
            return;
        
        $.getJSON(`/delete/${location.href.split('/').pop()}`, data => {
            if (!data.success)
                alert(`Failed: ${data.reason}`);
            alert("Deleted");
            location.href = '/';
        });
    });

    $('.settings .icon-container i').on('click', () => {
        iconChooser(icon => {
            $('.settings #icon').val(icon);
            $('.settings .icon-container i').attr('class', `bi bi-${icon}`);
        }, $('.settings .icon-container i'));
    });
});

function 
