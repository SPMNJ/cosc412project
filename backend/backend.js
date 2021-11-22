var ss = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/1gtm04EO-5v6T-j1IPAj_q6sH5rcmdk98CfVS78nvtkQ/edit")
var sheet = ss.getSheets()[0];
var mainheaders = {
    "Connection": "keep-alive",
    "Pragma": "no-cache",
    "Cache-Control": "no-cache",
    "sec-ch-ua": '"Google Chrome";v="87", " Not;A Brand";v="99", "Chromium";v="87"',
    "Accept": "application/json, text/plain, */*",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
    "Authorization": "Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NzY4NjMyNjMsImZ1bGxOYW1lIjoiY291cG9uV2ViVXNlcnNfU1IiLCJpYXQiOjE2MTkxODMyNjMsImlzcyI6IkRpZ2l0YWwgQ291cG9ucyB2MyJ9.TOwM17VHblG-YITQhI7rNHcBKl2Vwf3l1AMwDS3m7Qmiq7AUfK4Cz_ft14AIvok2QFbpJ52A16exN51XrSKyDA",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "Windows",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
    "Content-Type": "application/json",
    "Origin": "https://coupons.shoprite.com/",
    "Sec-Fetch-Site": "cross-site",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty",
    "Referer": "https://coupons.shoprite.com/",
  };
function doGet(e) {
  var responce;
  var request = e.parameter;
  if (request.type == "coupons") {
    try{
      fetchstuff(request.id)
      responce = respond(200, "All Digital Coupons Added!");
    }
    catch (error){
      responce = respond(400, "" + error);
    }
  }
  else if (request.type == "login") {
    try {
      responce = respond(200,login(request.id))
    }
    catch (error) {
      responce = respond(400, "" + error);
    }
  }
  else if (request.type == "loadcontent") {
    if (request.page == "login") {
      responce = respond(200, HtmlService.createHtmlOutputFromFile("login").getContent());
    }
    else if (request.page == "profile") {
      responce = respond(200, HtmlService.createHtmlOutputFromFile("profile").getContent());
    }
    else {
      responce = respond(400, "Invalid Page");
    }
  }
  
  else { //No Requests
    responce = respond(400, "Bad Request: No type included");
  }
  return ContentService.createTextOutput(request.type + "(" + responce + ")").setMimeType(ContentService.MimeType.JAVASCRIPT); //Line that returns the code
}

function login(id){
  if (id.length <= 10) {
    throw Error("Phone Numbers are currently disabled, Please Use your Price Plus Card!");
  }
  var data = {
    "ppc": id
  }
  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'headers': mainheaders,
    // Convert the JavaScript object to a JSON string.
    'payload': JSON.stringify(data),
    'contentLength': JSON.stringify(data).length
  };
  var response = UrlFetchApp.fetch('https://digitalcoupons-api-v3-prod.azurewebsites.net/api/v3/auth/login', options);
  if (response.getResponseCode() != "201") {
    throw Error("Invalid ShopRite Card, Might have to check Customer Service");
  }
  var password = JSON.parse(response.getContentText("UTF-8"));
  var tempheader = mainheaders;
  tempheader["Authorization"] = "Bearer " + password.access_token;
  return JSON.stringify({
    ppc_id: id,
    session_id: tempheader["Authorization"]
  });
}

function respond(code, msg) {
  return JSON.stringify({
    status: code,
    message: msg
  });
}

function fetchstuff(id) {
  Logger.log(id);
  if (id.length <= 10) {
    throw Error("Phone Numbers are currently disabled, Please Use your Price Plus Card!");
    var data = {
      "ppc": "phoneppc"
    }
    var options = {
      'method': 'put',
      'contentType': 'application/json',
      'headers': mainheaders,
      // Convert the JavaScript object to a JSON string.
      'payload': JSON.stringify(data),
      'contentLength': JSON.stringify(data).length
    };
    var response = UrlFetchApp.fetch('https://digitalcoupons-api-v3-prod.azurewebsites.net/api/v3/auth/login', options);
    var password = JSON.parse(response.getContentText("UTF-8"));
    var tempheader = mainheaders;
    tempheader["Authorization"] = "Bearer  " + password.token;
    tempheader["phone_number"] = id;
    tempheader["fsn"] = "phoneppc";
    var options2 = {
      'method': 'post',
      'contentType': 'application/json',
      'headers': tempheader
      // Convert the JavaScript object to a JSON string.
    };
    var response2 = UrlFetchApp.fetch('https://digitalcoupons-api-v3-prod.azurewebsites.net/api/v3/coupons/phoneppc', options2);
    Logger.log(response2);
    var temp = response2.getResponseCode();
    var ppc = JSON.parse(response2.getContentText("UTF-8"));
    if (ppc.ppc == 'ACCT_NOT_FOUND') {
      throw Error("Invalid Phone Number");
    }
    else if (ppc.ppc == 'MULTI_ACCTS_FOUND') {
      throw Error("Multiple Phone Numbers! See ShopRite Customer Service")
    }
    var id = ppc.ppc;
    
  }
  var data = {
    "ppc": id
  }
  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'headers': mainheaders,
    // Convert the JavaScript object to a JSON string.
    'payload': JSON.stringify(data),
    'contentLength': JSON.stringify(data).length
  };
  var response = UrlFetchApp.fetch('https://digitalcoupons-api-v3-prod.azurewebsites.net/api/v3/auth/login', options);
  if (response.getResponseCode() != "201") {
    throw Error("Invalid ShopRite Card, Might have to check Customer Service");
  }
  var password = JSON.parse(response.getContentText("UTF-8"));
  var tempheader = mainheaders;
  tempheader["Authorization"] = "Bearer " + password.access_token;
  var options = {
    'method': 'get',
    'headers': tempheader,
  }
  UrlFetchApp.fetch('https://digitalcoupons-api-v3-prod.azurewebsites.net/api/v3/shoprite/coupons/storeId/1627666', options)
  var response = UrlFetchApp.fetch('https://digitalcoupons-api-v3-prod.azurewebsites.net/api/v3/shoprite/coupons/available', options)
  var coupons = JSON.parse(response);  
  coupons.forEach(obj => {
    if (obj.clipped) {
      return null;
    }
    var data = {
      "coupon_id": obj.coupon_id,
    "clip_token": obj.clip_token,
    }
    var options = {
      'method': 'post',
      'headers': tempheader,
      'payload': JSON.stringify(data),
      'contentLength': JSON.stringify(data).length
    }
    UrlFetchApp.fetch('https://digitalcoupons-api-v3-prod.azurewebsites.net/api/v3/shoprite/coupons/clip', options)
  })

  return null;
}

function test() {
  fetchstuff("47103619169");
}

function loadAllPPCs() {
  shuffleSheet();
  var ppcs = sheet.getRange("A1:A").getValues();
  ppcs.forEach(obj => {
    if(obj[0] == ""){
      return null;
    }
    try {
      fetchstuff(obj[0].toString());
      Logger.log("Successfully added:" + obj[0])
    }
    catch (e){
      Logger.log(obj[0]+": "+e);
    }
  })
}
function shuffleSheet() {
  var range = sheet.getDataRange();
  range.setValues(shuffleArray(range.getValues()));    
}    

function shuffleArray(array) {
  var i, j, temp;
  for (i = array.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}