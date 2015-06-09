var chatLibId='',
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
	]

$('<link href="https://cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.4/darkly/bootstrap.min.css" rel="stylesheet">').appendTo('head')

$('body').append('<h4 id="ip-address"></h4>')
$('#helloDialog h2 center').html("Agar.io <small>w/ Lio's AI Extension</small>")
$(".text-muted[href='privacy.txt']")[0].nextSibling.nodeValue=" ";

var playBtn=$('#playBtn').removeAttr('onclick').clone().click(function(e){
		setNick(skinNames[~~(skinNames.length*Math.random())]);
		clearInterval(intervalId)
		return false;
	}),
	secLeft=60,
	intervalId=setInterval(function(){
		if(--secLeft){
			playBtn.text('PLAY in '+secLeft)
		}else{
			setNick(skinNames[~~(skinNames.length*Math.random())]);
			clearInterval(intervalId)
		}
	},1000)

$('#playBtn').after(playBtn).remove()

setDarkTheme(true)


ai.onFoundSpecialName=function(name){
	chrome.runtime.sendMessage(chatLibId,['foundSpecialName',name])
}

Chart.defaults.Line.pointDot=false
Chart.defaults.Line.showScale=false
Chart.defaults.global.responsive=false

var scoreCanvas=$('<canvas id="score-chart" width="200" height="200"></canvas>')
$('body').append(scoreCanvas);
var labels=[],
	data1=[],
	data2=[]
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
]});

var lastActionsDiv=$('<div id="last-action-div"></div>').appendTo('body')
var lastActionDeath=$('<ol id="last-action-death"></ol>').appendTo(lastActionsDiv)
var lastActionBest5Div=$('<ol id="last-action-best-5"></ol>').appendTo(lastActionsDiv)

var behaviorDiv=$('<div id="ai-intuition"><h4 id="ai-status">Considerations</h4><canvas id="behavior-canvas" width="350" height="100"></canvas></div>')
$('body').append(behaviorDiv)
behaviorChart=new Chart($('#behavior-canvas').get(0).getContext("2d")).Doughnut(ai.considerations)

var scoreH4=$('<h4 id="score"></h4>').appendTo('body')

ai.onTick=function(){ //TODO Move to ondraw
	if(!((this.scoreHistory.length+1)%10)){
		scoreH4.text("Score: "+~~(this.scoreHistory[this.scoreHistory.length-1]/100))

		var j=0;
		for(var i=this.scoreHistory.length>100?this.scoreHistory.length-100:0;i<this.scoreHistory.length;i++){
			scoreChart.datasets[0].points[j++].value=~~(this.scoreHistory[i])
		}

		j=0
		for(var i=this.gameHistory.length>10?this.gameHistory.length-10:0;i<this.gameHistory.length;i++){
			var gameStat=this.gameHistory[i];
			scoreChart.datasets[1].points[10*j++].value=~~(gameStat.maxSize)
		}
		scoreChart.update()

		if(this.isTeachMode){
			$('#ai-status').html('Considerations')
		}else if(this.gameHistory.length<100) {
			$('#ai-status').html('<span class="alert">EXPERIMENTING FOR 100 LIVES (life '+(this.gameHistory.length+1)+')</span>')
		}else if(this.gameHistory.length%2){
			$('#ai-status').html('<span class="alert">EXPERIMENTING FOR 1 LIFE</span>')
		}else{
			$('#ai-status').html('Considerations')
		}
	}

	var needsUpdate=false
	for(var i=0;i<this.considerations.length;i++){
		if(behaviorChart.segments[i].value!=this.considerations[i].value){
			behaviorChart.segments[i].value=this.considerations[i].value
			needsUpdate=true
		}
	}

	if(this.considerations.every(function(consideration){return !consideration.value})){
		behaviorChart.segments[0].value=1	
	}

	if(needsUpdate){
		behaviorChart.update()
	}
}

var heatMapDiv=$('<canvas id="heat-map" width="175" height="175"></canvas>').appendTo('body')
var heatMapCtx=$('#heat-map').get(0).getContext("2d")

var miniMapCanvas=$('<canvas id="mini-map" width="175" height="175"></canvas>').appendTo('body')
miniMapCtx=miniMapCanvas.get(0).getContext("2d")

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
		case 'loadChatId':
			chatLibId=m[1]
			break;
	}
})

var intuitionPanel=$('<div id="intuition-div"><div id="intuition-panel" class="panel panel-default"><div id="intuition-body" class="panel-body"><form id="intuition-form" class="form-horizontal"></form></div></div></div>').appendTo('body')

$('<button id="edit-intuition-btn" class="btn btn-primary">Edit Considerations</button>').appendTo('body').click(function(){
	$('#intuition-form').html("")

	ai.considerations.forEach(function(consideration,i){
		$('<div class="form-group">'
				+'<label for="rule-'+i+'" class="col-sm-9 control-label">'
					+consideration.label
				+'</label>'
			+'</div>')
			.append($('<div class="col-sm-3">'
				+'<input type="text" class="form-control" id="rule-'+i+'" value="'+consideration.value+'" />'
				+'</div>'
				).change(function(){
				consideration.weight=Math.abs(parseInt($(this).children('input').val()))
			}))
			.appendTo('#intuition-form')
	})

	intuitionPanel.fadeToggle()
})

$('<button id="teach-btn" class="btn btn-success active">Intuition On</button>').appendTo('body').click(function(){
	ai.isTeachMode=!ai.isTeachMode
	if(!ai.isTeachMode){
		$(this).addClass('btn-success').removeClass('btn-default').addClass('active').html("Intuition On")
	}else{
		$(this).addClass('btn-default').removeClass('btn-success').removeClass('active').html("Intuition Off")
	}
})

var myOrganismStatsDiv=$('<div id="my-organism-stats"></div>').appendTo('body')

ai.onDraw=function(){
	if(ai.lastActionBest5.length){
		lastActionBest5Div.html(ai.lastActionBest5
			.map(function(action){return '<li>'
				+(action.calcImportance(ai.considerations)*1000).toFixed(1)+' '
				+action.type
				+'('+~~action.x+','+~~action.y+') '
				+(action.weightedValues[0]?action.weightedValues[0][1].label:'')+' '
				+action.otherOrganism.name
				+'</li>'})
			.reduce(function(a,b){return a+b})
			)
	}
	if(false&&this.lastAction){
		var myOrganism=this.lastAction.myOrganism,
			msg=''

		if(myOrganism.dCoords){
			myOrganism.dCoords.every(function(coord,i){
				msg+='['+i+']'+Math.pow(Math.pow(coord[0],2)+Math.pow(coord[1],2),.5).toFixed(3)+' '
				return i<this.predictionDepth
			},this)
		}
		myOrganismStatsDiv.html(msg)
	}
}

ai.onDeath=function(){
	heatMapCtx.strokeStyle='rgb(231,76,60)'
	//heatMapCtx.strokeStyle="rgba(255,0,0,.5)"
	heatMapCtx.beginPath()
	heatMapCtx.arc(this.lastAction.myOrganism.px/64,this.lastAction.myOrganism.py/64,this.lastAction.myOrganism.size/64,0,2*Math.PI)
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
