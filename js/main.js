var url = "https://script.google.com/macros/s/AKfycbwcKESZXEs_R0TuQPRGfjiaBL49WdI0vuVsw_VhAJWPc5SH0-tnhygb-GHDdEahenNk/exec";
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
      $("#info").append("<div class='success'>Logging In</div>");
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