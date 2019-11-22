'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var ProductFactory = require('*/cartridge/scripts/factories/product');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');

/**
 * Creates an array of gift certificate line items
 * @param {dw.util.Collection<dw.order.GiftCertificateLineItem>} allLineItems - All gift certificate
 * line items of the basket
 * @param {string} view - the view of the line item (basket or order)
 * @returns {Array} an array of product line items.
 */
function createGiftCertificateLineItemsObject(allLineItems, view) {
    var lineItems = [];

    collections.forEach(allLineItems, function (item) {
        // when item's category is unassigned, return a lineItem with limited attributes

        lineItems.push({
            quantity: 1,
            productName: 'Gift Certificate',
            recipient: item.recipientName,
            recipientEmail: item.recipientEmail,
            amount: item.priceValue,
            message: item.message,
            UUID: item.UUID,
            noProduct: true,
            giftCertificateCode: '',
            images:
            {
                small: [
                    {
                        url: URLUtils.staticURL('/images/gift-certificate-tab-logo.png')
                    }
                ]

            }

        });
        return;

    });
    return lineItems;
}

/**
 * Loops through all of the product line items and adds the quantities together.
 * @param {dw.util.Collection<dw.order.ProductLineItem>} items - All product
 * line items of the basket
 * @returns {number} a number representing all product line items in the lineItem container.
 */
function getTotalQuantity(items) {
    // TODO add giftCertificateLineItems quantity
    var totalQuantity = 0;
    collections.forEach(items, function (lineItem) {
        totalQuantity++;
    });

    return totalQuantity;
}

/**
 * @constructor
 * @classdesc class that represents a collection of gift certificate line items and total quantity of
 * items in current basket or per shipment
 *
 * @param {dw.util.Collection<dw.order.Gift CertificateLineItem>} giftCertificateLineItems - the gift certificate line items
 *                                                                                          of the current line item container
 * @param {string} view - the view of the line item (basket or order)
 */
function GiftCertificateLineItems(giftCertificateLineItems, view) {
    if (giftCertificateLineItems) {
        this.items = createGiftCertificateLineItemsObject(giftCertificateLineItems, view);
        this.totalQuantity = getTotalQuantity(giftCertificateLineItems);
    } else {
        this.items = [];
        this.totalQuantity = 0;
    }
}

GiftCertificateLineItems.getTotalQuantity = getTotalQuantity;

module.exports = GiftCertificateLineItems;
