$(window).scroll(function (e) {
	parallax();
});

function parallax() {
    var scrolled = $(window).scrollTop();
    $('.bg').css('top', -(scrolled * 0.2) + 'px');
}

function smoothScroll(top, speed) {
    $('html,body').animate({
        scrollTop: top
    }, speed);
}
