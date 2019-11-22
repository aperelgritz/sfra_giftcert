'use strict';

var server = require('server');
var Logger = require('dw/system/Logger');
var GiftCertMgr = require('dw/order/GiftCertificateMgr');
var GiftCert = require('dw/order/GiftCertificate');
var Resource = require('dw/web/Resource');

var GiftCertificateModel = require('*/cartridge/models/giftcertificate');


server.get('Landing', server.middleware.https, function (req, res, next) {
    res.render('/giftCertificate/giftCertificateLanding');

    next();
});

server.post('Get', server.middleware.https, function (req, res, next) {
    var giftCert;

    if (req.form.giftCertCode) {
        //Logger.debug('Found req.form.giftCertCode with value: ' + req.form.giftCertCode);
        giftCert = GiftCertMgr.getGiftCertificateByCode(req.form.giftCertCode);

        if (giftCert) {

            var giftCertificateModel = new GiftCertificateModel(giftCert);

            res.render('/giftCertificate/giftCertificate', { giftcertificate: giftCertificateModel, status: 'found' });
        } else {
            res.render('/giftCertificate/giftCertificate', { giftcertificate: giftCertificateModel, status: 'not found' });
        }
    }


    next();
});

server.get('Add', server.middleware.https, function(req, res, next) {
    var giftCert = GiftCertMgr.getGiftCertificateByCode(req.querystring.giftCertCode);

    if (!giftCert) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.not.found', 'giftCertificate', null)
        });
        return next();
    }

    var giftCertStatus = giftCert.getStatus();
    var statusCodes = {
        0: 'STATUS_PENDING',
        1: 'STATUS_ISSUED',
        2: 'STATUS_PARTIALLY_REDEEMED',
        3: 'STATUS_REDEEMED'
    };

    var giftCertBalanceAndCurrency = '';
    var giftCertBalanceValue;
    var giftCertCurrency = '';
    var giftCertMessage = '';
    if (giftCertStatus === 1 || giftCertStatus === 2) {
        giftCertBalanceAndCurrency = giftCert.getBalance().toString();
        giftCertCurrency = giftCert.getBalance().getCurrencyCode();
        giftCertBalanceValue = giftCert.getBalance().getValue();
        giftCertMessage = Resource.msg('msg.status.issued.or.partially.redeemed', 'giftCertificate', null) + giftCertBalanceAndCurrency;
    } else if (giftCertStatus === 0) {
        giftCertMessage = Resource.msg('msg.status.pending', 'giftCertificate', null);
    } else if (giftCertStatus === 3) {
        giftCertMessage = Resource.msg('msg.status.redeemed', 'giftCertificate', null);
    }

    res.json({
        error: false,
        status: statusCodes[giftCertStatus],
        balanceValue: giftCertBalanceValue,
        balanceCurrency: giftCertCurrency,
        message: giftCertMessage
    });

    next();
});


module.exports = server.exports();