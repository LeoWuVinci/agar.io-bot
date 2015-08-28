var	nicks=[
		'twitch/gamerlio',
		'nomday.com/lio',
		'Skynet',
		'Bender',
		'Sonny',
		'Rosey',
		'MCP',
		'Tron',
		'Johnny 5',
		'Data',
		'Agent Smith',
		'C-3PO',
		'R2D2',
		'HAL 9000'
	].concat(skinNames),
	body=$('body'),
	startGameDate,
	playBtnName = $('#helloContainer[data-logged-in="1"]').length ? '.btn-play' : '.btn-play-guest',
	playBtn=$(playBtnName).removeAttr('onclick').clone().click(function(e){
		clearInterval(intervalId)
		startGameDate=Date.now()
		setNick(nicks[~~(nicks.length*Math.pow(Math.random(),.5))]);
		return false;
	}),
	secLeft=180,
	intervalId=setInterval(function(){
		if(!(--secLeft)){
			clearInterval(intervalId)
			startGameDate=Date.now()
			setNick(nicks[~~(nicks.length*Math.pow(Math.random(),2))]);
		}
	},1000),
	lastActionBest5Div=$('<ol id="last-action-best-5"></ol>').appendTo(body),
	aiStatusDiv=$('<div id="ai-intuition"></div>').appendTo('body'),
	aiStatusH4=$('<h4 id="ai-status"></h4>').appendTo(aiStatusDiv),
	considerationChart=new Chart($('<canvas id="behavior-canvas" width="350" height="100"></canvas>').appendTo(aiStatusDiv).get(0).getContext("2d")).Doughnut(ai.considerations),
	scoreH4=$('<h4 id="score"></h4>').appendTo('body'),
	heatMapCtx=$('<canvas id="heat-map" width="'+(ai.mapMaxX-ai.mapMinX)/64+'" height="'+(ai.mapMaxY-ai.mapMinY)/64+'"></canvas>')
		.appendTo(body)
		.get(0)
		.getContext("2d"),
	miniMapCtx=$('<canvas id="mini-map" width="'+(ai.mapMaxX-ai.mapMinX)/64+'" height="'+(ai.mapMaxX-ai.mapMinX)/64+'"></canvas>')
		.appendTo(body)
		.get(0)
		.getContext("2d"),
	intuitionBtn=$('<button id="intuition-btn" class="btn"></button>').appendTo('body').click(function(){
		ai.allowIntuition=!ai.allowIntuition
		renderIntuitionBtn()	
		}),
	intuitionPanel=$(
		'<div class="modal">'
			+'<div class="modal-dialog">'
				+'<div class="modal-content">'
					+'<div class="modal-header">'
						+'<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>'
						+'<h4 class="modal-title">Considerations</h4>'
					+'</div>'
					+'<div id="intuition-body" class="modal-body"></div>'
				+'</div>'
			+'</div>'
		+'</div>').appendTo(body),
	intuitionForm=$('<form id="intuition-form" class="form-horizontal"></form>').appendTo('#intuition-body'),
	pingH4=$('<h4 id="ping"></h4>').appendTo(body),
	level=$('<div id="lvl">INT Level 1</div>').appendTo(body),
	expBar=$('<div class="progress-bar"></div>')
		.appendTo($('<div id="exp" class="progress progress-striped active"></div>').appendTo(body)),
	serverProtocol=154669603
	
function onMapSizeUpdate(minX,minY,maxX,maxY){
	ai.mapMinX=minX
	ai.mapMinY=minY
	ai.mapMaxX=maxX
	ai.mapMaxY=maxY
}

$(playBtnName).after(playBtn).remove()

$('<link href="https://cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.4/darkly/bootstrap.min.css" rel="stylesheet">').appendTo('head')
$('.agario-panel h2')
	.html("Agar.io <small>w/ LioBot</small>")

$('.agario-panel .form-group:first-child')
	.append('<p class="help-block" style="text-align: center"><kbd>chrome://extensions</kbd> to disable</p>')
	.next().remove()
setDarkTheme(true)

function renderIntuitionMenu(){
	intuitionForm.html("")
	var row=$('<div class="row"></div>').appendTo(intuitionForm),
		columns=[
			$('<div class="col-sm-6"></div>').appendTo(row),
			$('<div class="col-sm-6"></div>').appendTo(row),
		]

	var i=0
	ai.actionGenerators.forEach(function(actionGenerator){
		actionGenerator.considerations.forEach(function(consideration){
			$('<div class="form-group">'
				+'<label for="rule-'+i+'" class="col-sm-8 control-label">'
					+consideration.label
				+'</label>'
			+'</div>')
			.append($('<div class="col-sm-4">'
				+'<input type="text" style="background-color: '+consideration.color+'" class="form-control" id="rule-'+i+'" value="'+consideration.value+'" />'
				+'</div>'
				).change(function(){
				consideration.weight=Math.abs(parseInt($(this).children('input').val()))
			}))
			.appendTo(columns[i++%2])
		})
	})
}

function renderIntuitionBtn(){
	intuitionBtn.removeClass('btn-success btn-default active')
	if(ai.allowIntuition){
		intuitionBtn.addClass('btn-success').addClass('active').html("Intuition ON")
	}else{
		intuitionBtn.addClass('btn-default').html("Intuition OFF")
	}
	renderStatus()
}
renderIntuitionBtn()

function renderStatus(){
	if(!ai.allowIntuition){
		aiStatusH4.html('Considerations ')
			.append(
				$('<a href="#">Edit</a>')
					.click(function(){
						renderIntuitionMenu()
						$(intuitionPanel).modal()	
					}))
	}else if(ai.gameHistory.length%2){
		aiStatusH4.html('<span class="alert">EXPERIMENTING</span>')
	}else{
		aiStatusH4.html('Considerations')
	}
}

ai.onDraw=function(){
	if(!((this.scoreHistory.length+1)%10)){
		scoreH4.text(~~(this.scoreHistory[this.scoreHistory.length-1]/100)+' pts')
		level.text('INT Level '+ai.lvl)
		expBar.attr('style','width:'+ai.lvlPercent+'%')
		if(ai.lvlPercent<50){
			expBar.removeClass('progress-bar-info progress-bar-success')
		}else if (ai.lvlPercent<75){
			expBar.addClass('progress-bar-info')
		}else{
			expBar
				.removeClass('progress-bar-info')
				.addClass('progress-bar-success')
		}
	}

	var needsUpdate=false
	for(var i=0;i<this.considerations.length;i++){
		if(considerationChart.segments[i].value!=this.considerations[i].value){
			considerationChart.segments[i].value=this.considerations[i].value
			needsUpdate=true
		}
	}

	if(this.considerations.every(function(consideration){return !consideration.value})){
		considerationChart.segments[0].value=1	
	}

	if(needsUpdate){
		considerationChart.update()
	}
	
	if(ai.lastActionBest5.length){
		lastActionBest5Div.html(ai.lastActionBest5
			.map(function(action){return '<li>'
				+action.type
				+'('+~~action.x+','+~~action.y+') '
				+(action.weightedValues[0]?('<span class="label consideration-label" style="background-color:'+action.weightedValues[0][1].color+'">'+action.weightedValues[0][1].label+'</span>'):'')+' '
				+action.otherOrganism.name
				+'</li>'})
			.join('')
			)
	}
}

ai.onDeath=function(){
	setTimeout(function(){
			startGameDate=Date.now()
			setNick(nicks[~~(nicks.length*Math.pow(Math.random(),2))])
		},5000)

	pingH4.html(~~this.avgPing+"ms latency")
	renderStatus()

	heatMapCtx.strokeStyle='rgb(231,76,60)'
	heatMapCtx.beginPath()
	heatMapCtx.arc((this.lastAction.myOrganism.nx-this.mapMinX)/64,(this.lastAction.myOrganism.ny-this.mapMinY)/64,this.lastAction.myOrganism.size/64,0,2*Math.PI)
	heatMapCtx.stroke()
}


var leaderboardList=$('<ul class="list-unstyled"></ul>').appendTo($('<div id="leaderboard-div"><h4>Leaderboard <small>UserID</small></h4></div>').appendTo('body'))
onDrawLeaderboard=function(organisms,myOrganismIds,teamPts){
	if(teamPts){
		$('#leaderboard-div').hide()	
		return true
	}
	$('#leaderboard-div').show()	
	leaderboardList.html('')
	organisms.forEach(function(organism){
		if(myOrganismIds.indexOf(organism.id) == -1){
			leaderboardList.append('<li>'+organism.name+' <small class="text-muted">'+organism.id+'</small></li>')
		}else{
			leaderboardList.append('<li class="text-warning">'+organism.name+' <small class="text-muted">'+organism.id+'</small></li>')
		}
	})
}
