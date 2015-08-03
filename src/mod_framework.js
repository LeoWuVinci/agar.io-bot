var serverVerId=154669603

$('#canvas').attr('id','canvas-2')
$.get(
	'/main_out.js',
	'',
	function(data){
		serverVerId=parseInt(/255\);[a-zA-Z]+\.setUint32\(1,([0-9]+)/.exec(data)[1])
	},
	'text'
)
