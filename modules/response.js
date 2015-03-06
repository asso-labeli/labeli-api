function formatResponse(res, message, data, success){
    res.send({message : message, data : data, success : success});
}

module.exports = formatResponse;