'use strict';

function submitGiftCertCode() {
    $('.giftcertcode-button').click(function (e) {
        e.preventDefault();
        $.spinner().start();
        $('.giftcert-message').hide();
        $('.coupon-missing-error').hide();
        $('.coupon-error-message').hide();
        if (!$('.giftcert-input-field').val()) {
            $('.coupon-missing-error').show();
            $.spinner().stop();
            return false;
        }

        var $giftcertcode = $('.giftcert-input-field').val();
        //console.log('$form: ' + $form);
        console.log('$giftcertcode: ' + $giftcertcode);
        var $data = $('.giftcert-input-field').attr('data-gift-cert-add');
        console.log('url: ' + $data);

        $.ajax({
            url: $('.giftcert-input-field').attr('data-gift-cert-add'),
            type: 'GET',
            dataType: 'json',
            data: 'giftCertCode=' + $giftcertcode,
            success: function (data) {
                if (data.error) {
                    $('.coupon-error-message').show();
                } else {
                    $('.giftcert-message').empty().show().append(data.message);
                }
                $.spinner().stop();
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    createErrorNotification(err.errorMessage);
                    $.spinner().stop();
                }
            }
        });
    });
}


module.exports = {
    submitGiftCertCode: submitGiftCertCode
};