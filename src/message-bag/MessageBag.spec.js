describe('MessageBag', function() {
    var MessageBag;
    var bag;

    var field;
    var error;

    beforeEach(function() {
        module('ngValidator.message-bag');

        inject(function(_MessageBag_) {
            MessageBag = _MessageBag_;
        });

        bag = new MessageBag;

        field = 'field';
        error = 'error';
    });

    describe('get all errors', function() {
        it('should return all errors', function() {
            bag.all().should.deep.equal({});
        });

        it('should not return reference to errors', function() {
            bag.all().should.not.equal(bag.all());
        });
    });

    describe('add new error', function() {
        it('should add new error', function() {
            bag.add(field, error);

            bag.get(field).should.contain(error);
        });
    });

    describe('detect errors', function() {
        it('should return false when no errors', function() {
            bag.hasErrors().should.equal(false);
        });

        it('should return true if there are some errors', function() {
            bag.add('some', true);

            bag.hasErrors().should.equal(true);
        });
    });


    describe('get first error', function() {
        it('should return empty string when no errors', function() {
            bag.first(field).should.equal('');
        });

        it('should return first error from type', function() {
            bag.add(field, error);
            bag.add(field, error + error);

            bag.first(field).should.equal(error);
        });
    });

    describe('get all errors of type', function() {
        it('should return empty array when no errors', function() {
            bag.get(field).should.deep.equal([]);
        });

        it('should return all errors of type', function() {
            bag.add(field, error);
            bag.add(field, error + error);

            bag.get(field).should.deep.equal([error, error + error]);
        });
    });

});