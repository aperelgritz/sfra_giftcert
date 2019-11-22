'use strict';

var collections = require('*/cartridge/scripts/util/collections');

var PaymentInstrument = require('dw/order/PaymentInstrument');
var PaymentMgr = require('dw/order/PaymentMgr');
var GiftCertMgr = require('dw/order/GiftCertificateMgr');
var GiftCert = require('dw/order/GiftCertificate');
var PaymentStatusCodes = require('dw/order/PaymentStatusCodes');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');

/**
 * Creates a token. This should be replaced by utilizing a tokenization provider
 * @returns {string} a token
 */
function createToken() {
    return Math.random().toString(36).substr(2);
}

/**
 * Verifies that entered credit card information is a valid card. If the information is valid a
 * credit card payment instrument is created
 * @param {dw.order.Basket} basket Current users's basket
 * @param {Object} paymentInformation - the payment information
 * @return {Object} returns an error object
 */
function Handle(basket, paymentInformation) {
    var currentBasket = basket;
    var cardErrors = {};
    //var cardNumber = paymentInformation.cardNumber.value;
    //var cardSecurityCode = paymentInformation.securityCode.value;
    //var expirationMonth = paymentInformation.expirationMonth.value;
    //var expirationYear = paymentInformation.expirationYear.value;
    var serverErrors = [];
    var creditCardStatus;

    //var cardType = paymentInformation.cardType.value;
    //var paymentCard = PaymentMgr.getPaymentCard(cardType);
    //var paymentCard = PaymentMgr.getPaymentCard(cardType);

    /*
    if (!paymentInformation.creditCardToken) {
        if (paymentCard) {
            creditCardStatus = paymentCard.verify(
                expirationMonth,
                expirationYear,
                cardNumber,
                cardSecurityCode
            );
        } else {
            cardErrors[paymentInformation.cardNumber.htmlName] =
                Resource.msg('error.invalid.card.number', 'creditCard', null);

            return { fieldErrors: [cardErrors], serverErrors: serverErrors, error: true };
        }

        if (creditCardStatus.error) {
            collections.forEach(creditCardStatus.items, function (item) {
                switch (item.code) {
                    case PaymentStatusCodes.CREDITCARD_INVALID_CARD_NUMBER:
                        cardErrors[paymentInformation.cardNumber.htmlName] =
                            Resource.msg('error.invalid.card.number', 'creditCard', null);
                        break;

                    case PaymentStatusCodes.CREDITCARD_INVALID_EXPIRATION_DATE:
                        cardErrors[paymentInformation.expirationMonth.htmlName] =
                            Resource.msg('error.expired.credit.card', 'creditCard', null);
                        cardErrors[paymentInformation.expirationYear.htmlName] =
                            Resource.msg('error.expired.credit.card', 'creditCard', null);
                        break;

                    case PaymentStatusCodes.CREDITCARD_INVALID_SECURITY_CODE:
                        cardErrors[paymentInformation.securityCode.htmlName] =
                            Resource.msg('error.invalid.security.code', 'creditCard', null);
                        break;
                    default:
                        serverErrors.push(
                            Resource.msg('error.card.information.error', 'creditCard', null)
                        );
                }
            });

            return { fieldErrors: [cardErrors], serverErrors: serverErrors, error: true };
        }
    }
    */


    Transaction.wrap(function () {
        //var paymentInstruments = currentBasket.getPaymentInstruments(
        //    PaymentInstrument.METHOD_GIFT_CERTIFICATE
        //);

        // Get all payment instruments, instead of only METHOD_CREDIT_CARD
        var paymentInstruments = currentBasket.getPaymentInstruments();

        collections.forEach(paymentInstruments, function (item) {
            currentBasket.removePaymentInstrument(item);
        });

        var basketTotalGrossPrice = currentBasket.totalGrossPrice.value;
        //require('dw/system/Logger').debug('basketTotalGrossPrice: ' + basketTotalGrossPrice + ' Type: ' + typeof(basketTotalGrossPrice));
        var giftCertBalance = GiftCertMgr.getGiftCertificateByCode(paymentInformation.giftCertCode.value).getBalance().getValue();
        //var giftCertBalance = giftCert.getBalance().getValue();
        //require('dw/system/Logger').debug('giftCertBalance: ' + giftCertBalance + ' Type: ' + typeof(giftCertBalance));

        if (giftCertBalance >= basketTotalGrossPrice) {
            var paymentInstrument = currentBasket.createPaymentInstrument(
                PaymentInstrument.METHOD_GIFT_CERTIFICATE, currentBasket.totalGrossPrice
            );
        } else {
            cardErrors[paymentInformation.giftCertCode.value] = 'Gift Cert has lower balance ('+giftCertBalance+') than the basket totalGrossPrice ('+basketTotalGrossPrice+').';
            return { fieldErrors: [cardErrors], serverErrors: serverErrors, error: true };
        }

        paymentInstrument.setGiftCertificateCode(paymentInformation.giftCertCode.value);
        /*
        paymentInstrument.setCreditCardHolder(currentBasket.billingAddress.fullName);
        paymentInstrument.setCreditCardNumber(cardNumber);
        paymentInstrument.setCreditCardType(cardType);
        paymentInstrument.setCreditCardExpirationMonth(expirationMonth);
        paymentInstrument.setCreditCardExpirationYear(expirationYear);
        paymentInstrument.setCreditCardToken(
            paymentInformation.creditCardToken
                ? paymentInformation.creditCardToken
                : createToken()
        );
        */
    });

    return { fieldErrors: cardErrors, serverErrors: serverErrors, error: false };
}

/**
 * Authorizes a payment using a gift certificate.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
    var serverErrors = [];
    var fieldErrors = {};
    var error = false;
    var giftCertStatus;

    try {
        Transaction.wrap(function () {
            paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
            paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
            giftCertStatus = GiftCertMgr.redeemGiftCertificate(paymentInstrument);
            //TODO get status
        });
    } catch (e) {
        error = true;
        serverErrors.push(
            Resource.msg('error.technical', 'checkout', null)
        );
    }

    return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
exports.createToken = createToken;
