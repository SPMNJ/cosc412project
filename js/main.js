var url = "https://script.google.com/macros/s/AKfycbzUnS-iBx5Zf4xLOGBJJlhuoOoMJyG689rQDWDC1wSnT1qzjVOE2xf6PakGRCqszlQn/exec";
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
    setTimeout(function () {
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
    setTimeout(function () {
      $("#reload.btn-loading").show();
      $("#reload.search-form-btn").hide();
    }, 1000);
    var input = $("#searchbox").val();
    $.ajax({
      url: url + "?type=coupons&id=" + input,
    });

    return false;
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
}

function loadcontent(responce){
  console.log(responce);
	if (responce.status == 200){
		$("#content").html(responce.message);
		setTimeout(function() {
		$(".content-loading").fadeOut().remove();
		$("#content").slideDown(1000);
							  },2000);
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
function loadlogin(){
	$("#content").slideUp(1000, function() {
    	$("#content").parent().append('<div class="content-loading" style="display: none"><img src="images/Rolling-1s-200px.svg" alt="" height="100px" width="100px"></div>');
		$('.content-loading').fadeIn();
		$.ajax({
				url: window.url + "?type=loadcontent&page=login" 
		});
	});
}
function loadprofile(){
	$("#content").slideUp(1000, function() {
    	$("#content").parent().append('<div class="content-loading" style="display: none"><img src="images/Rolling-1s-200px.svg" alt="" height="100px" width="100px"></div>');
		$('.content-loading').fadeIn();
		$.ajax({
				url: window.url + "?type=loadcontent&page=profile" 
		});
	});
}

