$(() => {
    $('head').append(`
        <style>
            .icon-search {
                width: 375px;
                padding: 10px;
                background-color: #222;
                box-shadow: 1px 1px 4px black;
                border-radius: 15px;
                position: absolute;
            }
            
            .icon-search .list {
                list-style: none;
                padding: 10px 0;
                margin: 10px 0 0;
                max-height: 200px;
                overflow-y: auto;
            }
            
            .icon-search #empty {
                color: #888;
                text-align: center;
                margin: 15px 0 0;
            }
            
            .icon-search .list li {
                display: flex;
                justify-content: center;
                align-items: center;
                text-align: center;
                font-size: 12px;
                cursor: pointer;
            }
            
            .icon-search .list li .icon {
                width: 80%;
                padding: 10px 0;
                box-shadow: 1px 1px 4px #00000088;
                border-radius: 12px;
            }
            
            .icon-search .list li .icon i {
                font-size: 18px;
            }
            
            .icon-search .list li .icon p {
                padding: 0;
                margin: 0;
            }
        </style>
    `);

    $('body').append(`
        <div class="icon-search" style="display: none">
            <input type="text" class="form-control" id="search">
            <p id="empty" style="display: none">Ingen resultater</p>
            <ul class="row row-cols-3 row-cols-sm-4 row-cols-lg-4 row-cols-xl-8 list"></ul>
        </div>
    `);

    $.getJSON('/iconlist', data => {
        var iconshtml = "";
        data.forEach(e => {
            iconshtml += `
                <li class="col mb-4" title="${e}" icon="${e}">
                    <div class="icon">
                        <i class="bi bi-${e}"></i>
                    </div>
                </li>
            `;
        });
        $('.icon-search .list').html(iconshtml);
    });

    $('.icon-search #search').on('keyup', function() {
        const search = $(this).val();
        if (search.length <= 2) return $('.icon-search .list li').show().closest('.icon-search').find('#empty').hide();
        var count = 0;
        $('.icon-search .list li').each(function() {
            if ($(this).attr('icon').includes(search)) count++;
            $(this).toggle($(this).attr('icon').includes(search));
        });
        $('.icon-search #empty').toggle(count <= 0);
    });

    $(document).on('mousedown', e => {
        if ($(e.target).closest('.icon-search').length <= 0)
            $('.icon-search').hide();
    });
});

function iconChooser(callback = (icon) => {}, el = null) {
    $('.icon-search #search').val('').trigger('keyup');
    $('.icon-search #empty').show();
    $('.icon-search').show().find('.list li').each(function() {
        $(this).off('click').on('click', function() {
            callback($(this).attr('icon'));
            $('.icon-search').hide();
        });
    });
    if (el)
        $('.icon-search').css({
            top: $(el).offset().top + $(el).height(),
            left: $(el).offset().left + ($(el).width() / 2) - ($('.icon-search').width() / 2),
        });
}