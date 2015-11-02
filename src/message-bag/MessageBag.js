(function() {
    'use strict';

    angular
        .module('ngValidator.message-bag', [])
        .factory('MessageBag', MessageBagFactory);

    function MessageBagFactory() {

        setErrorsBagPrototype();

        return MessageBag;

        function MessageBag() {
            var bag = new ErrorsBag;

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
         * Create a new ErrorsBag
         *
         * @constructor
         */
        function ErrorsBag() {
            this.errors = {};
        }

        function setErrorsBagPrototype() {
            /**
             * Add new error on field validation.
             *
             * @param   {string} field
             * @param   {string} message
             */
            ErrorsBag.prototype.add = function add(field, message) {
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
            ErrorsBag.prototype.hasErrors = function hasErrors() {
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
            ErrorsBag.prototype.all = function all() {
                return angular.copy(this.errors);
            };

            /**
             * Check if there are errors at field.
             *
             * @param   {string}  field
             * @returns {boolean}
             */
            ErrorsBag.prototype.has = function has(field) {
                return this.errors[field] ? true : false;
            };

            /**
             * Get first error at field.
             *
             * @param   {string}  field
             * @returns {string}
             */
            ErrorsBag.prototype.first = function first(field) {
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
            ErrorsBag.prototype.get = function get(field) {
                if (this.has(field)) {
                    return this.errors[field];
                }

                return [];
            };
        }
    }

})();
