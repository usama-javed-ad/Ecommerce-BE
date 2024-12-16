export function findOrFail(schema) {
    schema.pre(
      ['findOneAndUpdate', 'findOne', 'findOneAndDelete'],
      function (next) {
        if (!this.options.orNull) {
          this.orFail();
        }
        next();
      },
    );
  }
  
  export function newDocumentOnUpdate(schema) {
    schema.pre(
      [
        'update',
        'findOneAndUpdate',
        'findOneAndReplace',
        'updateOne',
        'updateMany',
        'replaceOne',
        'findByIdAndUpdate',
      ],
      function (next) {
        this.setOptions({ new: true });
        next();
      },
    );
  }
  
  export function incrementVersionOnUpdate(schema) {
    schema.pre(
      [
        'update',
        'findOneAndUpdate',
        'findOneAndReplace',
        'updateOne',
        'updateMany',
        'replaceOne',
        'findByIdAndUpdate',
      ],
      function (next) {
        const update = this.getUpdate();
        if (update.__v != null) {
          delete update.__v;
        }
        const keys = ['$set', '$setOnInsert'];
        for (const key of keys) {
          if (update[key]?.__v != null) {
            delete update[key].__v;
            if (Object.keys(update[key]).length === 0) {
              delete update[key];
            }
          }
        }
        update.$inc = update.$inc || {};
        update.$inc.__v = 1;
        next();
      },
    );
    schema.post(
      [
        'update',
        'findOneAndUpdate',
        'findOneAndReplace',
        'updateOne',
        'updateMany',
        'replaceOne',
        'findByIdAndUpdate',
      ],
      function (_, next) {
        next();
      },
    );
  }
  