'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./giftCertificate/giftCert'));
    processInclude(require('./checkout/giftCertificate'));
});
