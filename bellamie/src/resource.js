
// "Base class" from which the individual resources "inherit". I mean. That's not how it actually
// works, but think about it that way.

import r from "rethinkdb";
import winston from "winston";
import _ from "underscore";

export default class Resource {

  // TODO: dumbest filtering implementation ever, it loads every single row then filters with
  // underscore
  index(req, res, next) {
    let filter;
    if (req.query.filter) {
      try {
        filter = JSON.parse(req.query.filter);
      }
      catch (e) {
        res.status(400);
        res.json({
          code: "MALFORMED_REQUEST",
          message: "The 'filter' parameter must be in JSON format."
        });
        res.end();
        return;
      }
    }
    r.table(this.name).run(req.conn)
    .then(function(cursor) {
      return cursor.toArray();
    })
    .then(function(docs) {
      if (filter) {
        docs = _(docs).where(filter);
      }
      res.status(200);
      res.json(docs);
      next();
    })
    .catch(function(err) {
      res.status(500);
      res.json({
        code: "DATABASE_ERROR",
        message: JSON.stringify(err)
      });
      next();
    });
  }

  get(req, res, next) {
    r.table(this.name).get(req.params.id).run(req.conn)
    .then(function(doc) {
      if (doc) {
        res.status(200);
        res.json(doc);
      }
      else {
        res.status(404);
        res.json({
          code: "NOT_FOUND",
          message: "The specified resource was not found."
        });
      }
      next();
    })
    .catch(function(err) {
      res.status(500);
      res.json({
        code: "DATABASE_ERROR",
        message: JSON.stringify(err)
      });
      next();
    });
  }

  post(req, res, next) {
    r.table(this.name).insert(req.body).run(req.conn)
    .then(({generated_keys}) => {
      // TODO: error handling
      return r.table(this.name).get(generated_keys[0]).run(req.conn);
    })
    .then(function(doc) {
      res.status(201);
      res.json(doc);
      next();
    })
    .catch(function(err) {
      res.status(500);
      res.json({
        code: "DATABASE_ERROR",
        message: JSON.stringify(err)
      });
      next();
    });
  }

  put(req, res, next) {
    r.table(this.name).get(req.params.id).update(req.body).run(req.conn)
    .then((stuff) => {
      if (stuff.errors > 0) {
        throw new Error("Error in r.update()");
      }
      if (stuff.skipped > 0) {
        res.status(404);
        return {
          code: "NOT_FOUND",
          message: "The specified resource was not found."
        };
      }
      res.status(200);
      return r.table(this.name).get(req.params.id).run(req.conn);
    })
    .then(function(stuff) {
      res.json(stuff);
      next();
    })
    .catch(function(err) {
      res.status(500);
      res.json({
        code: "DATABASE_ERROR",
        message: err.message
      });
      next();
    });
  }

  delete(req, res, next) {
    r.table(this.name).get(req.params.id).delete(req.body).run(req.conn)
    .then(function(stuff) {
      if (stuff.errors > 0) {
        res.status(500);
        res.json({
          code: "DATABASE_ERROR",
          message: "Error when attempting to delete resource"
        });
        res.end();
        return next();
      }
      if (stuff.skipped > 0) {
        res.status(404);
        res.json({
          code: "NOT_FOUND",
          message: "The specified resource was not found."
        });
        res.end();
        return next();
      }
      res.status(204);
      res.end();
      next();
    })
    .catch(function(err) {
      res.status(500);
      res.json({
        code: "DATABASE_ERROR",
        message: JSON.stringify(err)
      });
      next();
    });
  }

  /**
   * Real simple. Just takes an object of properties. This lets us "subclass" real easy.
   */
  constructor(props) {
    Object.keys(props).forEach((key) => {
      this[key] = props[key];
    });
  }

  /**
   * Make sure they're allowed to do the thing that they're doing.
   * @param  {[type]}   req  [description]
   * @param  {[type]}   res  [description]
   * @param  {Function} next [description]
   * @return {[type]}        [description]
   */
  auth (req, res, next) {
    next();
  }

  validate (req, res, next) {
    next();
  }

  beforeSave (req, res, next) {
    next();
  }

  save (req, res, next) {
    next();
  }

  postSave (req, res, next) {
    next();
  }
}
