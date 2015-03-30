'use strict';

describe('MessageBag factory', function () {
    var MessageBag;

    beforeEach(module('ngValidator.message-bag'));

    beforeEach(inject(function (_MessageBag_) {
        MessageBag = _MessageBag_;
    }));

    it('can get an instance of my factory', function () {
        expect(MessageBag).toBeDefined();
    });

    describe('instance', function () {
        var bag;

        beforeEach(function(){
            bag = new MessageBag;
        });

        it('should have all the prototypes', function () {
            expect(bag.add).toBeDefined();
            expect(bag.all).toBeDefined();
            expect(bag.has).toBeDefined();
            expect(bag.get).toBeDefined();
            expect(bag.first).toBeDefined();
            expect(bag.hasErrors).toBeDefined();
        });

        it('has no messages at load', function () {
            expect(bag.errors).toBeDefined();

            expect(Object.keys(bag.errors).length).toEqual(0);
        });

        it('add should add new messages', function () {
            bag.add('a', 'a');

            expect(Object.keys(bag.errors).length).toEqual(1);
        });

        it('should detect if there are any errors', function () {
            expect(bag.hasErrors()).toBeFalsy();

            bag.add('a', 'a');

            expect(bag.hasErrors()).toBeTruthy();
        });

        it('should detect if there are errors on field', function () {
            expect(bag.has('a')).toBeFalsy();

            bag.add('a', 'a');

            expect(bag.has('a')).toBeTruthy();
        });

        it('should return array of errors on field', function () {
            expect(bag.get('a')).toEqual([]);

            bag.add('a', 'a');

            expect(bag.get('a')).toEqual(['a']);
            expect(bag.get('a').length).toEqual(1);
        });

        it('should return object with all errors', function () {
            bag.add('a', 'a');
            bag.add('b', 'b');

            expect(bag.all()).toEqual({a: ['a'], b: ['b']});
        });

        it('should be able to get first error on field', function() {
            bag.add('a', 'a');
            bag.add('b', 'b');

            expect(bag.first('a')).toEqual('a');
        });

    });

});