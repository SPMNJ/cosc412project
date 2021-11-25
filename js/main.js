var url = "https://script.google.com/macros/s/AKfycbzQADj0ibUG9cDKJsj6D4e7-Q-VUjBaRr9tsI9z5F70aDcS_7ll9VWWU4fO6YLNeaaU/exec";
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
  $("#content").slideUp(1000, function () {
    $("#content").parent().append('<div class="content-loading" style="display: none"><img src="images/Rolling-blue.svg" alt="" height="100px" width="100px"></div>');
    $('.content-loading').fadeIn();
    $.ajax({
      url: window.url + "?type=loadcontent&page=login"
    });
  });
}
function loadprofile() {
  $("#content").slideUp(1000, function () {
    $("#content").parent().append('<div class="content-loading" style="display: none"><img src="images/Rolling-blue.svg" alt="" height="100px" width="100px"></div>');
    $('.content-loading').fadeIn();
    $.ajax({
      url: window.url + "?type=loadcontent&page=profile"
    });
  });
}

function stopcamera() {
  Quagga.stop();
  $("#popup").children().fadeOut();
  $("#popup").fadeOut();
}

function scanreturn(text) {
  if (scanreason == "login") {
    $("#searchbox").val(text);
    $("#info").hide();
    $("#load.btn-loading").show();
    $("#load.search-form-btn").hide();
    $.ajax({
      url: window.url + "?type=login&code=" + text,
    });
  }
  scanreason = "";
}
