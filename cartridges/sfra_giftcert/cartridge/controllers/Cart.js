'use strict';

var server = require('server');
var Logger = require('dw/system/Logger');
server.extend(module.superModule);


server.append('AddProduct', function(req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');

    var collections = require('*/cartridge/scripts/util/collections');

    var currentBasket = BasketMgr.getCurrentOrNewBasket();

    if (currentBasket) {
        Transaction.wrap(function () {
            // Remove gift certificate already in the basket - Keeps the implementation simpler
            if (!currentBasket.giftCertificateLineItems.empty) {
                collections.forEach(currentBasket.giftCertificateLineItems, function (giftCertLineItem) {
                    currentBasket.removeGiftCertificateLineItem(giftCertLineItem);
                });
            }
        })
    }
    next();
});


server.replace('MiniCart', server.middleware.include, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');

    var currentBasket = BasketMgr.getCurrentBasket();
    var quantityTotal;
    var prodQuantityTotal;
    var giftCertQuantityTotal;

    // Check if gift certificates are in the basket, and add to total
    if (currentBasket) {
        prodQuantityTotal = currentBasket.productQuantityTotal;
        if (!currentBasket.giftCertificateLineItems.empty) {
            giftCertQuantityTotal = currentBasket.giftCertificateLineItems.length;
            quantityTotal = prodQuantityTotal + giftCertQuantityTotal;
        } else {
            quantityTotal = prodQuantityTotal;
        }
    } else {
        quantityTotal = 0;
    }

    res.render('/components/header/miniCart', { quantityTotal: quantityTotal });
    next();
});


server.post('AddGiftCert', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');
    var Transaction = require('dw/system/Transaction');
    var GiftCertificateLineItem = require('dw/order/GiftCertificateLineItem');
    var CartModel = require('*/cartridge/models/cart');
    var ProductLineItemsModel = require('*/cartridge/models/productLineItems');
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var giftCertRecipient = req.form.giftCertTo;
    var giftCertEmail = req.form.giftCertEmail;
    var giftCertAmount = parseInt(req.form.giftCertAmount, 10);
    var giftCertMessage;
    req.form.giftCertMessage ? giftCertMessage = req.form.giftCertMessage : giftCertMessage = "";
    var quantity;
    var result;

    if (currentBasket) {
        Transaction.wrap(function () {
            if (giftCertEmail && giftCertAmount) {
                quantity = 1;
                result = cartHelper.addGiftCertToCart(
                    currentBasket,
                    giftCertRecipient,
                    giftCertEmail,
                    giftCertAmount,
                    giftCertMessage,
                    quantity
                );
            } else {
                res.render('/giftCertificate/giftCertificate');
                next();
            }
            if (!result.error) {
                cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
                basketCalculationHelpers.calculateTotals(currentBasket);
            }
        });
    }

    var quantityTotal = 1;

    var cartModel = new CartModel(currentBasket);

    res.json({
        quantityTotal: 1,
        message: result.message,
        cart: cartModel,
        newBonusDiscountLineItem: {},
        error: result.error,
        pliUUID: result.uuid,
        minicartCountOfItems: Resource.msgf('minicart.count', 'common', null, quantityTotal)
    });

    next();
});


server.get('RemoveGiftCertLineItem', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var CartModel = require('*/cartridge/models/cart');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        return next();
    }

    var isGiftCertLineItemFound = false;

    Transaction.wrap(function () {
        if (req.querystring.uuid) {
            var giftCertLineItems = currentBasket.getGiftCertificateLineItems();

            for (var i = 0; i < giftCertLineItems.length; i++) {
                var item = giftCertLineItems[i];

                if ((item.UUID === req.querystring.uuid)) {
                    var shipmentToRemove = item.shipment;
                    currentBasket.removeGiftCertificateLineItem(item);
                    if (shipmentToRemove.productLineItems.empty && !shipmentToRemove.default) {
                        currentBasket.removeShipment(shipmentToRemove);
                    }
                    isGiftCertLineItemFound = true;
                    break;
                }
            }
        }
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    if (isGiftCertLineItemFound) {
        var basketModel = new CartModel(currentBasket);
        var basketModelPlus = {
            basket: basketModel
        };
        res.json(basketModelPlus);
    } else {
        res.setStatusCode(500);
        res.json({ errorMessage: Resource.msg('error.cannot.remove.product', 'cart', null) });
    }

    return next();
});

module.exports = server.exports();