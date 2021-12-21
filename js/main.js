var url = "https://script.google.com/macros/s/AKfycbwz6lkaNwlHpRWN-7TNKaf7phxJd5Zmle9czhs-kg7vWNR_2dq3HTSCrbn-cN-8_132/exec";
var timeoutid;
var scanreason = "";
(function ($) {
  "use strict";
  $.ajaxSetup({
    crossDomain: true,
    type: "GET",
    dataType: "jsonp",
  });
  /*==================================================================
  [ Focus input ]*/


  /*==================================================================
  [ Validate ]*/
  // Bind to the submit event of our form
  $(document).on('submit', "#searchForm", function (event) {
    event.preventDefault();
    $('#info').hide();
    $('#info').html("");
    timeoutid = setTimeout(function () {
      $("#load.btn-loading").show();
      $("#load.search-form-btn").hide();
    }, 1000);
    var input = $("#searchbox").val();
    $.ajax({
      url: url + "?type=login&id=" + input,
    });
    return false;
  });
  $(document).on('click', '#reload', function (event) {
    $('#info').hide();
    $('#info').html("");
    timeoutid = setTimeout(function () {
      $("#reload.btn-loading").show();
      $("#reload.search-form-btn").hide();
    }, 1000);
    var input = $("#searchbox").val();
    $.ajax({
      url: url + "?type=coupons&id=" + input,
    });

    return false;
  });

  $(document).on('click', '#scan', function (event) {
    Quagga.CameraAccess.request(null, {}).then(function () {
      Quagga.CameraAccess.release().then(function () {
        Quagga.CameraAccess.enumerateVideoDevices().then(function (devices) {
          start(devices);
        });
      });
    });
    $("#popup").fadeIn();
    $("#popup").children().fadeIn();
    scanreason = $("#scan").data().scanreason
    return false;
  });

  $(document).on('click', '#popup-close', function (event) {
    stopcamera();
    return false;
  });

  $(document).on('click', ".pass-form-btn",function() {
    $('#info').hide();
    $("#info").html("");
    if ($(this).parents(".block-content").hasClass("loaded")) {
      return false;
    }
    var coupon_id = $(this).parents(".block-content").data().coupon_id;
    var clip_token = $(this).parents(".block-content").data().clip_token;
    $.ajax({
      url: url + "?type=clip&coupon_id=" + coupon_id + "&clip_token=" + clip_token + "&coupon_auth=" + getCookie("session_id")
    });
  });	

  function tryToDetermineRightCamera(devices) {
    var backDevices = devices.filter(function (device) {
      return device.label.toUpperCase().includes("BACK");
    });

    if (backDevices.length > 0) {
      return backDevices[0].deviceId;
    } else {
      return devices[0].deviceId;
    }
  }

  function start(devices) {
    var deviceId = tryToDetermineRightCamera(devices);

    Quagga.init(
      {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: "#reader",
          constraints: {
            width: 1200,
            height: 1200,
            deviceId: deviceId,
          },
        },
        decoder: {
          readers: ["upc_reader"],
        },
      },
      function (err) {
        if (err) {
          console.log(err);
          alert(err);
          return;
        }
        $("#cameras-selection").empty();
        Quagga.start();
        possibleCameraOptions(deviceId);

      }
    );
  }

  function possibleCameraOptions(deviceId) {
    setTimeout(function () {
      Quagga.CameraAccess.enumerateVideoDevices().then(function (devices2) {
        devices2.forEach((device2) => {
          function pruneText(text) {
            return text.length > 30 ? text.substr(0, 30) : text;
          }
          var selected = deviceId == device2.deviceId;

          if (selected) {
            $("#cameras-selection").append(
              `<option value="${device2.deviceId
              }" selected="selected">${pruneText(device2.label)}</option>`
            );
          } else {
            $("#cameras-selection").append(
              `<option value="${device2.deviceId}">${pruneText(
                device2.label
              )}</option>`
            );
          }
        });
      });
    }, 50);
  }
  $(document).on('change', '#cameras-selection', function () {
    var optionSelected = $(this).find("option:selected");
    var deviceId = optionSelected.val();

    Quagga.stop();

    setTimeout(function () {
      Quagga.init(
        {
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: "#container",
            constraints: {
              width: 1200,
              height: 1200,
              deviceId: deviceId,
            },
          },
          decoder: {
            readers: ["upc_reader"],
          },
        },
        function (err) {
          if (err) {
            console.log(err);
            alert(err);
            return;
          }
          Quagga.start();
        }
      );
    }, 250);
  });

  Quagga.onDetected(function (result) {
    stopcamera();
    scanreturn(result.codeResult.code);
  });

  Quagga.onProcessed(function (result) {
    var drawingCtx = Quagga.canvas.ctx.overlay,
      drawingCanvas = Quagga.canvas.dom.overlay;

    if (result) {
      if (result.boxes) {
        drawingCtx.clearRect(
          0,
          0,
          parseInt(drawingCanvas.getAttribute("width")),
          parseInt(drawingCanvas.getAttribute("height"))
        );
        result.boxes
          .filter(function (box) {
            return box !== result.box;
          })
          .forEach(function (box) {
            Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, {
              color: "green",
              lineWidth: 2,
            });
          });
      }

      if (result.box) {
        Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, {
          color: "#00F",
          lineWidth: 2,
        });
      }

      if (result.codeResult && result.codeResult.code) {
        Quagga.ImageDebug.drawPath(
          result.line,
          { x: "x", y: "y" },
          drawingCtx,
          { color: "red", lineWidth: 3 }
        );
      }
    }
  });

})(jQuery);

function login(response) {
  if (response.status == 200) {
    var mesObj = JSON.parse(response.message);
    setCookie("ppc_id", mesObj.ppc_id, 3);
    setCookie("session_id", mesObj.session_id, 1);
    loadprofile();
  }
  else {
    $("#info").append("<div class='warning'>" + response.message + "</div>");
  }
  $("#info").show();
  $("#load.btn-loading").hide();
  $("#load.search-form-btn").show();
  if (timeoutid) {
    clearTimeout(timeoutid);
    timeoutid = null;
  }
}

function coupons(response) {
  if (response.status == 200) {
    $("#info").append("<div class='success'>" + response.message + "</div>");
  }
  else {
    $("#info").append("<div class='warning'>" + response.message + "</div>");
  }
  $("#info").show();
  $("#reload.btn-loading").hide();
  $("#reload.search-form-btn").show();
  if (timeoutid) {
    clearTimeout(timeoutid);
    timeoutid = null;
  }
}

function clip(responce) {
  console.log(responce);
  if (responce.status == 200) {
    var object = JSON.parse(responce.message);
    if(object.result){
      alert("Successfully clipped");
      $("[data-coupon_id='" + object.coupon_ids[0] + "']").find(".pass-form-btn").addClass("loaded");
      $("[data-coupon_id='" + object.coupon_ids[0] + "']").find(".pass-text").text("LOADED")
    }
  }
  else {
    alert(responce.message);
  }
}

function loadcontent(responce) {
  console.log(responce);
  if (responce.status == 200) {
    $("#content").html(responce.message);
    setTimeout(function () {
      $(".content-loading").fadeOut().remove();
      $("#content").slideDown(1000);
    }, 2000);
  }
  else {
    alert(responce.message);
  }
}

function setCookie(name, value, days) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}
function getCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for (const i of ca) {
    var c = i;
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}
function eraseCookie(name) {
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}
function loadlogin() {
  $(".wrap-content").css("width", "500px").css("padding","");
  $("#content").slideUp(1000, function () {
    $("#content").parent().append('<div class="content-loading" style="display: none"><img src="images/Rolling-blue.svg" alt="" height="100px" width="100px"></div>');
    $('.content-loading').fadeIn();
    $.ajax({
      url: window.url + "?type=loadcontent&page=login"
    });
  });
}
function loadprofile() {
  $(".wrap-content").css("width", "800px").css("padding", "inherit");
  $("#content").slideUp(1000, function () {
    $("#content").parent().append('<div class="content-loading" style="display: none"><img src="images/Rolling-blue.svg" alt="" height="100px" width="100px"></div>');
    $('.content-loading').fadeIn();
    $.ajax({
      url: window.url + "?type=loadcontent&page=profile&coupon_auth=" + getCookie("session_id")
    });
  });
}

function stopcamera() {
  Quagga.stop();
  $("#popup").children().fadeOut();
  $("#popup").fadeOut();
}

function scanreturn(text) {
  if (!isValidBarcode(text)) {
    $("#info").append("<div class='warning'>Invalid barcode</div>");
  }
  else {
    text = text.slice(0, -1);
    $("#info").append("<div class='success'>Barcode Scanned</div>");
    if (scanreason == "login") {
      $("#searchbox").val(text);
      $("#info").hide();
      $("#load.btn-loading").show();
      $("#load.search-form-btn").hide();
      $.ajax({
        url: window.url + "?type=login&id=" + text,
      });
    }
  }
  scanreason = "";
}

function isValidBarcode(barcode) {
  // check length
  if (barcode.length < 8 || barcode.length > 18 ||
    (barcode.length != 8 && barcode.length != 12 &&
      barcode.length != 13 && barcode.length != 14 &&
      barcode.length != 18)) {
    return false;
  }

  var lastDigit = Number(barcode.substring(barcode.length - 1));
  var checkSum = 0;
  if (isNaN(lastDigit)) { return false; } // not a valid upc/ean

  var arr = barcode.substring(0, barcode.length - 1).split("").reverse();
  var oddTotal = 0, evenTotal = 0;

  for (var i = 0; i < arr.length; i++) {
    if (isNaN(arr[i])) { return false; } // can't be a valid upc/ean we're checking for

    if (i % 2 == 0) { oddTotal += Number(arr[i]) * 3; }
    else { evenTotal += Number(arr[i]); }
  }
  checkSum = (10 - ((evenTotal + oddTotal) % 10)) % 10;

  // true if they are equal
  return checkSum == lastDigit;
}