var chatLibId='jfncmchbdglkmddpjkimdmaofbpcmdol',
	skinNames=[
		'twitch/gamerlio',
		'nomday.com/lio',
		'Yaranaika',
		'Pokerface',
		'Sir',
		'Mars',
		'Stalin',
		'Moon',
		'Wojak',
		'Imperial Japan',
		'Tumblr',
		'Doge',
		'Earth',
		'Bait',
		'Steam',
		'Piccolo',
		'Sanik',
		'Cia',
		'4chan',
		'Ayy Lmao',
		'Qing Dynasty',
	],
	body=$('body'),
	startGameDate,
	playBtn=$('#playBtn').removeAttr('onclick').clone().click(function(e){
		clearInterval(intervalId)
		startGameDate=Date.now()
		setNick(skinNames[~~(skinNames.length*Math.random())]);
		return false;
	}),
	secLeft=60,
	intervalId=setInterval(function(){
		if(--secLeft){
			playBtn.text('PLAY in '+secLeft)
		}else{
			clearInterval(intervalId)
			startGameDate=Date.now()
			setNick(skinNames[~~(skinNames.length*Math.random())]);
		}
	},1000),
	scoreCanvas=$('<canvas id="score-chart" width="200" height="200"></canvas>').appendTo(body),
	labels=[],
	data1=[],
	data2=[],
	lastActionBest5Div=$('<ol id="last-action-best-5"></ol>').appendTo(body),
	aiStatusDiv=$('<div id="ai-intuition"></div>').appendTo('body'),
	aiStatusH4=$('<h4 id="ai-status"></h4>').appendTo(aiStatusDiv),
	considerationChart=new Chart($('<canvas id="behavior-canvas" width="350" height="100"></canvas>').appendTo(aiStatusDiv).get(0).getContext("2d")).Doughnut(ai.considerations),
	scoreH4=$('<h4 id="score"></h4>').appendTo('body'),
	heatMapCtx=$('<canvas id="heat-map" width="175" height="175"></canvas>')
		.appendTo(body)
		.get(0)
		.getContext("2d"),
	miniMapCtx=$('<canvas id="mini-map" width="175" height="175"></canvas>')
		.appendTo(body)
		.get(0)
		.getContext("2d"),
	intuitionBtn=$('<button id="intuition-btn" class="btn"></button>').appendTo('body').click(function(){
		ai.isTeachMode=!ai.isTeachMode
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
	pingH4=$('<h4 id="ping"></h4>').appendTo(body)

$('#playBtn').after(playBtn).remove()

$('<link href="https://cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.4/darkly/bootstrap.min.css" rel="stylesheet">').appendTo('head')
body.append('<h4 id="ip-address"></h4>')
$('#helloDialog h2').html("Agar.io <small>w/ Lio's AI</small>")

setDarkTheme(true)

ai.onFoundSpecialName=function(name){
	chrome.runtime.sendMessage(chatLibId,['foundSpecialName',name])
}

Chart.defaults.Line.pointDot=false
Chart.defaults.Line.showScale=false
Chart.defaults.global.responsive=false
for(var i=0;i<100;i++){
	labels.push(i)
	data1.push(0)
	data2.push(0)
}
var scoreChart=new Chart(scoreCanvas.get(0).getContext("2d")).Line({labels:labels,datasets:[{
		label: "Current Game Scores",
		fillColor: "rgba(220,220,220,0.2)",
		strokeColor: "rgba(220,220,220,1)",
		data: data1
	},
	{
		label: "Past Game Scores",
		fillColor: "rgba(151,187,205,1)",
		strokeColor: "rgba(151,187,205,1)",
		data:data2
	}
]})

chrome.runtime.onMessage.addListener(function(m,s,res){
	console.log('ai',m)
	switch(m[0]){
		case 'setIntuition':
			ai.considerations[m[1]].weight=Math.abs(parseInt(m[2]))
			res(m)
			break;
		case 'specialNames':
			if(m[2]=="remove"){
				delete ai.specialNames[m[1]]
			}else{
				ai.specialNames[m[1]]=m[2]
			}
			break;
		case 'getAi':
			res(ai[m[1]])
			break;
		case 'setAi':
			ai[m[1]]=m[2]
			break;
	}
})

function renderIntuitionMenu(){
	intuitionForm.html("")
	var row=$('<div class="row"></div>').appendTo(intuitionForm),
		columns=[
			$('<div class="col-sm-6"></div>').appendTo(row),
			$('<div class="col-sm-6"></div>').appendTo(row),
		]
	ai.considerations.forEach(function(consideration,i){
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
			.appendTo(columns[i%2])
	})
}

function renderIntuitionBtn(){
	intuitionBtn.removeClass('btn-success btn-default active')
	if(!ai.isTeachMode){
		intuitionBtn.addClass('btn-success').addClass('active').html("Intuition ON")
	}else{
		intuitionBtn.addClass('btn-default').html("Intuition OFF")
	}
	renderStatus()
}
renderIntuitionBtn()

function renderStatus(){
	if(ai.isTeachMode){
		aiStatusH4.html('Considerations ')
			.append(
				$('<a href="#">Edit</a>')
					.click(function(){
						renderIntuitionMenu()
						$(intuitionPanel).modal()	
					}))
	}else if(ai.gameHistory.length<100){
		aiStatusH4.html('<span class="alert">INFANCY STAGE FOR '+(100-ai.gameHistory.length)+' GAMES</span>')
	}else if(ai.gameHistory.length%2){
		aiStatusH4.html('<span class="alert">EXPERIMENTING</span>')
	}else{
		aiStatusH4.html('Considerations')
	}
}

ai.onDraw=function(){
	if(!((this.scoreHistory.length+1)%10)){
		scoreH4.text(~~(this.scoreHistory[this.scoreHistory.length-1]/100)+' pts')
		var j=0;
		for(var i=this.scoreHistory.length>100?this.scoreHistory.length-100:0;i<this.scoreHistory.length;i++){
			scoreChart.datasets[0].points[j++].value=~~(this.scoreHistory[i])
		}
		scoreChart.update()
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
				+(action.calcImportance(ai.considerations)*1000).toFixed(1)+' '
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
		setNick(skinNames[~~(skinNames.length*Math.pow(Math.random(),2))])
		},5000)

	pingH4.html(~~this.avgPing+"ms latency")

	renderStatus()
	j=0
	for(var i=this.gameHistory.length>10?this.gameHistory.length-10:0;i<this.gameHistory.length;i++){
		var gameStat=this.gameHistory[i];
		scoreChart.datasets[1].points[10*j++].value=~~(gameStat.maxSize)
	}
	scoreChart.update()

	heatMapCtx.strokeStyle='rgb(231,76,60)'
	//heatMapCtx.strokeStyle="rgba(255,0,0,.5)"
	heatMapCtx.beginPath()
	heatMapCtx.arc(this.lastAction.myOrganism.nx/64,this.lastAction.myOrganism.ny/64,this.lastAction.myOrganism.size/64,0,2*Math.PI)
	heatMapCtx.stroke()
	console.info("DEAD x_X")
	console.info("Score",~~(this.scoreHistory[this.scoreHistory.length-1]/100))
	console.info("Time spent alive",(Date.now()-this.lastStateChangeDate.getTime())/60000,"mins")
}

var leaderboardList=$('<ul class="list-unstyled"></ul>').appendTo($('<div id="leaderboard-div"><h4>Leaderboard</h4></div>').appendTo('body'))
ai.updateLeaderboard=function(organisms,myOrganismIds){
	leaderboardList.html('')
	organisms.forEach(function(organism){
		if(myOrganismIds.indexOf(organism.id) == -1){
			leaderboardList.append('<li>'+organism.name+' <small class="text-muted">'+organism.id+'</small></li>')
		}else{
			leaderboardList.append('<li class="text-warning">'+organism.name+' <small class="text-muted">'+organism.id+'</small></li>')
		}
	})
}
