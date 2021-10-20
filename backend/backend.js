function doGet(e) {
    var response;
    var request = e.parameter;
    //TODO: #21 Add the necessary request types to backend
    response = respond(200, "Ping");
    return ContentService.createTextOutput(request.type + "(" + responce + ")").setMimeType(ContentService.MimeType.JAVASCRIPT); //Line that returns the code
}
function respond(code, msg) {
    return JSON.stringify({
        status: code,
        message: msg
    });
}
