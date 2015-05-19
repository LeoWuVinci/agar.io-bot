
$('#region').after('<select id="region" class="form-control" required><option selected disabled value=""> -- Select a Region -- </option><option value="US-Fremont">US West</option></select>').remove()

document.getElementById('region').onchange=function(e){
	setRegion($('#region').val());$('.region-message').hide();$('.region-message.'+$('#region').val()).show();$('.btn-needs-server').prop('disabled', false);	
}

$('#playBtn').after('<button disabled type="submit" id="playBtn" class="btn btn-play btn-primary btn-needs-server">Play</button>').remove()

document.getElementById('playBtn').onclick=function(e){
	setNick(document.getElementById('nick').value); return false;
}
