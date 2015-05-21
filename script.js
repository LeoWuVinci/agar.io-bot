

$('#region')
	.after($('#region').removeAttr('onchange').clone().change(function(e){
		setRegion($('#region').val());$('.region-message').hide();$('.region-message.'+$('#region').val()).show();$('.btn-needs-server').prop('disabled', false);	
	})).remove()

$('#playBtn')
	.after($('#playBtn').removeAttr('onclick').clone().click(function(e){
		setNick(document.getElementById('nick').value); return false;
	})).remove()
