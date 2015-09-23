function formatResponse(res, message, data, success) {
  res.send({
    message: message,
    data: data,
    success: success
  });
}

module.exports.Code = {
  success: 1,
  notLogged: -1,
  notAdmin: -2,
  notMember: -3,
  notOwner: -4,
  notAllowed: -5,
  alreadyExist: -21,
  notFound: -22,
  invalidID: -31,
  invalidParameter: -32
}

function sendResponse(res, httpCode, data) {
  res.type('json').status(httpCode).send(data);
}

function success(res, message, data) {
  sendResponse(res, 200, {
    message: message,
    data: data,
    success: 1
  });
}

function notLogged(res) {
  sendResponse(res, 401, {
    message: 'Error : Not logged',
    data: null,
    success: -1
  });
}

function notAdmin(res) {
  sendResponse(res, 403, {
    message: "Error : You're not an admin",
    data: null,
    success: -2
  });
}

function notMember(res) {
  sendResponse(res, 403, {
    message: "Error : You're not a member",
    data: null,
    success: -3
  });
}

function notOwner(res) {
  sendResponse(res, 403, {
    message: "Error : You're not the owner",
    data: null,
    success: -4
  });
}

function notAllowed(res) {
  sendResponse(res, 403, {
    message: "Error : You're not allowed to do that",
    data: null,
    success: -5
  });
}

// Code -11 to -19
function missing(res, field, errorCode) {
  sendResponse(res, 400, {
    message: "Error : Missing " + field,
    data: null,
    success: errorCode
  });
}

function alreadyExist(res, field) {
  sendResponse(res, 409, {
    message: "Error : " + field + " already exists",
    data: null,
    success: -21
  });
}

function notFound(res, field) {
  sendResponse(res, 404, {
    message: "Error : No " + field + " found",
    data: null,
    success: -22
  });
}

function findError(res, err) {
  sendResponse(res, 500, {
    message: "MongoDB error during find()",
    data: err,
    success: -27
  });
}

function removeError(res, err) {
  sendResponse(res, 500, {
    message: "MongoDB error during remove()",
    data: err,
    success: -28
  });
}

function saveError(res, err) {
  sendResponse(res, 500, {
    message: "MongoDB error during save()",
    data: err,
    success: -29
  });
}

function invalidID(res) {
  sendResponse(res, 400, {
    message: "Error : Invalid ID",
    data: null,
    success: -31
  });
}

function serverError(res, message, data, errorCode) {
  sendResponse(res, 500, {
    message: message,
    data: data,
    success: errorCode
  });
}

function invalidParameter(res, field) {
  sendResponse(res, 400, {
    message: "Error : Invalid " + field,
    data: null,
    success: -32
  });
}

module.exports = formatResponse;
module.exports.success = success;
module.exports.notLogged = notLogged;
module.exports.notAdmin = notAdmin;
module.exports.notMember = notMember;
module.exports.notOwner = notOwner;
module.exports.notAllowed = notAllowed;
module.exports.missing = missing;
module.exports.alreadyExist = alreadyExist;
module.exports.notFound = notFound;
module.exports.findError = findError;
module.exports.removeError = removeError;
module.exports.saveError = saveError;
module.exports.invalidID = invalidID;
module.exports.invalidParameter = invalidParameter;
module.exports.serverError = serverError;
