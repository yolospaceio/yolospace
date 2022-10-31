require ("packs/ethereum/web3.js")

$(document).on('click', '#fee_submit', function () {
  console.log($('#fee_fee_type').val());  
  $("div.loading-gif.displayInMiddle").show();
  if(isNaN(parseFloat($('input#fee_percentage').val()))){
    toastr.error('Please enter the valid fee percentage.');
    $("div.loading-gif.displayInMiddle").hide();
  } else {
    if($('#fee_fee_type').val() === 'Buyer'){
      updateBuyerServiceFee($('input#fee_percentage').val())
    }
    else if($('#fee_fee_type').val() === 'Seller'){
      updateSellerServiceFee($('input#fee_percentage').val())
    }
    else{
      toastr.error('Please enter the valid fee type.');
      $("div.loading-gif.displayInMiddle").hide();
    }
  }
});

global.toastr = require("toastr")

$(document).ready(function () {
  $(document).on('click', '.view-notification', function () {
    $.ajax({
      url: "/notifications",
      type: "get",
      dataType: "script",
      data: {}
    })
  })
});
    