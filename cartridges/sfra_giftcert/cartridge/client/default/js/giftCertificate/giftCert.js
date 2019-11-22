'use strict';
//var base = require('./base');

/**
 * Updates the Mini-Cart quantity value after the customer has pressed the "Add to Cart" button
 * @param {string} response - ajax response from clicking the add to cart button
 */
function handlePostCartAdd(response) {
    $('.minicart').trigger('count:update', response);
    var messageType = response.error ? 'alert-danger' : 'alert-success';
    // show add to cart toast
    if (response.newBonusDiscountLineItem
        && Object.keys(response.newBonusDiscountLineItem).length !== 0) {
        chooseBonusProducts(response.newBonusDiscountLineItem);
    } else {
        if ($('.add-to-cart-messages').length === 0) {
            $('body').append(
                '<div class="add-to-cart-messages"></div>'
            );
        }

        $('.add-to-cart-messages').append(
            '<div class="alert ' + messageType + ' add-to-basket-alert text-center" role="alert">'
            + response.message
            + '</div>'
        );

        setTimeout(function () {
            $('.add-to-basket-alert').remove();
        }, 5000);
    }
}

module.exports= {
    addGiftCertToCart: function () {
        $(document).on('click', 'button.add-giftcert-to-cart', function () {
            var addToCartUrl;
            var pid;
            var pidsObj;
            var setPids;

            $('body').trigger('product:beforeAddToCart', this);

            /*
            if ($('.set-items').length && $(this).hasClass('add-to-cart-global')) {
                setPids = [];

                $('.product-detail').each(function () {
                    if (!$(this).hasClass('product-set-detail')) {
                        setPids.push({
                            pid: $(this).find('.product-id').text(),
                            qty: $(this).find('.quantity-select').val(),
                            options: getOptions($(this))
                        });
                    }
                });
                pidsObj = JSON.stringify(setPids);
            }

            pid = getPidValue($(this));

            var $productContainer = $(this).closest('.product-detail');
            if (!$productContainer.length) {
                $productContainer = $(this).closest('.quick-view-dialog').find('.product-detail');
            }
            */

            addToCartUrl = $('.add-giftcert-to-cart-url').val();
            /*
            console.log('addToCartUrl: ' + addToCartUrl);
            console.log('giftCertTo: ' + $('#giftcertificate-recipient').val());
            console.log('giftCertEmail: ' + $('#giftcertificate-email').val());
            console.log('giftCertAmount: ' + $('#giftcertificate-amount').val());
            console.log('giftCertMessage: ' + $('#giftcertificate-message').val());
            */

            var form = {
                pid: pid,
                pidsObj: pidsObj,
                childProducts: [],
                quantity: 1,
                giftCertTo: $('#giftcertificate-recipient').val(),
                giftCertEmail: $('#giftcertificate-email').val(),
                giftCertAmount: $('#giftcertificate-amount').val(),
                giftCertMessage: $('#giftcertificate-message').val()
            };

            /*
            if (!$('.bundle-item').length) {
                form.options = getOptions($productContainer);
            }
            */

            $(this).trigger('updateAddToCartFormData', form);
            if (addToCartUrl) {
                $.ajax({
                    url: addToCartUrl,
                    method: 'POST',
                    data: form,
                    success: function (data) {
                        handlePostCartAdd(data);
                        $('body').trigger('product:afterAddToCart', data);
                        $.spinner().stop();
                    },
                    error: function () {
                        $.spinner().stop();
                    }
                });
            }
        });
    }
};