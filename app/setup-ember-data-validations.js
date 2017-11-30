import DS from 'ember-data';
import Validator from 'json-api-validations/-private/validator';
import { singularize, dasherize } from 'ember-inflector';

const { Store } = DS;

export default function setupEmberDataValidations(_Store = Store) {
  _Store.reopen({
    init() {
      this._super();
      let store = this;

      this.__validator = new Validator({
        disallowOnlyMetaDocument() {
          return 'ember-data does not enable json-api documents containing only `meta` as a member to be pushed to the store.';
        },
        formatType(type) {
          return dasherize(type);
        },
        // used to check for a schema by a slightly different name to be friendly
        formatFallbackType(type) {
          return singularize(dasherize(type));
        },
        isSubclassOf(subclassType, type) {
          try {
            let a = store.modelFor(type);
            let b = store.modelFor(subclassType);

            return a.detect(b);
          } catch (e) {
            return false;
          }
        },
        schemaFor(type) {
          let modelClass;

          try {
            modelClass = store.modelFor(type);
          } catch (e) {
            return undefined;
          }

          const schema = {

          };
          modelClass.eachRelationship((name, meta) => {
            let kind = meta.kind;
            schema[kind] = schema[kind] || [];
            schema[kind].push({
              key: name,
              schema: meta.type,
            });
          });
          modelClass.eachAttribute((name /*, meta*/) => {
            schema.attr = schema.attr || [];
            schema.attr.push(name);
          });

          return schema;
        }
      });
    },

    _push(jsonApiDocument) {
      this.__validator.validateDocument(jsonApiDocument);
      return this._super(jsonApiDocument);
    }
  });
}