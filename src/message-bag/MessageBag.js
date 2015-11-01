(function() {
    'use strict';

    angular
        .module('ngValidator.message-bag', [])
        .factory('MessageBag', MessageBagFactory);

    function MessageBagFactory() {

        function MessageBag() {
            var bag = new MessageBagContainer;

            angular.extend(this, {
                add: bag.add.bind(bag),
                has: bag.has.bind(bag),
                get: bag.get.bind(bag),
                all: bag.all.bind(bag),
                first: bag.first.bind(bag),
                hasErrors: bag.hasErrors.bind(bag)
            });
        }

        /**
         * Create a new MessageBagContainer
         *
         * @constructor
         */
        function MessageBagContainer() {
            this.errors = {};
        }

        /**
         * Add new error on field validation.
         *
         * @param   {string} field
         * @param   {string} message
         */
        MessageBagContainer.prototype.add = function add(field, message) {
            if (!(this.errors[field] instanceof Array)) {
                this.errors[field] = [];
            }

            this.errors[field].push(message);
        };

        /**
         * Check if there are any errors.
         *
         * @returns {boolean}
         */
        MessageBagContainer.prototype.hasErrors = function hasErrors() {
            for (var prop in this.errors) {
                /* istanbul ignore else */
                if (this.errors.hasOwnProperty(prop)) {
                    return true;
                }
            }

            return false;
        };

        /**
         * Get all errors.
         *
         * @returns {Object}
         */
        MessageBagContainer.prototype.all = function all() {
            return angular.copy(this.errors);
        };

        /**
         * Check if there are errors at field.
         *
         * @param   {string}  field
         * @returns {boolean}
         */
        MessageBagContainer.prototype.has = function has(field) {
            return this.errors[field] ? true : false;
        };

        /**
         * Get first error at field.
         *
         * @param   {string}  field
         * @returns {string}
         */
        MessageBagContainer.prototype.first = function first(field) {
            if (this.has(field)) {
                return this.errors[field][0];
            }

            return '';
        };

        /**
         * Get all the field errors.
         *
         * @param   {string}  field
         * @returns {Object}
         */
        MessageBagContainer.prototype.get = function get(field) {
            if (this.has(field)) {
                return this.errors[field];
            }

            return [];
        };

        return MessageBag;
    }

})();
