export function notFoundHandler(_req, _res, next) {
  const error = new Error('Rota não encontrada.');
  error.status = 404;
  next(error);
}

export function errorHandler(error, _req, res, _next) {
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({
    error: {
      message: status >= 500 ? 'Ocorreu um erro interno. Tente novamente.' : error.message,
      ...(error.details ? { fields: error.details } : {}),
    },
  });
}
