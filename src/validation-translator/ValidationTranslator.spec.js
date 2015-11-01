describe('ValidationTranslator', function() {
    var sut;

    var validationTranslatorLang;
    var validationTranslatorConfig;

    var onlyFallback;

    beforeEach(function() {
        validationTranslatorLang = {locale: 'fr', fallback: 'en'};
        validationTranslatorConfig = getMockConfig();

        onlyFallback = 'not present in FR';

        module('ngValidator.validation-translator', function($provide) {
            $provide.value('validationTranslatorLang', validationTranslatorLang);
            $provide.value('validationTranslatorConfig', validationTranslatorConfig);
        });

        inject(function(_ValidationTranslator_) {
            sut = _ValidationTranslator_;
        });
    });

    it('should return key when translation is not found', function() {
        sut.trans('not').should.equal('not');
    });

    it('should return translation of fallback if not found at main language', function() {
        sut.trans('onlyFallback').should.equal(onlyFallback);
    });

    it('should get values from config', function() {
        sut.trans('hello').should.equal('hello-fr');
        sut.trans('nested.value').should.equal('value-fr');
    });

    function getMockConfig() {
        return {
            fr: {
                hello: 'hello-fr',
                nested: {
                    value: 'value-fr'
                }
            },
            en: {
                hello: 'hello',
                onlyFallback: onlyFallback
            }
        }
    }
});