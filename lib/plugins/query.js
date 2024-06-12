// Copyright 2012 Mark Cavage, Inc.  All rights reserved.

'use strict';

var qs = require('querystring');
var assert = require('assert-plus');

var OLD_QS_OPTIONS = {
    allowDots: assert.optionalBool,
    arrayLimit: assert.optionalNumber,
    depth: assert.optionalNumber,
    parameterLimit: assert.optionalNumber,
    parseArrays: assert.optionalBool,
    plainObjects: assert.optionalBool,
    strictNullHandling: assert.optionalBool

    /*
     * Exclusions (`qs.parse` options that restify does NOT expose):
     * - `allowPrototypes`: It is strongly suggested against in qs docs.
     * - `decoder`
     * - `delimiter`: For query string parsing we shouldn't support anything
     *   but the default '&'.
     */
};

var REMOVED_QS_OPTIONS = [ 'arrayLimit', 'depth' ];

var EXPOSED_QS_OPTIONS = {
    parameterLimit: assert.optionalNumber,
};

/**
 * Returns a plugin that will parse the query string, and merge the results
 * into req.query.
 *
 * Unless options.mapParams is false, they will also be mapped into req.params.
 * @public
 * @function queryParser
 * @param    {Object}   options an options object
 * @returns  {Function}
 */
function queryParser(options) {
    if (!options) {
        options = {};
    }
    assert.object(options, 'options');

    REMOVED_QS_OPTIONS.forEach(function (k) {
        if (options.hasOwnProperty(k)) {
            throw new Error(k + ' is no longer supported');
        }
    });

    if (options.hasOwnProperty('allowDots') && options.allowDots != false) {
        throw new Error('allowDots is not supported');
    }

    if (options.hasOwnProperty('parseArrays') && options.parseArrays != false) {
        throw new Error('parseArrays is not supported');
    }

    if (options.hasOwnProperty('plainObjects') && options.plainObjects !== true) {
        throw new Error('only plainObjects are supported');
    }

    if (options.hasOwnProperty('strictNullHandling') && options.strictNullHandling != false) {
        throw new Error('strictNullHandling is not supported');
    }

    var qsOptions = {
        /*
         * NOTE plainObjects is the default with `querystring`, other options
         * that were the default in previous versions are not supported.
         */
    };
    Object.keys(EXPOSED_QS_OPTIONS).forEach(function (k) {
        EXPOSED_QS_OPTIONS[k](options[k], k); // assert type of this option

        if (options.hasOwnProperty(k)) {
            qsOptions[k] = options[k];
        }
    });

    // convert parameterLimit into maxKeys
    if (qsOptions.hasOwnProperty('parameterLimit')) {
        qsOptions.maxKeys = qsOptions.parameterLimit;
        delete qsOptions.parameterLimit;
    }

    function parseQueryString(req, res, next) {
        if (!req.getQuery()) {
            req.query = {};
            return (next());
        }

        req.query = qs.parse(req.getQuery(), '&', '=', qsOptions);

        if (options.mapParams !== false) {
            Object.keys(req.query).forEach(function (k) {
                if (req.params[k] && !options.overrideParams) {
                    return (false);
                }

                req.params[k] = req.query[k];
                return (true);
            });
        }

        return (next());
    }

    return (parseQueryString);
}

module.exports = queryParser;
