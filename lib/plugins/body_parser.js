// Copyright 2012 Mark Cavage, Inc.  All rights reserved.

'use strict';

var assert = require('assert-plus');

var errors = require('../errors');

var bodyReader = require('./body_reader');
var jsonParser = require('./json_body_parser');
var multipartParser = require('./multipart_body_parser');


///--- Globals

var UnsupportedMediaTypeError = errors.UnsupportedMediaTypeError;


///--- API

/**
 * parse the body of an incoming request.
 * @public
 * @function bodyParser
 * @throws   {UnsupportedMediaTypeError}
 * @param    {Object} options an option object
 * @returns  {Array}
 */
function bodyParser(options) {
    assert.optionalObject(options, 'options');
    options = options || {};
    options.bodyReader = true;

    var read = bodyReader(options);
    var parseJson = jsonParser(options);
    var parseMultipart = multipartParser(options);

    function parseBody(req, res, next) {
        // Allow use of 'requestBodyOnGet' flag to allow for merging of
        // the request body of a GET request into req.params
        if (req.method === 'HEAD') {
            next();
            return;
        }

        if (req.method === 'GET') {
            if (!options.requestBodyOnGet) {
                next();
                return;
            }
        }

        if (req.contentLength() === 0 && !req.isChunked()) {
            next();
            return;
        }

        var parser;
        var type = req.contentType().toLowerCase();

        switch (type) {
            case 'application/json':
                parser = parseJson[0];
                break;
            case 'multipart/form-data':
                parser = parseMultipart;
                break;
            default:
                break;
        }

        if (parser) {
            parser(req, res, next);
        } else if (options && options.rejectUnknown) {
            next(new UnsupportedMediaTypeError(type));
        } else {
            next();
        }
    }

    return ([read, parseBody]);
}

module.exports = bodyParser;
