/* Display logic */
var chatLibId='';

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

var lastActionBest5Div=$('<ol id="last-action-best-5"></ol>').appendTo('body')

var behaviorDiv=$('<div id="ai-intuition"><h4 id="ai-status">Intuition</h4><canvas id="behavior-canvas" width="350" height="100"></canvas></div>')
$('body').append(behaviorDiv)
behaviorChart=new Chart($('#behavior-canvas').get(0).getContext("2d")).Doughnut(ai.considerations)

ai.onTick=function(){ //TODO Move to ondraw
	if(!((this.scoreHistory.length+1)%10)){
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
			$('#ai-status').html('Intuition')
		}else if(this.gameHistory.length<100) {
			$('#ai-status').html('<span style="color:red">LEARNING FOR 100 LIVES (life '+(this.gameHistory.length+1)+')</span>')
		}else if(this.gameHistory.length%2){
			$('#ai-status').html('<span style="color:red">LEARNING FOR 1 LIFE</span>')
		}else{
			$('#ai-status').html('Intuition')
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

var heatMapDiv=$('<div id="heat-map-div"><canvas id="heat-map" width="175" height="175"></canvas></div>')
$('body').append(heatMapDiv)
var heatMapCtx=$('#heat-map').get(0).getContext("2d")

var miniMapCanvas=$('<canvas id="mini-map" width="175" height="175"></canvas>')
$('body').append(miniMapCanvas)
miniMapCtx=miniMapCanvas.get(0).getContext("2d")

chrome.runtime.onMessage.addListener(function(m,s,res){
	console.log('ai',m)
	switch(m[0]){
		case 'setIntuition':
			ai.considerations[m[1]].weight=m[2]
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

ai.considerations.forEach(function(consideration,i){
	$('<div class="form-group">'
			+'<label for="rule-'+i+'" class="col-sm-9 control-label">'
				+consideration.label
			+'</label>'
		+'</div>')
		.append($('<div class="col-sm-3">'
			+'<input type="text" class="form-control" id="rule-'+i+'" value="'+consideration.weight+'" />'
			+'</div>'
			).change(function(){
			consideration.weight=parseInt($(this).children('input').val())
		}))
		.appendTo('#intuition-form')
})

$('<button id="edit-intuition-btn" class="btn btn-primary">Edit Considerations</button>').appendTo('body').click(function(){
	intuitionPanel.fadeToggle()
})

$('<button id="teach-btn" class="btn btn-success active">Teach On</button>').appendTo('body').click(function(){
	ai.isTeachMode=!ai.isTeachMode
	if(ai.isTeachMode){
		$(this).addClass('btn-success').removeClass('btn-default').addClass('active').html("Teach On")
	}else{
		$(this).addClass('btn-default').removeClass('btn-success').removeClass('active').html("Teach Off")
	}
})

var myOrganismStatsDiv=$('<div id="my-organism-stats"></div>').appendTo('body')

ai.onDraw=function(){
	if(ai.lastActionBest5.length){
		lastActionBest5Div.html(ai.lastActionBest5
			.map(function(action){return '<li>'
				+action.calcImportance(ai.considerations).toFixed(3)+' '
				+action.type
				+'('+~~action.x+','+~~action.y+') '
				+(action.weightedValues[0]?action.weightedValues[0][1].label:'')+' '
				+action.otherOrganism.name
				+'</li>'})
			.reduce(function(a,b){return a+b})
			)
	}
	if(this.lastAction){
		var myOrganism=this.lastAction.myOrganism
		myOrganismStatsDiv.html(
			'v='+Math.pow(Math.pow(myOrganism.dx,2)+Math.pow(myOrganism.dy,2),.5).toFixed(3)
			+' a='+Math.pow(Math.pow(myOrganism.dx2,2)+Math.pow(myOrganism.dy2,2),.5).toFixed(3)
			+' j='+Math.pow(Math.pow(myOrganism.dx3,2)+Math.pow(myOrganism.dy3,2),.5).toFixed(3)
			)
	}
}
