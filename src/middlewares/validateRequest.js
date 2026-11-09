import { HttpError } from '../utils/httpError.js';

export function requireFields(fields) {
  return (req, _res, next) => {
    const missing = fields.filter(
      (field) =>
        req.body?.[field] === undefined ||
        req.body[field] === null ||
        String(req.body[field]).trim() === '',
    );
    if (missing.length) {
      const details = Object.fromEntries(
        missing.map((field) => [field, 'Este campo é obrigatório.']),
      );
      return next(new HttpError(400, 'Verifique os campos obrigatórios.', details));
    }
    return next();
  };
}
