'use strict';

/**
 * @constructor
 * @classdesc The gift certificate model
 * @param {dw.order.GiftCertificate} giftCertificateObject - a GiftCertificate object
 * @param {string} status
 */
function giftCertificate(giftCertificateObject, status) {
    if (giftCertificateObject) {
        this.amount = giftCertificateObject.amount;
        this.balance = giftCertificateObject.balance;
        this.enabled = giftCertificateObject.enabled;
    }

    if (status) {
        this.status = status;
    }
}

module.exports = giftCertificate;
