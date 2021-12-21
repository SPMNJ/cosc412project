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
  var htmlresponse;
  var request = e.parameter;
  if (request.type == "coupons") {
    try {
      fetchstuff(request.id)
      htmlresponse = respond(200, "All Digital Coupons Added!");
    }
    catch (error) {
      htmlresponse = respond(400, "" + error);
    }
  }
  else if (request.type == "login") {
    try {
      htmlresponse = respond(200, login(request.id))
    }
    catch (error) {
      htmlresponse = respond(400, "" + error);
    }
  }
  else if (request.type == "loadcontent") {
    if (request.page == "login") {
      htmlresponse = respond(200, HtmlService.createHtmlOutputFromFile("login").getContent());
    }
    else if (request.page == "profile" && request.coupon_auth) {
      console.log(request.coupon_auth)
      console.time("Pagebuild")
      var output = HtmlService.createTemplateFromFile("profile");
      output.coupons = getcoupons(request.coupon_auth.replace("%20", " "))
      htmlresponse = respond(200, output.evaluate().getContent());
      console.log("It took %s to load pass page for " + request.id, console.timeEnd("Pagebuild"));
    }
    else {
      htmlresponse = respond(400, "Invalid Page");
    }
  }

  else if (request.type == "clip") {
    if (request.coupon_id && request.clip_token && request.coupon_auth) {
      var tempheader = mainheaders;
      tempheader["Authorization"] = request.coupon_auth.replace("%20", " ");
      var data = {
        "coupon_id": request.coupon_id,
        "clip_token": request.clip_token,
      }
      var options = {
        'method': 'post',
        'headers': tempheader,
        'payload': JSON.stringify(data),
        'contentLength': JSON.stringify(data).length,
      }
      try {
        var response = UrlFetchApp.fetch('https://digitalcoupons-api-v3-prod.azurewebsites.net/api/v3/shoprite/coupons/clip', options);
        htmlresponse = respond(response.getResponseCode(), response.getContentText())
      }
      catch (error) {
        htmlresponse = respond(400, "" + error);
      }
    }
  }

  else { //No Requests
    htmlresponse = respond(400, "Bad Request: No type included");
  }
  return ContentService.createTextOutput(request.type + "(" + htmlresponse + ")").setMimeType(ContentService.MimeType.JAVASCRIPT); //Line that returns the code
}

function login(id) {
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
  Logger.log(response)
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
  Logger.log(coupons)
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

function getcoupons(auth) {
  var tempheader = mainheaders;
  tempheader["Authorization"] = auth;
  var options = {
    'method': 'get',
    'headers': tempheader,
  }
  UrlFetchApp.fetch('https://digitalcoupons-api-v3-prod.azurewebsites.net/api/v3/shoprite/coupons/storeId/1627666', options)
  var response = UrlFetchApp.fetch('https://digitalcoupons-api-v3-prod.azurewebsites.net/api/v3/shoprite/coupons/available', options)
  var coupons = JSON.parse(response);
  return coupons
}


function test() {
  dad = getcoupons("Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NzEwMzYxOTE2OSIsImh0dHBzOi8vd3d3Mi53YWtlZmVybi5jb20vY2xpcF9zb3VyY2UiOiJTUl9XRUIiLCJpYXQiOjE2NDAwMjc2NjksImV4cCI6MTY0MDExNDA2OSwiaXNzIjoiRGlnaXRhbCBDb3Vwb25zIHYzIn0.k6wm4csgRFhhri2XObGkRbkM8NfSPRxWbIq4QOAcz1hlbWGo44XK6ygCLgLrTbPmac3DvuvQ-Q2_AbbbmkLbiQ")
  var output = HtmlService.createTemplateFromFile("profile");
  output.coupons = dad
  htmlresponse = respond(200, output.evaluate().getContent());
}

function loadAllPPCs() {
  shuffleSheet();
  var ppcs = sheet.getRange("A1:A").getValues();
  ppcs.forEach(obj => {
    if (obj[0] == "") {
      return null;
    }
    try {
      fetchstuff(obj[0].toString());
      Logger.log("Successfully added:" + obj[0])
    }
    catch (e) {
      Logger.log(obj[0] + ": " + e);
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